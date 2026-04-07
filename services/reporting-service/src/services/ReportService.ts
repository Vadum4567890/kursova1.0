import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { Repository } from 'typeorm';
import { Rental, RentalStatus } from '../entities/Rental.entity';
import { AppDataSource } from '../database/data-source';

export type ReportExportFormat = 'xlsx' | 'pdf';

export interface RentalTransactionRow {
  rentalId: string;
  renterUserId: string;
  carId: string;
  status: RentalStatus;
  startDate: string;
  expectedEndDate: string;
  actualEndDate: string | null;
  durationDays: number;
  totalCost: number;
  penaltyAmount: number;
  depositAmount: number;
  depositToReturn: number;
  recognizedRevenue: number;
}

export interface FinancialReportModel {
  totalRevenue: number;
  totalPenalties: number;
  totalDeposits: number;
  depositLiability: number;
  netRevenue: number;
  projectedRevenue: number;
  averageCompletedTicket: number;
  averagePenaltyPerCompletedRental: number;
  period: {
    startDate: string;
    endDate: string;
  };
  rentals: {
    total: number;
    completed: number;
    active: number;
    cancelled: number;
  };
  statusBreakdown: Array<{
    status: RentalStatus;
    count: number;
    revenue: number;
  }>;
  transactions: RentalTransactionRow[];
  revenueTimeline: Array<{
    period: string;
    recognizedRevenue: number;
    penalties: number;
    rentalsCompleted: number;
  }>;
}

export interface ExportResult {
  buffer: Buffer;
  contentType: string;
  fileName: string;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toPeriodKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function toNumber(value: unknown): number {
  return Number(value || 0);
}

export class ReportService {
  private rentalRepository: Repository<Rental>;

  constructor() {
    this.rentalRepository = AppDataSource.getRepository(Rental);
  }

  private async getFilteredRentals(startDate?: Date, endDate?: Date): Promise<Rental[]> {
    const rentals = await this.rentalRepository.find({ order: { startDate: 'ASC' } });
    if (!startDate && !endDate) {
      return rentals;
    }

    const start = startDate || new Date(0);
    const end = endDate || new Date();
    return rentals.filter((rental) => rental.startDate >= start && rental.startDate <= end);
  }

  private buildTransactionRow(rental: Rental): RentalTransactionRow {
    const completed = rental.status === RentalStatus.COMPLETED;
    const cancelled = rental.status === RentalStatus.CANCELLED;
    const actualEndDate = rental.actualEndDate || rental.expectedEndDate;
    const durationDays = Math.max(
      1,
      Math.ceil((actualEndDate.getTime() - rental.startDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const totalCost = toNumber(rental.totalCost);
    const penaltyAmount = toNumber(rental.penaltyAmount);
    const depositAmount = toNumber(rental.depositAmount);
    const depositToReturn = completed || cancelled ? Math.max(0, depositAmount - penaltyAmount) : depositAmount;

    let recognizedRevenue = 0;
    if (completed) {
      recognizedRevenue = totalCost + penaltyAmount;
    } else if (cancelled) {
      recognizedRevenue = Math.max(0, totalCost + penaltyAmount - depositToReturn);
    }

    return {
      rentalId: rental.id,
      renterUserId: rental.renterUserId,
      carId: rental.carId,
      status: rental.status,
      startDate: rental.startDate.toISOString(),
      expectedEndDate: rental.expectedEndDate.toISOString(),
      actualEndDate: rental.actualEndDate ? rental.actualEndDate.toISOString() : null,
      durationDays,
      totalCost: roundCurrency(totalCost),
      penaltyAmount: roundCurrency(penaltyAmount),
      depositAmount: roundCurrency(depositAmount),
      depositToReturn: roundCurrency(depositToReturn),
      recognizedRevenue: roundCurrency(recognizedRevenue),
    };
  }

  private async buildFinancialReport(startDate?: Date, endDate?: Date): Promise<FinancialReportModel> {
    const filtered = await this.getFilteredRentals(startDate, endDate);
    const transactions = filtered.map((rental) => this.buildTransactionRow(rental));
    const completedTransactions = transactions.filter((row) => row.status === RentalStatus.COMPLETED);
    const activeTransactions = transactions.filter((row) => row.status === RentalStatus.ACTIVE);
    const cancelledTransactions = transactions.filter((row) => row.status === RentalStatus.CANCELLED);

    const recognizedRevenue = transactions.reduce((sum, row) => sum + row.recognizedRevenue, 0);
    const projectedRevenue = activeTransactions.reduce((sum, row) => sum + row.totalCost, 0);
    const totalPenalties = transactions.reduce((sum, row) => sum + row.penaltyAmount, 0);
    const totalDeposits = transactions.reduce((sum, row) => sum + row.depositAmount, 0);
    const depositLiability = transactions.reduce((sum, row) => sum + row.depositToReturn, 0);
    const netRevenue = recognizedRevenue - depositLiability;

    const timeline = new Map<string, { recognizedRevenue: number; penalties: number; rentalsCompleted: number }>();
    completedTransactions.forEach((row) => {
      const period = toPeriodKey(new Date(row.actualEndDate || row.expectedEndDate));
      const current = timeline.get(period) || { recognizedRevenue: 0, penalties: 0, rentalsCompleted: 0 };
      current.recognizedRevenue += row.recognizedRevenue;
      current.penalties += row.penaltyAmount;
      current.rentalsCompleted += 1;
      timeline.set(period, current);
    });

    const now = new Date();
    return {
      totalRevenue: roundCurrency(recognizedRevenue + projectedRevenue),
      totalPenalties: roundCurrency(totalPenalties),
      totalDeposits: roundCurrency(totalDeposits),
      depositLiability: roundCurrency(depositLiability),
      netRevenue: roundCurrency(netRevenue),
      projectedRevenue: roundCurrency(projectedRevenue),
      averageCompletedTicket: roundCurrency(
        completedTransactions.length > 0
          ? completedTransactions.reduce((sum, row) => sum + row.totalCost, 0) / completedTransactions.length
          : 0
      ),
      averagePenaltyPerCompletedRental: roundCurrency(
        completedTransactions.length > 0 ? totalPenalties / completedTransactions.length : 0
      ),
      period: {
        startDate: (startDate || new Date(0)).toISOString(),
        endDate: (endDate || now).toISOString(),
      },
      rentals: {
        total: filtered.length,
        completed: completedTransactions.length,
        active: activeTransactions.length,
        cancelled: cancelledTransactions.length,
      },
      statusBreakdown: [
        {
          status: RentalStatus.COMPLETED,
          count: completedTransactions.length,
          revenue: roundCurrency(completedTransactions.reduce((sum, row) => sum + row.recognizedRevenue, 0)),
        },
        {
          status: RentalStatus.ACTIVE,
          count: activeTransactions.length,
          revenue: roundCurrency(activeTransactions.reduce((sum, row) => sum + row.totalCost, 0)),
        },
        {
          status: RentalStatus.CANCELLED,
          count: cancelledTransactions.length,
          revenue: roundCurrency(cancelledTransactions.reduce((sum, row) => sum + row.recognizedRevenue, 0)),
        },
      ],
      transactions,
      revenueTimeline: Array.from(timeline.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, values]) => ({
          period,
          recognizedRevenue: roundCurrency(values.recognizedRevenue),
          penalties: roundCurrency(values.penalties),
          rentalsCompleted: values.rentalsCompleted,
        })),
    };
  }

  async generateFinancialReport(startDate?: Date, endDate?: Date): Promise<FinancialReportModel> {
    return this.buildFinancialReport(startDate, endDate);
  }

  async generateOccupancyReport(): Promise<any> {
    const rentals = await this.rentalRepository.find();
    const distinctCars = new Set(rentals.map((rental) => rental.carId));
    const activeCars = new Set(
      rentals
        .filter((rental) => rental.status === RentalStatus.ACTIVE)
        .map((rental) => rental.carId)
    );

    const totalCars = distinctCars.size;
    const rentedCars = activeCars.size;
    const availableCars = Math.max(0, totalCars - rentedCars);

    return {
      totalCars,
      availableCars,
      rentedCars,
      maintenanceCars: 0,
      occupancyRate: totalCars > 0 ? roundCurrency((rentedCars / totalCars) * 100) : 0,
      byType: {
        economy: { total: 0, available: 0, rented: 0 },
        business: { total: 0, available: 0, rented: 0 },
        premium: { total: 0, available: 0, rented: 0 },
      },
    };
  }

  async generateAvailabilityReport(): Promise<any> {
    const rentals = await this.rentalRepository.find({ order: { updatedAt: 'DESC' } });
    const byCar = new Map<string, Rental>();

    rentals.forEach((rental) => {
      if (!byCar.has(rental.carId)) {
        byCar.set(rental.carId, rental);
      }
    });

    const cars = Array.from(byCar.entries()).map(([carId, rental]) => ({
      id: carId,
      brand: 'Unknown',
      model: 'Unknown',
      status: rental.status === RentalStatus.ACTIVE ? 'rented' : 'available',
      nextAvailableDate:
        rental.status === RentalStatus.ACTIVE ? rental.expectedEndDate.toISOString() : undefined,
    }));

    const unavailableCars = cars.filter((car) => car.status === 'rented').length;
    return {
      availableCars: cars.length - unavailableCars,
      unavailableCars,
      maintenanceCars: 0,
      cars,
    };
  }

  async generateCarReport(startDate?: Date, endDate?: Date): Promise<any> {
    const filtered = await this.getFilteredRentals(startDate, endDate);
    const byCar = new Map<string, RentalTransactionRow[]>();

    filtered.forEach((rental) => {
      const row = this.buildTransactionRow(rental);
      const current = byCar.get(rental.carId) || [];
      current.push(row);
      byCar.set(rental.carId, current);
    });

    const cars = Array.from(byCar.entries()).map(([carId, rows]) => {
      const completed = rows.filter((row) => row.status === RentalStatus.COMPLETED);
      const active = rows.filter((row) => row.status === RentalStatus.ACTIVE);
      const cancelled = rows.filter((row) => row.status === RentalStatus.CANCELLED);
      const totalRevenue = rows.reduce((sum, row) => sum + row.recognizedRevenue, 0);
      const totalPenalties = rows.reduce((sum, row) => sum + row.penaltyAmount, 0);
      const totalDeposits = rows.reduce((sum, row) => sum + row.depositAmount, 0);

      return {
        car: {
          id: carId,
          brand: 'Unknown',
          model: 'Unknown',
          year: 0,
          type: 'unknown',
          pricePerDay: completed[0]?.totalCost || active[0]?.totalCost || 0,
          status: active.length > 0 ? 'rented' : 'available',
        },
        occupancy: {
          totalRentalDays: rows.reduce((sum, row) => sum + row.durationDays, 0),
          periodDays: 0,
          occupancyRate: '0%',
          rentalCount: rows.length,
          completedCount: completed.length,
          activeCount: active.length,
          cancelledCount: cancelled.length,
          isCurrentlyRented: active.length > 0,
          nextAvailableDate: active[0]?.expectedEndDate,
        },
        financial: {
          totalRevenue: roundCurrency(totalRevenue),
          expectedRevenue: roundCurrency(active.reduce((sum, row) => sum + row.totalCost, 0)),
          totalPenalties: roundCurrency(totalPenalties),
          totalDeposits: roundCurrency(totalDeposits),
          netRevenue: roundCurrency(totalRevenue - rows.reduce((sum, row) => sum + row.depositToReturn, 0)),
          averageRevenuePerRental: roundCurrency(rows.length > 0 ? totalRevenue / rows.length : 0),
        },
      };
    });

    const now = new Date();
    return {
      period: {
        startDate: (startDate || new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)).toISOString(),
        endDate: (endDate || now).toISOString(),
      },
      summary: {
        totalCars: cars.length,
        totalRevenue: roundCurrency(cars.reduce((sum, car) => sum + car.financial.totalRevenue, 0)),
        totalNetRevenue: roundCurrency(cars.reduce((sum, car) => sum + car.financial.netRevenue, 0)),
        totalPenalties: roundCurrency(cars.reduce((sum, car) => sum + car.financial.totalPenalties, 0)),
        averageOccupancyRate: 0,
      },
      cars,
    };
  }

  private buildFinancialWorkbook(report: FinancialReportModel): Buffer {
    const summaryRows = [
      { metric: 'Total revenue', value: report.totalRevenue },
      { metric: 'Net revenue', value: report.netRevenue },
      { metric: 'Projected revenue', value: report.projectedRevenue },
      { metric: 'Total penalties', value: report.totalPenalties },
      { metric: 'Deposit liability', value: report.depositLiability },
      { metric: 'Average completed ticket', value: report.averageCompletedTicket },
    ];

    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    const transactionsSheet = XLSX.utils.json_to_sheet(report.transactions);
    const timelineSheet = XLSX.utils.json_to_sheet(report.revenueTimeline);

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');
    XLSX.utils.book_append_sheet(workbook, timelineSheet, 'Timeline');

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
  }

  private buildFinancialPdf(report: FinancialReportModel): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text('Financial Report', { underline: true });
      doc.moveDown();
      doc.fontSize(11).text(`Period: ${report.period.startDate} - ${report.period.endDate}`);
      doc.text(`Total revenue: ${report.totalRevenue} UAH`);
      doc.text(`Net revenue: ${report.netRevenue} UAH`);
      doc.text(`Projected revenue: ${report.projectedRevenue} UAH`);
      doc.text(`Total penalties: ${report.totalPenalties} UAH`);
      doc.text(`Deposit liability: ${report.depositLiability} UAH`);
      doc.moveDown();
      doc.fontSize(13).text('Transactions');
      doc.moveDown(0.5);

      report.transactions.slice(0, 20).forEach((transaction) => {
        doc
          .fontSize(10)
          .text(
            `${transaction.rentalId} | ${transaction.status} | revenue=${transaction.recognizedRevenue} | penalties=${transaction.penaltyAmount} | deposit return=${transaction.depositToReturn}`
          );
      });

      if (report.transactions.length > 20) {
        doc.moveDown(0.5).fontSize(10).text(`...and ${report.transactions.length - 20} more transactions`);
      }

      doc.end();
    });
  }

  async exportFinancialReport(format: ReportExportFormat, startDate?: Date, endDate?: Date): Promise<ExportResult> {
    const report = await this.buildFinancialReport(startDate, endDate);
    const stamp = new Date().toISOString().slice(0, 10);

    if (format === 'xlsx') {
      return {
        buffer: this.buildFinancialWorkbook(report),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileName: `financial-report-${stamp}.xlsx`,
      };
    }

    return {
      buffer: await this.buildFinancialPdf(report),
      contentType: 'application/pdf',
      fileName: `financial-report-${stamp}.pdf`,
    };
  }
}
