#!/usr/bin/env node

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

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
import { KeycloakInfisicalIntegration, IntegrationConfig } from './integration/keycloak-infisical.js';
import { integrationTools } from './integration/tools.js';

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
let integration: KeycloakInfisicalIntegration | null = null;

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
  const infisicalClientId = process.env.INFISICAL_CLIENT_ID;
  const infisicalClientSecret = process.env.INFISICAL_CLIENT_SECRET;
  const infisicalToken = process.env.INFISICAL_TOKEN; // Legacy support

  // Prioritize Universal Auth (Client ID + Secret) over legacy token
  if (infisicalUrl && infisicalClientId && infisicalClientSecret) {
    infisicalClient = new InfisicalClient({
      url: infisicalUrl,
      clientId: infisicalClientId,
      clientSecret: infisicalClientSecret,
    });
    console.log('Infisical client initialized with Universal Auth');
  } else if (infisicalUrl && infisicalToken) {
    infisicalClient = new InfisicalClient({
      url: infisicalUrl,
      clientId: '', // Not used for legacy auth
      clientSecret: '', // Not used for legacy auth
      token: infisicalToken,
    });
    console.warn('⚠️  Infisical client initialized with deprecated API token. Please migrate to Universal Auth.');
  }
  // Initialize integration if both clients are available
  if (keycloakClient && infisicalClient) {
    const integrationConfig: IntegrationConfig = {
      enabled: process.env.KEYCLOAK_INFISICAL_INTEGRATION_ENABLED === 'true',
    };

    integration = new KeycloakInfisicalIntegration(keycloakClient, infisicalClient, integrationConfig);
    
    if (integrationConfig.enabled) {
      console.log('Keycloak-Infisical integration enabled with auto-discovery');
    } else {
      console.log('Keycloak-Infisical integration disabled');
    }
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

  // Add integration tools if both clients are available
  if (keycloakClient && infisicalClient) {
    tools.push(...integrationTools);
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
          return await keycloakClient.deleteRealm(args);        // User management
        case 'keycloak_create_user':
          const userResult = await keycloakClient.createUser(args);
          // Auto-store user credentials in Infisical if integration is enabled
          if (integration?.isEnabled() && args && args.password) {
            await integration.storeUserCredentials(args, (args.realm as string) || 'master', args.password as string);
          }
          return userResult;
        case 'keycloak_update_user':
          return await keycloakClient.updateUser(args);
        case 'keycloak_delete_user':
          return await keycloakClient.deleteUser(args);
          // Client management
        case 'keycloak_create_client':
          const clientResult = await keycloakClient.createClient(args);
          // Auto-store client secret in Infisical if integration is enabled
          if (integration?.isEnabled() && args && clientResult.clientData) {
            await integration.storeClientSecret(clientResult.clientData, (args.realm as string) || 'master');
          }
          return clientResult;
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
          const idpResult = await keycloakClient.createIdentityProvider(args);
          // Auto-store identity provider client secret in Infisical if integration is enabled
          if (integration?.isEnabled() && args) {
            await integration.storeIdentityProviderSecret(args, (args.realm as string) || 'master');
          }
          return idpResult;
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
    }    // Infisical tools (only write operations)
    if (name.startsWith('infisical_') && infisicalClient) {
      switch (name) {
        // Secret management
        case 'infisical_create_secret':
          return await infisicalClient.createSecret(args);
        case 'infisical_update_secret':
          return await infisicalClient.updateSecret(args);
        case 'infisical_delete_secret':
          return await infisicalClient.deleteSecret(args);
        
        // Project management
        case 'infisical_create_project':
          return await infisicalClient.createProject(args);
        case 'infisical_update_project':
          return await infisicalClient.updateProject(args);
        case 'infisical_delete_project':
          return await infisicalClient.deleteProject(args);
        
        // Environment management
        case 'infisical_create_environment':
          return await infisicalClient.createEnvironment(args);
        case 'infisical_update_environment':
          return await infisicalClient.updateEnvironment(args);
        case 'infisical_delete_environment':
          return await infisicalClient.deleteEnvironment(args);
        
        // Folder management
        case 'infisical_create_folder':
          return await infisicalClient.createFolder(args);
        case 'infisical_update_folder':
          return await infisicalClient.updateFolder(args);
        case 'infisical_delete_folder':
          return await infisicalClient.deleteFolder(args);
        
        // Secret tag management
        case 'infisical_create_secret_tag':
          return await infisicalClient.createSecretTag(args);
        case 'infisical_update_secret_tag':
          return await infisicalClient.updateSecretTag(args);
        case 'infisical_delete_secret_tag':
          return await infisicalClient.deleteSecretTag(args);
        
        // Organization management
        case 'infisical_update_organization_membership':
          return await infisicalClient.updateOrganizationMembership(args);
        case 'infisical_delete_organization_membership':
          return await infisicalClient.deleteOrganizationMembership(args);
          default:
          throw new Error(`Unknown Infisical tool: ${name}`);
      }
    }

    // Integration tools (require both clients)
    if (name.startsWith('keycloak_infisical_') && keycloakClient && infisicalClient) {
      switch (name) {        case 'keycloak_infisical_configure_integration':
          if (!integration) {
            const integrationConfig: IntegrationConfig = { enabled: false };
            integration = new KeycloakInfisicalIntegration(keycloakClient, infisicalClient, integrationConfig);
          }
          if (args) {
            integration.updateConfig(args as Partial<IntegrationConfig>);
          }
          return {
            content: [{ type: 'text', text: `Integration configuration updated. Enabled: ${integration.isEnabled()}` }],
          };

        case 'keycloak_infisical_get_integration_status':
          if (!integration) {
            return {
              content: [{ type: 'text', text: 'Integration not initialized. Both Keycloak and Infisical clients are required.' }],
            };
          }
          const config = integration.getConfig();
          return {
            content: [{ type: 'text', text: JSON.stringify(config, null, 2) }],
          };        case 'keycloak_infisical_store_existing_secret':
          if (!integration?.isEnabled()) {
            return {
              content: [{ type: 'text', text: 'Integration is not enabled or not configured.' }],
            };
          }
          if (!args) {
            throw new Error('Arguments are required for this tool');
          }
          await integration.storeGeneratedSecret(
            args.secretName as string,
            args.secretValue as string,
            args.context as string,
            (args.realm as string) || 'master'
          );
          return {
            content: [{ type: 'text', text: `Secret '${args.secretName}' stored in Infisical successfully` }],
          };

        default:
          throw new Error(`Unknown integration tool: ${name}`);
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
      }    } else if (url.protocol === 'infisical:' && infisicalClient) {
      const path = url.pathname.slice(1); // Remove leading slash
      const searchParams = new URLSearchParams(url.search);
      
      // Secret resources
      if (path === 'secrets') {
        const workspaceId = searchParams.get('workspaceId') || searchParams.get('projectId');
        const environment = searchParams.get('environment') || 'dev';
        const secretPath = searchParams.get('secretPath') || '/';
        const viewSecretValue = searchParams.get('viewSecretValue') !== 'false';
        const expandSecretReferences = searchParams.get('expandSecretReferences') === 'true';
        const recursive = searchParams.get('recursive') === 'true';
        const includeImports = searchParams.get('includeImports') === 'true';
        const metadataFilter = searchParams.get('metadataFilter');
        const tagSlugs = searchParams.get('tagSlugs');
        const workspaceSlug = searchParams.get('workspaceSlug');
        
        if (!workspaceId) throw new Error('workspaceId or projectId is required');
        return await infisicalClient.listSecrets({ 
          workspaceId, environment, secretPath, viewSecretValue, 
          expandSecretReferences, recursive, includeImports, 
          metadataFilter, tagSlugs, workspaceSlug 
        });
      } else if (path.startsWith('secret/')) {
        const secretName = path.split('/')[1];
        const workspaceId = searchParams.get('workspaceId') || searchParams.get('projectId');
        const environment = searchParams.get('environment') || 'dev';
        const secretPath = searchParams.get('secretPath') || '/';
        const version = searchParams.get('version');
        const type = searchParams.get('type') || 'shared';
        const expandSecretReferences = searchParams.get('expandSecretReferences') === 'true';
        const workspaceSlug = searchParams.get('workspaceSlug');
        
        if (!workspaceId) throw new Error('workspaceId or projectId is required');
        return await infisicalClient.getSecret({ 
          workspaceId, environment, secretName, secretPath, 
          version, type, expandSecretReferences, workspaceSlug 
        });
      }
      
      // Project resources
      else if (path === 'projects') {
        return await infisicalClient.listProjects({});
      } else if (path.startsWith('project/')) {
        const workspaceId = path.split('/')[1];
        return await infisicalClient.getProject({ workspaceId });
      }
      
      // Environment resources
      else if (path.startsWith('environments/')) {
        const workspaceId = path.split('/')[1];
        return await infisicalClient.listEnvironments({ workspaceId });
      }
      
      // Folder resources
      else if (path === 'folders') {
        const workspaceId = searchParams.get('workspaceId') || searchParams.get('projectId');
        const environment = searchParams.get('environment');
        const folderPath = searchParams.get('path') || searchParams.get('directory');
        const recursive = searchParams.get('recursive') === 'true';
        const lastSecretModified = searchParams.get('lastSecretModified');
        
        if (!workspaceId || !environment) throw new Error('workspaceId/projectId and environment are required');
        return await infisicalClient.listFolders({ 
          workspaceId, environment, path: folderPath, 
          recursive, lastSecretModified 
        });
      } else if (path.startsWith('folder/')) {
        const folderId = path.split('/')[1];
        return await infisicalClient.getFolder({ folderId });
      }
      
      // Secret tag resources
      else if (path.startsWith('secret-tags/')) {
        const parts = path.split('/');
        if (parts.length === 2) {
          // List tags: secret-tags/{workspaceId}
          const workspaceId = parts[1];
          return await infisicalClient.listSecretTags({ workspaceId });
        } else if (parts.length === 3) {
          // Get specific tag: secret-tags/{workspaceId}/{tagId}
          const workspaceId = parts[1];
          const tagId = parts[2];
          return await infisicalClient.getSecretTag({ workspaceId, tagId });
        }
      }
      
      // Organization resources
      else if (path.startsWith('organization/') && path.includes('/memberships')) {
        const organizationId = path.split('/')[1];
        return await infisicalClient.getOrganizationMemberships({ organizationId });
      }
      
      // Audit log resources
      else if (path === 'audit-logs') {
        const projectId = searchParams.get('projectId');
        const environment = searchParams.get('environment');
        const actorType = searchParams.get('actorType');
        const secretPath = searchParams.get('secretPath');
        const secretKey = searchParams.get('secretKey');
        const eventType = searchParams.get('eventType');
        const userAgentType = searchParams.get('userAgentType');
        const eventMetadata = searchParams.get('eventMetadata');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const offset = parseInt(searchParams.get('offset') || '0');
        const limit = parseInt(searchParams.get('limit') || '20');
        const actor = searchParams.get('actor');
        
        return await infisicalClient.getAuditLogs({ 
          projectId, environment, actorType, secretPath, secretKey, 
          eventType, userAgentType, eventMetadata, startDate, endDate, 
          offset, limit, actor 
        });
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
