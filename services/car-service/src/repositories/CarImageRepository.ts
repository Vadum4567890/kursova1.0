import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { CarImage } from '../entities/CarImage.entity';

export class CarImageRepository {
  private repository: Repository<CarImage>;

  constructor() {
    this.repository = AppDataSource.getRepository(CarImage);
  }

  async create(imageData: Partial<CarImage>): Promise<CarImage> {
    const image = this.repository.create(imageData);
    return await this.repository.save(image);
  }

  async findByCarId(carId: string): Promise<CarImage[]> {
    return await this.repository.find({
      where: { carId },
      order: { displayOrder: 'ASC', isPrimary: 'DESC' },
    });
  }

  async findById(id: string): Promise<CarImage | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }

  async update(id: string, imageData: Partial<CarImage>): Promise<CarImage> {
    await this.repository.update(id, imageData);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Image not found after update');
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async setPrimary(carId: string, imageId: string): Promise<void> {
    // Unset all primary images for this car
    await this.repository.update(
      { carId, isPrimary: true },
      { isPrimary: false }
    );
    // Set the new primary image
    await this.repository.update(imageId, { isPrimary: true });
  }
}

