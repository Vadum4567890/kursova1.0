import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Client } from './Client.entity';
import { Car } from './Car.entity';
import { Penalty } from './Penalty.entity';

export enum RentalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('rentals')
export class Rental {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Client, (client) => client.rentals)
  @JoinColumn({ name: 'client_id' })
  client!: Client;

  @ManyToOne(() => Car, (car) => car.rentals)
  @JoinColumn({ name: 'car_id' })
  car!: Car;

  @Column({ type: 'timestamp' })
  startDate!: Date;

  @Column({ type: 'timestamp' })
  expectedEndDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualEndDate?: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  depositAmount!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalCost!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  penaltyAmount!: number;

  @Column({
    type: 'enum',
    enum: RentalStatus,
    default: RentalStatus.ACTIVE,
  })
  status!: RentalStatus;

  @OneToMany(() => Penalty, (penalty) => penalty.rental)
  penalties!: Penalty[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}

