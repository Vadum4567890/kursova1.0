import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Rental } from './Rental.entity';

@Entity('penalties')
export class Penalty {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Rental, (rental) => rental.penalties)
  @JoinColumn({ name: 'rental_id' })
  rental: Rental;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  reason: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

