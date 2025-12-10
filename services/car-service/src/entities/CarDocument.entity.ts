import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Car } from './Car.entity';

export enum DocumentType {
  REGISTRATION = 'registration',
  INSURANCE = 'insurance',
  INSPECTION = 'inspection',
  OTHER = 'other',
}

@Entity('car_documents')
export class CarDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'car_id' })
  carId: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    name: 'doc_type',
  })
  docType: DocumentType;

  @Column({ type: 'text', name: 'doc_url' })
  docUrl: string;

  @Column({ type: 'date', nullable: true, name: 'expiry_date' })
  expiryDate: Date | null;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Car, (car) => car.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'car_id' })
  car: Car;
}

