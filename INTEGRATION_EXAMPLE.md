# Keycloak-Infisical Integration Example

## Simplified Configuration

The Keycloak-Infisical integration now requires only a single environment variable to enable it. All project and folder management is handled automatically.

### Environment Setup

```bash
# ✅ Only required variable for integration
export KEYCLOAK_INFISICAL_INTEGRATION_ENABLED="true"

# ❌ No longer needed - auto-managed
# export KEYCLOAK_INFISICAL_PROJECT_ID="..."
# export KEYCLOAK_INFISICAL_ENVIRONMENT="..."
# export KEYCLOAK_INFISICAL_FOLDER_PATH="..."
# export KEYCLOAK_INFISICAL_SECRET_PREFIX="..."
```

### Auto-Discovery Features

When the integration is enabled, the system automatically:

1. **Project Discovery/Creation**

   - Searches for existing "Keycloak Secrets" project
   - Creates new project if none exists
   - Caches project ID for future operations

2. **Folder Management**

   - Ensures `/keycloak` folder exists in the project
   - Creates folder if it doesn't exist
   - Uses consistent folder structure

3. **Secret Organization**
   - Applies consistent naming: `KEYCLOAK_CLIENT_<clientId>_SECRET`
   - Auto-tags secrets with `keycloak` and `auto-generated`
   - Includes descriptive comments with realm and client info

### Example Usage

```bash
# Enable integration
export KEYCLOAK_INFISICAL_INTEGRATION_ENABLED="true"

# Create a confidential client - secret is automatically stored in Infisical
keycloak_create_client realm=mycompany clientId=my-app clientSecret=auto-generate

# Result: Secret automatically stored as:
# Project: "Keycloak Secrets" (auto-created)
# Folder: "/keycloak" (auto-created)
# Secret: "KEYCLOAK_CLIENT_my-app_SECRET" (auto-named)
# Tags: ["keycloak", "auto-generated"] (auto-applied)
```

### Migration from Old Configuration

If you were using the previous manual configuration:

```bash
# Old way (deprecated) ❌
export KEYCLOAK_INFISICAL_PROJECT_ID="proj_123"
export KEYCLOAK_INFISICAL_ENVIRONMENT="dev"
export KEYCLOAK_INFISICAL_FOLDER_PATH="/custom"

# New way (simplified) ✅
export KEYCLOAK_INFISICAL_INTEGRATION_ENABLED="true"
```

The system will handle all project and folder management automatically.
