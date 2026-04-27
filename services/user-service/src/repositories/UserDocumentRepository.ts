import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { UserDocument, DocumentType } from '../entities/UserDocument.entity';
import { IUserDocumentRepository } from '../interfaces/IUserDocumentRepository';

export class UserDocumentRepository implements IUserDocumentRepository {
  private repository: Repository<UserDocument>;

  constructor() {
    this.repository = AppDataSource.getRepository(UserDocument);
  }

  async findById(id: string): Promise<UserDocument | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByUserId(userId: string): Promise<UserDocument[]> {
    return await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserIdAndType(userId: string, docType: DocumentType): Promise<UserDocument[]> {
    return await this.repository.find({
      where: { userId, docType },
      order: { createdAt: 'DESC' },
    });
  }

  async create(documentData: Partial<UserDocument>): Promise<UserDocument> {
    const document = this.repository.create(documentData);
    return await this.repository.save(document);
  }

  async update(id: string, documentData: Partial<UserDocument>): Promise<UserDocument | null> {
    await this.repository.update(id, documentData);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async findVerifiedByUserId(userId: string): Promise<UserDocument[]> {
    return await this.repository.find({
      where: { userId, verified: true },
      order: { createdAt: 'DESC' },
    });
  }
}

