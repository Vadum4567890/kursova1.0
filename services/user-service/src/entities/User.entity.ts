import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { UserProfile } from './UserProfile.entity';
import { UserDocument } from './UserDocument.entity';
import { UserRating } from './UserRating.entity';

export enum UserRole {
  RENTER = 'renter',
  OWNER = 'owner',
  BOTH = 'both',
  ADMIN = 'admin',
}

export enum VerifiedStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('user_accounts')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.RENTER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: VerifiedStatus,
    default: VerifiedStatus.PENDING,
  })
  verifiedStatus: VerifiedStatus;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ default: false })
  phoneVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
  profile: UserProfile;

  @OneToMany(() => UserDocument, (document) => document.user, { cascade: true })
  documents: UserDocument[];

  @OneToOne(() => UserRating, (rating) => rating.user, { cascade: true })
  rating: UserRating;
}

