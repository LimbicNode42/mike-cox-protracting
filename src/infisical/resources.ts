import { Resource } from '@modelcontextprotocol/sdk/types.js';

export const infisicalResources: Resource[] = [
  {
    uri: "infisical://secrets",
    name: "Infisical Secrets",
    description: "List secrets in an Infisical project environment",
    mimeType: "application/json"
  },
  {
    uri: "infisical://secret/{secretName}",
    name: "Infisical Secret",
    description: "Get a specific secret from Infisical",
    mimeType: "application/json"
  },
  {
    uri: "infisical://projects",
    name: "Infisical Projects",
    description: "List all Infisical projects",
    mimeType: "application/json"
  },
  {
    uri: "infisical://environments/{projectId}",
    name: "Infisical Environments",
    description: "List environments in an Infisical project",
    mimeType: "application/json"
  }
];
