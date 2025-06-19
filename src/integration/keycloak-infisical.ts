import { KeycloakClient } from '../keycloak/client.js';
import { InfisicalClient } from '../infisical/client.js';

export interface IntegrationConfig {
  enabled: boolean;
}

export class KeycloakInfisicalIntegration {
  private keycloakClient: KeycloakClient;
  private infisicalClient: InfisicalClient;
  private config: IntegrationConfig;
  private projectId: string | null = null;
  private projectDiscovered = false;

  constructor(
    keycloakClient: KeycloakClient,
    infisicalClient: InfisicalClient,
    config: IntegrationConfig = { enabled: false }
  ) {
    this.keycloakClient = keycloakClient;
    this.infisicalClient = infisicalClient;
    this.config = config;
  }

  /**
   * Auto-discover or create a project for storing Keycloak secrets
   */
  private async discoverProject(): Promise<string | null> {
    if (this.projectDiscovered) {
      return this.projectId;
    }

    try {
      // First, try to find an existing project named "Keycloak Secrets"
      const projectsResult = await this.infisicalClient.listProjects({});
      const projects = JSON.parse(projectsResult.content[0].text);

      const keycloakProject = projects.workspaces?.find(
        (p: any) => p.name === 'Keycloak Secrets' || p.name === 'keycloak-secrets'
      );

      if (keycloakProject) {
        this.projectId = keycloakProject.id;
        console.log(`📁 Found existing Keycloak Secrets project: ${this.projectId}`);
      } else {
        // Create a new project for Keycloak secrets
        try {
          await this.infisicalClient.createProject({
            name: 'Keycloak Secrets',
            description:
              'Auto-generated project for storing Keycloak secrets via MCP server integration',
            type: 'secret-manager',
          });
          // Fetch the newly created project
          const newProjectsResult = await this.infisicalClient.listProjects({});
          const newProjects = JSON.parse(newProjectsResult.content[0].text);
          const newKeycloakProject = newProjects.workspaces?.find(
            (p: any) => p.name === 'Keycloak Secrets'
          );

          if (newKeycloakProject) {
            this.projectId = newKeycloakProject.id;
            console.log(`🆕 Created new Keycloak Secrets project: ${this.projectId}`);
          }
        } catch (error) {
          console.error('Failed to create Keycloak Secrets project:', error);
          return null;
        }
      }

      this.projectDiscovered = true;
      return this.projectId;
    } catch (error) {
      console.error('Failed to discover Infisical project:', error);
      return null;
    }
  }

  /**
   * Get the folder path for storing secrets, auto-creating if needed
   */
  private async ensureFolder(projectId: string): Promise<string> {
    const folderPath = '/keycloak';

    try {
      // Try to create the folder (will succeed if it doesn't exist)
      await this.infisicalClient.createFolder({
        projectId,
        environment: 'dev',
        name: 'keycloak',
        path: '/',
      });
      console.log(`📂 Ensured Keycloak folder exists: ${folderPath}`);
    } catch (error) {
      // Folder likely already exists, which is fine
      console.log(`📂 Using existing Keycloak folder: ${folderPath}`);
    }

    return folderPath;
  }
  /**
   * Store a client secret in Infisical after client creation
   */
  async storeClientSecret(clientData: any, realm: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const projectId = await this.discoverProject();
    if (!projectId) {
      console.error('Could not discover or create Infisical project for Keycloak secrets');
      return;
    }

    try {
      const secretName = `KEYCLOAK_CLIENT_${clientData.clientId}_SECRET`;
      const secretValue = clientData.secret || '';

      if (!secretValue) {
        console.log(
          `No secret generated for client ${clientData.clientId}, skipping Infisical storage`
        );
        return;
      }

      const folderPath = await this.ensureFolder(projectId);

      await this.infisicalClient.createSecret({
        projectId,
        environment: 'dev',
        secretName,
        secretValue,
        secretPath: folderPath,
        secretComment: `Auto-generated client secret for Keycloak client '${clientData.clientId}' in realm '${realm}'`,
        tagIds: ['keycloak', 'auto-generated'],
      });

      console.log(
        `✅ Stored client secret for ${clientData.clientId} in Infisical project ${projectId}`
      );
    } catch (error) {
      console.error(`Failed to store client secret in Infisical:`, error);
    }
  }

  /**
   * Store user credentials in Infisical after user creation
   */
  async storeUserCredentials(userData: any, realm: string, password?: string): Promise<void> {
    if (!this.config.enabled || !password) {
      return;
    }

    const projectId = await this.discoverProject();
    if (!projectId) {
      console.error('Could not discover or create Infisical project for Keycloak secrets');
      return;
    }

    try {
      const secretName = `KEYCLOAK_USER_${userData.username}_PASSWORD`;
      const folderPath = await this.ensureFolder(projectId);

      await this.infisicalClient.createSecret({
        projectId,
        environment: 'dev',
        secretName,
        secretValue: password,
        secretPath: folderPath,
        secretComment: `Auto-generated password for Keycloak user '${userData.username}' in realm '${realm}'`,
        tagIds: ['keycloak', 'auto-generated'],
      });

      console.log(
        `✅ Stored user credentials for ${userData.username} in Infisical project ${projectId}`
      );
    } catch (error) {
      console.error(`Failed to store user credentials in Infisical:`, error);
    }
  }

  /**
   * Store identity provider client secret in Infisical
   */
  async storeIdentityProviderSecret(idpData: any, realm: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const projectId = await this.discoverProject();
    if (!projectId) {
      console.error('Could not discover or create Infisical project for Keycloak secrets');
      return;
    }

    try {
      const clientSecret = idpData.config?.clientSecret;
      if (!clientSecret) {
        console.log(
          `No client secret for identity provider ${idpData.alias}, skipping Infisical storage`
        );
        return;
      }

      const secretName = `KEYCLOAK_IDP_${idpData.alias}_CLIENT_SECRET`;
      const folderPath = await this.ensureFolder(projectId);

      await this.infisicalClient.createSecret({
        projectId,
        environment: 'dev',
        secretName,
        secretValue: clientSecret,
        secretPath: folderPath,
        secretComment: `Auto-generated client secret for Keycloak identity provider '${idpData.alias}' in realm '${realm}'`,
        tagIds: ['keycloak', 'auto-generated'],
      });

      console.log(
        `✅ Stored identity provider secret for ${idpData.alias} in Infisical project ${projectId}`
      );
    } catch (error) {
      console.error(`Failed to store identity provider secret in Infisical:`, error);
    }
  }

  /**
   * Store API tokens or other generated secrets
   */
  async storeGeneratedSecret(
    secretName: string,
    secretValue: string,
    context: string,
    realm: string
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const projectId = await this.discoverProject();
    if (!projectId) {
      console.error('Could not discover or create Infisical project for Keycloak secrets');
      return;
    }

    try {
      const fullSecretName = `KEYCLOAK_${secretName}`;
      const folderPath = await this.ensureFolder(projectId);

      await this.infisicalClient.createSecret({
        projectId,
        environment: 'dev',
        secretName: fullSecretName,
        secretValue,
        secretPath: folderPath,
        secretComment: `Auto-generated secret from Keycloak: ${context} in realm '${realm}'`,
        tagIds: ['keycloak', 'auto-generated'],
      });

      console.log(`✅ Stored generated secret ${fullSecretName} in Infisical project ${projectId}`);
    } catch (error) {
      console.error(`Failed to store generated secret in Infisical:`, error);
    }
  }

  /**
   * Store realm configuration secrets (admin credentials, etc.)
   */
  async storeRealmSecret(realmData: any, secretType: string, secretValue: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const projectId = await this.discoverProject();
    if (!projectId) {
      console.error('Could not discover or create Infisical project for Keycloak secrets');
      return;
    }

    try {
      const secretName = `KEYCLOAK_REALM_${realmData.realm || realmData.id}_${secretType}`;
      const folderPath = await this.ensureFolder(projectId);

      await this.infisicalClient.createSecret({
        projectId,
        environment: 'dev',
        secretName,
        secretValue,
        secretPath: folderPath,
        secretComment: `Auto-generated ${secretType} for Keycloak realm '${realmData.realm || realmData.id}'`,
        tagIds: ['keycloak', 'auto-generated'],
      });

      console.log(`✅ Stored realm secret ${secretName} in Infisical project ${projectId}`);
    } catch (error) {
      console.error(`Failed to store realm secret in Infisical:`, error);
    }
  }

  /**
   * Update configuration for the integration
   */
  updateConfig(newConfig: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  /**
   * Check if integration is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get current configuration
   */
  getConfig(): IntegrationConfig {
    return { ...this.config };
  }
}
