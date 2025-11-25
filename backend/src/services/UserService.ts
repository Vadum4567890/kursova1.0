import { User, UserRole } from '../models/User.entity';
import { IUserRepository } from '../core/interfaces/IUserRepository';
import { Logger } from '../utils/Logger';
import { IUserService, UpdateUserStatusData, CreateUserData } from '../core/interfaces/IUserService';

export interface UpdateUserRoleData {
  role: UserRole;
}

export interface UpdateUserData {
  email?: string;
  fullName?: string;
  address?: string;
  password?: string;
}

export class UserService implements IUserService {
  private logger: Logger;

  constructor(private userRepository: IUserRepository) {
    this.logger = Logger.getInstance();
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<User | null> {
    return await this.userRepository.findById(id);
  }

  /**
   * Create a new user (admin only)
   */
  async createUser(data: CreateUserData): Promise<User> {
    // Check if username already exists
    const existingUserByUsername = await this.userRepository.findByUsername(data.username);
    if (existingUserByUsername) {
      throw new Error('Username already exists');
    }

    // Check if email already exists
    const existingUserByEmail = await this.userRepository.findByEmail(data.email);
    if (existingUserByEmail) {
      throw new Error('Email already exists');
    }

    // Hash password
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Create user
    const userData: Partial<User> = {
      username: data.username,
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      address: data.address,
      phone: data.phone,
      role: data.role || UserRole.EMPLOYEE,
      isActive: true
    };

    const user = await this.userRepository.create(userData as User);
    this.logger.log(`User created by admin: ${user.username}`, 'info');
    
    return user;
  }

  /**
   * Update user
   */
  async updateUser(id: number, data: UpdateUserData): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // If password is being updated, hash it
    const updateData: Partial<User> = { ...data };
    if (data.password) {
      const bcrypt = require('bcrypt');
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(data.password, saltRounds);
    }

    return await this.userRepository.update(id, updateData);
  }

  /**
   * Update user role
   */
  async updateUserRole(id: number, data: UpdateUserRoleData): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate role
    if (!Object.values(UserRole).includes(data.role)) {
      throw new Error('Invalid role');
    }

    // Prevent changing own role
    // This check will be done in controller where we have access to current user

    const updated = await this.userRepository.update(id, { role: data.role });
    this.logger.log(`User role updated: ${user.username} -> ${data.role}`, 'info');
    
    return updated;
  }

  /**
   * Update user status (activate/deactivate)
   */
  async updateUserStatus(id: number, data: UpdateUserStatusData): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Prevent deactivating own account
    // This check will be done in controller

    const updated = await this.userRepository.update(id, { isActive: data.isActive });
    this.logger.log(`User status updated: ${user.username} -> ${data.isActive ? 'active' : 'inactive'}`, 'info');
    
    return updated;
  }

  /**
   * Delete user
   */
  async deleteUser(id: number): Promise<boolean> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Prevent deleting own account
    // This check will be done in controller

    const result = await this.userRepository.delete(id);
    if (result) {
      this.logger.log(`User deleted: ${user.username}`, 'info');
    }
    
    return result;
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: UserRole): Promise<User[]> {
    const allUsers = await this.userRepository.findAll();
    return allUsers.filter(user => user.role === role);
  }
}

