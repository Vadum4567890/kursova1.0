import { User } from '../entities/User.entity';
import { UserProfile } from '../entities/UserProfile.entity';
import { UserDocument, DocumentType } from '../entities/UserDocument.entity';
import { UserRating } from '../entities/UserRating.entity';
import { logger } from '../utils/logger';
import { KafkaProducer } from '../kafka/producer';
import { UserRepository } from '../repositories/UserRepository';
import { UserProfileRepository } from '../repositories/UserProfileRepository';
import { UserDocumentRepository } from '../repositories/UserDocumentRepository';
import { UserRatingRepository } from '../repositories/UserRatingRepository';

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
      return await this.ratingRepository.findByUserId(userId);
    } catch (error) {
      logger.error('Error getting user rating:', error);
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

