import axios, { AxiosInstance } from 'axios';

export interface InfisicalConfig {
  url: string;
  token: string;
}

export class InfisicalClient {
  private axiosInstance: AxiosInstance;
  private config: InfisicalConfig;

  constructor(config: InfisicalConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: `${config.url}/api`,
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async listSecrets(args: any): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/v3/secrets/raw`, {
        params: { workspaceId: args.projectId, environment: args.environment || 'dev' },
      });
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
    try {
      const response = await this.axiosInstance.get(`/v3/secrets/raw/${args.secretName}`, {
        params: { workspaceId: args.projectId, environment: args.environment || 'dev' },
      });
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
    try {
      await this.axiosInstance.post(`/v3/secrets/raw/${args.secretName}`, {
        workspaceId: args.projectId,
        environment: args.environment || 'dev',
        secretValue: args.secretValue,
      });
      return {
        content: [{ type: 'text', text: `Secret created successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async updateSecret(args: any): Promise<any> {
    try {
      await this.axiosInstance.patch(`/v3/secrets/raw/${args.secretName}`, {
        workspaceId: args.projectId,
        environment: args.environment || 'dev',
        secretValue: args.secretValue,
      });
      return {
        content: [{ type: 'text', text: `Secret updated successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async deleteSecret(args: any): Promise<any> {
    try {
      await this.axiosInstance.delete(`/v3/secrets/raw/${args.secretName}`, {
        params: { workspaceId: args.projectId, environment: args.environment || 'dev' },
      });
      return {
        content: [{ type: 'text', text: `Secret deleted successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async listProjects(args: any): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/v1/workspace');
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
    try {
      await this.axiosInstance.post('/v1/workspace', {
        workspaceName: args.name,
        organizationSlug: args.slug,
      });
      return {
        content: [{ type: 'text', text: `Project created successfully` }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  async listEnvironments(args: any): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/v1/workspace/${args.projectId}/environments`);
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
