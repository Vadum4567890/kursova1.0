import 'reflect-metadata';
import { newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import { Client } from '../src/entities/Client.entity';

describe('client-service integration (pg-mem)', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    const db = newDb({ autoCreateForeignKeyIndices: true });
    db.public.registerFunction({ name: 'current_database', returns: 'text' as any, implementation: () => 'pg_mem' });
    db.public.registerFunction({ name: 'version', returns: 'text' as any, implementation: () => 'pg_mem 1.0' });

    dataSource = await db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [Client],
      synchronize: true,
    });

    await dataSource.initialize();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('persists and loads a client record', async () => {
    const repo = dataSource.getRepository(Client);

    const saved = await repo.save(
      repo.create({
        fullName: 'Alice Integration',
        address: 'Kyiv',
        phone: '+380111111111',
        email: 'alice@example.com',
        registrationDate: new Date('2026-01-01'),
      })
    );

    const loaded = await repo.findOne({ where: { id: saved.id } });

    expect(loaded).toEqual(
      expect.objectContaining({
        fullName: 'Alice Integration',
        address: 'Kyiv',
        phone: '+380111111111',
        email: 'alice@example.com',
      })
    );
  });
});
