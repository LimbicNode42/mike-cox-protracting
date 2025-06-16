#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { KeycloakClient } from './keycloak/client.js';
import { InfisicalClient } from './infisical/client.js';
import { keycloakTools } from './keycloak/tools.js';
import { infisicalTools } from './infisical/tools.js';

const server = new Server(
  {
    name: 'mike-cox-protracting',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
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
    // Keycloak tools
    if (name.startsWith('keycloak_') && keycloakClient) {
      switch (name) {
        case 'keycloak_list_users':
          return await keycloakClient.listUsers(args);
        case 'keycloak_create_user':
          return await keycloakClient.createUser(args);
        case 'keycloak_get_user':
          return await keycloakClient.getUser(args);
        case 'keycloak_update_user':
          return await keycloakClient.updateUser(args);
        case 'keycloak_delete_user':
          return await keycloakClient.deleteUser(args);
        case 'keycloak_list_roles':
          return await keycloakClient.listRoles(args);
        case 'keycloak_assign_role':
          return await keycloakClient.assignRole(args);
        case 'keycloak_list_clients':
          return await keycloakClient.listClients(args);
        case 'keycloak_create_client':
          return await keycloakClient.createClient(args);
        default:
          throw new Error(`Unknown Keycloak tool: ${name}`);
      }
    }

    // Infisical tools
    if (name.startsWith('infisical_') && infisicalClient) {
      switch (name) {
        case 'infisical_list_secrets':
          return await infisicalClient.listSecrets(args);
        case 'infisical_get_secret':
          return await infisicalClient.getSecret(args);
        case 'infisical_create_secret':
          return await infisicalClient.createSecret(args);
        case 'infisical_update_secret':
          return await infisicalClient.updateSecret(args);
        case 'infisical_delete_secret':
          return await infisicalClient.deleteSecret(args);
        case 'infisical_list_projects':
          return await infisicalClient.listProjects(args);
        case 'infisical_create_project':
          return await infisicalClient.createProject(args);
        case 'infisical_list_environments':
          return await infisicalClient.listEnvironments(args);
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
