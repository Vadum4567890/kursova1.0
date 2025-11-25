import { Request, Response } from 'express';
import { IUserService } from '../core/interfaces/IUserService';
import { AppError } from '../middleware/errorHandler';
import { UserRole } from '../models/User.entity';
import { UpdateUserRoleDto, UpdateUserStatusDto, RegisterUserDto } from '../dto/requests/UserRequest.dto';
import { UserMapper } from '../dto/mappers/UserMapper';

export class UserController {
  constructor(private userService: IUserService) {}

  /**
   * GET /api/users - Get all users (admin only)
   */
  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userService.getAllUsers();
      const usersDto = UserMapper.toResponseDtoList(users);

      res.status(200).json({
        data: usersDto
      });
    } catch (error: any) {
      throw new AppError(error.message || 'Failed to get users', 500);
    }
  };

  /**
   * POST /api/users - Create a new user (admin only)
   */
  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const registerDto: RegisterUserDto = req.body;

      // Validation
      if (!registerDto.username || !registerDto.email || !registerDto.password) {
        throw new AppError('Username, email, and password are required', 400);
      }

      if (registerDto.password.length < 6) {
        throw new AppError('Password must be at least 6 characters long', 400);
      }

      // Validate role if provided
      if (registerDto.role && !Object.values(UserRole).includes(registerDto.role)) {
        throw new AppError('Invalid role', 400);
      }

      const user = await this.userService.createUser(registerDto);
      const userDto = UserMapper.toResponseDto(user);

      res.status(201).json({
        message: 'User created successfully',
        data: userDto
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message || 'Failed to create user', 400);
    }
  };

  /**
   * GET /api/users/:id - Get user by ID (admin only)
   */
  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid user ID', 400);
      }

      const user = await this.userService.getUserById(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const userDto = UserMapper.toResponseDto(user);
      res.status(200).json({
        data: userDto
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message || 'Failed to get user', 500);
    }
  };

  /**
   * PUT /api/users/:id/role - Update user role (admin only)
   */
  updateUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid user ID', 400);
      }

      const updateRoleDto: UpdateUserRoleDto = req.body;
      if (!updateRoleDto.role || !Object.values(UserRole).includes(updateRoleDto.role)) {
        throw new AppError('Invalid role. Must be one of: admin, manager, employee', 400);
      }

      // Prevent changing own role
      const currentUserId = (req as any).user?.id;
      if (currentUserId === id) {
        throw new AppError('Cannot change your own role', 403);
      }

      const updated = await this.userService.updateUserRole(id, updateRoleDto);
      const userDto = UserMapper.toResponseDto(updated);
      
      res.status(200).json({
        message: 'User role updated successfully',
        data: userDto
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message || 'Failed to update user role', 400);
    }
  };

  /**
   * PUT /api/users/:id/status - Update user status (admin only)
   */
  updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid user ID', 400);
      }

      const updateStatusDto: UpdateUserStatusDto = req.body;
      if (typeof updateStatusDto.isActive !== 'boolean') {
        throw new AppError('isActive must be a boolean', 400);
      }

      // Prevent deactivating own account
      const currentUserId = (req as any).user?.id;
      if (currentUserId === id && !updateStatusDto.isActive) {
        throw new AppError('Cannot deactivate your own account', 403);
      }

      const updated = await this.userService.updateUserStatus(id, updateStatusDto);
      const userDto = UserMapper.toResponseDto(updated);
      
      res.status(200).json({
        message: `User ${updateStatusDto.isActive ? 'activated' : 'deactivated'} successfully`,
        data: userDto
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message || 'Failed to update user status', 400);
    }
  };

  /**
   * DELETE /api/users/:id - Delete user (admin only)
   */
  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid user ID', 400);
      }

      // Prevent deleting own account
      const currentUserId = (req as any).user?.id;
      if (currentUserId === id) {
        throw new AppError('Cannot delete your own account', 403);
      }

      const result = await this.userService.deleteUser(id);
      if (!result) {
        throw new AppError('Failed to delete user', 500);
      }

      res.status(204).send();
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message || 'Failed to delete user', 500);
    }
  };

  /**
   * GET /api/users/role/:role - Get users by role (admin only)
   */
  getUsersByRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { role } = req.params;
      if (!role || !Object.values(UserRole).includes(role as UserRole)) {
        throw new AppError('Invalid role. Must be one of: admin, manager, employee', 400);
      }

      const users = await this.userService.getUsersByRole(role as UserRole);
      const usersDto = UserMapper.toResponseDtoList(users);

      res.status(200).json({
        data: usersDto
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message || 'Failed to get users by role', 500);
    }
  };
}

