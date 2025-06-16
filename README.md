# mike-cox-protracting

MCP Server for Keycloak and Infisical integration, providing identity and access management (IAM) and secrets management capabilities.

## Features

### Keycloak Integration
- User management (create, read, update, delete)
- Role management and assignment
- Client management
- Multi-realm support

### Infisical Integration
- Secret management (create, read, update, delete)
- Project and environment management
- Secure secret storage and retrieval

## Installation

```bash
npm install
npm run build
```

## Configuration

Set the following environment variables:

### Keycloak Configuration
```bash
export KEYCLOAK_URL="https://your-keycloak-instance.com"
export KEYCLOAK_USERNAME="admin"
export KEYCLOAK_PASSWORD="your-admin-password"
export KEYCLOAK_REALM="master"  # optional, defaults to 'master'
```

### Infisical Configuration
```bash
export INFISICAL_URL="https://your-infisical-instance.com"
export INFISICAL_TOKEN="your-api-token"
```

## Usage

### Direct Usage
```bash
npm start
```

### With VS Code MCP
Add to your `.vscode/mcp.json`:

```json
{
  "servers": {
    "keycloak-infisical": {
      "command": "node",
      "args": ["path/to/mike-cox-protracting/dist/index.js"],
      "env": {
        "KEYCLOAK_URL": "https://your-keycloak-instance.com",
        "KEYCLOAK_USERNAME": "admin",
        "KEYCLOAK_PASSWORD": "your-password",
        "INFISICAL_URL": "https://your-infisical-instance.com",
        "INFISICAL_TOKEN": "your-token"
      }
    }
  }
}
```

## Available Tools

### Keycloak Tools
- `keycloak_list_users` - List users in a realm
- `keycloak_create_user` - Create a new user
- `keycloak_get_user` - Get user details
- `keycloak_update_user` - Update user information
- `keycloak_delete_user` - Delete a user
- `keycloak_list_roles` - List roles in a realm
- `keycloak_assign_role` - Assign role to user
- `keycloak_list_clients` - List clients in a realm
- `keycloak_create_client` - Create a new client

### Infisical Tools
- `infisical_list_secrets` - List secrets in a project/environment
- `infisical_get_secret` - Get a specific secret
- `infisical_create_secret` - Create a new secret
- `infisical_update_secret` - Update an existing secret
- `infisical_delete_secret` - Delete a secret
- `infisical_list_projects` - List all projects
- `infisical_create_project` - Create a new project
- `infisical_list_environments` - List environments in a project

## Development

```bash
npm run dev        # Development mode with tsx
npm run build      # Build TypeScript
npm run test       # Run tests
npm run lint       # Lint code
npm run format     # Format code
```

## Architecture

This MCP server provides a unified interface for both Keycloak (IAM) and Infisical (secrets management), enabling comprehensive identity and secrets management workflows through the Model Context Protocol.

## License

MIT
