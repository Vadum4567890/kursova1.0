import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User.entity';
import { UserRepository } from '../repositories/UserRepository';
import { ConfigManager } from '../config/ConfigManager';
import { Logger } from '../utils/Logger';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role?: UserRole;
}

export interface LoginData {
  usernameOrEmail: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    fullName?: string;
  };
  token: string;
}

export class AuthService {
  private userRepository: UserRepository;
  private config: ConfigManager;
  private logger: Logger;

  constructor() {
    this.userRepository = new UserRepository();
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
      role: data.role || UserRole.EMPLOYEE,
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
        fullName: user.fullName
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
        fullName: user.fullName
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
}

