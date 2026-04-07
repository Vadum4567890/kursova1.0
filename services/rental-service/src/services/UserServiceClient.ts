import axios from 'axios';
import logger from '../utils/logger';

export interface UserInfo {
  id: string;
  email: string;
  role?: string;
  fullName?: string;
  username?: string;
  verifiedStatus?: string;
}

/**
 * HTTP client for User Service.
 * Used to validate renter exists before creating a rental.
 */
export class UserServiceClient {
  private baseUrl: string;

  constructor() {
    // Prefer gateway so it can resolve both dev-auth users (by UUID) and user-service users
    this.baseUrl = process.env.GATEWAY_URL || process.env.USER_SERVICE_URL || 'http://localhost:3002';
  }

  async getUserById(userId: string): Promise<UserInfo | null> {
    // Build URL: gateway exposes /api/users/:id; user-service exposes /api/users/:id
    const isGateway = this.baseUrl.includes('api-gateway') || this.baseUrl.includes(':3000');
    const url = isGateway
      ? `${this.baseUrl}/api/users/${userId}`
      : `${this.baseUrl}/api/users/${userId}`;
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'X-Service-Key': process.env.SERVICE_API_KEY || 'internal-service-key',
        },
      });

      if (response.data?.status === 'success' && response.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.warn('User lookup failed, returning null', { userId, err: error.message });
      return null;
    }
  }

  async validateRenter(userId: string): Promise<boolean> {
    const allowLegacy = (process.env.ALLOW_LEGACY_RENTER_IDS ?? 'true').toLowerCase() === 'true';
    try {
      const user = await this.getUserById(userId);
      if (user) return true;
      // In dev/hybrid mode (monolith auth numeric IDs mapped to synthetic UUIDs),
      // we may not have a corresponding user record in user-service yet.
      return allowLegacy;
    } catch {
      return allowLegacy;
    }
  }
}
