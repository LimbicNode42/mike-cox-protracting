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

## Architecture

This MCP server follows the proper **Resources vs Tools** distinction as per the MCP specification:

- **Resources** are like GET endpoints - they provide read-only access to data without side effects
- **Tools** are like POST/PUT/DELETE endpoints - they perform actions and have side effects

This separation allows LLMs to:
- Efficiently browse and discover data through resources
- Take actions when needed through tools
- Understand the difference between reading and writing operations

## Available Tools and Resources

### Keycloak Resources (Read-only, like GET requests)
- `keycloak://users?realm=master&max=100&search=term` - List users in a realm
- `keycloak://user/{userId}?realm=master` - Get user details
- `keycloak://roles?realm=master&clientId=optional` - List roles in a realm
- `keycloak://clients?realm=master` - List clients in a realm

### Keycloak Tools (Write operations, like POST/PUT/DELETE)
- `keycloak_create_user` - Create a new user
- `keycloak_update_user` - Update user information
- `keycloak_delete_user` - Delete a user
- `keycloak_assign_role` - Assign role to user
- `keycloak_create_client` - Create a new client

### Infisical Resources (Read-only, like GET requests)
- `infisical://secrets?projectId=123&environment=dev` - List secrets in a project/environment
- `infisical://secret/{secretName}?projectId=123&environment=dev` - Get a specific secret
- `infisical://projects` - List all projects
- `infisical://environments/{projectId}` - List environments in a project

### Infisical Tools (Write operations, like POST/PUT/DELETE)
- `infisical_create_secret` - Create a new secret
- `infisical_update_secret` - Update an existing secret
- `infisical_delete_secret` - Delete a secret
- `infisical_create_project` - Create a new project

## Development

```bash
npm run dev        # Development mode with tsx
npm run build      # Build TypeScript
npm run test       # Run tests
npm run lint       # Lint code
npm run format     # Format code
```

## License

MIT
