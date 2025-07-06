import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { KeycloakClient } from './keycloak/client.js';
import { InfisicalClient } from './infisical/client.js';
import { KeycloakInfisicalIntegration } from './integration/keycloak-infisical.js';
import { keycloakTools } from './keycloak/tools.js';
import { infisicalTools } from './infisical/tools.js';
import { integrationTools } from './integration/tools.js';
import { keycloakResources } from './keycloak/resources.js';
import { infisicalResources } from './infisical/resources.js';

export interface ServerSession {
  keycloakClient: KeycloakClient | null;
  infisicalClient: InfisicalClient | null;
  integration: KeycloakInfisicalIntegration | null;
  sessionId: string;
  initialized: boolean;
}

// Utility function to convert JSON Schema to Zod schema
function jsonSchemaToZod(jsonSchema: any): z.ZodRawShape {
  const shape: z.ZodRawShape = {};
  
  if (jsonSchema.type === 'object' && jsonSchema.properties) {
    for (const [key, propSchema] of Object.entries(jsonSchema.properties)) {
      const prop = propSchema as any;
      let zodType: z.ZodTypeAny;
      
      switch (prop.type) {
        case 'string':
          zodType = z.string();
          if (prop.description) {
            zodType = zodType.describe(prop.description);
          }
          break;
        case 'number':
          zodType = z.number();
          if (prop.description) {
            zodType = zodType.describe(prop.description);
          }
          break;
        case 'boolean':
          zodType = z.boolean();
          if (prop.description) {
            zodType = zodType.describe(prop.description);
          }
          break;
        case 'array':
          zodType = z.array(z.unknown());
          if (prop.description) {
            zodType = zodType.describe(prop.description);
          }
          break;
        case 'object':
          if (prop.properties) {
            zodType = z.object(jsonSchemaToZod(prop));
          } else {
            zodType = z.record(z.unknown());
          }
          if (prop.description) {
            zodType = zodType.describe(prop.description);
          }
          break;
        default:
          zodType = z.unknown();
          if (prop.description) {
            zodType = zodType.describe(prop.description);
          }
      }
      
      // Handle optional fields
      if (!jsonSchema.required || !jsonSchema.required.includes(key)) {
        zodType = zodType.optional();
      }
      
      shape[key] = zodType;
    }
  }
  
  return shape;
}

export function registerAllCapabilities(server: McpServer, session: ServerSession) {
  const { sessionId } = session;
  console.error(`[${sessionId}] Registering all server capabilities`);

  // Register Keycloak resources and tools
  if (session.keycloakClient) {
    registerKeycloakResources(server, session);
    registerKeycloakTools(server, session);
  }

  // Register Infisical resources and tools
  if (session.infisicalClient) {
    registerInfisicalResources(server, session);
    registerInfisicalTools(server, session);
  }

  // Register integration tools
  if (session.integration) {
    registerIntegrationTools(server, session);
  }

  console.error(`[${sessionId}] All capabilities registered`);
}

// Register Infisical resources
function registerInfisicalResources(server: McpServer, session: ServerSession) {
  const { infisicalClient, sessionId } = session;
  if (!infisicalClient) return;

  console.error(`[${sessionId}] Registering ${infisicalResources.length} Infisical resources`);

  // Get default values from environment variables
  const defaultProjectId = process.env.INFISICAL_PROJECT_ID;
  const defaultOrgId = process.env.INFISICAL_ORG_ID;
  const defaultEnvironment = process.env.INFISICAL_ENVIRONMENT_SLUG || 'dev';

  console.error(`[${sessionId}] Using defaults - Project: ${defaultProjectId}, Org: ${defaultOrgId}, Env: ${defaultEnvironment}`);

  // Resource handler mapping - map URI patterns to client methods
  const resourceHandlers: { [key: string]: (uri: URL, params: any) => Promise<any> } = {
    'infisical://secrets': async (uri) => {
      const urlParams = new URLSearchParams(uri.search);
      const projectId = urlParams.get('projectId') || urlParams.get('workspaceId') || process.env.INFISICAL_PROJECT_ID || '';
      const environment = urlParams.get('environment') || process.env.INFISICAL_ENVIRONMENT_SLUG || 'dev';
      const path = urlParams.get('path') || '/';
      return await infisicalClient.listSecrets({ projectId, environment, path });
    },
    'infisical://projects': async (uri) => {
      return await infisicalClient.listProjects({});
    },
    'infisical://project/{workspaceId}': async (uri, { workspaceId }) => {
      return await infisicalClient.getProject({ projectId: workspaceId });
    },
    'infisical://environments/{workspaceId}': async (uri, { workspaceId }) => {
      return await infisicalClient.listEnvironments({ projectId: workspaceId });
    },
    'infisical://environments/{projectId}': async (uri, { projectId }) => {
      return await infisicalClient.listEnvironments({ projectId });
    },
    'infisical://folders': async (uri) => {
      const urlParams = new URLSearchParams(uri.search);
      const projectId = urlParams.get('projectId') || urlParams.get('workspaceId') || process.env.INFISICAL_PROJECT_ID || '';
      const environment = urlParams.get('environment') || process.env.INFISICAL_ENVIRONMENT_SLUG || 'dev';
      const path = urlParams.get('path') || '/';
      return await infisicalClient.listFolders({ projectId, environment, path });
    },
    'infisical://folder/{folderId}': async (uri, { folderId }) => {
      return await infisicalClient.getFolder({ folderId });
    },
    'infisical://secret-tags/{workspaceId}': async (uri, { workspaceId }) => {
      return await infisicalClient.listSecretTags({ projectId: workspaceId });
    },
    'infisical://secret-tag/{workspaceId}/{tagId}': async (uri, { workspaceId, tagId }) => {
      // This would need a getSecretTag method on the client
      return { message: `Secret tag details for ${tagId} in ${workspaceId}`, tagId, workspaceId };
    },
    'infisical://organization/{organizationId}/memberships': async (uri, { organizationId }) => {
      return await infisicalClient.getOrganizationMemberships({ organizationId });
    },
    'infisical://audit-logs': async (uri) => {
      const urlParams = new URLSearchParams(uri.search);
      const organizationId = urlParams.get('organizationId') || process.env.INFISICAL_ORG_ID || '';
      return await infisicalClient.getAuditLogs({ organizationId });
    },
  };

  // Register all Infisical resources dynamically
  let registeredCount = 0;
  for (const resource of infisicalResources) {
    const handler = resourceHandlers[resource.uri];
    if (handler) {
      // Check if URI contains template variables (indicated by {})
      if (resource.uri.includes('{')) {
        // Dynamic resource with parameters
        server.registerResource(
          resource.name.toLowerCase().replace(/\s+/g, '-'),
          new ResourceTemplate(resource.uri, { list: undefined }),
          {
            title: resource.name,
            description: resource.description,
            mimeType: resource.mimeType
          },
          async (uri, params) => {
            try {
              const result = await handler(uri, params);
              return {
                contents: [{
                  uri: uri.href,
                  text: JSON.stringify(result, null, 2),
                  mimeType: resource.mimeType,
                }]
              };
            } catch (error: any) {
              return {
                contents: [{
                  uri: uri.href,
                  text: `Error fetching ${resource.name}: ${error.message}`,
                  mimeType: 'text/plain',
                }]
              };
            }
          }
        );
      } else {
        // Static resource
        server.registerResource(
          resource.name.toLowerCase().replace(/\s+/g, '-'),
          resource.uri,
          {
            title: resource.name,
            description: resource.description,
            mimeType: resource.mimeType
          },
          async (uri) => {
            try {
              const result = await handler(uri, {});
              return {
                contents: [{
                  uri: uri.href,
                  text: JSON.stringify(result, null, 2),
                  mimeType: resource.mimeType,
                }]
              };
            } catch (error: any) {
              return {
                contents: [{
                  uri: uri.href,
                  text: `Error fetching ${resource.name}: ${error.message}`,
                  mimeType: 'text/plain',
                }]
              };
            }
          }
        );
      }
      registeredCount++;
    } else {
      console.error(`[${sessionId}] No handler found for Infisical resource: ${resource.uri}`);
    }
  }
  console.error(`[${sessionId}] Successfully registered ${registeredCount}/${infisicalResources.length} Infisical resources`);
}

// Register Keycloak resources
function registerKeycloakResources(server: McpServer, session: ServerSession) {
  const { keycloakClient, sessionId } = session;
  if (!keycloakClient) return;

  console.error(`[${sessionId}] Registering ${keycloakResources.length} Keycloak resources`);

  // Get default values from environment variables
  const defaultRealm = process.env.KEYCLOAK_REALM || 'master';

  console.error(`[${sessionId}] Using defaults - Realm: ${defaultRealm}`);

  // Resource handler mapping - map URI patterns to client methods
  const resourceHandlers: { [key: string]: (uri: URL, params: any) => Promise<any> } = {
    'keycloak://realms': async (uri) => {
      return await keycloakClient.listRealms();
    },
    'keycloak://realm/{realm}': async (uri, { realm }) => {
      const actualRealm = realm || defaultRealm;
      return await keycloakClient.getRealm({ realm: actualRealm });
    },
    'keycloak://users': async (uri) => {
      const urlParams = new URLSearchParams(uri.search);
      const realm = urlParams.get('realm') || defaultRealm;
      const max = parseInt(urlParams.get('max') || '100');
      const search = urlParams.get('search') || undefined;
      return await keycloakClient.listUsers({ realm, max, search, first: 0 });
    },
    'keycloak://user/{userId}': async (uri, { userId }) => {
      const urlParams = new URLSearchParams(uri.search);
      const realm = urlParams.get('realm') || defaultRealm;
      return await keycloakClient.getUser({ realm, userId });
    },
    'keycloak://users/count': async (uri) => {
      const urlParams = new URLSearchParams(uri.search);
      const realm = urlParams.get('realm') || defaultRealm;
      return await keycloakClient.getUserCount({ realm });
    },
    'keycloak://clients': async (uri) => {
      const urlParams = new URLSearchParams(uri.search);
      const realm = urlParams.get('realm') || defaultRealm;
      const max = parseInt(urlParams.get('max') || '100');
      return await keycloakClient.listClients({ realm, max, first: 0 });
    },
    'keycloak://client/{clientUuid}': async (uri, { clientUuid }) => {
      const urlParams = new URLSearchParams(uri.search);
      const realm = urlParams.get('realm') || defaultRealm;
      return await keycloakClient.getClient({ realm, clientUuid });
    },
    'keycloak://roles': async (uri) => {
      const urlParams = new URLSearchParams(uri.search);
      const realm = urlParams.get('realm') || defaultRealm;
      const max = parseInt(urlParams.get('max') || '100');
      return await keycloakClient.listRoles({ realm, max, first: 0 });
    },
    'keycloak://role/{roleName}': async (uri, { roleName }) => {
      const urlParams = new URLSearchParams(uri.search);
      const realm = urlParams.get('realm') || defaultRealm;
      return await keycloakClient.getRole({ realm, roleName });
    },
    'keycloak://groups': async (uri) => {
      const urlParams = new URLSearchParams(uri.search);
      const realm = urlParams.get('realm') || defaultRealm;
      return await keycloakClient.listGroups({ realm });
    },
    'keycloak://group/{groupId}': async (uri, { groupId }) => {
      const urlParams = new URLSearchParams(uri.search);
      const realm = urlParams.get('realm') || defaultRealm;
      return await keycloakClient.getGroup({ realm, groupId });
    },
  };

  // Register all Keycloak resources dynamically
  let registeredCount = 0;
  for (const resource of keycloakResources) {
    const handler = resourceHandlers[resource.uri];
    if (handler) {
      // Check if URI contains template variables (indicated by {})
      if (resource.uri.includes('{')) {
        // Dynamic resource with parameters
        server.registerResource(
          resource.name.toLowerCase().replace(/\s+/g, '-'),
          new ResourceTemplate(resource.uri, { list: undefined }),
          {
            title: resource.name,
            description: resource.description,
            mimeType: resource.mimeType
          },
          async (uri, params) => {
            try {
              const result = await handler(uri, params);
              return {
                contents: [{
                  uri: uri.href,
                  text: JSON.stringify(result, null, 2),
                  mimeType: resource.mimeType,
                }]
              };
            } catch (error: any) {
              return {
                contents: [{
                  uri: uri.href,
                  text: `Error fetching ${resource.name}: ${error.message}`,
                  mimeType: 'text/plain',
                }]
              };
            }
          }
        );
      } else {
        // Static resource
        server.registerResource(
          resource.name.toLowerCase().replace(/\s+/g, '-'),
          resource.uri,
          {
            title: resource.name,
            description: resource.description,
            mimeType: resource.mimeType
          },
          async (uri) => {
            try {
              const result = await handler(uri, {});
              return {
                contents: [{
                  uri: uri.href,
                  text: JSON.stringify(result, null, 2),
                  mimeType: resource.mimeType,
                }]
              };
            } catch (error: any) {
              return {
                contents: [{
                  uri: uri.href,
                  text: `Error fetching ${resource.name}: ${error.message}`,
                  mimeType: 'text/plain',
                }]
              };
            }
          }
        );
      }
      registeredCount++;
    } else {
      console.error(`[${sessionId}] No handler found for Keycloak resource: ${resource.uri}`);
    }
  }
  console.error(`[${sessionId}] Successfully registered ${registeredCount}/${keycloakResources.length} Keycloak resources`);
}

// Register Keycloak tools
function registerKeycloakTools(server: McpServer, session: ServerSession) {
  const { keycloakClient, sessionId } = session;
  if (!keycloakClient) return;

  console.error(`[${sessionId}] Registering ${keycloakTools.length} Keycloak tools`);

  // Tool method mapping - map tool names to client methods
  const toolMethods: { [key: string]: (args: any) => Promise<any> } = {
    'keycloak_create_realm': (args) => keycloakClient.createRealm(args),
    'keycloak_update_realm': (args) => keycloakClient.updateRealm(args),
    'keycloak_delete_realm': (args) => keycloakClient.deleteRealm(args),
    'keycloak_create_user': (args) => keycloakClient.createUser(args),
    'keycloak_update_user': (args) => keycloakClient.updateUser(args),
    'keycloak_delete_user': (args) => keycloakClient.deleteUser(args),
    'keycloak_create_client': (args) => keycloakClient.createClient(args),
    'keycloak_update_client': (args) => keycloakClient.updateClient(args),
    'keycloak_delete_client': (args) => keycloakClient.deleteClient(args),
    'keycloak_create_role': (args) => keycloakClient.createRole(args),
    'keycloak_update_role': (args) => keycloakClient.updateRole(args),
    'keycloak_delete_role': (args) => keycloakClient.deleteRole(args),
    'keycloak_get_realm': (args) => keycloakClient.getRealm(args),
    'keycloak_get_user': (args) => keycloakClient.getUser(args),
    'keycloak_get_client': (args) => keycloakClient.getClient(args),
    'keycloak_get_role': (args) => keycloakClient.getRole(args),
    'keycloak_list_users': (args) => keycloakClient.listUsers(args),
    'keycloak_list_clients': (args) => keycloakClient.listClients(args),
    'keycloak_list_roles': (args) => keycloakClient.listRoles(args),
    'keycloak_get_user_count': (args) => keycloakClient.getUserCount(args),
  };

  // Register all Keycloak tools dynamically from imported definitions
  let registeredCount = 0;
  for (const tool of keycloakTools) {
    const methodHandler = toolMethods[tool.name];
    if (methodHandler) {
      // Convert JSON Schema to Zod and register the tool
      const zodSchema = jsonSchemaToZod(tool.inputSchema);
      server.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: zodSchema
        },
        async (args: any) => {
          try {
            const result = await methodHandler(args);
            return {
              content: [{
                type: "text" as const,
                text: JSON.stringify(result, null, 2)
              }]
            };
          } catch (error: any) {
            return {
              content: [{
                type: "text" as const,
                text: `Error executing ${tool.name}: ${error.message}`
              }],
              isError: true
            };
          }
        }
      );
      registeredCount++;
    } else {
      console.error(`[${sessionId}] No handler found for Keycloak tool: ${tool.name}`);
    }
  }
  console.error(`[${sessionId}] Successfully registered ${registeredCount}/${keycloakTools.length} Keycloak tools`);
}

// Register Infisical tools
function registerInfisicalTools(server: McpServer, session: ServerSession) {
  const { infisicalClient, sessionId } = session;
  if (!infisicalClient) return;

  console.error(`[${sessionId}] Registering ${infisicalTools.length} Infisical tools`);

  // Tool method mapping for Infisical
  const infisicalToolMethods: { [key: string]: (args: any) => Promise<any> } = {
    'infisical_get_secret': (args) => infisicalClient.getSecret(args),
    'infisical_create_secret': (args) => infisicalClient.createSecret(args),
    'infisical_update_secret': (args) => infisicalClient.updateSecret(args),
    'infisical_delete_secret': (args) => infisicalClient.deleteSecret(args),
    'infisical_create_project': (args) => infisicalClient.createProject(args),
    'infisical_update_project': (args) => infisicalClient.updateProject(args),
    'infisical_delete_project': (args) => infisicalClient.deleteProject(args),
    'infisical_create_environment': (args) => infisicalClient.createEnvironment(args),
    'infisical_update_environment': (args) => infisicalClient.updateEnvironment(args),
    'infisical_delete_environment': (args) => infisicalClient.deleteEnvironment(args),
    'infisical_create_folder': (args) => infisicalClient.createFolder(args),
    'infisical_update_folder': (args) => infisicalClient.updateFolder(args),
    'infisical_delete_folder': (args) => infisicalClient.deleteFolder(args),
    'infisical_create_secret_tag': (args) => infisicalClient.createSecretTag(args),
    'infisical_update_secret_tag': (args) => infisicalClient.updateSecretTag(args),
    'infisical_delete_secret_tag': (args) => infisicalClient.deleteSecretTag(args),
  };

  // Register all Infisical tools dynamically
  let registeredCount = 0;
  for (const tool of infisicalTools) {
    const methodHandler = infisicalToolMethods[tool.name];
    if (methodHandler) {
      // Convert JSON Schema to Zod and register the tool
      const zodSchema = jsonSchemaToZod(tool.inputSchema);
      server.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: zodSchema
        },
        async (args: any) => {
          try {
            const result = await methodHandler(args);
            return {
              content: [{
                type: "text" as const,
                text: JSON.stringify(result, null, 2)
              }]
            };
          } catch (error: any) {
            return {
              content: [{
                type: "text" as const,
                text: `Error executing ${tool.name}: ${error.message}`
              }],
              isError: true
            };
          }
        }
      );
      registeredCount++;
    } else {
      console.error(`[${sessionId}] No handler found for Infisical tool: ${tool.name}`);
    }
  }
  console.error(`[${sessionId}] Successfully registered ${registeredCount}/${infisicalTools.length} Infisical tools`);
}

// Register integration tools
function registerIntegrationTools(server: McpServer, session: ServerSession) {
  const { integration, sessionId } = session;
  if (!integration) return;

  console.error(`[${sessionId}] Registering ${integrationTools.length} integration tools`);

  // Integration tool method mapping
  const integrationToolMethods: { [key: string]: (args: any) => Promise<any> } = {
    'keycloak_infisical_configure_integration': async (args) => {
      integration.updateConfig(args);
      return { message: 'Integration configuration updated', config: integration.getConfig() };
    },
    'keycloak_infisical_get_integration_status': async (args) => {
      return { 
        enabled: integration.isEnabled(), 
        config: integration.getConfig(),
        message: 'Integration status retrieved'
      };
    },
    'keycloak_infisical_store_existing_secret': async (args) => {
      await integration.storeGeneratedSecret(args.secretName, args.secretValue, args.context || 'Manual storage', args.realm);
      return { message: `Secret ${args.secretName} stored successfully in realm ${args.realm}` };
    },
  };

  // Register all integration tools dynamically
  let registeredCount = 0;
  for (const tool of integrationTools) {
    const methodHandler = integrationToolMethods[tool.name];
    if (methodHandler) {
      // Convert JSON Schema to Zod and register the tool
      const zodSchema = jsonSchemaToZod(tool.inputSchema);
      server.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: zodSchema
        },
        async (args: any) => {
          try {
            const result = await methodHandler(args);
            return {
              content: [{
                type: "text" as const,
                text: JSON.stringify(result, null, 2)
              }]
            };
          } catch (error: any) {
            return {
              content: [{
                type: "text" as const,
                text: `Error executing ${tool.name}: ${error.message}`
              }],
              isError: true
            };
          }
        }
      );
      registeredCount++;
    } else {
      console.error(`[${sessionId}] No handler found for integration tool: ${tool.name}`);
    }
  }
  console.error(`[${sessionId}] Successfully registered ${registeredCount}/${integrationTools.length} integration tools`);
}
