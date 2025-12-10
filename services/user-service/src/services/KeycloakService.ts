import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface KeycloakUser {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  enabled: boolean;
  attributes?: Record<string, string[]>;
}

export interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export class KeycloakService {
  private keycloakUrl: string;
  private realm: string;
  private clientId: string;
  private clientSecret?: string;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
    this.realm = process.env.KEYCLOAK_REALM || 'car-rental-realm';
    this.clientId = process.env.KEYCLOAK_CLIENT_ID || 'user-service';
    this.clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

    this.axiosInstance = axios.create({
      baseURL: `${this.keycloakUrl}/realms/${this.realm}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Get admin access token for Keycloak Admin API
   */
  async getAdminToken(): Promise<string> {
    try {
      const response = await this.axiosInstance.post(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret || '',
        })
      );

      return response.data.access_token;
    } catch (error: any) {
      logger.error('Failed to get Keycloak admin token:', error.message);
      throw new Error('Keycloak authentication failed');
    }
  }

  /**
   * Create user in Keycloak
   */
  async createUser(userData: {
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    emailVerified?: boolean;
  }): Promise<string> {
    try {
      const adminToken = await this.getAdminToken();

      const keycloakUser = {
        email: userData.email,
        username: userData.username || userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        emailVerified: userData.emailVerified || false,
        enabled: true,
        credentials: userData.password
          ? [
              {
                type: 'password',
                value: userData.password,
                temporary: false,
              },
            ]
          : undefined,
      };

      const response = await axios.post(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users`,
        keycloakUser,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Extract user ID from Location header
      const location = response.headers.location;
      const userId = location?.split('/').pop();

      if (!userId) {
        throw new Error('Failed to get user ID from Keycloak');
      }

      logger.info(`User created in Keycloak: ${userId}`);
      return userId;
    } catch (error: any) {
      logger.error('Failed to create user in Keycloak:', error.response?.data || error.message);
      throw new Error(`Keycloak user creation failed: ${error.response?.data?.errorMessage || error.message}`);
    }
  }

  /**
   * Get user from Keycloak by ID
   */
  async getUserById(userId: string): Promise<KeycloakUser | null> {
    try {
      const adminToken = await this.getAdminToken();

      const response = await axios.get(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.error('Failed to get user from Keycloak:', error.message);
      throw error;
    }
  }

  /**
   * Update user in Keycloak
   */
  async updateUser(userId: string, userData: Partial<KeycloakUser>): Promise<void> {
    try {
      const adminToken = await this.getAdminToken();

      await axios.put(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`User updated in Keycloak: ${userId}`);
    } catch (error: any) {
      logger.error('Failed to update user in Keycloak:', error.message);
      throw error;
    }
  }

  /**
   * Delete user from Keycloak
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const adminToken = await this.getAdminToken();

      await axios.delete(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      logger.info(`User deleted from Keycloak: ${userId}`);
    } catch (error: any) {
      logger.error('Failed to delete user from Keycloak:', error.message);
      throw error;
    }
  }

  /**
   * Verify JWT token with Keycloak
   */
  async verifyToken(token: string): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        '/protocol/openid-connect/token/introspect',
        new URLSearchParams({
          token,
          client_id: this.clientId,
          client_secret: this.clientSecret || '',
        })
      );

      if (!response.data.active) {
        return null;
      }

      return response.data;
    } catch (error: any) {
      logger.error('Failed to verify token with Keycloak:', error.message);
      return null;
    }
  }

  /**
   * Get user info from token
   */
  async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Failed to get user info from Keycloak:', error.message);
      throw error;
    }
  }
}

