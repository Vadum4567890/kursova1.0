import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';
import { GoogleAuthService } from '../services/GoogleAuthService';
import { UserService } from '../services/UserService';
import { User, UserRole } from '../entities/User.entity';
import { logger } from '../utils/logger';

type PublicAuthUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  fullName?: string;
  address?: string;
  phone?: string;
};

function createStatusError(message: string, statusCode: number): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

function normalizeEmail(email: unknown): string {
  return String(email || '').trim().toLowerCase();
}

function normalizeUsername(username: unknown): string {
  return String(username || '').trim().toLowerCase();
}

function normalizePhone(phone: unknown): string {
  const raw = String(phone || '').trim();
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 10 && digits.startsWith('0')) {
    return `+38${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('380')) {
    return `+${digits}`;
  }
  if (raw.startsWith('+') && digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return raw;
}

function normalizeFullName(fullName: unknown): string {
  return String(fullName || '').trim().replace(/\s+/g, ' ');
}

function normalizeAddress(address: unknown): string {
  return String(address || '').trim().replace(/\s+/g, ' ');
}

function validateFullName(fullName: string): void {
  if (!fullName) {
    throw createStatusError('Full name is required', 400);
  }
  if (fullName.length < 5 || fullName.length > 80) {
    throw createStatusError('Full name must be between 5 and 80 characters', 400);
  }
  if (fullName.split(' ').length < 2) {
    throw createStatusError('Full name must include first and last name', 400);
  }
  if (!/^[\p{L}'’-]+(?:\s+[\p{L}'’-]+)+$/u.test(fullName)) {
    throw createStatusError('Full name contains invalid characters', 400);
  }
}

function validatePhone(phone: string): void {
  if (!phone) {
    throw createStatusError('Phone is required', 400);
  }
  if (!/^\+\d{10,15}$/.test(phone)) {
    throw createStatusError('Phone must be a valid international number', 400);
  }
}

function validateAddress(address: string): void {
  if (!address) {
    throw createStatusError('Address is required', 400);
  }
  if (address.length < 5 || address.length > 160) {
    throw createStatusError('Address must be between 5 and 160 characters', 400);
  }
  if (!/^[\p{L}\p{N}\s.,'’/#№()-]+$/u.test(address)) {
    throw createStatusError('Address contains invalid characters', 400);
  }
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string | null): boolean {
  if (!storedHash) return false;
  const [algorithm, salt, hash] = storedHash.split(':');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;

  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function roleFromInput(roleRaw: unknown): UserRole {
  if (roleRaw === UserRole.OWNER) return UserRole.OWNER;
  if (roleRaw === UserRole.BOTH) return UserRole.BOTH;
  if (roleRaw === UserRole.ADMIN) return UserRole.ADMIN;
  return UserRole.RENTER;
}

export class AuthController {
  private googleAuthService: GoogleAuthService;
  private userService: UserService;

  constructor() {
    this.googleAuthService = new GoogleAuthService();
    this.userService = new UserService();
  }

  private toPublicAuthUser(user: User): PublicAuthUser {
    const firstName = user.profile?.firstName?.trim();
    const lastName = user.profile?.lastName?.trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    return {
      id: user.id,
      username: user.username || user.email,
      email: user.email,
      role: user.role,
      fullName: fullName || undefined,
      address: user.profile?.address || undefined,
      phone: user.phone || undefined,
    };
  }

  private signToken(user: User): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw createStatusError('JWT_SECRET is not configured', 500);
    }

    const publicUser = this.toPublicAuthUser(user);
    const signOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as SignOptions['expiresIn'],
    };

    return jwt.sign(
      {
        sub: user.id,
        id: user.id,
        username: publicUser.username,
        email: user.email,
        role: user.role,
        roles: [user.role],
        fullName: publicUser.fullName,
      },
      secret,
      signOptions
    );
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, email, password, role, fullName, address, phone } = req.body || {};
      const normalizedEmail = normalizeEmail(email);
      const normalizedUsername = normalizeUsername(username);
      const normalizedPassword = String(password || '');
      const normalizedPhone = normalizePhone(phone);
      const normalizedFullName = normalizeFullName(fullName);
      const normalizedAddress = normalizeAddress(address);

      if (!normalizedUsername || !normalizedEmail || !normalizedPassword) {
        throw createStatusError('username, email and password are required', 400);
      }
      if (normalizedPassword.length < 6) {
        throw createStatusError('Password must be at least 6 characters', 400);
      }
      validateFullName(normalizedFullName);
      validatePhone(normalizedPhone);
      validateAddress(normalizedAddress);

      const existingByEmail = await this.userService.getUserByEmail(normalizedEmail);
      if (existingByEmail) {
        throw createStatusError('User already exists', 409);
      }
      const existingByUsername = await this.userService.getUserByUsername(normalizedUsername);
      if (existingByUsername) {
        throw createStatusError('Username already exists', 409);
      }
      const existingByPhone = await this.userService.getClientByPhone(normalizedPhone);
      if (existingByPhone) {
        throw createStatusError('Phone already exists', 409);
      }

      const user = await this.userService.createUser({
        username: normalizedUsername,
        email: normalizedEmail,
        phone: normalizedPhone,
        role: roleFromInput(role),
        passwordHash: hashPassword(normalizedPassword),
      });

      const [firstName, ...rest] = normalizedFullName.split(' ');
      await this.userService.updateUserProfile(user.id, {
        firstName,
        lastName: rest.join(' '),
        address: normalizedAddress,
      });

      const saved = await this.userService.getUserById(user.id);
      if (!saved) {
        throw createStatusError('User was created but could not be loaded', 500);
      }

      res.status(201).json({
        message: 'OK',
        data: {
          token: this.signToken(saved),
          user: this.toPublicAuthUser(saved),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { usernameOrEmail, password } = req.body || {};
      const loginValue = String(usernameOrEmail || '').trim();
      const normalizedLogin = loginValue.toLowerCase();
      const normalizedPassword = String(password || '');

      if (!loginValue || !normalizedPassword) {
        throw createStatusError('Login and password are required', 400);
      }

      const user = loginValue.includes('@')
        ? await this.userService.getUserByEmail(normalizedLogin)
        : await this.userService.getUserByUsername(normalizedLogin);

      if (!user || !verifyPassword(normalizedPassword, user.passwordHash)) {
        throw createStatusError('Invalid username or password', 401);
      }

      res.json({
        message: 'OK',
        data: {
          token: this.signToken(user),
          user: this.toPublicAuthUser(user),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        throw createStatusError('Unauthorized', 401);
      }

      const user = await this.userService.getUserById(req.user.id);
      if (!user) {
        throw createStatusError('User not found', 404);
      }

      res.json({ data: this.toPublicAuthUser(user) });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        throw createStatusError('Unauthorized', 401);
      }

      const { email, fullName, address, phone } = req.body || {};
      const userUpdate: Partial<User> = {};
      if (email !== undefined) userUpdate.email = normalizeEmail(email);
      if (phone !== undefined) userUpdate.phone = phone ? String(phone).trim() : null;
      if (Object.keys(userUpdate).length > 0) {
        await this.userService.updateUser(req.user.id, userUpdate);
      }

      const profileUpdate: Record<string, string | null> = {};
      if (fullName !== undefined) {
        const normalizedFullName = String(fullName || '').trim().replace(/\s+/g, ' ');
        const [firstName, ...rest] = normalizedFullName ? normalizedFullName.split(' ') : [];
        profileUpdate.firstName = firstName || null;
        profileUpdate.lastName = rest.length > 0 ? rest.join(' ') : null;
      }
      if (address !== undefined) {
        profileUpdate.address = address ? String(address).trim() : null;
      }
      if (Object.keys(profileUpdate).length > 0) {
        await this.userService.updateUserProfile(req.user.id, profileUpdate);
      }

      const updated = await this.userService.getUserById(req.user.id);
      if (!updated) {
        throw createStatusError('User not found', 404);
      }

      res.json({ message: 'OK', data: this.toPublicAuthUser(updated) });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        throw createStatusError('Unauthorized', 401);
      }

      const { currentPassword, newPassword } = req.body || {};
      const user = await this.userService.getUserById(req.user.id);
      if (!user || !verifyPassword(String(currentPassword || ''), user.passwordHash)) {
        throw createStatusError('Invalid current password', 400);
      }
      if (String(newPassword || '').length < 6) {
        throw createStatusError('New password must be at least 6 characters', 400);
      }

      await this.userService.updateUser(req.user.id, {
        passwordHash: hashPassword(String(newPassword)),
      });

      res.json({ message: 'Password updated' });
    } catch (error) {
      next(error);
    }
  };

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

      const { userInfo, jwtToken } = await this.googleAuthService.authenticateWithGoogle(idToken);

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

      res.json({
        status: 'success',
        data: {
          userId: user.id,
          token: jwtToken,
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
      const { userInfo, jwtToken } = await this.googleAuthService.authenticateWithGoogle(tokens.idToken);

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
          token: jwtToken,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

