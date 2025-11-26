import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User.entity';
import { IUserRepository } from '../core/interfaces/IUserRepository';
import { ConfigManager } from '../config/ConfigManager';
import { Logger } from '../utils/Logger';
import { IAuthService, AuthResponse } from '../core/interfaces/IAuthService';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  address?: string;
  role?: UserRole;
}

export interface LoginData {
  usernameOrEmail: string;
  password: string;
}

export class AuthService implements IAuthService {
  private config: ConfigManager;
  private logger: Logger;

  constructor(private userRepository: IUserRepository) {
    this.config = ConfigManager.getInstance();
    this.logger = Logger.getInstance();
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
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
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Create user
    const userData: Partial<User> = {
      username: data.username,
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      address: data.address,
      role: data.role || UserRole.USER,
      isActive: true
    };

    const user = await this.userRepository.create(userData as User);
    this.logger.log(`User registered: ${user.username}`, 'info');

    // Generate token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        address: user.address
      },
      token
    };
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    // Find user by username or email
    const user = await this.userRepository.findByUsernameOrEmail(data.usernameOrEmail);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    this.logger.log(`User logged in: ${user.username}`, 'info');

    // Generate token
    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        address: user.address
      },
      token
    };
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: User): string {
    const jwtConfig = this.config.getJwtConfig();
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      const jwtConfig = this.config.getJwtConfig();
      return jwt.verify(token, jwtConfig.secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<User | null> {
    return await this.userRepository.findById(id);
  }

  /**
   * Update user profile (email, fullName, address, phone)
   */
  async updateProfile(userId: number, data: { email?: string; fullName?: string; address?: string; phone?: string }): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (data.email && data.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email already exists');
      }
    }

    const updateData: Partial<User> = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;

    const updated = await this.userRepository.update(userId, updateData);
    this.logger.log(`User profile updated: ${user.username}`, 'info');
    
    return updated;
  }

  /**
   * Change user password
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.userRepository.update(userId, { password: hashedPassword });
    this.logger.log(`User password changed: ${user.username}`, 'info');
  }
}

