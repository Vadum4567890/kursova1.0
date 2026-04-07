import 'reflect-metadata';
import { newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../src/database/data-source';
import { Penalty } from '../src/entities/Penalty.entity';
import { Rental, RentalStatus } from '../src/entities/Rental.entity';
import { PenaltyService } from '../src/services/PenaltyService';
import { ReportService } from '../src/services/ReportService';
import { AnalyticsService } from '../src/services/AnalyticsService';

function makeUuid(seed: string): string {
  const clean = seed.replace(/[^a-f0-9]/gi, '').padEnd(32, '0').slice(0, 32).toLowerCase();
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-4${clean.slice(13, 16)}-8${clean.slice(17, 20)}-${clean.slice(20, 32)}`;
}

describe('reporting-service integration (pg-mem)', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    const db = newDb({ autoCreateForeignKeyIndices: true });
    db.public.registerFunction({ name: 'current_database', returns: 'text' as any, implementation: () => 'pg_mem' });
    db.public.registerFunction({ name: 'version', returns: 'text' as any, implementation: () => 'pg_mem 1.0' });
    db.public.registerFunction({ name: 'uuid_generate_v4', returns: 'uuid' as any, implementation: () => makeUuid(`${Date.now()}${Math.random()}`) });

    dataSource = await db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [Rental, Penalty],
      synchronize: true,
    });

    await dataSource.initialize();

    jest.spyOn(AppDataSource, 'getRepository').mockImplementation(((entity: any) =>
      dataSource.getRepository(entity)) as any);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM penalties');
    await dataSource.query('DELETE FROM rentals');
  });

  it('creates a penalty and updates rental penalty total', async () => {
    const rentalRepo = dataSource.getRepository(Rental);
    const rental = await rentalRepo.save(
      rentalRepo.create({
        carId: '11111111-1111-4111-8111-111111111111',
        renterUserId: '22222222-2222-4222-8222-222222222222',
        startDate: new Date('2026-01-10T00:00:00.000Z'),
        expectedEndDate: new Date('2026-01-12T00:00:00.000Z'),
        actualEndDate: new Date('2026-01-12T00:00:00.000Z'),
        depositAmount: 300,
        totalCost: 500,
        penaltyAmount: 0,
        status: RentalStatus.COMPLETED,
      })
    );

    const service = new PenaltyService();
    const created = await service.createPenalty(rental.id, 150, 'Late return');
    const updatedRental = await rentalRepo.findOneByOrFail({ id: rental.id });

    expect(created.amount).toBe(150);
    expect(updatedRental.penaltyAmount).toBe(150);
  });

  it('builds financial report from persisted rentals', async () => {
    const rentalRepo = dataSource.getRepository(Rental);

    await rentalRepo.save([
      rentalRepo.create({
        id: '77777777-7777-4777-8777-777777777777',
        carId: '33333333-3333-4333-8333-333333333333',
        renterUserId: '44444444-4444-4444-8444-444444444444',
        startDate: new Date('2026-02-01T00:00:00.000Z'),
        expectedEndDate: new Date('2026-02-03T00:00:00.000Z'),
        actualEndDate: new Date('2026-02-03T00:00:00.000Z'),
        depositAmount: 200,
        totalCost: 600,
        penaltyAmount: 50,
        status: RentalStatus.COMPLETED,
      }),
      rentalRepo.create({
        id: '88888888-8888-4888-8888-888888888888',
        carId: '55555555-5555-4555-8555-555555555555',
        renterUserId: '66666666-6666-4666-8666-666666666666',
        startDate: new Date('2026-02-05T00:00:00.000Z'),
        expectedEndDate: new Date('2026-02-06T00:00:00.000Z'),
        actualEndDate: null,
        depositAmount: 100,
        totalCost: 400,
        penaltyAmount: 0,
        status: RentalStatus.ACTIVE,
      }),
    ]);

    const service = new ReportService();
    const report = await service.generateFinancialReport(
      new Date('2026-02-01T00:00:00.000Z'),
      new Date('2026-02-28T23:59:59.000Z')
    );

    expect(report.totalRevenue).toBe(1050);
    expect(report.totalPenalties).toBe(50);
    expect(report.rentals.completed).toBe(1);
    expect(report.rentals.active).toBe(1);
    expect(report.transactions).toHaveLength(2);
    expect(report.revenueTimeline).toHaveLength(1);
  });

  it('builds exportable workbook and top renter analytics', async () => {
    const rentalRepo = dataSource.getRepository(Rental);

    await rentalRepo.save([
      rentalRepo.create({
        id: '11111111-aaaa-4111-8111-111111111111',
        carId: '33333333-3333-4333-8333-333333333333',
        renterUserId: '44444444-4444-4444-8444-444444444444',
        startDate: new Date('2026-03-01T00:00:00.000Z'),
        expectedEndDate: new Date('2026-03-02T00:00:00.000Z'),
        actualEndDate: new Date('2026-03-02T00:00:00.000Z'),
        depositAmount: 150,
        totalCost: 700,
        penaltyAmount: 100,
        status: RentalStatus.COMPLETED,
      }),
      rentalRepo.create({
        id: '22222222-bbbb-4222-8222-222222222222',
        carId: '55555555-5555-4555-8555-555555555555',
        renterUserId: '44444444-4444-4444-8444-444444444444',
        startDate: new Date('2026-03-05T00:00:00.000Z'),
        expectedEndDate: new Date('2026-03-06T00:00:00.000Z'),
        actualEndDate: null,
        depositAmount: 90,
        totalCost: 300,
        penaltyAmount: 0,
        status: RentalStatus.ACTIVE,
      }),
    ]);

    const reportService = new ReportService();
    const analyticsService = new AnalyticsService();

    const xlsx = await reportService.exportFinancialReport('xlsx');
    const pdf = await reportService.exportFinancialReport('pdf');
    const topClients = await analyticsService.getTopClients(5);

    expect(xlsx.contentType).toContain('spreadsheetml');
    expect(xlsx.buffer.length).toBeGreaterThan(100);
    expect(pdf.contentType).toBe('application/pdf');
    expect(pdf.buffer.length).toBeGreaterThan(100);
    expect(topClients[0].rentalCount).toBe(2);
    expect(topClients[0].netRevenue).toBeGreaterThan(0);
  });
});
