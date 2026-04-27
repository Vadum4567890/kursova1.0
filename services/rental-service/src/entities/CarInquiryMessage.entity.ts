import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/** Повідомлення до/після бронювання: тред (авто + орендар), без прив’язки до rental_id. */
@Entity('car_inquiry_messages')
@Index(['carId', 'threadRenterUserId'])
export class CarInquiryMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'car_id' })
  carId!: string;

  /** Сторона орендаря в переписці (для DM з власником). */
  @Column({ type: 'uuid', name: 'thread_renter_user_id' })
  threadRenterUserId!: string;

  @Column({ type: 'uuid', name: 'sender_user_id' })
  senderUserId!: string;

  @Column({ type: 'text' })
  body!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
