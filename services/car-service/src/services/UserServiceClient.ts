import axios from 'axios';
import logger from '../utils/logger';

export interface User {
  id: string;
  email: string;
  role: string;
  verifiedStatus: string;
}

export interface UserProfile {
  userId: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

/**
 * HTTP Client для комунікації з User Service
 * Використовується для отримання інформації про користувачів
 */
export class UserServiceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.USER_SERVICE_URL || 'http://user-service:3002';
  }

  /**
   * Отримати інформацію про користувача
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/users/${userId}`, {
        timeout: 5000,
        headers: {
          'X-Service-Key': process.env.SERVICE_API_KEY || 'internal-service-key',
        },
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn('User not found', { userId });
        return null;
      }

      logger.error('Error fetching user from User Service', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Отримати профіль користувача
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/users/${userId}/profile`,
        {
          timeout: 5000,
          headers: {
            'X-Service-Key': process.env.SERVICE_API_KEY || 'internal-service-key',
          },
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }

      logger.error('Error fetching user profile from User Service', {
        userId,
        error: error.message,
      });
      return null; // Не кидаємо помилку, щоб не блокувати основний flow
    }
  }

  /**
   * Перевірити чи користувач існує та має роль owner
   */
  async validateOwner(ownerId: string): Promise<boolean> {
    try {
      const user = await this.getUserById(ownerId);
      if (!user) {
        return false;
      }

      // Перевірка ролі
      const validRoles = ['owner', 'both', 'admin'];
      return validRoles.includes(user.role);
    } catch (error) {
      logger.error('Error validating owner', { ownerId, error });
      return false;
    }
  }
}

