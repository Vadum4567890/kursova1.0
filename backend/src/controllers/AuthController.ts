import { Request, Response, NextFunction } from 'express';
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
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, email, password, fullName, address, role } = req.body;

      // Validation
      if (!username || !email || !password) {
        return next(new AppError('Username, email, and password are required', 400));
      }

      if (password.length < 6) {
        return next(new AppError('Password must be at least 6 characters long', 400));
      }

      const result = await this.authService.register({
        username,
        email,
        password,
        fullName,
        address,
        role
      });

      res.status(201).json({
        message: 'User registered successfully',
        data: result
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        return next(error);
      }
      return next(new AppError(error.message || 'Registration failed', 400));
    }
  };

  /**
   * POST /api/auth/login - Login user
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { usernameOrEmail, password } = req.body;

      // Validation
      if (!usernameOrEmail || !password) {
        return next(new AppError('Username/email and password are required', 400));
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
        return next(error);
      }
      return next(new AppError(error.message || 'Login failed', 401));
    }
  };

  /**
   * GET /api/auth/me - Get current user info
   */
  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return next(new AppError('User not authenticated', 401));
      }

      const user = await this.authService.getUserById(userId);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      res.status(200).json({
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          address: user.address,
          isActive: user.isActive
        }
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        return next(error);
      }
      return next(new AppError(error.message || 'Failed to get user info', 500));
    }
  };

  /**
   * PUT /api/auth/profile - Update user profile
   */
  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return next(new AppError('User not authenticated', 401));
      }

      const { email, fullName, address } = req.body;

      const updated = await this.authService.updateProfile(userId, { email, fullName: fullName, address });

      res.status(200).json({
        message: 'Profile updated successfully',
        data: {
          id: updated.id,
          username: updated.username,
          email: updated.email,
          role: updated.role,
          fullName: updated.fullName,
          address: updated.address,
          isActive: updated.isActive
        }
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        return next(error);
      }
      return next(new AppError(error.message || 'Failed to update profile', 400));
    }
  };

  /**
   * PUT /api/auth/password - Change password
   */
  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return next(new AppError('User not authenticated', 401));
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return next(new AppError('Current password and new password are required', 400));
      }

      await this.authService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        message: 'Password changed successfully'
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        return next(error);
      }
      return next(new AppError(error.message || 'Failed to change password', 400));
    }
  };
}

