#!/usr/bin/env node

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Tool,
  Resource,
} from '@modelcontextprotocol/sdk/types.js';
import { KeycloakClient } from './keycloak/client.js';
import { InfisicalClient } from './infisical/client.js';
import {
  KeycloakInfisicalIntegration,
  IntegrationConfig,
} from './integration/keycloak-infisical.js';
import { keycloakResources } from './keycloak/resources.js';
import { keycloakTools } from './keycloak/tools.js';
import { infisicalResources } from './infisical/resources.js';
import { infisicalTools } from './infisical/tools.js';

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
  const infisicalToken = process.env.INFISICAL_TOKEN;
  const infisicalClientId = process.env.INFISICAL_CLIENT_ID;
  const infisicalClientSecret = process.env.INFISICAL_CLIENT_SECRET;

  // Prioritize token auth (preferred) over Universal Auth (fallback)
  if (infisicalUrl && infisicalToken) {
    infisicalClient = new InfisicalClient({
      url: infisicalUrl,
      token: infisicalToken,
      // Static environment configuration from .env
      orgId: process.env.INFISICAL_ORG_ID,
      projectId: process.env.INFISICAL_PROJECT_ID,
      environment: process.env.INFISICAL_ENVIRONMENT_SLUG,
    });
    console.error('Infisical client initialized with Token Auth');
  } else if (infisicalUrl && infisicalClientId && infisicalClientSecret) {
    infisicalClient = new InfisicalClient({
      url: infisicalUrl,
      clientId: infisicalClientId,
      clientSecret: infisicalClientSecret,
      // Static environment configuration from .env
      orgId: process.env.INFISICAL_ORG_ID,
      projectId: process.env.INFISICAL_PROJECT_ID,
      environment: process.env.INFISICAL_ENVIRONMENT_SLUG,
    });
    console.error('Infisical client initialized with Universal Auth');
  }

  // Initialize integration if both clients are available
  if (keycloakClient && infisicalClient) {
    const integrationConfig: IntegrationConfig = {
      enabled: process.env.KEYCLOAK_INFISICAL_INTEGRATION_ENABLED === 'true',
    };

    integration = new KeycloakInfisicalIntegration(
      keycloakClient,
      infisicalClient,
      integrationConfig
    );
    if (integrationConfig.enabled) {
      console.error('Keycloak-Infisical integration enabled with auto-discovery');
    } else {
      console.error('Keycloak-Infisical integration disabled');
    }
  }
}

// Define available resources
const resources: Resource[] = [...keycloakResources, ...infisicalResources];

// Define available tools
const tools: Tool[] = [...keycloakTools, ...infisicalTools];

// List resources handler
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources };
});

// Read resource handler
server.setRequestHandler(ReadResourceRequestSchema, async request => {
  const { uri } = request.params;

  try {
    // Parse custom protocol URL safely
    const queryStart = uri.indexOf('?');
    const searchParams =
      queryStart >= 0 ? new URLSearchParams(uri.substring(queryStart)) : new URLSearchParams();

    if (uri.startsWith('keycloak://')) {
      if (!keycloakClient) {
        throw new Error('Keycloak client not configured');
      }

      // ========== REALM RESOURCES ==========
      if (uri === 'keycloak://realms') {
        const result = await keycloakClient.listRealms();
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      } else if (uri.match(/^keycloak:\/\/realm\/([^?]+)/)) {
        const realm = uri.match(/^keycloak:\/\/realm\/([^?]+)/)?.[1];
        if (!realm) throw new Error('Realm name is required');
        const result = await keycloakClient.getRealm({ realm });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      }

      // ========== USER RESOURCES ==========
      else if (uri.startsWith('keycloak://users')) {
        const realm = searchParams.get('realm') || 'master';
        const max = parseInt(searchParams.get('max') || '100');
        const search = searchParams.get('search') || undefined;
        const first = parseInt(searchParams.get('first') || '0');

        const result = await keycloakClient.listUsers({ realm, max, search, first });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      } else if (uri.match(/^keycloak:\/\/user\/([^?]+)/)) {
        const userId = uri.match(/^keycloak:\/\/user\/([^?]+)/)?.[1];
        const realm = searchParams.get('realm') || 'master';
        if (!userId) throw new Error('User ID is required');
        const result = await keycloakClient.getUser({ realm, userId });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      } else if (uri.startsWith('keycloak://users/count')) {
        const realm = searchParams.get('realm') || 'master';
        const result = await keycloakClient.getUserCount({ realm });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      }

      // ========== CLIENT RESOURCES ==========
      else if (uri.startsWith('keycloak://clients')) {
        const realm = searchParams.get('realm') || 'master';
        const clientId = searchParams.get('clientId') || undefined;
        const max = parseInt(searchParams.get('max') || '100');
        const first = parseInt(searchParams.get('first') || '0');

        const result = await keycloakClient.listClients({ realm, clientId, max, first });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      } else if (uri.match(/^keycloak:\/\/client\/([^?]+)/)) {
        const clientUuid = uri.match(/^keycloak:\/\/client\/([^?]+)/)?.[1];
        const realm = searchParams.get('realm') || 'master';
        if (!clientUuid) throw new Error('Client UUID is required');
        const result = await keycloakClient.getClient({ realm, clientUuid });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      }

      // ========== ROLE RESOURCES ==========
      else if (uri.startsWith('keycloak://roles')) {
        const realm = searchParams.get('realm') || 'master';
        const result = await keycloakClient.listRoles({ realm });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      } else if (uri.match(/^keycloak:\/\/role\/([^?]+)/)) {
        const roleName = uri.match(/^keycloak:\/\/role\/([^?]+)/)?.[1];
        const realm = searchParams.get('realm') || 'master';
        if (!roleName) throw new Error('Role name is required');
        const result = await keycloakClient.getRole({ realm, roleName });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      } else if (uri.match(/^keycloak:\/\/client\/([^\/]+)\/roles/)) {
        const clientUuid = uri.match(/^keycloak:\/\/client\/([^\/]+)\/roles/)?.[1];
        const realm = searchParams.get('realm') || 'master';
        if (!clientUuid) throw new Error('Client UUID is required');
        const result = await keycloakClient.listClientRoles({ realm, clientUuid });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      }

      // ========== GROUP RESOURCES ==========
      else if (uri.startsWith('keycloak://groups')) {
        const realm = searchParams.get('realm') || 'master';
        const result = await keycloakClient.listGroups({ realm });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      } else if (uri.match(/^keycloak:\/\/group\/([^?]+)/)) {
        const groupId = uri.match(/^keycloak:\/\/group\/([^?]+)/)?.[1];
        const realm = searchParams.get('realm') || 'master';
        if (!groupId) throw new Error('Group ID is required');
        const result = await keycloakClient.getGroup({ realm, groupId });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      }

      // ========== IDENTITY PROVIDER RESOURCES ==========
      else if (uri.startsWith('keycloak://identity-providers')) {
        const realm = searchParams.get('realm') || 'master';
        const result = await keycloakClient.listIdentityProviders({ realm });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      } else if (uri.match(/^keycloak:\/\/identity-provider\/([^?]+)/)) {
        const alias = uri.match(/^keycloak:\/\/identity-provider\/([^?]+)/)?.[1];
        const realm = searchParams.get('realm') || 'master';
        if (!alias) throw new Error('Identity provider alias is required');
        const result = await keycloakClient.getIdentityProvider({ realm, alias });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      }

      // ========== CLIENT SCOPE RESOURCES ==========
      else if (uri.startsWith('keycloak://client-scopes')) {
        const realm = searchParams.get('realm') || 'master';
        const result = await keycloakClient.listClientScopes({ realm });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      }

      // ========== EVENT RESOURCES ==========
      else if (uri.startsWith('keycloak://events')) {
        const realm = searchParams.get('realm') || 'master';
        const result = await keycloakClient.getEvents({ realm });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      } else if (uri.startsWith('keycloak://admin-events')) {
        const realm = searchParams.get('realm') || 'master';
        const result = await keycloakClient.getAdminEvents({ realm });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      }

      // ========== AUTHENTICATION FLOW RESOURCES ==========
      else if (uri.startsWith('keycloak://authentication/flows')) {
        const realm = searchParams.get('realm') || 'master';
        const result = await keycloakClient.listAuthenticationFlows({ realm });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      }

      // ========== ORGANIZATION RESOURCES ==========
      else if (uri.startsWith('keycloak://organizations')) {
        const realm = searchParams.get('realm') || 'master';
        const result = await keycloakClient.listOrganizations({ realm });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      }
    } else if (uri.startsWith('infisical://')) {
      if (!infisicalClient) {
        throw new Error('Infisical client not configured');
      } // ========== SECRET RESOURCES ==========
      if (uri.startsWith('infisical://secrets')) {
        const workspaceId = searchParams.get('workspaceId') || searchParams.get('projectId');
        const environment = searchParams.get('environment');
        const secretPath = searchParams.get('secretPath') || '/';

        const result = await infisicalClient.listSecrets({
          workspaceId,
          environment,
          secretPath,
        });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      }

      // ========== PROJECT RESOURCES ==========
      else if (uri === 'infisical://projects') {
        const result = await infisicalClient.listProjects({});
        return {
          contents: [
            {
              uri,
              text: result.content[0].text,
              mimeType: 'application/json',
            },
          ],
        };
      } else if (uri.match(/^infisical:\/\/project\/([^?]+)/)) {
        const workspaceId = uri.match(/^infisical:\/\/project\/([^?]+)/)?.[1];
        if (!workspaceId) throw new Error('Workspace ID is required');
        const result = await infisicalClient.getProject({ workspaceId });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      }

      // ========== ENVIRONMENT RESOURCES ==========
      else if (uri.match(/^infisical:\/\/environments\/([^?]+)/)) {
        const workspaceId = uri.match(/^infisical:\/\/environments\/([^?]+)/)?.[1];
        if (!workspaceId) throw new Error('Workspace ID is required');
        const result = await infisicalClient.listEnvironments({ workspaceId });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      } // ========== FOLDER RESOURCES ==========
      else if (uri.startsWith('infisical://folders')) {
        const workspaceId = searchParams.get('workspaceId') || searchParams.get('projectId');
        const environment = searchParams.get('environment');
        const path = searchParams.get('path') || '/';

        const result = await infisicalClient.listFolders({
          workspaceId,
          environment,
          path,
        });
        return {
          contents: [
            {
              uri,
              text: result.content[0].text,
              mimeType: 'application/json',
            },
          ],
        };
      } else if (uri.match(/^infisical:\/\/folder\/([^?]+)/)) {
        const folderId = uri.match(/^infisical:\/\/folder\/([^?]+)/)?.[1];
        if (!folderId) throw new Error('Folder ID is required');
        const result = await infisicalClient.getFolder({ folderId });
        return {
          contents: [
            {
              uri,
              text: result.content[0].text,
              mimeType: 'application/json',
            },
          ],
        };
      } // ========== SECRET TAG RESOURCES ==========
      else if (uri.match(/^infisical:\/\/secret-tags\/([^?]+)/)) {
        const workspaceId = uri.match(/^infisical:\/\/secret-tags\/([^?]+)/)?.[1];
        if (!workspaceId) throw new Error('Workspace ID is required');
        const result = await infisicalClient.listSecretTags({ workspaceId });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      } else if (uri.match(/^infisical:\/\/secret-tag\/([^\/]+)\/([^?]+)/)) {
        const matches = uri.match(/^infisical:\/\/secret-tag\/([^\/]+)\/([^?]+)/);
        const workspaceId = matches?.[1];
        const tagId = matches?.[2];
        if (!workspaceId || !tagId) throw new Error('Workspace ID and tag ID are required');
        const result = await infisicalClient.getSecretTag({ workspaceId, tagId });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      }

      // ========== ORGANIZATION RESOURCES ==========
      else if (uri.match(/^infisical:\/\/organization\/([^\/]+)\/memberships/)) {
        const organizationId = uri.match(/^infisical:\/\/organization\/([^\/]+)\/memberships/)?.[1];
        if (!organizationId) throw new Error('Organization ID is required');
        const result = await infisicalClient.getOrganizationMemberships({ organizationId });
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      }

      // ========== AUDIT LOG RESOURCES ==========
      else if (uri.startsWith('infisical://audit-logs')) {
        const result = await infisicalClient.getAuditLogs({});
        return {
          contents: [
            {
              uri,
              text: JSON.stringify(result, null, 2),
              mimeType: 'application/json',
            },
          ],
        };
      }
    }

    throw new Error(`Unknown resource: ${uri}`);
  } catch (error: any) {
    return {
      contents: [
        {
          uri,
          text: `Error: ${error.message}`,
          mimeType: 'text/plain',
        },
      ],
    };
  }
});

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  try {
    // ========== KEYCLOAK TOOLS ==========
    if (name.startsWith('keycloak_')) {
      if (!keycloakClient) {
        throw new Error('Keycloak client not configured');
      }

      // Realm management
      if (name === 'keycloak_create_realm') {
        const result = await keycloakClient.createRealm(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'keycloak_update_realm') {
        const result = await keycloakClient.updateRealm(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'keycloak_delete_realm') {
        const result = await keycloakClient.deleteRealm(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      // User management
      else if (name === 'keycloak_create_user') {
        const result = await keycloakClient.createUser(args);

        // Auto-store user credentials in Infisical if integration is enabled
        if (integration?.isEnabled() && args && args.password) {
          await integration.storeUserCredentials(
            args,
            (args.realm as string) || 'master',
            args.password as string
          );
        }

        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'keycloak_update_user') {
        const result = await keycloakClient.updateUser(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'keycloak_delete_user') {
        const result = await keycloakClient.deleteUser(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      // Client management
      else if (name === 'keycloak_create_client') {
        const result = await keycloakClient.createClient(args);

        // Auto-store client secret in Infisical if integration is enabled
        if (integration?.isEnabled() && args && result.clientData) {
          await integration.storeClientSecret(
            result.clientData,
            (args.realm as string) || 'master'
          );
        }

        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'keycloak_update_client') {
        const result = await keycloakClient.updateClient(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'keycloak_delete_client') {
        const result = await keycloakClient.deleteClient(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      // Role management
      else if (name === 'keycloak_create_role') {
        const result = await keycloakClient.createRole(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'keycloak_update_role') {
        const result = await keycloakClient.updateRole(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'keycloak_delete_role') {
        const result = await keycloakClient.deleteRole(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'keycloak_create_client_role') {
        const result = await keycloakClient.createClientRole(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } // Role assignment
      else if (name === 'keycloak_assign_realm_role') {
        const result = await keycloakClient.assignRealmRoleToUser(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'keycloak_assign_client_role') {
        const result = await keycloakClient.assignClientRoleToUser(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'keycloak_assign_role') {
        // Backward compatibility - determine if it's a realm or client role
        const result = await keycloakClient.assignRole(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      // Group management
      else if (name === 'keycloak_create_group') {
        const result = await keycloakClient.createGroup(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'keycloak_update_group') {
        const result = await keycloakClient.updateGroup(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'keycloak_delete_group') {
        const result = await keycloakClient.deleteGroup(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      // Identity provider management
      else if (name === 'keycloak_create_identity_provider') {
        const result = await keycloakClient.createIdentityProvider(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'keycloak_update_identity_provider') {
        const result = await keycloakClient.updateIdentityProvider(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'keycloak_delete_identity_provider') {
        const result = await keycloakClient.deleteIdentityProvider(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      // Client scope management
      else if (name === 'keycloak_create_client_scope') {
        const result = await keycloakClient.createClientScope(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      // Authentication flow management
      else if (name === 'keycloak_create_authentication_flow') {
        const result = await keycloakClient.createAuthenticationFlow(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      // Organization management
      else if (name === 'keycloak_create_organization') {
        const result = await keycloakClient.createOrganization(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else {
        throw new Error(`Unknown Keycloak tool: ${name}`);
      }
    }

    // ========== INFISICAL TOOLS ==========
    else if (name.startsWith('infisical_')) {
      if (!infisicalClient) {
        throw new Error('Infisical client not configured');
      } // Secret management
      if (name === 'infisical_get_secret') {
        const result = await infisicalClient.getSecret(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'infisical_create_secret') {
        const result = await infisicalClient.createSecret(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'infisical_update_secret') {
        const result = await infisicalClient.updateSecret(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'infisical_delete_secret') {
        const result = await infisicalClient.deleteSecret(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      // Project management
      else if (name === 'infisical_create_project') {
        const result = await infisicalClient.createProject(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'infisical_update_project') {
        const result = await infisicalClient.updateProject(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'infisical_delete_project') {
        const result = await infisicalClient.deleteProject(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      // Environment management
      else if (name === 'infisical_create_environment') {
        const result = await infisicalClient.createEnvironment(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'infisical_update_environment') {
        const result = await infisicalClient.updateEnvironment(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'infisical_delete_environment') {
        const result = await infisicalClient.deleteEnvironment(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      // Folder management
      else if (name === 'infisical_create_folder') {
        const result = await infisicalClient.createFolder(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'infisical_update_folder') {
        const result = await infisicalClient.updateFolder(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'infisical_delete_folder') {
        const result = await infisicalClient.deleteFolder(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      // Secret tag management
      else if (name === 'infisical_create_secret_tag') {
        const result = await infisicalClient.createSecretTag(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'infisical_update_secret_tag') {
        const result = await infisicalClient.updateSecretTag(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'infisical_delete_secret_tag') {
        const result = await infisicalClient.deleteSecretTag(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      // Organization management
      else if (name === 'infisical_update_organization_membership') {
        const result = await infisicalClient.updateOrganizationMembership(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else if (name === 'infisical_delete_organization_membership') {
        const result = await infisicalClient.deleteOrganizationMembership(args);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } else {
        throw new Error(`Unknown Infisical tool: ${name}`);
      }
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const mode = args.includes('--mode') ? args[args.indexOf('--mode') + 1] : 'stdio';
  const host = args.includes('--host') ? args[args.indexOf('--host') + 1] : '0.0.0.0';
  const port = args.includes('--port')
    ? parseInt(args[args.indexOf('--port') + 1] || '8000')
    : 8000;

  initializeClients();

  if (mode === 'http') {
    // HTTP mode for production deployments
    await runHttpServer(host, port);
  } else {
    // STDIO mode for MCP Inspector and development
    await runStdioServer();
  }
}

async function runStdioServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('MCP Server for Keycloak and Infisical started in STDIO mode');
  console.error(`Keycloak client: ${keycloakClient ? 'configured' : 'not configured'}`);
  console.error(`Infisical client: ${infisicalClient ? 'configured' : 'not configured'}`);
}

async function runHttpServer(host: string, port: number) {
  // For HTTP mode, we use Express with SSE transport
  const app = express();

  // Enable CORS for all routes
  app.use(cors());

  // Parse JSON bodies
  app.use(express.json());

  // Health check endpoint for Docker
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      keycloak: keycloakClient ? 'configured' : 'not configured',
      infisical: infisicalClient ? 'configured' : 'not configured',
    });
  });
  // MCP Server endpoint using SSE transport
  app.post('/mcp', async (req: Request, res: Response) => {
    const transport = new SSEServerTransport('/mcp', res);
    await server.connect(transport);
  });

  app.listen(port, host, () => {
    console.error(`MCP Server for Keycloak and Infisical started in HTTP mode on ${host}:${port}`);
    console.error(`Health check available at: http://${host}:${port}/health`);
    console.error(`MCP endpoint available at: http://${host}:${port}/mcp`);
    console.error(`Keycloak client: ${keycloakClient ? 'configured' : 'not configured'}`);
    console.error(`Infisical client: ${infisicalClient ? 'configured' : 'not configured'}`);
  });
}

main().catch(error => {
  console.error('Server error:', error);
  process.exit(1);
});
