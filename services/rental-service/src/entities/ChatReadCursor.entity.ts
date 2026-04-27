import { Entity, Column, PrimaryColumn } from 'typeorm';

/** Коли користувач востаннє «бачив» діалог (для непрочитаних). */
@Entity('chat_read_cursors')
export class ChatReadCursor {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @PrimaryColumn('varchar', { length: 512, name: 'conversation_key' })
  conversationKey!: string;

  @Column({ type: 'timestamptz', name: 'last_read_at' })
  lastReadAt!: Date;
}
