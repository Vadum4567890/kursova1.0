import { Repository, FindOptionsWhere } from 'typeorm';
import { IRepository } from './IRepository';
import { DatabaseConnection } from '../database/DatabaseConnection';

/**
 * Base repository with CRUD operations implementation
 * Uses Repository Pattern for data access abstraction
 */
export abstract class BaseRepository<T> implements IRepository<T> {
  protected repository: Repository<T>;

  constructor(entity: new () => T) {
    const dataSource = DatabaseConnection.getInstance().getDataSource();
    this.repository = dataSource.getRepository(entity);
  }

  async findAll(): Promise<T[]> {
    return await this.repository.find();
  }

  async findById(id: number): Promise<T | null> {
    return await this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
    } as any);
  }

  async create(entity: Partial<T>): Promise<T> {
    const newEntity = this.repository.create(entity as any);
    return await this.repository.save(newEntity);
  }

  async update(id: number, entity: Partial<T>): Promise<T> {
    await this.repository.update(id, entity as any);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Entity with id ${id} not found`);
    }
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}

