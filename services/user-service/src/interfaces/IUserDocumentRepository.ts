import { UserDocument, DocumentType } from '../entities/UserDocument.entity';

export interface IUserDocumentRepository {
  findById(id: string): Promise<UserDocument | null>;
  findByUserId(userId: string): Promise<UserDocument[]>;
  findByUserIdAndType(userId: string, docType: DocumentType): Promise<UserDocument[]>;
  create(documentData: Partial<UserDocument>): Promise<UserDocument>;
  update(id: string, documentData: Partial<UserDocument>): Promise<UserDocument | null>;
  delete(id: string): Promise<boolean>;
  findVerifiedByUserId(userId: string): Promise<UserDocument[]>;
}

