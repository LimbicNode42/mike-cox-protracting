import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const infisicalTools: Tool[] = [
  // ========== SECRET MANAGEMENT (READ) ==========
  {
    name: 'infisical_get_secret',
    description: 'Get a specific secret from Infisical by name',
    inputSchema: {
      type: 'object',
      properties: {
        secretName: { type: 'string', description: 'Name of the secret to retrieve' },
        workspaceId: {
          type: 'string',
          description: 'Infisical workspace/project ID (optional if configured in .env)',
        },
        projectId: { type: 'string', description: 'Infisical project ID (alias for workspaceId)' },
        environment: {
          type: 'string',
          description: 'Environment name (optional if configured in .env, defaults to dev)',
        },
        secretPath: { type: 'string', description: 'Path of the secret', default: '/' },
        version: { type: 'number', description: 'Version of the secret to retrieve' },
        type: {
          type: 'string',
          description: 'Type of secret (shared or personal)',
          default: 'shared',
        },
        expandSecretReferences: {
          type: 'boolean',
          description: 'Whether to expand secret references',
          default: false,
        },
      },
      required: ['secretName'],
    },
  },

  // ========== SECRET MANAGEMENT (WRITE) ==========
  {
    name: 'infisical_create_secret',
    description: 'Create a new secret in Infisical',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Infisical workspace/project ID' },
        projectId: { type: 'string', description: 'Infisical project ID (alias for workspaceId)' },
        environment: { type: 'string', description: 'Environment name', default: 'dev' },
        secretName: { type: 'string', description: 'Name of the secret' },
        secretValue: { type: 'string', description: 'Value of the secret' },
        secretPath: {
          type: 'string',
          description: 'Path where the secret should be created',
          default: '/',
        },
        secretComment: { type: 'string', description: 'Comment for the secret' },
        type: {
          type: 'string',
          description: 'Type of secret (shared or personal)',
          default: 'shared',
        },
        skipMultilineEncoding: { type: 'boolean', description: 'Skip multiline encoding' },
        secretMetadata: {
          type: 'array',
          description: 'Secret metadata key-value pairs',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              value: { type: 'string' },
            },
            required: ['key', 'value'],
          },
        },
        tagIds: {
          type: 'array',
          description: 'Array of tag IDs to attach to the secret',
          items: {
            type: 'string',
          },
        },
        secretReminderRepeatDays: { type: 'number', description: 'Reminder interval in days' },
        secretReminderNote: { type: 'string', description: 'Reminder note' },
      },
      required: ['secretName', 'secretValue'],
    },
  },
  {
    name: 'infisical_update_secret',
    description: 'Update an existing secret in Infisical',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Infisical workspace/project ID' },
        projectId: { type: 'string', description: 'Infisical project ID (alias for workspaceId)' },
        environment: { type: 'string', description: 'Environment name', default: 'dev' },
        secretName: { type: 'string', description: 'Name of the secret to update' },
        secretValue: { type: 'string', description: 'New value of the secret' },
        secretPath: { type: 'string', description: 'Path of the secret', default: '/' },
        secretComment: { type: 'string', description: 'New comment for the secret' },
        type: {
          type: 'string',
          description: 'Type of secret (shared or personal)',
          default: 'shared',
        },
        skipMultilineEncoding: { type: 'boolean', description: 'Skip multiline encoding' },
        secretMetadata: {
          type: 'array',
          description: 'Secret metadata key-value pairs',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              value: { type: 'string' },
            },
            required: ['key', 'value'],
          },
        },
        tagIds: {
          type: 'array',
          description: 'Array of tag IDs to attach to the secret',
          items: {
            type: 'string',
          },
        },
        secretReminderRepeatDays: { type: 'number', description: 'Reminder interval in days' },
        secretReminderNote: { type: 'string', description: 'Reminder note' },
      },
      required: ['secretName'],
    },
  },
  {
    name: 'infisical_delete_secret',
    description: 'Delete a secret from Infisical',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Infisical workspace/project ID' },
        projectId: { type: 'string', description: 'Infisical project ID (alias for workspaceId)' },
        environment: { type: 'string', description: 'Environment name', default: 'dev' },
        secretName: { type: 'string', description: 'Name of the secret to delete' },
        secretPath: { type: 'string', description: 'Path of the secret', default: '/' },
        type: {
          type: 'string',
          description: 'Type of secret (shared or personal)',
          default: 'shared',
        },
      },
      required: ['secretName'],
    },
  },

  // ========== PROJECT MANAGEMENT (WRITE) ==========
  {
    name: 'infisical_create_project',
    description: 'Create a new project in Infisical',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string', description: 'Project name' },
        name: { type: 'string', description: 'Project name (alias for projectName)' },
        projectDescription: { type: 'string', description: 'Project description' },
        description: {
          type: 'string',
          description: 'Project description (alias for projectDescription)',
        },
        slug: { type: 'string', description: 'Project slug (5-36 characters)' },
        kmsKeyId: { type: 'string', description: 'KMS key ID for encryption' },
        template: { type: 'string', description: 'Project template to apply', default: 'default' },
        type: { type: 'string', description: 'Project type', default: 'secret-manager' },
        shouldCreateDefaultEnvs: {
          type: 'boolean',
          description: 'Create default environments',
          default: true,
        },
      },
      required: ['projectName'],
    },
  },
  {
    name: 'infisical_update_project',
    description: 'Update project settings in Infisical',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Infisical workspace/project ID' },
        projectId: { type: 'string', description: 'Infisical project ID (alias for workspaceId)' },
        name: { type: 'string', description: 'New project name' },
        autoCapitalization: { type: 'boolean', description: 'Enable auto-capitalization' },
      },
      required: ['workspaceId'],
    },
  },
  {
    name: 'infisical_delete_project',
    description: 'Delete a project from Infisical',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Infisical workspace/project ID' },
        projectId: { type: 'string', description: 'Infisical project ID (alias for workspaceId)' },
      },
      required: ['workspaceId'],
    },
  },

  // ========== ENVIRONMENT MANAGEMENT (WRITE) ==========
  {
    name: 'infisical_create_environment',
    description: 'Create a new environment in a project',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Infisical workspace/project ID' },
        projectId: { type: 'string', description: 'Infisical project ID (alias for workspaceId)' },
        name: { type: 'string', description: 'Environment name' },
        slug: { type: 'string', description: 'Environment slug (1-64 characters)' },
        position: { type: 'number', description: 'Position for ordering environments', default: 1 },
      },
      required: ['workspaceId', 'name', 'slug'],
    },
  },
  {
    name: 'infisical_update_environment',
    description: 'Update environment settings',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Infisical workspace/project ID' },
        projectId: { type: 'string', description: 'Infisical project ID (alias for workspaceId)' },
        environmentId: { type: 'string', description: 'Environment ID to update' },
        name: { type: 'string', description: 'New environment name' },
        slug: { type: 'string', description: 'New environment slug' },
        position: { type: 'number', description: 'New position for ordering' },
      },
      required: ['workspaceId', 'environmentId'],
    },
  },
  {
    name: 'infisical_delete_environment',
    description: 'Delete an environment from a project',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Infisical workspace/project ID' },
        projectId: { type: 'string', description: 'Infisical project ID (alias for workspaceId)' },
        environmentId: { type: 'string', description: 'Environment ID to delete' },
      },
      required: ['workspaceId', 'environmentId'],
    },
  },

  // ========== FOLDER MANAGEMENT (WRITE) ==========
  {
    name: 'infisical_create_folder',
    description: 'Create a new folder for organizing secrets',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Infisical workspace/project ID' },
        projectId: { type: 'string', description: 'Infisical project ID (alias for workspaceId)' },
        environment: { type: 'string', description: 'Environment name' },
        name: { type: 'string', description: 'Folder name' },
        path: {
          type: 'string',
          description: 'Parent path where folder will be created',
          default: '/',
        },
      },
      required: ['workspaceId', 'environment', 'name'],
    },
  },
  {
    name: 'infisical_update_folder',
    description: 'Update folder properties',
    inputSchema: {
      type: 'object',
      properties: {
        folderId: { type: 'string', description: 'Folder ID to update' },
        name: { type: 'string', description: 'New folder name' },
      },
      required: ['folderId'],
    },
  },
  {
    name: 'infisical_delete_folder',
    description: 'Delete a folder and its contents',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Infisical workspace/project ID' },
        projectId: { type: 'string', description: 'Infisical project ID (alias for workspaceId)' },
        environment: { type: 'string', description: 'Environment name' },
        folderId: { type: 'string', description: 'Folder ID to delete' },
        path: { type: 'string', description: 'Folder path', default: '/' },
      },
      required: ['workspaceId', 'environment', 'folderId'],
    },
  },

  // ========== SECRET TAG MANAGEMENT (WRITE) ==========
  {
    name: 'infisical_create_secret_tag',
    description: 'Create a new secret tag for organization',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Infisical workspace/project ID' },
        projectId: { type: 'string', description: 'Infisical project ID (alias for workspaceId)' },
        name: { type: 'string', description: 'Tag name' },
        slug: { type: 'string', description: 'Tag slug' },
        color: { type: 'string', description: 'Tag color (hex code)', default: '#000000' },
      },
      required: ['workspaceId', 'name', 'slug'],
    },
  },
  {
    name: 'infisical_update_secret_tag',
    description: 'Update secret tag properties',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Infisical workspace/project ID' },
        projectId: { type: 'string', description: 'Infisical project ID (alias for workspaceId)' },
        tagId: { type: 'string', description: 'Tag ID to update' },
        name: { type: 'string', description: 'New tag name' },
        slug: { type: 'string', description: 'New tag slug' },
        color: { type: 'string', description: 'New tag color (hex code)' },
      },
      required: ['workspaceId', 'tagId'],
    },
  },
  {
    name: 'infisical_delete_secret_tag',
    description: 'Delete a secret tag',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Infisical workspace/project ID' },
        projectId: { type: 'string', description: 'Infisical project ID (alias for workspaceId)' },
        tagId: { type: 'string', description: 'Tag ID to delete' },
      },
      required: ['workspaceId', 'tagId'],
    },
  },

  // ========== ORGANIZATION MANAGEMENT (WRITE) ==========
  {
    name: 'infisical_update_organization_membership',
    description: 'Update organization membership role',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string', description: 'Organization ID' },
        membershipId: { type: 'string', description: 'Membership ID to update' },
        role: { type: 'string', description: 'New role for the member' },
      },
      required: ['organizationId', 'membershipId', 'role'],
    },
  },
  {
    name: 'infisical_delete_organization_membership',
    description: 'Remove a member from the organization',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string', description: 'Organization ID' },
        membershipId: { type: 'string', description: 'Membership ID to delete' },
      },
      required: ['organizationId', 'membershipId'],
    },
  },
];
