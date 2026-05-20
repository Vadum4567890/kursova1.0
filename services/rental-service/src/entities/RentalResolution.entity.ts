import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Rental, RentalLifecycleState, RentalStatus } from './Rental.entity';

export enum RentalResolutionType {
  ADMIN_ACTIVATED = 'admin_activated',
  ADMIN_COMPLETED = 'admin_completed',
  RENTER_NO_SHOW = 'renter_no_show',
  OWNER_NO_SHOW = 'owner_no_show',
  MUTUAL_CANCEL = 'mutual_cancel',
  ADMIN_CANCEL = 'admin_cancel',
  PICKUP_DISPUTE = 'pickup_dispute',
  RETURN_DISPUTE = 'return_dispute',
}

const RENTAL_STATUS_VALUES = ['pending', 'active', 'completed', 'cancelled'];
const RENTAL_LIFECYCLE_STATE_VALUES = [
  'awaiting_owner_approval',
  'awaiting_pickup',
  'pickup_partially_confirmed',
  'pickup_disputed',
  'no_show',
  'active',
  'return_due',
  'return_partially_confirmed',
  'return_disputed',
  'completed',
  'cancelled',
];

@Entity('rental_resolutions')
export class RentalResolution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'rental_id' })
  rentalId: string;

  @ManyToOne(() => Rental, (rental) => rental.resolutions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rental_id' })
  rental: Rental;

  @Column({ type: 'uuid', name: 'actor_user_id' })
  actorUserId: string;

  @Column({ type: 'varchar', length: 32, name: 'actor_role' })
  actorRole: string;

  @Column({ type: 'varchar', length: 64 })
  action: string;

  @Column({
    type: 'enum',
    enum: RentalResolutionType,
    name: 'resolution_type',
  })
  resolutionType: RentalResolutionType;

  @Column({
    type: 'enum',
    enum: RENTAL_STATUS_VALUES,
    enumName: 'rentals_status_enum',
    name: 'previous_status',
  })
  previousStatus: RentalStatus;

  @Column({
    type: 'enum',
    enum: RENTAL_STATUS_VALUES,
    enumName: 'rentals_status_enum',
    name: 'next_status',
  })
  nextStatus: RentalStatus;

  @Column({
    type: 'enum',
    enum: RENTAL_LIFECYCLE_STATE_VALUES,
    enumName: 'rentals_lifecycle_state_enum',
    name: 'previous_lifecycle_state',
  })
  previousLifecycleState: RentalLifecycleState;

  @Column({
    type: 'enum',
    enum: RENTAL_LIFECYCLE_STATE_VALUES,
    enumName: 'rentals_lifecycle_state_enum',
    name: 'next_lifecycle_state',
  })
  nextLifecycleState: RentalLifecycleState;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'penalty_amount' })
  penaltyAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'deposit_refund_amount' })
  depositRefundAmount: number;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
