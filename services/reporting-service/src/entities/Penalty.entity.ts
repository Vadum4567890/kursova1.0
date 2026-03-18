import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Rental } from './Rental.entity';

@Entity('penalties')
export class Penalty {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Rental, (rental) => rental.penalties, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rental_id' })
  rental!: Rental;

  @Column({ type: 'uuid', name: 'rental_id' })
  rentalId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ type: 'timestamp', name: 'date' })
  date!: Date;

  @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}

