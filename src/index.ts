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

  try {    // Keycloak tools (only write operations)
    if (name.startsWith('keycloak_') && keycloakClient) {
      switch (name) {
        // Realm management
        case 'keycloak_create_realm':
          return await keycloakClient.createRealm(args);
        case 'keycloak_update_realm':
          return await keycloakClient.updateRealm(args);
        case 'keycloak_delete_realm':
          return await keycloakClient.deleteRealm(args);
        
        // User management
        case 'keycloak_create_user':
          return await keycloakClient.createUser(args);
        case 'keycloak_update_user':
          return await keycloakClient.updateUser(args);
        case 'keycloak_delete_user':
          return await keycloakClient.deleteUser(args);
        
        // Client management
        case 'keycloak_create_client':
          return await keycloakClient.createClient(args);
        case 'keycloak_update_client':
          return await keycloakClient.updateClient(args);
        case 'keycloak_delete_client':
          return await keycloakClient.deleteClient(args);
        
        // Role management
        case 'keycloak_create_role':
          return await keycloakClient.createRole(args);
        case 'keycloak_update_role':
          return await keycloakClient.updateRole(args);
        case 'keycloak_delete_role':
          return await keycloakClient.deleteRole(args);
        case 'keycloak_create_client_role':
          return await keycloakClient.createClientRole(args);
        
        // Role assignment
        case 'keycloak_assign_realm_role':
          return await keycloakClient.assignRealmRoleToUser(args);
        case 'keycloak_assign_client_role':
          return await keycloakClient.assignClientRoleToUser(args);
        case 'keycloak_assign_role': // Backward compatibility
          return await keycloakClient.assignRole(args);
        
        // Group management
        case 'keycloak_create_group':
          return await keycloakClient.createGroup(args);
        case 'keycloak_update_group':
          return await keycloakClient.updateGroup(args);
        case 'keycloak_delete_group':
          return await keycloakClient.deleteGroup(args);
        
        // Identity provider management
        case 'keycloak_create_identity_provider':
          return await keycloakClient.createIdentityProvider(args);
        case 'keycloak_update_identity_provider':
          return await keycloakClient.updateIdentityProvider(args);
        case 'keycloak_delete_identity_provider':
          return await keycloakClient.deleteIdentityProvider(args);
        
        // Client scope management
        case 'keycloak_create_client_scope':
          return await keycloakClient.createClientScope(args);
        
        // Authentication flow management
        case 'keycloak_create_authentication_flow':
          return await keycloakClient.createAuthenticationFlow(args);
        
        // Organization management
        case 'keycloak_create_organization':
          return await keycloakClient.createOrganization(args);
        
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
      
      // Realm resources
      if (path === 'realms') {
        return await keycloakClient.listRealms();
      } else if (path.startsWith('realm/')) {
        const realm = path.split('/')[1];
        return await keycloakClient.getRealm({ realm });
      }
      
      // User resources
      else if (path === 'users') {
        const realm = searchParams.get('realm') || 'master';
        const max = parseInt(searchParams.get('max') || '100');
        const search = searchParams.get('search') || undefined;
        const first = parseInt(searchParams.get('first') || '0');
        return await keycloakClient.listUsers({ realm, max, search, first });
      } else if (path.startsWith('user/')) {
        const userId = path.split('/')[1];
        const realm = searchParams.get('realm') || 'master';
        return await keycloakClient.getUser({ realm, userId });
      } else if (path === 'users/count') {
        const realm = searchParams.get('realm') || 'master';
        const search = searchParams.get('search') || undefined;
        return await keycloakClient.getUserCount({ realm, search });
      }
      
      // Client resources
      else if (path === 'clients') {
        const realm = searchParams.get('realm') || 'master';
        const clientId = searchParams.get('clientId') || undefined;
        const max = parseInt(searchParams.get('max') || '100');
        const first = parseInt(searchParams.get('first') || '0');
        return await keycloakClient.listClients({ realm, clientId, max, first });
      } else if (path.startsWith('client/')) {
        const clientUuid = path.split('/')[1];
        const realm = searchParams.get('realm') || 'master';
        
        // Check if this is a client roles request
        if (path.endsWith('/roles')) {
          return await keycloakClient.listClientRoles({ realm, clientUuid });
        } else {
          return await keycloakClient.getClient({ realm, clientUuid });
        }
      }
      
      // Role resources
      else if (path === 'roles') {
        const realm = searchParams.get('realm') || 'master';
        const max = parseInt(searchParams.get('max') || '100');
        const search = searchParams.get('search') || undefined;
        return await keycloakClient.listRoles({ realm, max, search });
      } else if (path.startsWith('role/')) {
        const roleName = path.split('/')[1];
        const realm = searchParams.get('realm') || 'master';
        return await keycloakClient.getRole({ realm, roleName });
      }
      
      // Group resources
      else if (path === 'groups') {
        const realm = searchParams.get('realm') || 'master';
        const max = parseInt(searchParams.get('max') || '100');
        const search = searchParams.get('search') || undefined;
        const first = parseInt(searchParams.get('first') || '0');
        return await keycloakClient.listGroups({ realm, max, search, first });
      } else if (path.startsWith('group/')) {
        const groupId = path.split('/')[1];
        const realm = searchParams.get('realm') || 'master';
        return await keycloakClient.getGroup({ realm, groupId });
      }
      
      // Identity provider resources
      else if (path === 'identity-providers') {
        const realm = searchParams.get('realm') || 'master';
        const alias = searchParams.get('alias') || undefined;
        const providerId = searchParams.get('providerId') || undefined;
        return await keycloakClient.listIdentityProviders({ realm, alias, providerId });
      } else if (path.startsWith('identity-provider/')) {
        const alias = path.split('/')[1];
        const realm = searchParams.get('realm') || 'master';
        return await keycloakClient.getIdentityProvider({ realm, alias });
      }
      
      // Client scope resources
      else if (path === 'client-scopes') {
        const realm = searchParams.get('realm') || 'master';
        return await keycloakClient.listClientScopes({ realm });
      }
      
      // Event resources
      else if (path === 'events') {
        const realm = searchParams.get('realm') || 'master';
        const max = parseInt(searchParams.get('max') || '100');
        const first = parseInt(searchParams.get('first') || '0');
        const dateFrom = searchParams.get('dateFrom') || undefined;
        const dateTo = searchParams.get('dateTo') || undefined;
        const type = searchParams.get('type') || undefined;
        const userId = searchParams.get('userId') || undefined;
        return await keycloakClient.getEvents({ realm, max, first, dateFrom, dateTo, type, userId });
      } else if (path === 'admin-events') {
        const realm = searchParams.get('realm') || 'master';
        const max = parseInt(searchParams.get('max') || '100');
        const first = parseInt(searchParams.get('first') || '0');
        const dateFrom = searchParams.get('dateFrom') || undefined;
        const dateTo = searchParams.get('dateTo') || undefined;
        const operationType = searchParams.get('operationType') || undefined;
        const authRealm = searchParams.get('authRealm') || undefined;
        const authClient = searchParams.get('authClient') || undefined;
        const authUser = searchParams.get('authUser') || undefined;
        const authIpAddress = searchParams.get('authIpAddress') || undefined;
        const resourcePath = searchParams.get('resourcePath') || undefined;
        return await keycloakClient.getAdminEvents({ 
          realm, max, first, dateFrom, dateTo, operationType, 
          authRealm, authClient, authUser, authIpAddress, resourcePath 
        });
      }
      
      // Authentication flow resources
      else if (path === 'authentication/flows') {
        const realm = searchParams.get('realm') || 'master';
        return await keycloakClient.listAuthenticationFlows({ realm });
      }
      
      // Organization resources
      else if (path === 'organizations') {
        const realm = searchParams.get('realm') || 'master';
        const max = parseInt(searchParams.get('max') || '100');
        const first = parseInt(searchParams.get('first') || '0');
        const search = searchParams.get('search') || undefined;
        return await keycloakClient.listOrganizations({ realm, max, first, search });
      }
    }else if (url.protocol === 'infisical:' && infisicalClient) {
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
