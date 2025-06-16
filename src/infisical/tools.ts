import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const infisicalTools: Tool[] = [
  {
    name: 'infisical_list_secrets',
    description: 'List secrets in an Infisical project environment',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Infisical project ID' },
        environment: { type: 'string', description: 'Environment name', default: 'dev' }
      },
      required: ['projectId']
    }
  },
  {
    name: 'infisical_get_secret',
    description: 'Get a specific secret from Infisical',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Infisical project ID' },
        environment: { type: 'string', description: 'Environment name', default: 'dev' },
        secretName: { type: 'string', description: 'Name of the secret to retrieve' }
      },
      required: ['projectId', 'secretName']
    }
  },
  {
    name: 'infisical_create_secret',
    description: 'Create a new secret in Infisical',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Infisical project ID' },
        environment: { type: 'string', description: 'Environment name', default: 'dev' },
        secretName: { type: 'string', description: 'Name of the secret' },
        secretValue: { type: 'string', description: 'Value of the secret' }
      },
      required: ['projectId', 'secretName', 'secretValue']
    }
  },
  {
    name: 'infisical_update_secret',
    description: 'Update an existing secret in Infisical',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Infisical project ID' },
        environment: { type: 'string', description: 'Environment name', default: 'dev' },
        secretName: { type: 'string', description: 'Name of the secret to update' },
        secretValue: { type: 'string', description: 'New value of the secret' }
      },
      required: ['projectId', 'secretName', 'secretValue']
    }
  },
  {
    name: 'infisical_delete_secret',
    description: 'Delete a secret from Infisical',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Infisical project ID' },
        environment: { type: 'string', description: 'Environment name', default: 'dev' },
        secretName: { type: 'string', description: 'Name of the secret to delete' }
      },
      required: ['projectId', 'secretName']
    }
  },
  {
    name: 'infisical_list_projects',
    description: 'List all Infisical projects',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'infisical_create_project',
    description: 'Create a new project in Infisical',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name' },
        slug: { type: 'string', description: 'Project slug' }
      },
      required: ['name', 'slug']
    }
  },
  {
    name: 'infisical_list_environments',
    description: 'List environments in an Infisical project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Infisical project ID' }
      },
      required: ['projectId']
    }
  }
];
