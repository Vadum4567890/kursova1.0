import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../core/interfaces/IAuthService';
import { AppError } from '../middleware/errorHandler';
import { RegisterUserDto, LoginUserDto, UpdateProfileDto, ChangePasswordDto } from '../dto/requests/UserRequest.dto';
import { UserMapper } from '../dto/mappers/UserMapper';

export class AuthController {
  constructor(private authService: IAuthService) {}

  /**
   * POST /api/auth/register - Register a new user
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const registerDto: RegisterUserDto = req.body;

      // Validation
      if (!registerDto.username || !registerDto.email || !registerDto.password) {
        return next(new AppError('Username, email, and password are required', 400));
      }

      if (registerDto.password.length < 6) {
        return next(new AppError('Password must be at least 6 characters long', 400));
      }

      const result = await this.authService.register(registerDto);
      // result.user is already a User entity from the service
      const userDto = UserMapper.toResponseDto(result.user as any);

      res.status(201).json({
        message: 'User registered successfully',
        data: {
          user: userDto,
          token: result.token
        }
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
      const loginDto: LoginUserDto = req.body;

      // Validation
      if (!loginDto.usernameOrEmail || !loginDto.password) {
        return next(new AppError('Username/email and password are required', 400));
      }

      const result = await this.authService.login(loginDto);
      // result.user is already a User entity from the service
      const userDto = UserMapper.toResponseDto(result.user as any);

      res.status(200).json({
        message: 'Login successful',
        data: {
          user: userDto,
          token: result.token
        }
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

      const userDto = UserMapper.toResponseDto(user);
      res.status(200).json({
        data: userDto
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

      const updateProfileDto: UpdateProfileDto = req.body;

      const updated = await this.authService.updateProfile(userId, updateProfileDto);
      const userDto = UserMapper.toResponseDto(updated);

      res.status(200).json({
        message: 'Profile updated successfully',
        data: userDto
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

      const changePasswordDto: ChangePasswordDto = req.body;

      if (!changePasswordDto.currentPassword || !changePasswordDto.newPassword) {
        return next(new AppError('Current password and new password are required', 400));
      }

      await this.authService.changePassword(userId, changePasswordDto.currentPassword, changePasswordDto.newPassword);

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

