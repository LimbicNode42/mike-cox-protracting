import { KeycloakClient } from '../keycloak/client.js';
import { InfisicalClient } from '../infisical/client.js';

export interface IntegrationConfig {
  enabled: boolean;
  infisicalProjectId?: string;
  infisicalEnvironment?: string;
  secretPrefix?: string;
  folderPath?: string;
  autoTagSlugs?: string[];
}

export class KeycloakInfisicalIntegration {
  private keycloakClient: KeycloakClient;
  private infisicalClient: InfisicalClient;
  private config: IntegrationConfig;

  constructor(
    keycloakClient: KeycloakClient, 
    infisicalClient: InfisicalClient,
    config: IntegrationConfig = { enabled: false }
  ) {
    this.keycloakClient = keycloakClient;
    this.infisicalClient = infisicalClient;
    this.config = {
      enabled: config.enabled,
      infisicalProjectId: config.infisicalProjectId,
      infisicalEnvironment: config.infisicalEnvironment || 'dev',
      secretPrefix: config.secretPrefix || 'KEYCLOAK_',
      folderPath: config.folderPath || '/keycloak',
      autoTagSlugs: config.autoTagSlugs || ['keycloak', 'auto-generated']
    };
  }

  /**
   * Store a client secret in Infisical after client creation
   */
  async storeClientSecret(clientData: any, realm: string): Promise<void> {
    if (!this.config.enabled || !this.config.infisicalProjectId) {
      return;
    }

    try {
      const secretName = `${this.config.secretPrefix}CLIENT_${clientData.clientId}_SECRET`;
      const secretValue = clientData.secret || '';
      
      if (!secretValue) {
        console.log(`No secret generated for client ${clientData.clientId}, skipping Infisical storage`);
        return;
      }

      await this.infisicalClient.createSecret({
        projectId: this.config.infisicalProjectId,
        environment: this.config.infisicalEnvironment,
        secretName,
        secretValue,
        secretPath: this.config.folderPath,
        secretComment: `Auto-generated client secret for Keycloak client '${clientData.clientId}' in realm '${realm}'`,
        tagIds: this.config.autoTagSlugs
      });

      console.log(`Stored client secret for ${clientData.clientId} in Infisical`);
    } catch (error) {
      console.error(`Failed to store client secret in Infisical:`, error);
    }
  }

  /**
   * Store user credentials in Infisical after user creation
   */
  async storeUserCredentials(userData: any, realm: string, password?: string): Promise<void> {
    if (!this.config.enabled || !this.config.infisicalProjectId || !password) {
      return;
    }

    try {
      const secretName = `${this.config.secretPrefix}USER_${userData.username}_PASSWORD`;
      
      await this.infisicalClient.createSecret({
        projectId: this.config.infisicalProjectId,
        environment: this.config.infisicalEnvironment,
        secretName,
        secretValue: password,
        secretPath: this.config.folderPath,
        secretComment: `Auto-generated password for Keycloak user '${userData.username}' in realm '${realm}'`,
        tagIds: this.config.autoTagSlugs
      });

      console.log(`Stored user credentials for ${userData.username} in Infisical`);
    } catch (error) {
      console.error(`Failed to store user credentials in Infisical:`, error);
    }
  }

  /**
   * Store identity provider client secret in Infisical
   */
  async storeIdentityProviderSecret(idpData: any, realm: string): Promise<void> {
    if (!this.config.enabled || !this.config.infisicalProjectId) {
      return;
    }

    try {
      const clientSecret = idpData.config?.clientSecret;
      if (!clientSecret) {
        console.log(`No client secret for identity provider ${idpData.alias}, skipping Infisical storage`);
        return;
      }

      const secretName = `${this.config.secretPrefix}IDP_${idpData.alias}_CLIENT_SECRET`;
      
      await this.infisicalClient.createSecret({
        projectId: this.config.infisicalProjectId,
        environment: this.config.infisicalEnvironment,
        secretName,
        secretValue: clientSecret,
        secretPath: this.config.folderPath,
        secretComment: `Auto-generated client secret for Keycloak identity provider '${idpData.alias}' in realm '${realm}'`,
        tagIds: this.config.autoTagSlugs
      });

      console.log(`Stored identity provider secret for ${idpData.alias} in Infisical`);
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
    if (!this.config.enabled || !this.config.infisicalProjectId) {
      return;
    }

    try {
      const fullSecretName = `${this.config.secretPrefix}${secretName}`;
      
      await this.infisicalClient.createSecret({
        projectId: this.config.infisicalProjectId,
        environment: this.config.infisicalEnvironment,
        secretName: fullSecretName,
        secretValue,
        secretPath: this.config.folderPath,
        secretComment: `Auto-generated secret from Keycloak: ${context} in realm '${realm}'`,
        tagIds: this.config.autoTagSlugs
      });

      console.log(`Stored generated secret ${fullSecretName} in Infisical`);
    } catch (error) {
      console.error(`Failed to store generated secret in Infisical:`, error);
    }
  }

  /**
   * Store realm configuration secrets (admin credentials, etc.)
   */
  async storeRealmSecret(realmData: any, secretType: string, secretValue: string): Promise<void> {
    if (!this.config.enabled || !this.config.infisicalProjectId) {
      return;
    }

    try {
      const secretName = `${this.config.secretPrefix}REALM_${realmData.realm || realmData.id}_${secretType}`;
      
      await this.infisicalClient.createSecret({
        projectId: this.config.infisicalProjectId,
        environment: this.config.infisicalEnvironment,
        secretName,
        secretValue,
        secretPath: this.config.folderPath,
        secretComment: `Auto-generated ${secretType} for Keycloak realm '${realmData.realm || realmData.id}'`,
        tagIds: this.config.autoTagSlugs
      });

      console.log(`Stored realm secret ${secretName} in Infisical`);
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
   * Check if integration is enabled and properly configured
   */
  isEnabled(): boolean {
    return this.config.enabled && !!this.config.infisicalProjectId;
  }

  /**
   * Get current configuration
   */
  getConfig(): IntegrationConfig {
    return { ...this.config };
  }
}
