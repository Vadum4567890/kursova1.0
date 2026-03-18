import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Rental } from './Rental.entity';

@Entity('penalties')
export class Penalty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'rental_id' })
  rentalId: string;

  @ManyToOne(() => Rental, (rental) => rental.penalties, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rental_id' })
  rental: Rental;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 500 })
  reason: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
