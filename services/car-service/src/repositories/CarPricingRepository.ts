import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { CarPricing } from '../entities/CarPricing.entity';

export class CarPricingRepository {
  private repository: Repository<CarPricing>;

  constructor() {
    this.repository = AppDataSource.getRepository(CarPricing);
  }

  async create(pricingData: Partial<CarPricing>): Promise<CarPricing> {
    const pricing = this.repository.create(pricingData);
    return await this.repository.save(pricing);
  }

  async findByCarId(carId: string): Promise<CarPricing | null> {
    return await this.repository.findOne({
      where: { carId },
    });
  }

  async update(carId: string, pricingData: Partial<CarPricing>): Promise<CarPricing> {
    await this.repository.update(carId, pricingData);
    const updated = await this.findByCarId(carId);
    if (!updated) {
      throw new Error('Pricing not found after update');
    }
    return updated;
  }

  async delete(carId: string): Promise<void> {
    await this.repository.delete(carId);
  }
}

