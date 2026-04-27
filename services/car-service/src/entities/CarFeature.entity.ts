import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Car } from './Car.entity';

@Entity('car_features')
@Unique(['carId', 'featureName'])
export class CarFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'car_id' })
  carId: string;

  @Column({ type: 'varchar', length: 100, name: 'feature_name' })
  featureName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Car, (car) => car.features, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'car_id' })
  car: Car;
}

