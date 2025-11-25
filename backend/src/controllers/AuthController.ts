import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AppError } from '../middleware/errorHandler';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * POST /api/auth/register - Register a new user
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password, fullName, role } = req.body;

      // Validation
      if (!username || !email || !password) {
        throw new AppError('Username, email, and password are required', 400);
      }

      if (password.length < 6) {
        throw new AppError('Password must be at least 6 characters long', 400);
      }

      const result = await this.authService.register({
        username,
        email,
        password,
        fullName,
        role
      });

      res.status(201).json({
        message: 'User registered successfully',
        data: result
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message || 'Registration failed', 400);
    }
  };

  /**
   * POST /api/auth/login - Login user
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { usernameOrEmail, password } = req.body;

      // Validation
      if (!usernameOrEmail || !password) {
        throw new AppError('Username/email and password are required', 400);
      }

      const result = await this.authService.login({
        usernameOrEmail,
        password
      });

      res.status(200).json({
        message: 'Login successful',
        data: result
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message || 'Login failed', 401);
    }
  };

  /**
   * GET /api/auth/me - Get current user info
   */
  getMe = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const user = await this.authService.getUserById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.status(200).json({
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          isActive: user.isActive
        }
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message || 'Failed to get user info', 500);
    }
  };
}

