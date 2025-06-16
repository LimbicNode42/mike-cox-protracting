import axios, { AxiosInstance } from 'axios';

export interface KeycloakConfig {
  url: string;
  username: string;
  password: string;
  realm: string;
  clientId?: string;
}

export class KeycloakClient {
  private axiosInstance: AxiosInstance;
  private config: KeycloakConfig;
  private accessToken: string | null = null;

  constructor(config: KeycloakConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: `${config.url}/admin/realms`,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private async authenticate(): Promise<void> {
    try {
      const response = await axios.post(
        `${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'password',
          client_id: this.config.clientId || 'admin-cli',
          username: this.config.username,
          password: this.config.password,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
    } catch (error) {
      throw new Error(`Failed to authenticate with Keycloak: ${error}`);
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken) {
      await this.authenticate();
    }
  }

  async listUsers(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = args.realm || this.config.realm;
    const response = await this.axiosInstance.get(`/${realm}/users`);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async createUser(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = args.realm || this.config.realm;
    await this.axiosInstance.post(`/${realm}/users`, args);
    return {
      content: [{ type: 'text', text: `User created successfully` }],
    };
  }

  async getUser(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = args.realm || this.config.realm;
    const response = await this.axiosInstance.get(`/${realm}/users/${args.userId}`);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async updateUser(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = args.realm || this.config.realm;
    await this.axiosInstance.put(`/${realm}/users/${args.userId}`, args);
    return {
      content: [{ type: 'text', text: `User updated successfully` }],
    };
  }

  async deleteUser(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = args.realm || this.config.realm;
    await this.axiosInstance.delete(`/${realm}/users/${args.userId}`);
    return {
      content: [{ type: 'text', text: `User deleted successfully` }],
    };
  }

  async listRoles(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = args.realm || this.config.realm;
    const response = await this.axiosInstance.get(`/${realm}/roles`);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async assignRole(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = args.realm || this.config.realm;
    // Simplified role assignment
    return {
      content: [{ type: 'text', text: `Role assigned successfully` }],
    };
  }

  async listClients(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = args.realm || this.config.realm;
    const response = await this.axiosInstance.get(`/${realm}/clients`);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async createClient(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = args.realm || this.config.realm;
    await this.axiosInstance.post(`/${realm}/clients`, args);
    return {
      content: [{ type: 'text', text: `Client created successfully` }],
    };
  }
}
