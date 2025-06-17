import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const integrationTools: Tool[] = [
  {
    name: 'keycloak_infisical_configure_integration',
    description: 'Configure the Keycloak-Infisical integration settings',
    inputSchema: {
      type: 'object',
      properties: {
        enabled: { 
          type: 'boolean', 
          description: 'Enable or disable the integration' 
        },
        infisicalProjectId: { 
          type: 'string', 
          description: 'Infisical project ID for storing Keycloak secrets' 
        },
        infisicalEnvironment: { 
          type: 'string', 
          description: 'Infisical environment (e.g., dev, staging, prod)',
          default: 'dev'
        },
        secretPrefix: { 
          type: 'string', 
          description: 'Prefix for auto-generated secret names',
          default: 'KEYCLOAK_'
        },
        folderPath: { 
          type: 'string', 
          description: 'Folder path in Infisical for storing secrets',
          default: '/keycloak'
        },
        autoTagSlugs: { 
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to apply to auto-generated secrets',
          default: ['keycloak', 'auto-generated']
        }
      },
      required: []
    }
  },
  {
    name: 'keycloak_infisical_get_integration_status',
    description: 'Get the current status and configuration of the Keycloak-Infisical integration',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'keycloak_infisical_store_existing_secret',
    description: 'Manually store an existing Keycloak secret in Infisical',
    inputSchema: {
      type: 'object',
      properties: {
        secretName: { 
          type: 'string', 
          description: 'Name for the secret in Infisical' 
        },
        secretValue: { 
          type: 'string', 
          description: 'Secret value to store' 
        },
        context: { 
          type: 'string', 
          description: 'Context or description of the secret' 
        },
        realm: { 
          type: 'string', 
          description: 'Keycloak realm the secret belongs to',
          default: 'master'
        }
      },
      required: ['secretName', 'secretValue', 'context']
    }
  }
];
