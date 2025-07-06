#!/usr/bin/env node

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { KeycloakClient } from './keycloak/client.js';
import { InfisicalClient } from './infisical/client.js';
import {
  KeycloakInfisicalIntegration,
  IntegrationConfig,
} from './integration/keycloak-infisical.js';
import { registerAllCapabilities, ServerSession } from './registrations.js';

// Session storage for stateful mode
const sessions: Map<string, ServerSession> = new Map();

// Initialize clients for a session
function initializeSessionClients(sessionId: string): ServerSession {
  let keycloakClient: KeycloakClient | null = null;
  let infisicalClient: InfisicalClient | null = null;
  let integration: KeycloakInfisicalIntegration | null = null;

  // Initialize Keycloak client if configuration is available
  const keycloakUrl = process.env.KEYCLOAK_URL;
  const keycloakUsername = process.env.KEYCLOAK_USERNAME;
  const keycloakPassword = process.env.KEYCLOAK_PASSWORD;

  if (keycloakUrl && keycloakUsername && keycloakPassword) {
    keycloakClient = new KeycloakClient({
      url: keycloakUrl,
      username: keycloakUsername,
      password: keycloakPassword,
    });
    console.error(`[${sessionId}] Keycloak client initialized`);
  } else {
    console.error(`[${sessionId}] Keycloak client not configured - missing environment variables`);
  }

  // Initialize Infisical client if configuration is available
  const infisicalUrl = process.env.INFISICAL_URL;
  const infisicalToken = process.env.INFISICAL_TOKEN;

  if (infisicalUrl && infisicalToken) {
    infisicalClient = new InfisicalClient({
      url: infisicalUrl,
      token: infisicalToken,
    });
    console.error(`[${sessionId}] Infisical client initialized`);
  } else {
    console.error(`[${sessionId}] Infisical client not configured - missing environment variables`);
  }

  // Initialize integration if both clients are available
  if (keycloakClient && infisicalClient) {
    const integrationConfig: IntegrationConfig = {
      enabled: true,
    };
    integration = new KeycloakInfisicalIntegration(
      keycloakClient,
      infisicalClient,
      integrationConfig
    );
    console.error(`[${sessionId}] Keycloak-Infisical integration initialized`);
  } else {
    console.error(
      `[${sessionId}] Integration not available - both Keycloak and Infisical clients required`
    );
  }

  const session: ServerSession = {
    keycloakClient,
    infisicalClient,
    integration,
    sessionId,
    initialized: true,
  };

  sessions.set(sessionId, session);
  return session;
}

// Create stateful MCP server instance
function createStatefulMCPServer(sessionId: string): McpServer {
  const server = new McpServer({
    name: 'mike-cox-protracting',
    version: '0.1.0',
  });

  // Get session
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  console.error(`[${sessionId}] Creating MCP server for session`);

  // Register all capabilities using the new registration system
  registerAllCapabilities(server, session);

  return server;
}

// Main function
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const mode = args.includes('--mode') ? args[args.indexOf('--mode') + 1] : 'stdio';
  const host = args.includes('--host') ? args[args.indexOf('--host') + 1] : '0.0.0.0';
  const port = args.includes('--port')
    ? parseInt(args[args.indexOf('--port') + 1] || '8000')
    : 8000;

  if (mode === 'http') {
    // HTTP mode for production deployments with session management
    await runStatefulHttpServer(host, port);
  } else {
    // STDIO mode for MCP Inspector and development
    await runStdioServer();
  }
}

// Run server in STDIO mode (for development/testing)
async function runStdioServer() {
  // Create a single session for STDIO mode
  const sessionId = 'stdio-session';
  const session = initializeSessionClients(sessionId);

  const server = createStatefulMCPServer(sessionId);
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error('MCP Server for Keycloak and Infisical started in STDIO mode');
  console.error(`Keycloak client: ${session.keycloakClient ? 'configured' : 'not configured'}`);
  console.error(`Infisical client: ${session.infisicalClient ? 'configured' : 'not configured'}`);
  console.error(`Integration: ${session.integration ? 'configured' : 'not configured'}`);
}

// Run server in HTTP mode with session management (stateful)
async function runStatefulHttpServer(host: string, port: number) {
  const app = express();

  // Enable CORS for all routes
  app.use(
    cors({
      origin: true,
      exposedHeaders: ['mcp-session-id'],
      allowedHeaders: ['Content-Type', 'mcp-session-id'],
    })
  );

  // Parse JSON bodies
  app.use(express.json());

  // Map to store transports by session ID
  const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    const activeSessions = Object.keys(transports).length;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      mode: 'stateful',
      activeSessions,
      capabilities: ['keycloak', 'infisical', 'integration'],
    });
  });

  // Handle POST requests for client-to-server communication
  app.post('/mcp', async (req: Request, res: Response) => {
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;
    let server: McpServer;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport and session
      transport = transports[sessionId];
      console.error(`[${sessionId}] Reusing existing session`);
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request - create new session
      const newSessionId = randomUUID();
      console.error(`[${newSessionId}] Creating new session`);

      // Initialize session clients
      const session = initializeSessionClients(newSessionId);

      // Create stateful server for this session
      server = createStatefulMCPServer(newSessionId);

      // Create transport with session management
      // Configure DNS rebinding protection and allowed hosts
      const enableDnsRebindingProtection = process.env.MCP_ENABLE_DNS_REBINDING_PROTECTION !== 'false';
      const allowedHosts: string[] = [];
      
      if (enableDnsRebindingProtection) {
        // Start with default localhost addresses
        allowedHosts.push(
          '127.0.0.1', 
          'localhost', 
          `127.0.0.1:${port}`, 
          `localhost:${port}`
        );
        
        // Add the current host if not localhost
        if (host !== '127.0.0.1' && host !== 'localhost') {
          allowedHosts.push(host, `${host}:${port}`);
        }
        
        // Add custom allowed hosts from environment variable
        const customHosts = process.env.MCP_ALLOWED_HOSTS;
        if (customHosts) {
          allowedHosts.push(...customHosts.split(',').map(h => h.trim()));
        }
        
        console.error(`[${newSessionId}] DNS rebinding protection ENABLED. Allowed hosts: ${allowedHosts.join(', ')}`);
      } else {
        console.error(`[${newSessionId}] DNS rebinding protection DISABLED - allowing all hosts`);
      }
      
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
        onsessioninitialized: id => {
          console.error(`[${id}] Session initialized`);
          transports[id] = transport;
        },
        enableDnsRebindingProtection,
        allowedHosts: enableDnsRebindingProtection ? allowedHosts : undefined,
      });

      // Clean up transport when closed
      transport.onclose = () => {
        console.error(`[${newSessionId}] Session closed, cleaning up`);
        if (transport.sessionId) {
          delete transports[transport.sessionId];
          sessions.delete(transport.sessionId);
        }
      };

      // Connect to the MCP server
      await server.connect(transport);
    } else {
      // Invalid request
      console.error('Invalid request: No valid session ID provided');
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    try {
      // Handle the request
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });

  // Handle GET requests for server-to-client notifications via SSE
  app.get('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  });

  // Handle DELETE requests for session termination
  app.delete('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  });

  app.listen(port, host, () => {
    console.error(
      `MCP Server for Keycloak and Infisical started in STATEFUL HTTP mode on ${host}:${port}`
    );
    console.error(`Health check available at: http://${host}:${port}/health`);
    console.error(`MCP endpoint available at: http://${host}:${port}/mcp`);
    console.error('Features: Session management, SSE notifications, stateful client connections');
  });
}

main().catch(error => {
  console.error('Server error:', error);
  process.exit(1);
});
