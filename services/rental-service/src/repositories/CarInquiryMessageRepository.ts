import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { CarInquiryMessage } from '../entities/CarInquiryMessage.entity';

export class CarInquiryMessageRepository {
  private repository: Repository<CarInquiryMessage>;

  constructor() {
    this.repository = AppDataSource.getRepository(CarInquiryMessage);
  }

  async create(data: Partial<CarInquiryMessage>): Promise<CarInquiryMessage> {
    const row = this.repository.create(data);
    return this.repository.save(row);
  }

  async findByThread(carId: string, threadRenterUserId: string): Promise<CarInquiryMessage[]> {
    return this.repository.find({
      where: { carId, threadRenterUserId },
      order: { createdAt: 'ASC' },
    });
  }

  /** Останнє повідомлення по кожному треду (орендар), для вибору діалогу власником. */
  async listLatestPerThread(carId: string): Promise<CarInquiryMessage[]> {
    return this.repository
      .createQueryBuilder('m')
      .distinctOn(['m.threadRenterUserId'])
      .where('m.carId = :carId', { carId })
      .orderBy('m.threadRenterUserId', 'ASC')
      .addOrderBy('m.createdAt', 'DESC')
      .getMany();
  }

  /** Унікальні авто, де є inquiry-повідомлення (для хабу чатів без залежності від GET /cars/owner). */
  async findDistinctCarIdsWithMessages(): Promise<string[]> {
    const raw = await this.repository.query(
      `SELECT DISTINCT car_id AS "carId" FROM car_inquiry_messages`
    );
    return (raw as { carId: string }[]).map((r) => r.carId).filter(Boolean);
  }

  /** Унікальні авто, де орендар веде тред (thread = свій user id). */
  async findDistinctCarIdsForRenterThread(renterUserId: string): Promise<string[]> {
    const raw = await this.repository.query(
      `SELECT DISTINCT car_id AS "carId" FROM car_inquiry_messages WHERE thread_renter_user_id = $1`,
      [renterUserId]
    );
    return (raw as { carId: string }[]).map((r) => r.carId).filter(Boolean);
  }

  /** Повідомлення від іншої сторони після lastRead. */
  async countIncomingAfter(
    carId: string,
    threadRenterUserId: string,
    viewerUserId: string,
    after: Date
  ): Promise<number> {
    return this.repository
      .createQueryBuilder('m')
      .where('m.carId = :carId', { carId })
      .andWhere('m.threadRenterUserId = :tid', { tid: threadRenterUserId })
      .andWhere('LOWER(CAST(m.senderUserId AS text)) != LOWER(:uid)', { uid: viewerUserId })
      .andWhere('m.createdAt > :after', { after })
      .getCount();
  }
}
