import { AuthService, RegisterData, LoginData } from '../../services/AuthService';
import { User, UserRole } from '../../models/User.entity';
import { IUserRepository } from '../../core/interfaces/IUserRepository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

const mockConfig = {
  getJwtConfig: jest.fn().mockReturnValue({ secret: 'test-secret-key' }),
  get: jest.fn().mockReturnValue('test-secret-key'),
};

jest.mock('../../config/ConfigManager', () => {
  const mockConfig = {
    getJwtConfig: jest.fn().mockReturnValue({ secret: 'test-secret-key' }),
    get: jest.fn().mockReturnValue('test-secret-key'),
  };
  return {
    ConfigManager: {
      getInstance: jest.fn().mockReturnValue(mockConfig),
    },
  };
});

jest.mock('../../utils/Logger', () => {
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  };
  return {
    Logger: {
      getInstance: jest.fn().mockReturnValue(mockLogger),
    },
  };
});

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  const createMockUser = (overrides?: Partial<User>): User => ({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: UserRole.USER,
    fullName: 'Test User',
    address: 'Test Address',
    phone: '+380123456789',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User);

  beforeEach(() => {
    mockUserRepository = {
      findByUsername: jest.fn(),
      findByEmail: jest.fn(),
      findByUsernameOrEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      getRepository: jest.fn(),
    } as any;

    authService = new AuthService(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData: RegisterData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
      };

      const hashedPassword = 'hashedpassword123';
      const mockUser = createMockUser({
        username: registerData.username,
        email: registerData.email,
        password: hashedPassword,
        fullName: registerData.fullName,
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await authService.register(registerData);

      expect(result.user.username).toBe(registerData.username);
      expect(result.user.email).toBe(registerData.email);
      expect(result.token).toBe('mock-token');
      expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw error if username already exists', async () => {
      const registerData: RegisterData = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password123',
      };

      const existingUser = createMockUser({ username: 'existinguser' });
      mockUserRepository.findByUsername.mockResolvedValue(existingUser);

      await expect(authService.register(registerData)).rejects.toThrow('Username already exists');
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      const registerData: RegisterData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
      };

      mockUserRepository.findByUsername.mockResolvedValue(null);
      const existingUser = createMockUser({ email: 'existing@example.com' });
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(authService.register(registerData)).rejects.toThrow('Email already exists');
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should set default role to USER if not provided', async () => {
      const registerData: RegisterData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const hashedPassword = 'hashedpassword123';
      const mockUser = createMockUser({
        username: registerData.username,
        email: registerData.email,
        password: hashedPassword,
        role: UserRole.USER,
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await authService.register(registerData);

      expect(result.user.role).toBe(UserRole.USER);
    });

    it('should allow setting custom role', async () => {
      const registerData: RegisterData = {
        username: 'adminuser',
        email: 'admin@example.com',
        password: 'password123',
        role: UserRole.ADMIN,
      };

      const hashedPassword = 'hashedpassword123';
      const mockUser = createMockUser({
        username: registerData.username,
        email: registerData.email,
        password: hashedPassword,
        role: UserRole.ADMIN,
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await authService.register(registerData);

      expect(result.user.role).toBe(UserRole.ADMIN);
    });
  });

  describe('login', () => {
    it('should login user with username successfully', async () => {
      const loginData: LoginData = {
        usernameOrEmail: 'testuser',
        password: 'password123',
      };

      const mockUser = createMockUser({
        username: 'testuser',
        password: 'hashedpassword',
      });

      mockUserRepository.findByUsernameOrEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await authService.login(loginData);

      expect(result.user.username).toBe('testuser');
      expect(result.token).toBe('mock-token');
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
    });

    it('should login user with email successfully', async () => {
      const loginData: LoginData = {
        usernameOrEmail: 'test@example.com',
        password: 'password123',
      };

      const mockUser = createMockUser({
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      mockUserRepository.findByUsernameOrEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await authService.login(loginData);

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBe('mock-token');
    });

    it('should throw error if user not found', async () => {
      const loginData: LoginData = {
        usernameOrEmail: 'nonexistent',
        password: 'password123',
      };

      mockUserRepository.findByUsernameOrEmail.mockResolvedValue(null);

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if password is incorrect', async () => {
      const loginData: LoginData = {
        usernameOrEmail: 'testuser',
        password: 'wrongpassword',
      };

      const mockUser = createMockUser({
        username: 'testuser',
        password: 'hashedpassword',
      });

      mockUserRepository.findByUsernameOrEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if user is inactive', async () => {
      const loginData: LoginData = {
        usernameOrEmail: 'testuser',
        password: 'password123',
      };

      const mockUser = createMockUser({
        username: 'testuser',
        password: 'hashedpassword',
        isActive: false,
      });

      mockUserRepository.findByUsernameOrEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(authService.login(loginData)).rejects.toThrow('User account is deactivated');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token and return decoded data', () => {
      const token = 'valid-token';
      const decoded = { id: 1, username: 'testuser' };

      (jwt.verify as jest.Mock).mockReturnValue(decoded);

      const result = authService.verifyToken(token);

      expect(result).toEqual(decoded);
      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret-key');
    });

    it('should throw error for invalid token', () => {
      const token = 'invalid-token';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => authService.verifyToken(token)).toThrow('Invalid or expired token');
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser = createMockUser();
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await authService.getUserById(1);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await authService.getUserById(999);

      expect(result).toBeNull();
    });
  });
});

