import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../utils/logger';
import { KeycloakService } from './KeycloakService';

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

export class GoogleAuthService {
  private googleClientId: string;
  private keycloakService: KeycloakService;

  constructor() {
    this.googleClientId = process.env.GOOGLE_CLIENT_ID || '';
    this.keycloakService = new KeycloakService();

    if (!this.googleClientId) {
      logger.warn('GOOGLE_CLIENT_ID not set, Google Auth will not work');
    }
  }

  /**
   * Verify Google ID token
   */
  async verifyGoogleToken(idToken: string): Promise<GoogleUserInfo | null> {
    try {
      const client = new OAuth2Client(this.googleClientId);

      const ticket = await client.verifyIdToken({
        idToken,
        audience: this.googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return null;
      }

      return {
        id: payload.sub,
        email: payload.email || '',
        verified_email: payload.email_verified || false,
        name: payload.name || '',
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture,
        locale: payload.locale,
      };
    } catch (error: any) {
      logger.error('Failed to verify Google token:', error.message);
      return null;
    }
  }

  /**
   * Get user info from Google using access token
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to get user info from Google:', error.message);
      return null;
    }
  }

  /**
   * Create or get user from Google authentication
   * Returns Keycloak user ID
   */
  async authenticateWithGoogle(googleToken: string): Promise<{
    keycloakUserId: string;
    userInfo: GoogleUserInfo;
  }> {
    try {
      // Verify Google token
      const googleUser = await this.verifyGoogleToken(googleToken);
      if (!googleUser || !googleUser.email) {
        throw new Error('Invalid Google token or missing email');
      }

      // Check if user exists in Keycloak by email
      // Note: This requires searching users by email in Keycloak
      // For now, we'll create a new user or return existing

      // Create user in Keycloak with Google info
      const keycloakUserId = await this.keycloakService.createUser({
        email: googleUser.email,
        username: googleUser.email,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        emailVerified: googleUser.verified_email,
      });

      logger.info(`Google user authenticated: ${googleUser.email}, Keycloak ID: ${keycloakUserId}`);

      return {
        keycloakUserId,
        userInfo: googleUser,
      };
    } catch (error: any) {
      logger.error('Google authentication failed:', error.message);
      throw error;
    }
  }

  /**
   * Get Google OAuth URL for authorization
   */
  getGoogleAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.googleClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state }),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken: string; idToken: string }> {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: this.googleClientId,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        idToken: response.data.id_token,
      };
    } catch (error: any) {
      logger.error('Failed to exchange code for tokens:', error.message);
      throw error;
    }
  }
}

