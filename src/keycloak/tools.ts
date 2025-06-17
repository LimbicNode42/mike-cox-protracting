import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const keycloakTools: Tool[] = [
  // ========== REALM MANAGEMENT (WRITE) ==========
  {
    name: 'keycloak_create_realm',
    description: 'Create a new realm in Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Realm name/ID'
        },
        displayName: {
          type: 'string',
          description: 'Display name for the realm'
        },
        enabled: {
          type: 'boolean',
          description: 'Whether the realm is enabled',
          default: true
        }
      },
      required: ['realm']
    }
  },
  {
    name: 'keycloak_update_realm',
    description: 'Update realm configuration in Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Realm name to update',
          default: 'master'
        },
        displayName: {
          type: 'string',
          description: 'New display name for the realm'
        },
        enabled: {
          type: 'boolean',
          description: 'Whether the realm is enabled'
        }
      },
      required: ['realm']
    }
  },
  {
    name: 'keycloak_delete_realm',
    description: 'Delete a realm from Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Realm name to delete'
        }
      },
      required: ['realm']
    }
  },

  // ========== USER MANAGEMENT (WRITE) ==========
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
      required: ['username']
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
        username: {
          type: 'string',
          description: 'New username'
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

  // ========== CLIENT MANAGEMENT (WRITE) ==========
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
  },
  {
    name: 'keycloak_update_client',
    description: 'Update client configuration in Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        clientUuid: {
          type: 'string',
          description: 'Client UUID to update'
        },
        name: {
          type: 'string',
          description: 'New display name for the client'
        },
        description: {
          type: 'string',
          description: 'New description of the client'
        },
        enabled: {
          type: 'boolean',
          description: 'Whether the client is enabled'
        },
        redirectUris: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Updated redirect URIs for the client'
        }
      },
      required: ['clientUuid']
    }
  },
  {
    name: 'keycloak_delete_client',
    description: 'Delete a client from Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        clientUuid: {
          type: 'string',
          description: 'Client UUID to delete'
        }
      },
      required: ['clientUuid']
    }
  },

  // ========== ROLE MANAGEMENT (WRITE) ==========
  {
    name: 'keycloak_create_role',
    description: 'Create a new realm role in Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        name: {
          type: 'string',
          description: 'Role name'
        },
        description: {
          type: 'string',
          description: 'Role description'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'keycloak_update_role',
    description: 'Update role details in Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        roleName: {
          type: 'string',
          description: 'Role name to update'
        },
        name: {
          type: 'string',
          description: 'New role name'
        },
        description: {
          type: 'string',
          description: 'New role description'
        }
      },
      required: ['roleName']
    }
  },
  {
    name: 'keycloak_delete_role',
    description: 'Delete a role from Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        roleName: {
          type: 'string',
          description: 'Role name to delete'
        }
      },
      required: ['roleName']
    }
  },
  {
    name: 'keycloak_create_client_role',
    description: 'Create a new client role in Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        clientUuid: {
          type: 'string',
          description: 'Client UUID'
        },
        name: {
          type: 'string',
          description: 'Role name'
        },
        description: {
          type: 'string',
          description: 'Role description'
        }
      },
      required: ['clientUuid', 'name']
    }
  },

  // ========== ROLE ASSIGNMENT (WRITE) ==========
  {
    name: 'keycloak_assign_realm_role',
    description: 'Assign realm role to a user in Keycloak',
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
          description: 'Realm role name to assign'
        }
      },
      required: ['userId', 'roleName']
    }
  },
  {
    name: 'keycloak_assign_client_role',
    description: 'Assign client role to a user in Keycloak',
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
        clientUuid: {
          type: 'string',
          description: 'Client UUID'
        },
        roleName: {
          type: 'string',
          description: 'Client role name to assign'
        }
      },
      required: ['userId', 'clientUuid', 'roleName']
    }
  },

  // ========== GROUP MANAGEMENT (WRITE) ==========
  {
    name: 'keycloak_create_group',
    description: 'Create a new group in Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        name: {
          type: 'string',
          description: 'Group name'
        },
        path: {
          type: 'string',
          description: 'Group path'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'keycloak_update_group',
    description: 'Update group details in Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        groupId: {
          type: 'string',
          description: 'Group ID to update'
        },
        name: {
          type: 'string',
          description: 'New group name'
        },
        path: {
          type: 'string',
          description: 'New group path'
        }
      },
      required: ['groupId']
    }
  },
  {
    name: 'keycloak_delete_group',
    description: 'Delete a group from Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        groupId: {
          type: 'string',
          description: 'Group ID to delete'
        }
      },
      required: ['groupId']
    }
  },

  // ========== IDENTITY PROVIDER MANAGEMENT (WRITE) ==========
  {
    name: 'keycloak_create_identity_provider',
    description: 'Create a new identity provider in Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        alias: {
          type: 'string',
          description: 'Identity provider alias'
        },
        providerId: {
          type: 'string',
          description: 'Identity provider type (e.g., saml, oidc, google)'
        },
        displayName: {
          type: 'string',
          description: 'Display name for the identity provider'
        },
        enabled: {
          type: 'boolean',
          description: 'Whether the identity provider is enabled',
          default: true
        }
      },
      required: ['alias', 'providerId']
    }
  },
  {
    name: 'keycloak_update_identity_provider',
    description: 'Update identity provider configuration in Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        alias: {
          type: 'string',
          description: 'Identity provider alias to update'
        },
        displayName: {
          type: 'string',
          description: 'New display name for the identity provider'
        },
        enabled: {
          type: 'boolean',
          description: 'Whether the identity provider is enabled'
        }
      },
      required: ['alias']
    }
  },
  {
    name: 'keycloak_delete_identity_provider',
    description: 'Delete an identity provider from Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        alias: {
          type: 'string',
          description: 'Identity provider alias to delete'
        }
      },
      required: ['alias']
    }
  },

  // ========== CLIENT SCOPE MANAGEMENT (WRITE) ==========
  {
    name: 'keycloak_create_client_scope',
    description: 'Create a new client scope in Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        name: {
          type: 'string',
          description: 'Client scope name'
        },
        description: {
          type: 'string',
          description: 'Client scope description'
        },
        protocol: {
          type: 'string',
          description: 'Protocol for the client scope',
          default: 'openid-connect'
        }
      },
      required: ['name']
    }
  },

  // ========== AUTHENTICATION FLOW MANAGEMENT (WRITE) ==========
  {
    name: 'keycloak_create_authentication_flow',
    description: 'Create a new authentication flow in Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        alias: {
          type: 'string',
          description: 'Authentication flow alias'
        },
        description: {
          type: 'string',
          description: 'Authentication flow description'
        },
        topLevel: {
          type: 'boolean',
          description: 'Whether this is a top-level flow',
          default: true
        }
      },
      required: ['alias']
    }
  },

  // ========== ORGANIZATION MANAGEMENT (WRITE) ==========
  {
    name: 'keycloak_create_organization',
    description: 'Create a new organization in Keycloak',
    inputSchema: {
      type: 'object',
      properties: {
        realm: {
          type: 'string',
          description: 'Keycloak realm name',
          default: 'master'
        },
        name: {
          type: 'string',
          description: 'Organization name'
        },
        description: {
          type: 'string',
          description: 'Organization description'
        }
      },
      required: ['name']
    }
  },

  // ========== BACKWARD COMPATIBILITY ==========
  {
    name: 'keycloak_assign_role',
    description: 'Assign role to a user in Keycloak (backward compatibility - use keycloak_assign_realm_role or keycloak_assign_client_role)',
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
          description: 'Client ID for client-specific roles (optional)'
        }
      },
      required: ['userId', 'roleName']
    }
  }
];
