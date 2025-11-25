import { User, UserRole } from '../models/User.entity';
import { UserRepository } from '../repositories/UserRepository';
import { Logger } from '../utils/Logger';

export interface UpdateUserRoleData {
  role: UserRole;
}

export interface UpdateUserStatusData {
  isActive: boolean;
}

export class UserService {
  private userRepository: UserRepository;
  private logger: Logger;

  constructor() {
    this.userRepository = new UserRepository();
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

