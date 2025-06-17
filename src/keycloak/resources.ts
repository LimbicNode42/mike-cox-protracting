import { Resource } from '@modelcontextprotocol/sdk/types.js';

export const keycloakResources: Resource[] = [
  {
    uri: "keycloak://users",
    name: "Keycloak Users",
    description: "List users in a Keycloak realm",
    mimeType: "application/json"
  },
  {
    uri: "keycloak://user/{userId}",
    name: "Keycloak User Details",
    description: "Get specific user details from Keycloak",
    mimeType: "application/json"
  },
  {
    uri: "keycloak://roles",
    name: "Keycloak Roles",
    description: "List roles in a Keycloak realm",
    mimeType: "application/json"
  },
  {
    uri: "keycloak://clients",
    name: "Keycloak Clients",
    description: "List clients in a Keycloak realm",
    mimeType: "application/json"
  }
];
