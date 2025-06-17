# mike-cox-protracting

MCP Server for Keycloak and Infisical integration, providing identity and access management (IAM) and secrets management capabilities.

## Features

### Keycloak Integration
- **Multi-realm/Multi-client Support**: No need to specify realm or client ID for every operation
- **Realm Management**: Create, read, update, delete realms
- **User Management**: Complete user lifecycle management
- **Client Management**: Full client configuration and management
- **Role Management**: Realm and client roles
- **Group Management**: User groups and hierarchies
- **Identity Provider Integration**: External identity provider configuration
- **Client Scope Management**: OAuth/OIDC scope configuration
- **Event Monitoring**: Access to Keycloak events and admin events
- **Authentication Flows**: Custom authentication flow management
- **Organization Management**: Enterprise organization features

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

This MCP server provides comprehensive coverage of the Keycloak Admin REST API, supporting dynamic multi-realm and multi-client operations.

### Keycloak Resources (Read-only operations)

#### Realm Resources
- `keycloak://realms` - List all realms
- `keycloak://realm/{realm}` - Get specific realm configuration

#### User Resources
- `keycloak://users?realm=master&max=100&search=term&first=0` - List users in a realm
- `keycloak://user/{userId}?realm=master` - Get user details
- `keycloak://users/count?realm=master&search=term` - Get user count

#### Client Resources
- `keycloak://clients?realm=master&clientId=optional&max=100&first=0` - List clients
- `keycloak://client/{clientUuid}?realm=master` - Get client details
- `keycloak://client/{clientUuid}/roles?realm=master` - List client roles

#### Role Resources
- `keycloak://roles?realm=master&max=100&search=term` - List realm roles
- `keycloak://role/{roleName}?realm=master` - Get role details

#### Group Resources
- `keycloak://groups?realm=master&max=100&search=term&first=0` - List groups
- `keycloak://group/{groupId}?realm=master` - Get group details

#### Identity Provider Resources
- `keycloak://identity-providers?realm=master&alias=optional&providerId=optional` - List identity providers
- `keycloak://identity-provider/{alias}?realm=master` - Get identity provider details

#### Client Scope Resources
- `keycloak://client-scopes?realm=master` - List client scopes

#### Event Resources
- `keycloak://events?realm=master&max=100&first=0&dateFrom=ISO&dateTo=ISO&type=EVENT_TYPE&userId=USER_ID` - Get events
- `keycloak://admin-events?realm=master&max=100&first=0&dateFrom=ISO&dateTo=ISO&operationType=OP&authRealm=REALM` - Get admin events

#### Authentication Flow Resources
- `keycloak://authentication/flows?realm=master` - List authentication flows

#### Organization Resources
- `keycloak://organizations?realm=master&max=100&first=0&search=term` - List organizations

### Keycloak Tools (Write operations)

#### Realm Management
- `keycloak_create_realm` - Create a new realm
- `keycloak_update_realm` - Update realm configuration
- `keycloak_delete_realm` - Delete a realm

#### User Management
- `keycloak_create_user` - Create a new user
- `keycloak_update_user` - Update user information
- `keycloak_delete_user` - Delete a user

#### Client Management
- `keycloak_create_client` - Create a new client
- `keycloak_update_client` - Update client configuration
- `keycloak_delete_client` - Delete a client

#### Role Management
- `keycloak_create_role` - Create a realm role
- `keycloak_update_role` - Update role details
- `keycloak_delete_role` - Delete a role
- `keycloak_create_client_role` - Create a client role

#### Role Assignment
- `keycloak_assign_realm_role` - Assign realm role to user
- `keycloak_assign_client_role` - Assign client role to user
- `keycloak_assign_role` - Legacy role assignment (backward compatibility)

#### Group Management
- `keycloak_create_group` - Create a new group
- `keycloak_update_group` - Update group details
- `keycloak_delete_group` - Delete a group

#### Identity Provider Management
- `keycloak_create_identity_provider` - Create identity provider
- `keycloak_update_identity_provider` - Update identity provider
- `keycloak_delete_identity_provider` - Delete identity provider

#### Client Scope Management
- `keycloak_create_client_scope` - Create a client scope

#### Authentication Flow Management
- `keycloak_create_authentication_flow` - Create authentication flow

#### Organization Management
- `keycloak_create_organization` - Create an organization

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
