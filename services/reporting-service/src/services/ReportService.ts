import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { Repository } from 'typeorm';
import { Rental, RentalStatus } from '../entities/Rental.entity';
import { AppDataSource } from '../database/data-source';
import { fetchUserDisplayName } from '../clients/userServiceClient';

export type ReportExportFormat = 'xlsx' | 'pdf';

export interface RentalTransactionRow {
  rentalId: string;
  renterUserId: string;
  /** Ім'я з user-service для UI; якщо недоступне — на клієнті показують скорочений id */
  renterDisplayName?: string | null;
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
    pending: number;
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

const REPORT_BRAND_NAME = process.env.REPORT_BRAND_NAME || 'Car Rental Platform';
const REPORT_BRAND_TAGLINE = process.env.REPORT_BRAND_TAGLINE || 'Financial Intelligence Report';

function toPeriodKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function toNumber(value: unknown): number {
  return Number(value || 0);
}

function formatCurrency(value: number): string {
  return `${roundCurrency(value).toLocaleString('en-US')} UAH`;
}

/** Підпис періоду в PDF/XLSX без сирого ISO (UTC — узгоджено з датами з API). */
function formatReportDateUk(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatReportPeriodRange(startIso: string, endIso: string): string {
  return `${formatReportDateUk(startIso)} — ${formatReportDateUk(endIso)}`;
}

function formatGeneratedAtUk(): string {
  return new Date().toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

  private async enrichTransactionsWithRenterNames(rows: RentalTransactionRow[]): Promise<RentalTransactionRow[]> {
    const ids = [...new Set(rows.map((r) => r.renterUserId))];
    const nameById = new Map<string, string>();
    await Promise.all(
      ids.map(async (id) => {
        const name = await fetchUserDisplayName(id);
        if (name) nameById.set(id, name);
      })
    );
    return rows.map((row) => ({
      ...row,
      renterDisplayName: nameById.get(row.renterUserId) ?? null,
    }));
  }

  private async buildFinancialReport(startDate?: Date, endDate?: Date): Promise<FinancialReportModel> {
    const filtered = await this.getFilteredRentals(startDate, endDate);
    let transactions = filtered.map((rental) => this.buildTransactionRow(rental));
    transactions = await this.enrichTransactionsWithRenterNames(transactions);
    const completedTransactions = transactions.filter((row) => row.status === RentalStatus.COMPLETED);
    const activeTransactions = transactions.filter((row) => row.status === RentalStatus.ACTIVE);
    const pendingTransactions = transactions.filter((row) => row.status === RentalStatus.PENDING);
    const cancelledTransactions = transactions.filter((row) => row.status === RentalStatus.CANCELLED);

    const recognizedRevenue = transactions.reduce((sum, row) => sum + row.recognizedRevenue, 0);
    const projectedRevenue = [...activeTransactions, ...pendingTransactions].reduce(
      (sum, row) => sum + row.totalCost,
      0
    );
    const totalPenalties = transactions.reduce((sum, row) => sum + row.penaltyAmount, 0);
    const totalDeposits = transactions.reduce((sum, row) => sum + row.depositAmount, 0);
    const depositLiability = transactions.reduce((sum, row) => sum + row.depositToReturn, 0);
    const netRevenue = recognizedRevenue - depositLiability;

    const penaltiesOnCompleted = completedTransactions.reduce((sum, row) => sum + row.penaltyAmount, 0);

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
        completedTransactions.length > 0 ? penaltiesOnCompleted / completedTransactions.length : 0
      ),
      period: {
        startDate: (startDate || new Date(0)).toISOString(),
        endDate: (endDate || now).toISOString(),
      },
      rentals: {
        total: filtered.length,
        completed: completedTransactions.length,
        active: activeTransactions.length,
        pending: pendingTransactions.length,
        cancelled: cancelledTransactions.length,
      },
      statusBreakdown: [
        {
          status: RentalStatus.COMPLETED,
          count: completedTransactions.length,
          revenue: roundCurrency(completedTransactions.reduce((sum, row) => sum + row.recognizedRevenue, 0)),
        },
        {
          status: RentalStatus.PENDING,
          count: pendingTransactions.length,
          revenue: roundCurrency(pendingTransactions.reduce((sum, row) => sum + row.totalCost, 0)),
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
        .filter(
          (rental) =>
            rental.status === RentalStatus.ACTIVE || rental.status === RentalStatus.PENDING
        )
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
      status:
        rental.status === RentalStatus.ACTIVE || rental.status === RentalStatus.PENDING
          ? 'rented'
          : 'available',
      nextAvailableDate:
        rental.status === RentalStatus.ACTIVE || rental.status === RentalStatus.PENDING
          ? rental.expectedEndDate.toISOString()
          : undefined,
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
      const active = rows.filter(
        (row) => row.status === RentalStatus.ACTIVE || row.status === RentalStatus.PENDING
      );
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
    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.aoa_to_sheet([
      [REPORT_BRAND_NAME],
      [REPORT_BRAND_TAGLINE],
      [`Period: ${formatReportPeriodRange(report.period.startDate, report.period.endDate)}`],
      [],
      ['Metric', 'Value'],
      ['Total revenue', report.totalRevenue],
      [
        'Note (total revenue)',
        'Recognized from completed/cancelled + projected from active (not yet charged)',
      ],
      ['Net revenue', report.netRevenue],
      ['Note (net revenue)', 'Recognized revenue minus deposit amounts to return'],
      ['Projected revenue', report.projectedRevenue],
      ['Total penalties', report.totalPenalties],
      ['Deposit liability', report.depositLiability],
      ['Average completed ticket', report.averageCompletedTicket],
      ['Average penalty / completed rental', report.averagePenaltyPerCompletedRental],
      [],
      ['Status', 'Count', 'Revenue'],
      ...report.statusBreakdown.map((item) => [item.status, item.count, item.revenue]),
    ]);

    summarySheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
    ];
    summarySheet['!cols'] = [{ wch: 34 }, { wch: 18 }, { wch: 18 }];

    const transactionsSheet = XLSX.utils.json_to_sheet(
      report.transactions.map((row) => ({
        rentalId: row.rentalId,
        renterUserId: row.renterUserId,
        renterDisplayName: row.renterDisplayName ?? '',
        carId: row.carId,
        status: row.status,
        startDate: row.startDate,
        expectedEndDate: row.expectedEndDate,
        actualEndDate: row.actualEndDate || '',
        durationDays: row.durationDays,
        totalCost: row.totalCost,
        penaltyAmount: row.penaltyAmount,
        depositAmount: row.depositAmount,
        depositToReturn: row.depositToReturn,
        recognizedRevenue: row.recognizedRevenue,
      }))
    );
    transactionsSheet['!cols'] = [
      { wch: 38 },
      { wch: 38 },
      { wch: 38 },
      { wch: 14 },
      { wch: 24 },
      { wch: 24 },
      { wch: 24 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
    ];

    const timelineSheet = XLSX.utils.json_to_sheet(
      report.revenueTimeline.map((row) => ({
        period: row.period,
        recognizedRevenue: row.recognizedRevenue,
        penalties: row.penalties,
        rentalsCompleted: row.rentalsCompleted,
      }))
    );
    timelineSheet['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 18 }];

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');
    XLSX.utils.book_append_sheet(workbook, timelineSheet, 'Timeline');

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
  }

  private drawPdfFooter(doc: any) {
    const footerY = 760;
    doc
      .strokeColor('#cbd5e1')
      .moveTo(40, footerY)
      .lineTo(555, footerY)
      .stroke();

    doc
      .fillColor('#64748b')
      .fontSize(9)
      .text(`${REPORT_BRAND_NAME} • Prepared for academic defense/demo`, 40, footerY + 10, {
        width: 300,
        align: 'left',
      })
      .text(`Generated: ${formatGeneratedAtUk()}`, 350, footerY + 10, {
        width: 205,
        align: 'right',
      });
  }

  private drawPdfSignatures(doc: any, y: number) {
    doc
      .fillColor('#0f172a')
      .fontSize(10)
      .text('Prepared by: ____________________', 40, y)
      .text('Approved by: ____________________', 310, y);
  }

  private drawPdfTable(
    doc: any,
    startY: number,
    headers: string[],
    rows: string[][]
  ) {
    const columnWidths =
      headers.length === 5 ? [115, 72, 78, 78, 82] : [150, 100, 110, 110];
    let y = startY;
    let x = 40;

    headers.forEach((header, index) => {
      const width = columnWidths[index] || 100;
      doc.rect(x, y, width, 24).fill('#e2e8f0');
      doc.fillColor('#0f172a').fontSize(9).text(header, x + 6, y + 7, { width: width - 12 });
      x += width;
    });

    y += 24;
    rows.forEach((row, rowIndex) => {
      x = 40;
      row.forEach((cell, index) => {
        const width = columnWidths[index] || 100;
        doc.rect(x, y, width, 22).fill(rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc');
        doc.fillColor('#0f172a').fontSize(8.5).text(cell, x + 6, y + 6, { width: width - 12 });
        x += width;
      });
      y += 22;
    });

    return y;
  }

  private buildFinancialPdf(report: FinancialReportModel): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.rect(40, 40, 515, 78).fill('#0f172a');
      doc
        .fillColor('#ffffff')
        .fontSize(20)
        .text(REPORT_BRAND_NAME, 56, 58)
        .fontSize(10)
        .text(REPORT_BRAND_TAGLINE, 56, 84);

      doc
        .fillColor('#0f172a')
        .fontSize(11)
        .text(`Period: ${formatReportPeriodRange(report.period.startDate, report.period.endDate)}`, 40, 140);

      doc
        .fillColor('#64748b')
        .fontSize(8)
        .text(
          'Total revenue = recognized (completed/cancelled) + projected (active). Net revenue = recognized − deposit liability.',
          40,
          158,
          { width: 515 }
        );

      const cards = [
        { label: 'Total revenue', value: `${report.totalRevenue} UAH`, color: '#1d4ed8' },
        { label: 'Net revenue', value: `${report.netRevenue} UAH`, color: '#047857' },
        { label: 'Projected', value: `${report.projectedRevenue} UAH`, color: '#7c3aed' },
        { label: 'Penalties', value: `${report.totalPenalties} UAH`, color: '#dc2626' },
      ];

      cards.forEach((card, index) => {
        const x = 40 + (index % 2) * 255;
        const y = 192 + Math.floor(index / 2) * 82;
        doc.roundedRect(x, y, 235, 64, 8).fill(card.color);
        doc
          .fillColor('#ffffff')
          .fontSize(10)
          .text(card.label, x + 14, y + 12)
          .fontSize(16)
          .text(card.value, x + 14, y + 30);
      });

      doc
        .fillColor('#0f172a')
        .fontSize(13)
        .text('Transaction overview', 40, 370);

      const tableRows = report.transactions.slice(0, 10).map((transaction) => {
        const renterLabel =
          transaction.renterDisplayName?.trim() ||
          `${transaction.renterUserId.slice(0, 8)}…`;
        return [
          renterLabel,
          transaction.status,
          formatCurrency(transaction.totalCost),
          formatCurrency(transaction.penaltyAmount),
          formatCurrency(transaction.depositToReturn),
        ];
      });

      const tableEnd = this.drawPdfTable(
        doc,
        394,
        ['Renter', 'Status', 'Rental', 'Penalty', 'Deposit return'],
        tableRows.length > 0 ? tableRows : [['No data', '-', '-', '-', '-']]
      );

      doc
        .fillColor('#334155')
        .fontSize(10)
        .text(
          `Completed: ${report.rentals.completed} | Active: ${report.rentals.active} | Cancelled: ${report.rentals.cancelled}`,
          40,
          tableEnd + 18
        )
        .text(
          `Projected revenue: ${formatCurrency(report.projectedRevenue)} | Deposit liability: ${formatCurrency(report.depositLiability)}`,
          40,
          tableEnd + 34
        );

      if (report.transactions.length > 10) {
        doc
          .fillColor('#64748b')
          .fontSize(9)
          .text(`Additional transactions not shown in preview: ${report.transactions.length - 10}`, 40, tableEnd + 54);
      }

      this.drawPdfSignatures(doc, 710);
      this.drawPdfFooter(doc);

      doc.end();
    });
  }

  private buildOccupancyWorkbook(report: any): Buffer {
    const workbook = XLSX.utils.book_new();
    const summary = XLSX.utils.aoa_to_sheet([
      [REPORT_BRAND_NAME],
      ['Occupancy Executive Snapshot'],
      [],
      ['Metric', 'Value'],
      ['Total cars', report.totalCars],
      ['Available cars', report.availableCars],
      ['Rented cars', report.rentedCars],
      ['Occupancy rate', report.occupancyRate],
    ]);
    summary['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    summary['!cols'] = [{ wch: 26 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(workbook, summary, 'Occupancy');
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
  }

  private buildCarWorkbook(report: any): Buffer {
    const workbook = XLSX.utils.book_new();
    const summary = XLSX.utils.aoa_to_sheet([
      [REPORT_BRAND_NAME],
      ['Car Performance Report'],
      [`Period: ${formatReportPeriodRange(report.period.startDate, report.period.endDate)}`],
      [],
      ['Metric', 'Value'],
      ['Total cars', report.summary.totalCars],
      ['Total revenue', report.summary.totalRevenue],
      ['Total net revenue', report.summary.totalNetRevenue],
      ['Total penalties', report.summary.totalPenalties],
    ]);
    const cars = XLSX.utils.json_to_sheet(
      (report.cars || []).map((item: any) => ({
        carId: item.car.id,
        brand: item.car.brand,
        model: item.car.model,
        status: item.car.status,
        rentalCount: item.occupancy.rentalCount,
        totalRevenue: item.financial.totalRevenue,
        netRevenue: item.financial.netRevenue,
        penalties: item.financial.totalPenalties,
      }))
    );
    XLSX.utils.book_append_sheet(workbook, summary, 'Summary');
    XLSX.utils.book_append_sheet(workbook, cars, 'Cars');
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
  }

  private buildOccupancyPdf(report: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.rect(40, 40, 515, 78).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(20).text(REPORT_BRAND_NAME, 56, 58);
      doc.fontSize(10).text('Occupancy Executive Snapshot', 56, 84);

      const cards = [
        ['Occupancy rate', `${report.occupancyRate}%`],
        ['Available cars', String(report.availableCars)],
        ['Rented cars', String(report.rentedCars)],
        ['Total fleet', String(report.totalCars)],
      ];

      cards.forEach(([label, value], index) => {
        const x = 40 + (index % 2) * 255;
        const y = 170 + Math.floor(index / 2) * 82;
        doc.roundedRect(x, y, 235, 64, 8).fill(index % 2 === 0 ? '#1d4ed8' : '#0f766e');
        doc.fillColor('#ffffff').fontSize(10).text(label, x + 14, y + 12);
        doc.fontSize(16).text(value, x + 14, y + 30);
      });

      const tableEnd = this.drawPdfTable(doc, 350, ['Section', 'Total', 'Available', 'Rented'], [
        ['Overall fleet', String(report.totalCars), String(report.availableCars), String(report.rentedCars)],
        ['Economy', String(report.byType?.economy?.total || 0), String(report.byType?.economy?.available || 0), String(report.byType?.economy?.rented || 0)],
        ['Business', String(report.byType?.business?.total || 0), String(report.byType?.business?.available || 0), String(report.byType?.business?.rented || 0)],
        ['Premium', String(report.byType?.premium?.total || 0), String(report.byType?.premium?.available || 0), String(report.byType?.premium?.rented || 0)],
      ]);

      this.drawPdfSignatures(doc, Math.min(tableEnd + 30, 710));
      this.drawPdfFooter(doc);
      doc.end();
    });
  }

  private buildCarPdf(report: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.rect(40, 40, 762, 78).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(20).text(REPORT_BRAND_NAME, 56, 58);
      doc.fontSize(10).text('Car Performance & Profitability Report', 56, 84);
      doc
        .fillColor('#0f172a')
        .fontSize(11)
        .text(`Period: ${formatReportPeriodRange(report.period.startDate, report.period.endDate)}`, 40, 140);

      const rows = (report.cars || []).slice(0, 12).map((item: any) => [
        `${item.car.brand} ${item.car.model}`.trim(),
        item.car.status,
        formatCurrency(item.financial.totalRevenue),
        formatCurrency(item.financial.netRevenue),
      ]);

      const tableEnd = this.drawPdfTable(doc, 180, ['Car', 'Status', 'Revenue', 'Net'], rows.length > 0 ? rows : [['No data', '-', '-', '-']]);
      doc
        .fillColor('#0f172a')
        .fontSize(10)
        .text(
          `Fleet summary: total=${report.summary.totalCars}, revenue=${formatCurrency(report.summary.totalRevenue)}, net=${formatCurrency(report.summary.totalNetRevenue)}`,
          40,
          tableEnd + 20
        );

      this.drawPdfSignatures(doc, 520);
      this.drawPdfFooter(doc);
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

  async exportOccupancyReport(format: ReportExportFormat): Promise<ExportResult> {
    const report = await this.generateOccupancyReport();
    const stamp = new Date().toISOString().slice(0, 10);

    if (format === 'xlsx') {
      return {
        buffer: this.buildOccupancyWorkbook(report),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileName: `occupancy-report-${stamp}.xlsx`,
      };
    }

    return {
      buffer: await this.buildOccupancyPdf(report),
      contentType: 'application/pdf',
      fileName: `occupancy-report-${stamp}.pdf`,
    };
  }

  async exportCarReport(format: ReportExportFormat, startDate?: Date, endDate?: Date): Promise<ExportResult> {
    const report = await this.generateCarReport(startDate, endDate);
    const stamp = new Date().toISOString().slice(0, 10);

    if (format === 'xlsx') {
      return {
        buffer: this.buildCarWorkbook(report),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileName: `car-report-${stamp}.xlsx`,
      };
    }

    return {
      buffer: await this.buildCarPdf(report),
      contentType: 'application/pdf',
      fileName: `car-report-${stamp}.pdf`,
    };
  }
}
