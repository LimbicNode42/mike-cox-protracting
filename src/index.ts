#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { KeycloakClient } from './keycloak/client.js';
import { InfisicalClient } from './infisical/client.js';
import { keycloakTools } from './keycloak/tools.js';
import { infisicalTools } from './infisical/tools.js';
import { keycloakResources } from './keycloak/resources.js';
import { infisicalResources } from './infisical/resources.js';

const server = new Server(
  {
    name: 'mike-cox-protracting',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Initialize clients
let keycloakClient: KeycloakClient | null = null;
let infisicalClient: InfisicalClient | null = null;

// Initialize clients from environment variables
function initializeClients() {
  const keycloakUrl = process.env.KEYCLOAK_URL;
  const keycloakUsername = process.env.KEYCLOAK_USERNAME;
  const keycloakPassword = process.env.KEYCLOAK_PASSWORD;
  const keycloakRealm = process.env.KEYCLOAK_REALM || 'master';

  if (keycloakUrl && keycloakUsername && keycloakPassword) {
    keycloakClient = new KeycloakClient({
      url: keycloakUrl,
      username: keycloakUsername,
      password: keycloakPassword,
      realm: keycloakRealm,
    });
  }

  const infisicalUrl = process.env.INFISICAL_URL;
  const infisicalToken = process.env.INFISICAL_TOKEN;

  if (infisicalUrl && infisicalToken) {
    infisicalClient = new InfisicalClient({
      url: infisicalUrl,
      token: infisicalToken,
    });
  }
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools: Tool[] = [];
  
  if (keycloakClient) {
    tools.push(...keycloakTools);
  }
  
  if (infisicalClient) {
    tools.push(...infisicalTools);
  }

  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Keycloak tools (only write operations)
    if (name.startsWith('keycloak_') && keycloakClient) {
      switch (name) {
        case 'keycloak_create_user':
          return await keycloakClient.createUser(args);
        case 'keycloak_update_user':
          return await keycloakClient.updateUser(args);
        case 'keycloak_delete_user':
          return await keycloakClient.deleteUser(args);
        case 'keycloak_assign_role':
          return await keycloakClient.assignRole(args);
        case 'keycloak_create_client':
          return await keycloakClient.createClient(args);
        default:
          throw new Error(`Unknown Keycloak tool: ${name}`);
      }
    }

    // Infisical tools (only write operations)
    if (name.startsWith('infisical_') && infisicalClient) {
      switch (name) {
        case 'infisical_create_secret':
          return await infisicalClient.createSecret(args);
        case 'infisical_update_secret':
          return await infisicalClient.updateSecret(args);
        case 'infisical_delete_secret':
          return await infisicalClient.deleteSecret(args);
        case 'infisical_create_project':
          return await infisicalClient.createProject(args);
        default:
          throw new Error(`Unknown Infisical tool: ${name}`);
      }
    }

    throw new Error(`Tool not available or client not configured: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const resources = [];
  
  if (keycloakClient) {
    resources.push(...keycloakResources);
  }
  
  if (infisicalClient) {
    resources.push(...infisicalResources);
  }

  return { resources };
});

// Handle resource reading
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    // Parse the URI to determine what resource to read
    const url = new URL(uri);
    
    if (url.protocol === 'keycloak:' && keycloakClient) {
      const path = url.pathname.slice(1); // Remove leading slash
      const searchParams = new URLSearchParams(url.search);
      
      if (path === 'users') {
        const realm = searchParams.get('realm') || 'master';
        const max = parseInt(searchParams.get('max') || '100');
        const search = searchParams.get('search') || undefined;
        return await keycloakClient.listUsers({ realm, max, search });
      } else if (path.startsWith('user/')) {
        const userId = path.split('/')[1];
        const realm = searchParams.get('realm') || 'master';
        return await keycloakClient.getUser({ realm, userId });
      } else if (path === 'roles') {
        const realm = searchParams.get('realm') || 'master';
        const clientId = searchParams.get('clientId') || undefined;
        return await keycloakClient.listRoles({ realm, clientId });
      } else if (path === 'clients') {
        const realm = searchParams.get('realm') || 'master';
        return await keycloakClient.listClients({ realm });
      }
    } else if (url.protocol === 'infisical:' && infisicalClient) {
      const path = url.pathname.slice(1); // Remove leading slash
      const searchParams = new URLSearchParams(url.search);
      
      if (path === 'secrets') {
        const projectId = searchParams.get('projectId');
        const environment = searchParams.get('environment') || 'dev';
        if (!projectId) throw new Error('projectId is required');
        return await infisicalClient.listSecrets({ projectId, environment });
      } else if (path.startsWith('secret/')) {
        const secretName = path.split('/')[1];
        const projectId = searchParams.get('projectId');
        const environment = searchParams.get('environment') || 'dev';
        if (!projectId) throw new Error('projectId is required');
        return await infisicalClient.getSecret({ projectId, environment, secretName });
      } else if (path === 'projects') {
        return await infisicalClient.listProjects({});
      } else if (path.startsWith('environments/')) {
        const projectId = path.split('/')[1];
        return await infisicalClient.listEnvironments({ projectId });
      }
    }
    
    throw new Error(`Unknown resource: ${uri}`);
  } catch (error: any) {
    return {
      contents: [{
        uri,
        text: `Error: ${error.message}`,
        mimeType: 'text/plain'
      }]
    };
  }
});

async function main() {
  initializeClients();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('MCP Server for Keycloak and Infisical started');
  console.error(`Keycloak client: ${keycloakClient ? 'configured' : 'not configured'}`);
  console.error(`Infisical client: ${infisicalClient ? 'configured' : 'not configured'}`);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
