import { User, UserRole } from '../entities/User.entity';
import { UserProfile } from '../entities/UserProfile.entity';
import { UserDocument, DocumentType } from '../entities/UserDocument.entity';
import { UserRating } from '../entities/UserRating.entity';
import { logger } from '../utils/logger';
import { KafkaProducer } from '../kafka/producer';
import { UserRepository } from '../repositories/UserRepository';
import { UserProfileRepository } from '../repositories/UserProfileRepository';
import { UserDocumentRepository } from '../repositories/UserDocumentRepository';
import { UserRatingRepository } from '../repositories/UserRatingRepository';
import crypto from 'crypto';

export interface ClientRecord {
  id: string;
  fullName: string;
  address: string;
  phone: string;
  email: string | null;
  /** Для каталогу пошуку: орендар / орендодавець / обидві ролі */
  role: 'renter' | 'owner' | 'both';
  registrationDate: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientPayload {
  fullName?: string;
  address?: string;
  phone?: string;
  email?: string | null;
}

export interface AdminUserRecord {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  fullName?: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt?: Date;
}

interface PasswordUserPayload {
  username?: string;
  email?: string;
  password?: string;
  role?: UserRole | 'user' | 'manager' | 'employee';
  fullName?: string;
  address?: string;
  phone?: string;
}

function createStatusError(message: string, statusCode: number): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function normalizeRole(role?: PasswordUserPayload['role']): UserRole {
  if (role === UserRole.ADMIN) return UserRole.ADMIN;
  if (role === UserRole.OWNER) return UserRole.OWNER;
  if (role === UserRole.BOTH) return UserRole.BOTH;
  return UserRole.RENTER;
}

export class UserService {
  private userRepository: UserRepository;
  private profileRepository: UserProfileRepository;
  private documentRepository: UserDocumentRepository;
  private ratingRepository: UserRatingRepository;
  private kafkaProducer: KafkaProducer;

  constructor() {
    this.userRepository = new UserRepository();
    this.profileRepository = new UserProfileRepository();
    this.documentRepository = new UserDocumentRepository();
    this.ratingRepository = new UserRatingRepository();
    this.kafkaProducer = new KafkaProducer();
    // Don't connect to Kafka on startup - use lazy connection when needed
  }

  private isClientRole(role?: UserRole): boolean {
    return role === UserRole.RENTER || role === UserRole.BOTH;
  }

  /** У списку «клієнти» / пошук: орендарі та орендодавці (без адміністраторів) */
  private isMarketplaceCustomerRole(role?: UserRole): boolean {
    return (
      role === UserRole.RENTER || role === UserRole.OWNER || role === UserRole.BOTH
    );
  }

  private mapUserRoleToClientRecordRole(role?: UserRole): ClientRecord['role'] {
    if (role === UserRole.OWNER) return 'owner';
    if (role === UserRole.BOTH) return 'both';
    return 'renter';
  }

  private splitFullName(fullName?: string): { firstName: string | null; lastName: string | null } {
    const normalized = String(fullName || '').trim().replace(/\s+/g, ' ');
    if (!normalized) {
      return { firstName: null, lastName: null };
    }

    const [firstName, ...rest] = normalized.split(' ');
    return {
      firstName: firstName || null,
      lastName: rest.length > 0 ? rest.join(' ') : null,
    };
  }

  private toClientRecord(user: User): ClientRecord {
    const firstName = user.profile?.firstName?.trim();
    const lastName = user.profile?.lastName?.trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    return {
      id: user.id,
      fullName: fullName || user.email || `Client ${user.id}`,
      address: user.profile?.address || '',
      phone: user.phone || '',
      email: user.email || null,
      role: this.mapUserRoleToClientRecordRole(user.role),
      registrationDate: user.createdAt?.toISOString() || new Date().toISOString(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  public toAdminUser(user: User): AdminUserRecord {
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
      isActive: true,
      createdAt: user.createdAt,
    };
  }

  async listUsers(role?: string): Promise<AdminUserRecord[]> {
    const users = await this.userRepository.findAll();
    return users
      .map((user) => this.toAdminUser(user))
      .filter((user) => {
        if (!role) return true;
        if (role === 'user' || role === 'renter') {
          return user.role === UserRole.RENTER || user.role === UserRole.BOTH;
        }
        if (role === 'owner') {
          return user.role === UserRole.OWNER || user.role === UserRole.BOTH;
        }
        return user.role === role;
      });
  }

  async createPasswordUser(payload: PasswordUserPayload): Promise<AdminUserRecord> {
    const username = String(payload.username || '').trim().toLowerCase();
    const email = String(payload.email || '').trim().toLowerCase();
    const password = String(payload.password || '');
    const phone = payload.phone ? String(payload.phone).trim() : null;

    if (!username || !email || !password) {
      throw createStatusError('username, email and password are required', 400);
    }
    if (password.length < 6) {
      throw createStatusError('Password must be at least 6 characters', 400);
    }
    if (await this.userRepository.findByEmail(email)) {
      throw createStatusError('User already exists', 409);
    }
    if (await this.userRepository.findByUsername(username)) {
      throw createStatusError('Username already exists', 409);
    }
    if (phone && await this.userRepository.findByPhone(phone)) {
      throw createStatusError('Phone already exists', 409);
    }

    const user = await this.createUser({
      username,
      email,
      phone,
      role: normalizeRole(payload.role),
      passwordHash: hashPassword(password),
    });

    if (payload.fullName || payload.address) {
      const { firstName, lastName } = this.splitFullName(payload.fullName);
      await this.updateUserProfile(user.id, {
        firstName,
        lastName,
        address: payload.address ? String(payload.address).trim() : null,
      });
    }

    const saved = await this.userRepository.findById(user.id);
    if (!saved) {
      throw createStatusError('User was created but could not be loaded', 500);
    }
    return this.toAdminUser(saved);
  }

  async updateUserRole(userId: string, role: UserRole): Promise<AdminUserRecord | null> {
    const updated = await this.updateUser(userId, { role });
    return updated ? this.toAdminUser(updated) : null;
  }

  async deleteUser(userId: string): Promise<boolean> {
    return await this.userRepository.delete(userId);
  }

  private buildClientEmail(phone: string, email?: string | null): string {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (normalizedEmail) {
      return normalizedEmail;
    }

    const phoneKey = phone.replace(/\D+/g, '') || Date.now().toString();
    return `client+${phoneKey}@local.user-service`;
  }

  async listClients(searchQuery?: string): Promise<ClientRecord[]> {
    try {
      const users = await this.userRepository.findAll();
      const normalizedQuery = String(searchQuery || '').trim().toLowerCase();
      const clients = users
        .filter((user) => this.isMarketplaceCustomerRole(user.role))
        .map((user) => this.toClientRecord(user));

      if (!normalizedQuery) {
        return clients;
      }

      const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

      return clients.filter((client) => {
        const fields = [
          String(client.id ?? ''),
          client.fullName ?? '',
          client.phone ?? '',
          client.email ?? '',
          client.address ?? '',
        ].map((v) => String(v).toLowerCase());

        const phoneDigits = String(client.phone ?? '').replace(/\D/g, '');

        return tokens.every((token) => {
          if (fields.some((f) => f.includes(token))) {
            return true;
          }
          const td = token.replace(/\D/g, '');
          if (td.length >= 2 && phoneDigits.includes(td)) {
            return true;
          }
          return false;
        });
      });
    } catch (error) {
      logger.error('Error listing clients:', error);
      throw error;
    }
  }

  async getClientById(userId: string): Promise<ClientRecord | null> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user || !this.isMarketplaceCustomerRole(user.role)) {
        return null;
      }
      return this.toClientRecord(user);
    } catch (error) {
      logger.error('Error getting client by ID:', error);
      throw error;
    }
  }

  async getClientByPhone(phone: string): Promise<ClientRecord | null> {
    try {
      const user = await this.userRepository.findByPhone(phone);
      if (!user || !this.isMarketplaceCustomerRole(user.role)) {
        return null;
      }
      return this.toClientRecord(user);
    } catch (error) {
      logger.error('Error getting client by phone:', error);
      throw error;
    }
  }

  async createClient(payload: ClientPayload): Promise<ClientRecord> {
    return this.registerOrGetClient(payload, false);
  }

  async registerOrGetClient(payload: ClientPayload, allowExisting = true): Promise<ClientRecord> {
    try {
      const phone = String(payload.phone || '').trim();
      const fullName = String(payload.fullName || '').trim();
      const address = String(payload.address || '').trim();

      if (!phone) {
        throw createStatusError('phone is required', 400);
      }

      const existing = await this.userRepository.findByPhone(phone);
      if (existing && this.isClientRole(existing.role)) {
        if (allowExisting) {
          return this.toClientRecord(existing);
        }
        throw createStatusError('Client already exists', 409);
      }

      if (!fullName || !address) {
        throw createStatusError('fullName and address are required for new client', 400);
      }

      const email = this.buildClientEmail(phone, payload.email);
      const { firstName, lastName } = this.splitFullName(fullName);
      const createdUser = await this.createUser({
        email,
        phone,
        role: UserRole.RENTER,
      });

      await this.updateUserProfile(createdUser.id, {
        firstName,
        lastName,
        address,
      });

      const saved = await this.userRepository.findById(createdUser.id);
      if (!saved) {
        throw createStatusError('Client was created but could not be loaded', 500);
      }

      return this.toClientRecord(saved);
    } catch (error) {
      logger.error('Error creating/registering client:', error);
      throw error;
    }
  }

  async updateClient(userId: string, payload: ClientPayload): Promise<ClientRecord | null> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user || !this.isClientRole(user.role)) {
        return null;
      }

      const userUpdate: Partial<User> = {};
      if (payload.phone !== undefined) {
        userUpdate.phone = payload.phone ? String(payload.phone).trim() : null;
      }
      if (payload.email !== undefined) {
        userUpdate.email = this.buildClientEmail(userUpdate.phone || user.phone || '', payload.email);
      }
      if (Object.keys(userUpdate).length > 0) {
        await this.updateUser(userId, userUpdate);
      }

      const profileUpdate: Partial<UserProfile> = {};
      if (payload.fullName !== undefined) {
        const { firstName, lastName } = this.splitFullName(payload.fullName);
        profileUpdate.firstName = firstName;
        profileUpdate.lastName = lastName;
      }
      if (payload.address !== undefined) {
        profileUpdate.address = payload.address ? String(payload.address).trim() : null;
      }
      if (Object.keys(profileUpdate).length > 0) {
        await this.updateUserProfile(userId, profileUpdate);
      }

      return await this.getClientById(userId);
    } catch (error) {
      logger.error('Error updating client:', error);
      throw error;
    }
  }

  async deleteClient(userId: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user || !this.isClientRole(user.role)) {
        return false;
      }
      return await this.userRepository.delete(userId);
    } catch (error) {
      logger.error('Error deleting client:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      return await this.userRepository.findById(userId);
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findByEmail(email);
    } catch (error) {
      logger.error('Error getting user by email:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      return await this.userRepository.findByUsername(username);
    } catch (error) {
      logger.error('Error getting user by username:', error);
      throw error;
    }
  }

  async createUser(userData: Partial<User>): Promise<User> {
    try {
      const savedUser = await this.userRepository.create(userData);

      // Create default profile
      await this.profileRepository.create({ userId: savedUser.id });

      // Create default rating
      await this.ratingRepository.create({ userId: savedUser.id });

      // Publish event
      await this.kafkaProducer.send('user.created', {
        userId: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
        timestamp: new Date().toISOString(),
      });

      logger.info(`User created: ${savedUser.id}`);
      return savedUser;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updateData: Partial<User>): Promise<User> {
    try {
      const updatedUser = await this.userRepository.update(userId, updateData);

      if (!updatedUser) {
        throw new Error('User not found');
      }

      // Publish event
      await this.kafkaProducer.send('user.updated', {
        userId: updatedUser.id,
        updatedFields: Object.keys(updateData),
        timestamp: new Date().toISOString(),
      });

      logger.info(`User updated: ${userId}`);
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      return await this.profileRepository.findByUserId(userId);
    } catch (error) {
      logger.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      let profile = await this.profileRepository.findByUserId(userId);

      if (!profile) {
        profile = await this.profileRepository.create({ userId, ...profileData });
      } else {
        profile = await this.profileRepository.update(userId, profileData);
        if (!profile) {
          throw new Error('Failed to update profile');
        }
      }

      return profile;
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  async createDocument(userId: string, documentData: {
    docType: DocumentType;
    docNumber?: string;
    docImageUrl?: string;
  }): Promise<UserDocument> {
    try {
      const document = await this.documentRepository.create({
        userId,
        ...documentData,
      });

      logger.info(`Document created for user: ${userId}`);
      return document;
    } catch (error) {
      logger.error('Error creating document:', error);
      throw error;
    }
  }

  async getUserDocuments(userId: string): Promise<UserDocument[]> {
    try {
      return await this.documentRepository.findByUserId(userId);
    } catch (error) {
      logger.error('Error getting user documents:', error);
      throw error;
    }
  }

  async getDocumentById(documentId: string): Promise<UserDocument | null> {
    try {
      return await this.documentRepository.findById(documentId);
    } catch (error) {
      logger.error('Error getting document by ID:', error);
      throw error;
    }
  }

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    try {
      const document = await this.documentRepository.findById(documentId);

      if (!document || document.userId !== userId) {
        throw new Error('Document not found');
      }

      const deleted = await this.documentRepository.delete(documentId);
      if (!deleted) {
        throw new Error('Failed to delete document');
      }

      logger.info(`Document deleted: ${documentId}`);
    } catch (error) {
      logger.error('Error deleting document:', error);
      throw error;
    }
  }

  async getUserRating(userId: string): Promise<UserRating | null> {
    try {
      const existing = await this.ratingRepository.findByUserId(userId);
      if (existing) {
        return existing;
      }
      return await this.ratingRepository.create({ userId });
    } catch (error) {
      logger.error('Error getting user rating:', error);
      throw error;
    }
  }

  async incrementCompletedRentals(userId: string): Promise<UserRating | null> {
    try {
      return await this.ratingRepository.incrementCompletedRentals(userId);
    } catch (error) {
      logger.error('Error incrementing completed rentals:', error);
      throw error;
    }
  }

  async applyPublishedReviewAggregate(
    userId: string,
    payload: {
      role: 'owner' | 'renter';
      overallScore: number;
      categories: Record<string, number>;
    }
  ): Promise<UserRating | null> {
    try {
      return await this.ratingRepository.applyPublishedReviewAggregate(userId, payload);
    } catch (error) {
      logger.error('Error applying published review aggregate:', error);
      throw error;
    }
  }

  async verifyDiia(userId: string, diiaData: any): Promise<any> {
    try {
      // TODO: Implement Дія API integration
      // For now, return mock response
      logger.info(`Дія verification requested for user: ${userId}`);

      // Update user verification status
      await this.updateUser(userId, {
        verifiedStatus: 'verified' as any,
        emailVerified: true,
      });

      // Publish event
      await this.kafkaProducer.send('user.verified', {
        userId,
        verificationType: 'diia',
        timestamp: new Date().toISOString(),
      });

      return {
        verified: true,
        message: 'User verified via Дія API',
      };
    } catch (error) {
      logger.error('Error verifying via Дія:', error);
      throw error;
    }
  }
}

