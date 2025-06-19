import { Resource } from '@modelcontextprotocol/sdk/types.js';

export const keycloakResources: Resource[] = [
  // ========== REALM RESOURCES ==========
  {
    uri: 'keycloak://realms',
    name: 'Keycloak Realms',
    description: 'List all realms in Keycloak',
    mimeType: 'application/json',
  },
  {
    uri: 'keycloak://realm/{realm}',
    name: 'Keycloak Realm Details',
    description: 'Get specific realm configuration from Keycloak',
    mimeType: 'application/json',
  },

  // ========== USER RESOURCES ==========
  {
    uri: 'keycloak://users',
    name: 'Keycloak Users',
    description: 'List users in a Keycloak realm (specify realm as query parameter)',
    mimeType: 'application/json',
  },
  {
    uri: 'keycloak://user/{userId}',
    name: 'Keycloak User Details',
    description: 'Get specific user details from Keycloak (specify realm as query parameter)',
    mimeType: 'application/json',
  },
  {
    uri: 'keycloak://users/count',
    name: 'Keycloak User Count',
    description: 'Get user count in a Keycloak realm (specify realm as query parameter)',
    mimeType: 'application/json',
  },

  // ========== CLIENT RESOURCES ==========
  {
    uri: 'keycloak://clients',
    name: 'Keycloak Clients',
    description: 'List clients in a Keycloak realm (specify realm as query parameter)',
    mimeType: 'application/json',
  },
  {
    uri: 'keycloak://client/{clientUuid}',
    name: 'Keycloak Client Details',
    description: 'Get specific client details from Keycloak (specify realm as query parameter)',
    mimeType: 'application/json',
  },

  // ========== ROLE RESOURCES ==========
  {
    uri: 'keycloak://roles',
    name: 'Keycloak Realm Roles',
    description: 'List realm roles in a Keycloak realm (specify realm as query parameter)',
    mimeType: 'application/json',
  },
  {
    uri: 'keycloak://role/{roleName}',
    name: 'Keycloak Realm Role Details',
    description: 'Get specific realm role details from Keycloak (specify realm as query parameter)',
    mimeType: 'application/json',
  },
  {
    uri: 'keycloak://client/{clientUuid}/roles',
    name: 'Keycloak Client Roles',
    description: 'List client roles for a specific client (specify realm as query parameter)',
    mimeType: 'application/json',
  },

  // ========== GROUP RESOURCES ==========
  {
    uri: 'keycloak://groups',
    name: 'Keycloak Groups',
    description: 'List groups in a Keycloak realm (specify realm as query parameter)',
    mimeType: 'application/json',
  },
  {
    uri: 'keycloak://group/{groupId}',
    name: 'Keycloak Group Details',
    description: 'Get specific group details from Keycloak (specify realm as query parameter)',
    mimeType: 'application/json',
  },

  // ========== IDENTITY PROVIDER RESOURCES ==========
  {
    uri: 'keycloak://identity-providers',
    name: 'Keycloak Identity Providers',
    description: 'List identity providers in a Keycloak realm (specify realm as query parameter)',
    mimeType: 'application/json',
  },
  {
    uri: 'keycloak://identity-provider/{alias}',
    name: 'Keycloak Identity Provider Details',
    description:
      'Get specific identity provider details from Keycloak (specify realm as query parameter)',
    mimeType: 'application/json',
  },

  // ========== CLIENT SCOPE RESOURCES ==========
  {
    uri: 'keycloak://client-scopes',
    name: 'Keycloak Client Scopes',
    description: 'List client scopes in a Keycloak realm (specify realm as query parameter)',
    mimeType: 'application/json',
  },

  // ========== EVENT RESOURCES ==========
  {
    uri: 'keycloak://events',
    name: 'Keycloak Events',
    description:
      'Get events from a Keycloak realm (specify realm and optional filters as query parameters)',
    mimeType: 'application/json',
  },
  {
    uri: 'keycloak://admin-events',
    name: 'Keycloak Admin Events',
    description:
      'Get admin events from a Keycloak realm (specify realm and optional filters as query parameters)',
    mimeType: 'application/json',
  },

  // ========== AUTHENTICATION FLOW RESOURCES ==========
  {
    uri: 'keycloak://authentication/flows',
    name: 'Keycloak Authentication Flows',
    description: 'List authentication flows in a Keycloak realm (specify realm as query parameter)',
    mimeType: 'application/json',
  },

  // ========== ORGANIZATION RESOURCES ==========
  {
    uri: 'keycloak://organizations',
    name: 'Keycloak Organizations',
    description: 'List organizations in a Keycloak realm (specify realm as query parameter)',
    mimeType: 'application/json',
  },
];
