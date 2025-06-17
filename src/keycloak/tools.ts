import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const keycloakTools: Tool[] = [
  {
    name: 'keycloak_create_user',
    description: 'Create a new user in Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        username: {
          type: 'string',
          description: 'Username for the new user'
        },
        email: {
          type: 'string',
          description: 'Email address for the new user'
        },
        firstName: {
          type: 'string',
          description: 'First name of the user'
        },
        lastName: {
          type: 'string',
          description: 'Last name of the user'
        },
        password: {
          type: 'string',
          description: 'Initial password for the user'
        },
        enabled: {
          type: 'boolean',
          description: 'Whether the user account is enabled',
          default: true
        },
        emailVerified: {
          type: 'boolean',
          description: 'Whether the email is verified',
          default: false
        }
      },
      required: ['username', 'email']
    }
  },
  {
    name: 'keycloak_update_user',
    description: 'Update user details in Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        userId: {
          type: 'string',
          description: 'User ID to update'
        },
        email: {
          type: 'string',
          description: 'New email address'
        },
        firstName: {
          type: 'string',
          description: 'New first name'
        },
        lastName: {
          type: 'string',
          description: 'New last name'
        },
        enabled: {
          type: 'boolean',
          description: 'Enable or disable the user account'
        }
      },
      required: ['userId']
    }
  },
  {
    name: 'keycloak_delete_user',
    description: 'Delete a user from Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        userId: {
          type: 'string',
          description: 'User ID to delete'
        }
      },
      required: ['userId']
    }
  },
  {
    name: 'keycloak_assign_role',
    description: 'Assign role to a user in Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        userId: {
          type: 'string',
          description: 'User ID to assign role to'
        },
        roleName: {
          type: 'string',
          description: 'Role name to assign'
        },
        clientId: {
          type: 'string',
          description: 'Client ID for client-specific roles'
        }
      },
      required: ['userId', 'roleName']
    }
  },
  {
    name: 'keycloak_create_client',
    description: 'Create a new client in Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        clientId: {
          type: 'string',
          description: 'Client ID for the new client'
        },
        name: {
          type: 'string',
          description: 'Display name for the client'
        },
        description: {
          type: 'string',
          description: 'Description of the client'
        },
        protocol: {
          type: 'string',
          description: 'Client protocol',
          default: 'openid-connect'
        },
        publicClient: {
          type: 'boolean',
          description: 'Whether this is a public client',
          default: false
        },
        redirectUris: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Valid redirect URIs for the client'
        }
      },
      required: ['clientId']
    }
  }
];
