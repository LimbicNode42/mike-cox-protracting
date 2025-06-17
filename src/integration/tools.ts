import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const integrationTools: Tool[] = [
  {
    name: 'keycloak_infisical_configure_integration',
    description: 'Configure the Keycloak-Infisical integration settings with auto-discovery',
    inputSchema: {
      type: 'object',
      properties: {
        enabled: { 
          type: 'boolean', 
          description: 'Enable or disable the integration. When enabled, the system will auto-discover or create a "Keycloak Secrets" project and "/keycloak" folder.' 
        }
      },
      required: ['enabled']
    }
  },
  {
    name: 'keycloak_infisical_get_integration_status',
    description: 'Get the current status and configuration of the Keycloak-Infisical integration with auto-discovery details',
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
