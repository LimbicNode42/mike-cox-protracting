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
- **Comprehensive Secret Management**: Full CRUD operations for secrets with folder organization
- **Project Lifecycle Management**: Create, read, update, delete projects with advanced configuration
- **Environment Management**: Multi-environment support with dynamic switching
- **Folder Organization**: Hierarchical folder structure for secret organization
- **Secret Tags**: Categorization and filtering of secrets with tag management
- **Organization Management**: User membership and role management within organizations
- **Audit Logging**: Comprehensive audit trail with advanced filtering and search
- **Advanced Parameterization**: Dynamic project/workspace/environment support

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

## Usage Examples

### Keycloak Examples

#### Creating a User with Role Assignment
```bash
# First create the user
keycloak_create_user realm=mycompany username=john.doe email=john@company.com firstName=John lastName=Doe

# Then assign a realm role
keycloak_assign_realm_role realm=mycompany userId=user-uuid roleName=manager

# Or assign a client role
keycloak_assign_client_role realm=mycompany userId=user-uuid clientId=my-app roleName=user
```

#### Setting up a Client with Custom Scopes
```bash
# Create a client
keycloak_create_client realm=mycompany clientId=web-app name="Web Application" protocol=openid-connect

# Create a custom client scope
keycloak_create_client_scope realm=mycompany name=custom-scope description="Custom scope for web app"
```

### Infisical Examples

#### Complete Secret Management Workflow
```bash
# Create a project
infisical_create_project name="Production App" organizationId=org-123 description="Production environment secrets"

# Create an environment
infisical_create_environment projectId=proj-456 name=production slug=prod description="Production environment"

# Create a folder for database secrets
infisical_create_folder projectId=proj-456 environment=prod name="database" path="/database"

# Create a secret tag for categorization
infisical_create_secret_tag projectId=proj-456 name="database" color="#FF5733"

# Create a database secret with folder organization and tags
infisical_create_secret projectId=proj-456 environment=prod secretName=DB_PASSWORD secretValue=super-secure-password folderId=folder-789 tagIds=tag-123

# Update the secret value
infisical_update_secret projectId=proj-456 environment=prod secretName=DB_PASSWORD secretValue=new-secure-password

# List all secrets in the database folder
# Resource: infisical://secrets?projectId=proj-456&environment=prod&folderId=folder-789

# Get audit logs for secret access
# Resource: infisical://audit-logs?projectId=proj-456&eventType=SECRET_READ&startDate=2023-01-01
```

#### Advanced Secret Organization
```bash
# Create nested folder structure
infisical_create_folder projectId=proj-456 environment=prod name="services" path="/services"
infisical_create_folder projectId=proj-456 environment=prod name="auth-service" path="/services/auth-service"

# Create environment-specific tags
infisical_create_secret_tag projectId=proj-456 name="critical" color="#FF0000"
infisical_create_secret_tag projectId=proj-456 name="api-key" color="#00FF00"

# Create secrets with proper organization
infisical_create_secret projectId=proj-456 environment=prod secretName=AUTH_SECRET secretValue=auth-token folderId=auth-folder-id tagIds=critical-tag-id,api-key-tag-id
```

#### Organization Management
```bash
# Update user role in organization
infisical_update_organization_membership organizationId=org-123 membershipId=member-456 role=admin

# Remove user from organization
infisical_delete_organization_membership organizationId=org-123 membershipId=member-456
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

## Advanced Features

### Dynamic Context Support
Both Keycloak and Infisical integrations support dynamic context switching:

- **Keycloak**: Automatically handles multi-realm and multi-client operations without requiring explicit realm/client specification for every operation
- **Infisical**: Supports dynamic project, workspace, and environment switching with intelligent parameter inference

### Comprehensive API Coverage
This MCP server provides extensive coverage of both platforms:

- **Keycloak**: Full Admin REST API coverage including realms, users, clients, roles, groups, identity providers, client scopes, events, authentication flows, and organizations
- **Infisical**: Complete API coverage including secrets, projects, environments, folders, secret tags, organization management, and audit logging

### Advanced Query Capabilities
Both integrations support sophisticated filtering and querying:

- **Pagination**: Configurable page size and offset for large datasets
- **Search**: Full-text search across entities with configurable parameters
- **Filtering**: Advanced filtering by multiple criteria (dates, types, users, etc.)
- **Sorting**: Customizable sorting options for optimal data presentation

### Error Handling and Validation
Robust error handling with:
- Comprehensive input validation
- Detailed error messages with context
- Graceful handling of authentication and authorization failures
- Retry logic for transient network issues

## Architecture

This MCP server follows the proper **Resources vs Tools** distinction as per the MCP specification:

- **Resources** are like GET endpoints - they provide read-only access to data without side effects
- **Tools** are like POST/PUT/DELETE endpoints - they perform actions and have side effects

This separation allows LLMs to:
- Efficiently browse and discover data through resources
- Take actions when needed through tools
- Understand the difference between reading and writing operations

The architecture supports:
- **Modular Design**: Separate modules for Keycloak and Infisical with consistent patterns
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Extensibility**: Easy to add new endpoints and capabilities
- **Configuration**: Environment-based configuration with sensible defaults

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

### Infisical Resources (Read-only operations)

#### Secret Resources
- `infisical://secrets?projectId=123&environment=dev&workspaceId=456&folderId=789&tagSlugs=tag1,tag2&max=100&offset=0` - List secrets with advanced filtering
- `infisical://secret/{secretName}?projectId=123&environment=dev&workspaceId=456&folderId=789&type=shared&version=1` - Get specific secret with version support

#### Project Resources
- `infisical://projects?workspaceId=123&max=100&offset=0` - List projects in workspace
- `infisical://project/{projectId}` - Get project details and configuration

#### Environment Resources
- `infisical://environments/{projectId}?workspaceId=123` - List environments in project

#### Folder Resources
- `infisical://folders?projectId=123&environment=dev&workspaceId=456&folderId=parent&max=100&offset=0` - List folders in environment
- `infisical://folder/{folderId}?projectId=123&environment=dev&workspaceId=456` - Get folder details

#### Secret Tag Resources
- `infisical://secret-tags?projectId=123&max=100&offset=0` - List secret tags in project
- `infisical://secret-tag/{tagId}?projectId=123` - Get secret tag details

#### Organization Resources
- `infisical://organization-memberships/{organizationId}?max=100&offset=0` - List organization memberships

#### Audit Log Resources
- `infisical://audit-logs?projectId=123&max=100&offset=0&eventType=SECRET_READ&userEmailFilter=user@example.com&startDate=2023-01-01&endDate=2023-12-31` - Get audit logs with advanced filtering

### Infisical Tools (Write operations)

#### Secret Management
- `infisical_create_secret` - Create a new secret with folder and tag support
- `infisical_update_secret` - Update existing secret properties
- `infisical_delete_secret` - Delete a secret from the project

#### Project Management
- `infisical_create_project` - Create a new project with advanced configuration
- `infisical_update_project` - Update project settings and metadata
- `infisical_delete_project` - Delete a project and all its contents

#### Environment Management
- `infisical_create_environment` - Create a new environment in project
- `infisical_update_environment` - Update environment configuration
- `infisical_delete_environment` - Delete an environment

#### Folder Management
- `infisical_create_folder` - Create a new folder for secret organization
- `infisical_update_folder` - Update folder name and properties
- `infisical_delete_folder` - Delete a folder and optionally its contents

#### Secret Tag Management
- `infisical_create_secret_tag` - Create a new tag for secret categorization
- `infisical_update_secret_tag` - Update tag properties and color
- `infisical_delete_secret_tag` - Delete a secret tag

#### Organization Management
- `infisical_update_organization_membership` - Update user role in organization
- `infisical_delete_organization_membership` - Remove user from organization

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
