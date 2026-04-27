import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { ChatReadCursor } from '../entities/ChatReadCursor.entity';

export class ChatReadCursorRepository {
  private repository: Repository<ChatReadCursor>;

  constructor() {
    this.repository = AppDataSource.getRepository(ChatReadCursor);
  }

  async findByUserId(userId: string): Promise<ChatReadCursor[]> {
    return this.repository.find({ where: { userId } });
  }

  async upsert(userId: string, conversationKey: string, lastReadAt: Date): Promise<void> {
    await this.repository.save({
      userId,
      conversationKey,
      lastReadAt,
    });
  }
}
