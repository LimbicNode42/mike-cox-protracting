import axios, { AxiosInstance } from 'axios';

export interface KeycloakConfig {
  url: string;
  username: string;
  password: string;
  realm?: string; // Make realm optional for multi-realm operations
  clientId?: string;
}

export class KeycloakClient {
  private axiosInstance: AxiosInstance;
  private adminAxiosInstance: AxiosInstance;
  private config: KeycloakConfig;
  private accessToken: string | null = null;

  constructor(config: KeycloakConfig) {
    this.config = config;

    // Instance for realm-specific operations
    this.axiosInstance = axios.create({
      baseURL: `${config.url}/admin/realms`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Instance for admin operations (cross-realm)
    this.adminAxiosInstance = axios.create({
      baseURL: `${config.url}/admin`,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  private async authenticate(): Promise<void> {
    try {
      const authRealm = this.config.realm || 'master'; // Default to master realm for authentication
      const response = await axios.post(
        `${this.config.url}/realms/${authRealm}/protocol/openid-connect/token`,
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
      this.adminAxiosInstance.defaults.headers.common['Authorization'] =
        `Bearer ${this.accessToken}`;
    } catch (error) {
      throw new Error(`Failed to authenticate with Keycloak: ${error}`);
    }
  }
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken) {
      await this.authenticate();
    }
  }

  private getRealmPath(realm?: string): string {
    return realm || this.config.realm || 'master';
  }

  // ========== REALM MANAGEMENT ==========

  async listRealms(): Promise<any> {
    await this.ensureAuthenticated();
    const response = await this.adminAxiosInstance.get('/realms');
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async createRealm(args: any): Promise<any> {
    await this.ensureAuthenticated();
    await this.adminAxiosInstance.post('/realms', args);
    return {
      content: [{ type: 'text', text: `Realm '${args.realm || args.id}' created successfully` }],
    };
  }

  async getRealm(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const response = await this.axiosInstance.get(`/${realm}`);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async updateRealm(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const { realm: realmParam, ...updateData } = args;
    await this.axiosInstance.put(`/${realm}`, updateData);
    return {
      content: [{ type: 'text', text: `Realm '${realm}' updated successfully` }],
    };
  }

  async deleteRealm(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    await this.axiosInstance.delete(`/${realm}`);
    return {
      content: [{ type: 'text', text: `Realm '${realm}' deleted successfully` }],
    };
  }

  // ========== USER MANAGEMENT ==========

  async listUsers(args: any = {}): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const params = new URLSearchParams();

    // Add query parameters for user filtering
    if (args.search) params.append('search', args.search);
    if (args.username) params.append('username', args.username);
    if (args.email) params.append('email', args.email);
    if (args.firstName) params.append('firstName', args.firstName);
    if (args.lastName) params.append('lastName', args.lastName);
    if (args.first !== undefined) params.append('first', args.first.toString());
    if (args.max !== undefined) params.append('max', args.max.toString());
    if (args.enabled !== undefined) params.append('enabled', args.enabled.toString());
    if (args.briefRepresentation !== undefined)
      params.append('briefRepresentation', args.briefRepresentation.toString());

    const queryString = params.toString();
    const url = `/${realm}/users${queryString ? `?${queryString}` : ''}`;
    const response = await this.axiosInstance.get(url);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async createUser(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const { realm: realmParam, ...userData } = args;
    await this.axiosInstance.post(`/${realm}/users`, userData);
    return {
      content: [{ type: 'text', text: `User created successfully in realm '${realm}'` }],
    };
  }

  async getUser(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const response = await this.axiosInstance.get(`/${realm}/users/${args.userId}`);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async updateUser(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const { realm: realmParam, userId, ...updateData } = args;
    await this.axiosInstance.put(`/${realm}/users/${userId}`, updateData);
    return {
      content: [
        { type: 'text', text: `User '${userId}' updated successfully in realm '${realm}'` },
      ],
    };
  }

  async deleteUser(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    await this.axiosInstance.delete(`/${realm}/users/${args.userId}`);
    return {
      content: [
        { type: 'text', text: `User '${args.userId}' deleted successfully from realm '${realm}'` },
      ],
    };
  }

  async getUserCount(args: any = {}): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const params = new URLSearchParams();

    if (args.search) params.append('search', args.search);
    if (args.username) params.append('username', args.username);
    if (args.email) params.append('email', args.email);
    if (args.firstName) params.append('firstName', args.firstName);
    if (args.lastName) params.append('lastName', args.lastName);
    if (args.enabled !== undefined) params.append('enabled', args.enabled.toString());

    const queryString = params.toString();
    const url = `/${realm}/users/count${queryString ? `?${queryString}` : ''}`;
    const response = await this.axiosInstance.get(url);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  // ========== CLIENT MANAGEMENT ==========

  async listClients(args: any = {}): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const params = new URLSearchParams();

    if (args.clientId) params.append('clientId', args.clientId);
    if (args.search !== undefined) params.append('search', args.search.toString());
    if (args.first !== undefined) params.append('first', args.first.toString());
    if (args.max !== undefined) params.append('max', args.max.toString());
    if (args.viewableOnly !== undefined)
      params.append('viewableOnly', args.viewableOnly.toString());

    const queryString = params.toString();
    const url = `/${realm}/clients${queryString ? `?${queryString}` : ''}`;
    const response = await this.axiosInstance.get(url);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }
  async createClient(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const { realm: realmParam, ...clientData } = args;

    // Create the client
    const createResponse = await this.axiosInstance.post(`/${realm}/clients`, clientData);

    // If this is a confidential client, retrieve the generated secret
    let clientSecret = null;
    if (!clientData.publicClient && clientData.protocol === 'openid-connect') {
      try {
        // First, find the created client by clientId to get its UUID
        const clientsResponse = await this.axiosInstance.get(`/${realm}/clients`, {
          params: { clientId: clientData.clientId },
        });

        if (clientsResponse.data && clientsResponse.data.length > 0) {
          const clientUuid = clientsResponse.data[0].id;

          // Get the client secret
          const secretResponse = await this.axiosInstance.get(
            `/${realm}/clients/${clientUuid}/client-secret`
          );
          clientSecret = secretResponse.data.value;

          // Store the secret in the client data for the integration to use
          clientData.secret = clientSecret;
        }
      } catch (error) {
        console.warn(`Could not retrieve client secret for ${clientData.clientId}:`, error);
      }
    }

    const message = clientSecret
      ? `Client '${clientData.clientId}' created successfully in realm '${realm}' with secret`
      : `Client '${clientData.clientId}' created successfully in realm '${realm}'`;

    return {
      content: [{ type: 'text', text: message }],
      clientData, // Include the client data with secret for integration
    };
  }

  async getClient(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const response = await this.axiosInstance.get(`/${realm}/clients/${args.clientUuid}`);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async updateClient(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const { realm: realmParam, clientUuid, ...updateData } = args;
    await this.axiosInstance.put(`/${realm}/clients/${clientUuid}`, updateData);
    return {
      content: [
        { type: 'text', text: `Client '${clientUuid}' updated successfully in realm '${realm}'` },
      ],
    };
  }

  async deleteClient(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    await this.axiosInstance.delete(`/${realm}/clients/${args.clientUuid}`);
    return {
      content: [
        {
          type: 'text',
          text: `Client '${args.clientUuid}' deleted successfully from realm '${realm}'`,
        },
      ],
    };
  }

  // ========== ROLE MANAGEMENT ==========

  async listRoles(args: any = {}): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const params = new URLSearchParams();

    if (args.briefRepresentation !== undefined)
      params.append('briefRepresentation', args.briefRepresentation.toString());
    if (args.first !== undefined) params.append('first', args.first.toString());
    if (args.max !== undefined) params.append('max', args.max.toString());
    if (args.search) params.append('search', args.search);

    const queryString = params.toString();
    const url = `/${realm}/roles${queryString ? `?${queryString}` : ''}`;
    const response = await this.axiosInstance.get(url);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async createRole(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const { realm: realmParam, ...roleData } = args;
    await this.axiosInstance.post(`/${realm}/roles`, roleData);
    return {
      content: [
        { type: 'text', text: `Role '${roleData.name}' created successfully in realm '${realm}'` },
      ],
    };
  }

  async getRole(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const response = await this.axiosInstance.get(`/${realm}/roles/${args.roleName}`);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async updateRole(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const { realm: realmParam, roleName, ...updateData } = args;
    await this.axiosInstance.put(`/${realm}/roles/${roleName}`, updateData);
    return {
      content: [
        { type: 'text', text: `Role '${roleName}' updated successfully in realm '${realm}'` },
      ],
    };
  }

  async deleteRole(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    await this.axiosInstance.delete(`/${realm}/roles/${args.roleName}`);
    return {
      content: [
        {
          type: 'text',
          text: `Role '${args.roleName}' deleted successfully from realm '${realm}'`,
        },
      ],
    };
  }

  async listClientRoles(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const params = new URLSearchParams();

    if (args.briefRepresentation !== undefined)
      params.append('briefRepresentation', args.briefRepresentation.toString());
    if (args.first !== undefined) params.append('first', args.first.toString());
    if (args.max !== undefined) params.append('max', args.max.toString());
    if (args.search) params.append('search', args.search);

    const queryString = params.toString();
    const url = `/${realm}/clients/${args.clientUuid}/roles${queryString ? `?${queryString}` : ''}`;
    const response = await this.axiosInstance.get(url);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async createClientRole(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const { realm: realmParam, clientUuid, ...roleData } = args;
    await this.axiosInstance.post(`/${realm}/clients/${clientUuid}/roles`, roleData);
    return {
      content: [
        {
          type: 'text',
          text: `Client role '${roleData.name}' created successfully in realm '${realm}'`,
        },
      ],
    };
  }

  // ========== ROLE ASSIGNMENTS ==========

  async assignRealmRoleToUser(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);

    // First get the role representation
    const roleResponse = await this.axiosInstance.get(`/${realm}/roles/${args.roleName}`);
    const roleRepresentation = roleResponse.data;

    // Assign the role
    await this.axiosInstance.post(`/${realm}/users/${args.userId}/role-mappings/realm`, [
      roleRepresentation,
    ]);
    return {
      content: [
        {
          type: 'text',
          text: `Realm role '${args.roleName}' assigned to user '${args.userId}' in realm '${realm}'`,
        },
      ],
    };
  }

  async assignClientRoleToUser(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);

    // First get the role representation
    const roleResponse = await this.axiosInstance.get(
      `/${realm}/clients/${args.clientUuid}/roles/${args.roleName}`
    );
    const roleRepresentation = roleResponse.data;

    // Assign the role
    await this.axiosInstance.post(
      `/${realm}/users/${args.userId}/role-mappings/clients/${args.clientUuid}`,
      [roleRepresentation]
    );
    return {
      content: [
        {
          type: 'text',
          text: `Client role '${args.roleName}' assigned to user '${args.userId}' in realm '${realm}'`,
        },
      ],
    };
  }

  // ========== GROUP MANAGEMENT ==========

  async listGroups(args: any = {}): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const params = new URLSearchParams();

    if (args.briefRepresentation !== undefined)
      params.append('briefRepresentation', args.briefRepresentation.toString());
    if (args.exact !== undefined) params.append('exact', args.exact.toString());
    if (args.first !== undefined) params.append('first', args.first.toString());
    if (args.max !== undefined) params.append('max', args.max.toString());
    if (args.populateHierarchy !== undefined)
      params.append('populateHierarchy', args.populateHierarchy.toString());
    if (args.q) params.append('q', args.q);
    if (args.search) params.append('search', args.search);

    const queryString = params.toString();
    const url = `/${realm}/groups${queryString ? `?${queryString}` : ''}`;
    const response = await this.axiosInstance.get(url);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async createGroup(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const { realm: realmParam, ...groupData } = args;
    await this.axiosInstance.post(`/${realm}/groups`, groupData);
    return {
      content: [
        {
          type: 'text',
          text: `Group '${groupData.name}' created successfully in realm '${realm}'`,
        },
      ],
    };
  }

  async getGroup(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const response = await this.axiosInstance.get(`/${realm}/groups/${args.groupId}`);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async updateGroup(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const { realm: realmParam, groupId, ...updateData } = args;
    await this.axiosInstance.put(`/${realm}/groups/${groupId}`, updateData);
    return {
      content: [
        { type: 'text', text: `Group '${groupId}' updated successfully in realm '${realm}'` },
      ],
    };
  }

  async deleteGroup(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    await this.axiosInstance.delete(`/${realm}/groups/${args.groupId}`);
    return {
      content: [
        {
          type: 'text',
          text: `Group '${args.groupId}' deleted successfully from realm '${realm}'`,
        },
      ],
    };
  }

  // ========== IDENTITY PROVIDERS ==========

  async listIdentityProviders(args: any = {}): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const params = new URLSearchParams();

    if (args.briefRepresentation !== undefined)
      params.append('briefRepresentation', args.briefRepresentation.toString());
    if (args.first !== undefined) params.append('first', args.first.toString());
    if (args.max !== undefined) params.append('max', args.max.toString());
    if (args.realmOnly !== undefined) params.append('realmOnly', args.realmOnly.toString());
    if (args.search) params.append('search', args.search);

    const queryString = params.toString();
    const url = `/${realm}/identity-provider/instances${queryString ? `?${queryString}` : ''}`;
    const response = await this.axiosInstance.get(url);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async createIdentityProvider(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const { realm: realmParam, ...idpData } = args;
    await this.axiosInstance.post(`/${realm}/identity-provider/instances`, idpData);
    return {
      content: [
        {
          type: 'text',
          text: `Identity provider '${idpData.alias}' created successfully in realm '${realm}'`,
        },
      ],
    };
  }

  async getIdentityProvider(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const response = await this.axiosInstance.get(
      `/${realm}/identity-provider/instances/${args.alias}`
    );
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async updateIdentityProvider(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const { realm: realmParam, alias, ...updateData } = args;
    await this.axiosInstance.put(`/${realm}/identity-provider/instances/${alias}`, updateData);
    return {
      content: [
        {
          type: 'text',
          text: `Identity provider '${alias}' updated successfully in realm '${realm}'`,
        },
      ],
    };
  }

  async deleteIdentityProvider(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    await this.axiosInstance.delete(`/${realm}/identity-provider/instances/${args.alias}`);
    return {
      content: [
        {
          type: 'text',
          text: `Identity provider '${args.alias}' deleted successfully from realm '${realm}'`,
        },
      ],
    };
  }

  // ========== CLIENT SCOPES ==========

  async listClientScopes(args: any = {}): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const response = await this.axiosInstance.get(`/${realm}/client-scopes`);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async createClientScope(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const { realm: realmParam, ...scopeData } = args;
    await this.axiosInstance.post(`/${realm}/client-scopes`, scopeData);
    return {
      content: [
        {
          type: 'text',
          text: `Client scope '${scopeData.name}' created successfully in realm '${realm}'`,
        },
      ],
    };
  }

  // ========== EVENTS AND SESSIONS ==========

  async getEvents(args: any = {}): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const params = new URLSearchParams();

    if (args.client) params.append('client', args.client);
    if (args.dateFrom) params.append('dateFrom', args.dateFrom);
    if (args.dateTo) params.append('dateTo', args.dateTo);
    if (args.first !== undefined) params.append('first', args.first.toString());
    if (args.max !== undefined) params.append('max', args.max.toString());
    if (args.type) params.append('type', args.type);
    if (args.user) params.append('user', args.user);

    const queryString = params.toString();
    const url = `/${realm}/events${queryString ? `?${queryString}` : ''}`;
    const response = await this.axiosInstance.get(url);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async getAdminEvents(args: any = {}): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const params = new URLSearchParams();

    if (args.authClient) params.append('authClient', args.authClient);
    if (args.authRealm) params.append('authRealm', args.authRealm);
    if (args.authUser) params.append('authUser', args.authUser);
    if (args.dateFrom) params.append('dateFrom', args.dateFrom);
    if (args.dateTo) params.append('dateTo', args.dateTo);
    if (args.first !== undefined) params.append('first', args.first.toString());
    if (args.max !== undefined) params.append('max', args.max.toString());

    const queryString = params.toString();
    const url = `/${realm}/admin-events${queryString ? `?${queryString}` : ''}`;
    const response = await this.axiosInstance.get(url);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  // ========== AUTHENTICATION FLOWS ==========

  async listAuthenticationFlows(args: any = {}): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const response = await this.axiosInstance.get(`/${realm}/authentication/flows`);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async createAuthenticationFlow(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const { realm: realmParam, ...flowData } = args;
    await this.axiosInstance.post(`/${realm}/authentication/flows`, flowData);
    return {
      content: [
        {
          type: 'text',
          text: `Authentication flow '${flowData.alias}' created successfully in realm '${realm}'`,
        },
      ],
    };
  }

  // ========== ORGANIZATIONS (if enabled) ==========

  async listOrganizations(args: any = {}): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const params = new URLSearchParams();

    if (args.briefRepresentation !== undefined)
      params.append('briefRepresentation', args.briefRepresentation.toString());
    if (args.exact !== undefined) params.append('exact', args.exact.toString());
    if (args.first !== undefined) params.append('first', args.first.toString());
    if (args.max !== undefined) params.append('max', args.max.toString());
    if (args.q) params.append('q', args.q);
    if (args.search) params.append('search', args.search);

    const queryString = params.toString();
    const url = `/${realm}/organizations${queryString ? `?${queryString}` : ''}`;
    const response = await this.axiosInstance.get(url);
    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  }

  async createOrganization(args: any): Promise<any> {
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);
    const { realm: realmParam, ...orgData } = args;
    await this.axiosInstance.post(`/${realm}/organizations`, orgData);
    return {
      content: [
        {
          type: 'text',
          text: `Organization '${orgData.name}' created successfully in realm '${realm}'`,
        },
      ],
    };
  }

  // ========== UTILITY METHODS ==========

  async assignRole(args: any): Promise<any> {
    // This method maintains backward compatibility
    await this.ensureAuthenticated();
    const realm = this.getRealmPath(args.realm);

    if (args.clientUuid) {
      return this.assignClientRoleToUser({
        ...args,
        realm,
      });
    } else {
      return this.assignRealmRoleToUser({
        ...args,
        realm,
      });
    }
  }
}
