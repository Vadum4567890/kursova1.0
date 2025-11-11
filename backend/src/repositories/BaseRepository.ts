import { Repository, FindOptionsWhere, ObjectLiteral, DataSource } from 'typeorm';
import { IRepository } from './IRepository';
import { DatabaseConnection } from '../database/DatabaseConnection';

/**
 * Base repository with CRUD operations implementation
 * Uses Repository Pattern for data access abstraction
 */
export abstract class BaseRepository<T extends ObjectLiteral> implements IRepository<T> {
  protected entity: new () => T;
  private _repository: Repository<T> | null = null;

  constructor(entity: new () => T) {
    this.entity = entity;
  }

  protected get repository(): Repository<T> {
    if (!this._repository) {
      const dataSource = DatabaseConnection.getInstance().getDataSource();
      this._repository = dataSource.getRepository(this.entity);
    }
    return this._repository;
  }

  async findAll(): Promise<T[]> {
    return await this.repository.find();
  }

  async findById(id: number): Promise<T | null> {
    return await this.repository.findOne({
      where: { id } as unknown as FindOptionsWhere<T>,
    } as any);
  }

  async create(entity: Partial<T>): Promise<T> {
    const newEntity = this.repository.create(entity as any);
    const saved = await this.repository.save(newEntity);
    // save can return T or T[], ensure we return single entity
    return Array.isArray(saved) ? saved[0] : saved;
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

