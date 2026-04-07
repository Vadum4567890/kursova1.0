import { AnalyticsController } from '../src/controllers/AnalyticsController';
import { PenaltyController } from '../src/controllers/PenaltyController';
import { ReportController } from '../src/controllers/ReportController';

function createResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe('reporting-service controllers', () => {
  it('wraps financial report data and parses query dates', async () => {
    const reportService = {
      generateFinancialReport: jest.fn().mockResolvedValue({ totalRevenue: 1000 }),
    };
    const controller = new ReportController(reportService as any);
    const res = createResponse();
    const next = jest.fn();

    await controller.generateFinancialReport(
      { query: { startDate: '2026-01-01', endDate: '2026-01-31' } } as any,
      res,
      next
    );

    expect(reportService.generateFinancialReport).toHaveBeenCalledWith(
      new Date('2026-01-01'),
      new Date('2026-01-31')
    );
    expect(res.json).toHaveBeenCalledWith({ data: { totalRevenue: 1000 } });
  });

  it('streams exported financial report as attachment', async () => {
    const reportService = {
      exportFinancialReport: jest.fn().mockResolvedValue({
        buffer: Buffer.from('file'),
        contentType: 'application/pdf',
        fileName: 'financial-report.pdf',
      }),
    };
    const controller = new ReportController(reportService as any);
    const res = createResponse();
    res.setHeader = jest.fn();
    const next = jest.fn();

    await controller.exportFinancialReport(
      { query: { startDate: '2026-01-01', endDate: '2026-01-31', format: 'pdf' } } as any,
      res,
      next
    );

    expect(reportService.exportFinancialReport).toHaveBeenCalledWith(
      'pdf',
      new Date('2026-01-01'),
      new Date('2026-01-31')
    );
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(res.send).toHaveBeenCalledWith(Buffer.from('file'));
  });

  it('returns 404 when penalty is missing', async () => {
    const penaltyService = {
      getPenaltyById: jest.fn().mockResolvedValue(null),
    };
    const controller = new PenaltyController(penaltyService as any);
    const res = createResponse();
    const next = jest.fn();

    await controller.getPenaltyById({ params: { id: 'missing' } } as any, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Penalty not found' });
  });

  it('uses default limit for popular cars analytics', async () => {
    const analyticsService = {
      getPopularCars: jest.fn().mockResolvedValue([{ id: 'car-1' }]),
    };
    const controller = new AnalyticsController(analyticsService as any);
    const res = createResponse();
    const next = jest.fn();

    await controller.getPopularCars({ query: {} } as any, res, next);

    expect(analyticsService.getPopularCars).toHaveBeenCalledWith(10);
    expect(res.json).toHaveBeenCalledWith({ data: [{ id: 'car-1' }] });
  });
});
