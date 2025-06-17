import { Resource } from '@modelcontextprotocol/sdk/types.js';

export const infisicalResources: Resource[] = [
  // ========== SECRET RESOURCES ==========
  {
    uri: "infisical://secrets",
    name: "Infisical Secrets",
    description: "List secrets in an Infisical project environment (specify workspaceId/projectId and environment as query parameters)",
    mimeType: "application/json"
  },
  {
    uri: "infisical://secret/{secretName}",
    name: "Infisical Secret",
    description: "Get a specific secret from Infisical (specify workspaceId/projectId and environment as query parameters)",
    mimeType: "application/json"
  },

  // ========== PROJECT RESOURCES ==========
  {
    uri: "infisical://projects",
    name: "Infisical Projects",
    description: "List all Infisical projects/workspaces",
    mimeType: "application/json"
  },
  {
    uri: "infisical://project/{workspaceId}",
    name: "Infisical Project Details",
    description: "Get specific project/workspace details from Infisical",
    mimeType: "application/json"
  },

  // ========== ENVIRONMENT RESOURCES ==========
  {
    uri: "infisical://environments/{workspaceId}",
    name: "Infisical Environments",
    description: "List environments in an Infisical project/workspace",
    mimeType: "application/json"
  },
  {
    uri: "infisical://environments/{projectId}",
    name: "Infisical Environments (Legacy)",
    description: "List environments in an Infisical project (legacy alias for workspaceId)",
    mimeType: "application/json"
  },

  // ========== FOLDER RESOURCES ==========
  {
    uri: "infisical://folders",
    name: "Infisical Folders",
    description: "List folders in an Infisical project environment (specify workspaceId/projectId and environment as query parameters)",
    mimeType: "application/json"
  },
  {
    uri: "infisical://folder/{folderId}",
    name: "Infisical Folder Details",
    description: "Get specific folder details from Infisical",
    mimeType: "application/json"
  },

  // ========== SECRET TAG RESOURCES ==========
  {
    uri: "infisical://secret-tags/{workspaceId}",
    name: "Infisical Secret Tags",
    description: "List secret tags in an Infisical project/workspace",
    mimeType: "application/json"
  },
  {
    uri: "infisical://secret-tag/{workspaceId}/{tagId}",
    name: "Infisical Secret Tag Details",
    description: "Get specific secret tag details from Infisical",
    mimeType: "application/json"
  },

  // ========== ORGANIZATION RESOURCES ==========
  {
    uri: "infisical://organization/{organizationId}/memberships",
    name: "Infisical Organization Memberships",
    description: "List organization user memberships in Infisical",
    mimeType: "application/json"
  },

  // ========== AUDIT LOG RESOURCES ==========
  {
    uri: "infisical://audit-logs",
    name: "Infisical Audit Logs",
    description: "Get audit logs from Infisical organization (specify optional filters as query parameters)",
    mimeType: "application/json"
  }
];
