import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { DocumentType } from '../entities/UserDocument.entity';

export class CreateDocumentDto {
  @IsEnum(DocumentType)
  docType!: DocumentType;

  @IsOptional()
  @IsString()
  docNumber?: string;

  @IsOptional()
  @IsString()
  docImageUrl?: string;
}

