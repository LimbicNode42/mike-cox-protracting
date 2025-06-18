import axios, { AxiosInstance } from 'axios';

export interface InfisicalConfig {
  url: string;
  // Token Auth (preferred)
  token?: string;
  // Universal Auth (fallback)
  clientId?: string;
  clientSecret?: string;
  // Static configuration defaults (from environment)
  orgId?: string;
  projectId?: string;
  environment?: string;
}

interface AccessTokenData {
  accessToken: string;
  expiresIn: number;
  accessTokenMaxTTL: number;
  tokenType: string;
  expiresAt: number; // Calculated field
}

export class InfisicalClient {
  private axiosInstance: AxiosInstance;
  private config: InfisicalConfig;
  private accessTokenData: AccessTokenData | null = null;
  private isAuthenticating = false;

  constructor(config: InfisicalConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: `${config.url}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Token Auth (preferred) - use token directly
    if (config.token) {
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${config.token}`;
    }
    // Universal Auth (fallback) - requires authentication flow
    else if (config.clientId && config.clientSecret) {
      // Will authenticate via Universal Auth when needed
    }
    else {
      throw new Error('Either token (preferred) or clientId + clientSecret (fallback) must be provided');
    }
  }

  /**
   * Authenticate with Infisical using Universal Auth (only if not using token auth)
   */
  private async authenticate(): Promise<void> {
    if (this.isAuthenticating) {
      // Wait for ongoing authentication
      while (this.isAuthenticating) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.isAuthenticating = true;

    try {
      // Check if we're using token auth (preferred)
      if (this.config.token) {
        this.isAuthenticating = false;
        return; // Already configured with token auth
      }

      // Use Universal Auth as fallback
      if (!this.config.clientId || !this.config.clientSecret) {
        throw new Error('Client ID and Client Secret are required for Universal Auth when token is not provided');
      }

      const response = await axios.post(
        `${this.config.url}/api/v1/auth/universal-auth/login`,
        new URLSearchParams({
          clientId: this.config.clientId,
          clientSecret: this.config.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );      const tokenData: AccessTokenData = {
        ...response.data,
        expiresAt: Date.now() + (response.data.expiresIn * 1000),
      };
      
      this.accessTokenData = tokenData;

      // Set the authorization header
      this.axiosInstance.defaults.headers.common['Authorization'] = `${tokenData.tokenType} ${tokenData.accessToken}`;
      
      console.log(`✅ Infisical Universal Auth successful. Token expires in ${tokenData.expiresIn} seconds.`);
    } catch (error: any) {
      throw new Error(`Failed to authenticate with Infisical: ${error.response?.data?.message || error.message}`);
    } finally {
      this.isAuthenticating = false;
    }
  }

  /**
   * Renew the access token before it expires
   */
  private async renewToken(): Promise<void> {
    if (!this.accessTokenData) {
      throw new Error('No access token to renew');
    }

    try {
      const response = await axios.post(
        `${this.config.url}/api/v1/auth/universal-auth/renew`,
        {},
        {
          headers: {
            'Authorization': `${this.accessTokenData.tokenType} ${this.accessTokenData.accessToken}`,
          },
        }
      );      const newTokenData: AccessTokenData = {
        ...response.data,
        expiresAt: Date.now() + (response.data.expiresIn * 1000),
      };

      this.accessTokenData = newTokenData;
      this.axiosInstance.defaults.headers.common['Authorization'] = `${newTokenData.tokenType} ${newTokenData.accessToken}`;
      
      console.log(`🔄 Infisical token renewed. New expiration in ${newTokenData.expiresIn} seconds.`);
    } catch (error: any) {
      console.warn('Failed to renew token, will re-authenticate:', error.message);
      this.accessTokenData = null;
      await this.authenticate();
    }
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureAuthenticated(): Promise<void> {
    // If using token auth, no need to authenticate or renew
    if (this.config.token) {
      return;
    }

    // If we don't have a token, authenticate using Universal Auth
    if (!this.accessTokenData) {
      await this.authenticate();
      return;
    }

    // Check if token will expire in the next 60 seconds
    const bufferTime = 60 * 1000; // 60 seconds buffer
    if (Date.now() + bufferTime >= this.accessTokenData.expiresAt) {
      console.log('🔄 Access token expiring soon, renewing...');
      await this.renewToken();
    }
  }

  // ========== SECRET MANAGEMENT ==========
    async listSecrets(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const params: any = {
        workspaceId: args.workspaceId || args.projectId || this.config.projectId,
        environment: args.environment || this.config.environment || 'dev',
        secretPath: args.secretPath || '/',
        viewSecretValue: args.viewSecretValue !== undefined ? args.viewSecretValue : true,
        expandSecretReferences: args.expandSecretReferences || false,
        recursive: args.recursive || false,
        include_imports: args.includeImports || false,
      };
      
      if (args.workspaceSlug) params.workspaceSlug = args.workspaceSlug;
      if (args.metadataFilter) params.metadataFilter = args.metadataFilter;
      if (args.tagSlugs) params.tagSlugs = args.tagSlugs;

      const response = await this.axiosInstance.get(`/v3/secrets/raw`, { params });
      return {
        content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }
  async getSecret(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const params: any = {
        workspaceId: args.workspaceId || args.projectId || this.config.projectId,
        environment: args.environment || this.config.environment || 'dev',
        secretPath: args.secretPath || '/',
        version: args.version,
        type: args.type || 'shared',
        expandSecretReferences: args.expandSecretReferences || false,
      };
      
      if (args.workspaceSlug) params.workspaceSlug = args.workspaceSlug;

      const response = await this.axiosInstance.get(`/v3/secrets/raw/${args.secretName}`, { params });
      return {
        content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }
  async createSecret(args: any): Promise<any> {
    await this.ensureAuthenticated();
    await this.ensureAuthenticated();
    try {
      const data: any = {
        workspaceId: args.workspaceId || args.projectId,
        environment: args.environment || 'dev',
        secretValue: args.secretValue,
        secretPath: args.secretPath || '/',
        secretComment: args.secretComment || '',
        type: args.type || 'shared',
        skipMultilineEncoding: args.skipMultilineEncoding || false,
      };

      if (args.secretMetadata) data.secretMetadata = args.secretMetadata;
      if (args.tagIds) data.tagIds = args.tagIds;
      if (args.secretReminderRepeatDays) data.secretReminderRepeatDays = args.secretReminderRepeatDays;
      if (args.secretReminderNote) data.secretReminderNote = args.secretReminderNote;

      const response = await this.axiosInstance.post(`/v3/secrets/raw/${args.secretName}`, data);
      return {
        content: [{ type: 'text', text: `Secret '${args.secretName}' created successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }
  async updateSecret(args: any): Promise<any> {
    await this.ensureAuthenticated();
    await this.ensureAuthenticated();
    try {
      const data: any = {
        workspaceId: args.workspaceId || args.projectId,
        environment: args.environment || 'dev',
        secretPath: args.secretPath || '/',
        type: args.type || 'shared',
        skipMultilineEncoding: args.skipMultilineEncoding || false,
      };

      if (args.secretValue !== undefined) data.secretValue = args.secretValue;
      if (args.secretComment !== undefined) data.secretComment = args.secretComment;
      if (args.secretMetadata) data.secretMetadata = args.secretMetadata;
      if (args.tagIds) data.tagIds = args.tagIds;
      if (args.secretReminderRepeatDays !== undefined) data.secretReminderRepeatDays = args.secretReminderRepeatDays;
      if (args.secretReminderNote !== undefined) data.secretReminderNote = args.secretReminderNote;

      const response = await this.axiosInstance.patch(`/v3/secrets/raw/${args.secretName}`, data);
      return {
        content: [{ type: 'text', text: `Secret '${args.secretName}' updated successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }
  async deleteSecret(args: any): Promise<any> {
    await this.ensureAuthenticated();
    await this.ensureAuthenticated();
    try {
      const params: any = {
        workspaceId: args.workspaceId || args.projectId,
        environment: args.environment || 'dev',
        secretPath: args.secretPath || '/',
        type: args.type || 'shared',
      };

      await this.axiosInstance.delete(`/v3/secrets/raw/${args.secretName}`, { params });
      return {
        content: [{ type: 'text', text: `Secret '${args.secretName}' deleted successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  // ========== PROJECT MANAGEMENT ==========

  async listProjects(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      // Use the correct API endpoint with organization ID
      const orgId = this.config.orgId;
      if (!orgId) {
        return {
          content: [{ type: 'text', text: `Error: Organization ID is required. Please set INFISICAL_ORG_ID in your environment.` }],
        };
      }
      
      const response = await this.axiosInstance.get(`/v2/organizations/${orgId}/workspaces`);
      return {
        content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async createProject(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const data: any = {
        projectName: args.projectName || args.name,
        projectDescription: args.projectDescription || args.description,
        type: args.type || 'secret-manager',
        shouldCreateDefaultEnvs: args.shouldCreateDefaultEnvs !== undefined ? args.shouldCreateDefaultEnvs : true,
      };

      if (args.slug) data.slug = args.slug;
      if (args.kmsKeyId) data.kmsKeyId = args.kmsKeyId;
      if (args.template) data.template = args.template;

      const response = await this.axiosInstance.post('/v2/workspace', data);
      return {
        content: [{ type: 'text', text: `Project '${args.projectName || args.name}' created successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async getProject(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await this.axiosInstance.get(`/v1/workspace/${args.workspaceId || args.projectId}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async updateProject(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const data: any = {};
      
      if (args.name !== undefined) data.name = args.name;
      if (args.autoCapitalization !== undefined) data.autoCapitalization = args.autoCapitalization;

      const response = await this.axiosInstance.patch(`/v1/workspace/${args.workspaceId || args.projectId}`, data);
      return {
        content: [{ type: 'text', text: `Project updated successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async deleteProject(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      await this.axiosInstance.delete(`/v1/workspace/${args.workspaceId || args.projectId}`);
      return {
        content: [{ type: 'text', text: `Project deleted successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  // ========== ENVIRONMENT MANAGEMENT ==========

  async listEnvironments(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await this.axiosInstance.get(`/v1/workspace/${args.workspaceId || args.projectId}/environments`);
      return {
        content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async createEnvironment(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const data: any = {
        name: args.name,
        slug: args.slug,
        position: args.position || 1,
      };

      const response = await this.axiosInstance.post(`/v1/workspace/${args.workspaceId || args.projectId}/environments`, data);
      return {
        content: [{ type: 'text', text: `Environment '${args.name}' created successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async updateEnvironment(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const data: any = {};
      
      if (args.name !== undefined) data.name = args.name;
      if (args.slug !== undefined) data.slug = args.slug;
      if (args.position !== undefined) data.position = args.position;

      const response = await this.axiosInstance.patch(`/v1/workspace/${args.workspaceId || args.projectId}/environments/${args.environmentId}`, data);
      return {
        content: [{ type: 'text', text: `Environment updated successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async deleteEnvironment(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      await this.axiosInstance.delete(`/v1/workspace/${args.workspaceId || args.projectId}/environments/${args.environmentId}`);
      return {
        content: [{ type: 'text', text: `Environment deleted successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  // ========== FOLDER MANAGEMENT ==========

  async listFolders(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const params: any = {
        workspaceId: args.workspaceId || args.projectId || this.config.projectId,
        environment: args.environment || this.config.environment || 'dev',
        recursive: args.recursive || false,
      };

      if (args.path) params.path = args.path;
      if (args.directory) params.directory = args.directory; // Deprecated but supported
      if (args.lastSecretModified) params.lastSecretModified = args.lastSecretModified;

      const response = await this.axiosInstance.get('/v1/folders', { params });
      return {
        content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async getFolder(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await this.axiosInstance.get(`/v1/folders/${args.folderId}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async createFolder(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const data: any = {
        workspaceId: args.workspaceId || args.projectId,
        environment: args.environment,
        name: args.name,
        path: args.path || '/',
      };

      const response = await this.axiosInstance.post('/v1/folders', data);
      return {
        content: [{ type: 'text', text: `Folder '${args.name}' created successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async updateFolder(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const data: any = {};
      
      if (args.name !== undefined) data.name = args.name;

      const response = await this.axiosInstance.patch(`/v1/folders/${args.folderId}`, data);
      return {
        content: [{ type: 'text', text: `Folder updated successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async deleteFolder(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const params: any = {
        workspaceId: args.workspaceId || args.projectId,
        environment: args.environment,
        path: args.path || '/',
      };

      await this.axiosInstance.delete(`/v1/folders/${args.folderId}`, { params });
      return {
        content: [{ type: 'text', text: `Folder deleted successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  // ========== SECRET TAGS ==========

  async listSecretTags(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await this.axiosInstance.get(`/v1/workspace/${args.workspaceId || args.projectId}/tags`);
      return {
        content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async getSecretTag(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await this.axiosInstance.get(`/v1/workspace/${args.workspaceId || args.projectId}/tags/${args.tagId}`);
      return {
        content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async createSecretTag(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const data: any = {
        name: args.name,
        slug: args.slug,
        color: args.color || '#000000',
      };

      const response = await this.axiosInstance.post(`/v1/workspace/${args.workspaceId || args.projectId}/tags`, data);
      return {
        content: [{ type: 'text', text: `Secret tag '${args.name}' created successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async updateSecretTag(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const data: any = {};
      
      if (args.name !== undefined) data.name = args.name;
      if (args.slug !== undefined) data.slug = args.slug;
      if (args.color !== undefined) data.color = args.color;

      const response = await this.axiosInstance.patch(`/v1/workspace/${args.workspaceId || args.projectId}/tags/${args.tagId}`, data);
      return {
        content: [{ type: 'text', text: `Secret tag updated successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async deleteSecretTag(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      await this.axiosInstance.delete(`/v1/workspace/${args.workspaceId || args.projectId}/tags/${args.tagId}`);
      return {
        content: [{ type: 'text', text: `Secret tag deleted successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  // ========== ORGANIZATION MANAGEMENT ==========

  async getOrganizationMemberships(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const response = await this.axiosInstance.get(`/v2/organizations/${args.organizationId}/memberships`);
      return {
        content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async updateOrganizationMembership(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const data: any = {
        role: args.role,
      };

      const response = await this.axiosInstance.patch(`/v2/organizations/${args.organizationId}/memberships/${args.membershipId}`, data);
      return {
        content: [{ type: 'text', text: `Organization membership updated successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async deleteOrganizationMembership(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      await this.axiosInstance.delete(`/v2/organizations/${args.organizationId}/memberships/${args.membershipId}`);
      return {
        content: [{ type: 'text', text: `Organization membership deleted successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  // ========== AUDIT LOGS ==========

  async getAuditLogs(args: any): Promise<any> {
    await this.ensureAuthenticated();
    try {
      const params: any = {
        offset: args.offset || 0,
        limit: args.limit || 20,
      };

      if (args.projectId) params.projectId = args.projectId;
      if (args.environment) params.environment = args.environment;
      if (args.actorType) params.actorType = args.actorType;
      if (args.secretPath) params.secretPath = args.secretPath;
      if (args.secretKey) params.secretKey = args.secretKey;
      if (args.eventType) params.eventType = args.eventType;
      if (args.userAgentType) params.userAgentType = args.userAgentType;
      if (args.eventMetadata) params.eventMetadata = args.eventMetadata;
      if (args.startDate) params.startDate = args.startDate;
      if (args.endDate) params.endDate = args.endDate;
      if (args.actor) params.actor = args.actor;

      const response = await this.axiosInstance.get('/v1/organization/audit-logs', { params });
      return {
        content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }
}
