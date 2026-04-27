import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.entity';

export enum DocumentType {
  PASSPORT = 'passport',
  DRIVING_LICENSE = 'driving_license',
  TAX_ID = 'tax_id',
  OTHER = 'other',
}

@Entity('user_documents')
export class UserDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  docType: DocumentType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  docNumber: string | null;

  @Column({ type: 'text', nullable: true })
  docImageUrl: string | null;

  @Column({ default: false })
  verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  verifiedBy: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

