import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { KeycloakService } from '../services/KeycloakService';
import { GoogleAuthService } from '../services/GoogleAuthService';
import { UserService } from '../services/UserService';
import { logger } from '../utils/logger';

export class AuthController {
  private keycloakService: KeycloakService;
  private googleAuthService: GoogleAuthService;
  private userService: UserService;

  constructor() {
    this.keycloakService = new KeycloakService();
    this.googleAuthService = new GoogleAuthService();
    this.userService = new UserService();
  }

  /**
   * @swagger
   * /api/users/auth/google:
   *   post:
   *     summary: Authenticate with Google
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - idToken
   *             properties:
   *               idToken:
   *                 type: string
   *                 description: Google ID token
   *     responses:
   *       200:
   *         description: Authentication successful
   *       401:
   *         description: Invalid token
   */
  authenticateWithGoogle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          status: 'error',
          message: 'Google ID token is required',
        });
      }

      const { keycloakUserId, userInfo } = await this.googleAuthService.authenticateWithGoogle(idToken);

      // Check if user exists in our database
      let user = await this.userService.getUserByEmail(userInfo.email);

      if (!user) {
        // Create user in our database
        user = await this.userService.createUser({
          email: userInfo.email,
          emailVerified: userInfo.verified_email,
        });

        // Update profile with Google info
        if (userInfo.given_name || userInfo.family_name) {
          await this.userService.updateUserProfile(user.id, {
            firstName: userInfo.given_name,
            lastName: userInfo.family_name,
            avatarUrl: userInfo.picture,
          });
        }
      }

      // Get Keycloak tokens for the user
      // Note: This would require additional Keycloak setup for Google identity provider

      res.json({
        status: 'success',
        data: {
          userId: user.id,
          keycloakUserId,
          email: userInfo.email,
          name: userInfo.name,
        },
      });
    } catch (error: any) {
      logger.error('Google authentication error:', error);
      next(error);
    }
  };

  /**
   * @swagger
   * /api/users/auth/google/url:
   *   get:
   *     summary: Get Google OAuth URL
   *     tags: [Authentication]
   *     parameters:
   *       - in: query
   *         name: redirectUri
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: state
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Google OAuth URL
   */
  getGoogleAuthUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { redirectUri, state } = req.query;

      if (!redirectUri || typeof redirectUri !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'redirectUri is required',
        });
      }

      const authUrl = this.googleAuthService.getGoogleAuthUrl(redirectUri, state as string);

      res.json({
        status: 'success',
        data: {
          authUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /api/users/auth/google/callback:
   *   post:
   *     summary: Handle Google OAuth callback
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - code
   *               - redirectUri
   *             properties:
   *               code:
   *                 type: string
   *               redirectUri:
   *                 type: string
   *     responses:
   *       200:
   *         description: Authentication successful
   */
  handleGoogleCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, redirectUri } = req.body;

      if (!code || !redirectUri) {
        return res.status(400).json({
          status: 'error',
          message: 'Code and redirectUri are required',
        });
      }

      const tokens = await this.googleAuthService.exchangeCodeForTokens(code, redirectUri);
      const { keycloakUserId, userInfo } = await this.googleAuthService.authenticateWithGoogle(tokens.idToken);

      // Create or get user
      let user = await this.userService.getUserByEmail(userInfo.email);
      if (!user) {
        user = await this.userService.createUser({
          email: userInfo.email,
          emailVerified: userInfo.verified_email,
        });
      }

      res.json({
        status: 'success',
        data: {
          userId: user.id,
          keycloakUserId,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

