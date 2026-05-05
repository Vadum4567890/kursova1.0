import axios from 'axios';
import logger from '../utils/logger';

export interface UserInfo {
  id: string;
  email: string;
  phone?: string | null;
  role?: string;
  fullName?: string;
  username?: string;
  verifiedStatus?: string;
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
  };
}

/**
 * HTTP client for User Service.
 * Used to validate renter exists before creating a rental.
 */
export class UserServiceClient {
  private baseUrl: string;
  private writeBaseUrl: string;

  private serviceApiKey(): string {
    return process.env.NODE_ENV === 'production'
      ? process.env.SERVICE_API_KEY || ''
      : process.env.SERVICE_API_KEY || 'internal-service-key';
  }

  constructor() {
    // Prefer gateway so it can resolve both dev-auth users (by UUID) and user-service users
    this.baseUrl = process.env.GATEWAY_URL || process.env.USER_SERVICE_URL || 'http://localhost:3002';
    this.writeBaseUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
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
          'X-Service-Key': this.serviceApiKey(),
        },
      });

      const root = response.data as { success?: boolean; status?: string; data?: UserInfo } | undefined;
      if (root && root.success === false) {
        return null;
      }
      if (root?.data && typeof root.data === 'object') {
        if (root.status === 'success' || root.status === undefined) {
          return root.data as UserInfo;
        }
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

  async incrementCompletedRentals(userId: string): Promise<void> {
    await axios.post(
      `${this.writeBaseUrl}/api/users/${userId}/rating/completed-rental`,
      {},
      {
        timeout: 5000,
        headers: {
          'X-Service-Key': this.serviceApiKey(),
        },
      }
    );
  }

  async applyPublishedReviewAggregate(
    userId: string,
    payload: {
      role: 'owner' | 'renter';
      overallScore: number;
      categories: Record<string, number>;
    }
  ): Promise<void> {
    await axios.post(
      `${this.writeBaseUrl}/api/users/${userId}/rating/aggregate`,
      payload,
      {
        timeout: 5000,
        headers: {
          'X-Service-Key': this.serviceApiKey(),
        },
      }
    );
  }
}
