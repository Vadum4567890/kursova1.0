import api from './api';

export interface FinancialReport {
  totalRevenue: number;
  totalPenalties: number;
  totalDeposits: number;
  netRevenue: number;
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
  debug?: {
    completedRentalsCount: number;
    activeRentalsCount: number;
    cancelledRentalsCount: number;
    totalRevenueFromCompleted: number;
    expectedRevenueFromActive: number;
    depositsToReturnFromCompleted: number;
    cancelledDepositsToReturn: number;
    completedNetRevenue: number;
    cancelledNetRevenue: number;
    calculation: {
      completed: Array<{
        id: number;
        cost: number;
        penalty: number;
        deposit: number;
        depositToReturn: number;
        net: number;
      }>;
      cancelled?: Array<{
        id: number;
        cost: number;
        penalty: number;
        deposit: number;
        depositToReturn: number;
        net: number;
      }>;
    };
  };
}

export interface OccupancyReport {
  totalCars: number;
  availableCars: number;
  rentedCars: number;
  maintenanceCars: number;
  occupancyRate: number;
  byType: {
    economy: { total: number; available: number; rented: number };
    business: { total: number; available: number; rented: number };
    premium: { total: number; available: number; rented: number };
  };
}

export interface AvailabilityReport {
  availableCars: number;
  unavailableCars: number;
  maintenanceCars: number;
  cars: Array<{
    id: number;
    brand: string;
    model: string;
    status: string;
    nextAvailableDate?: string;
  }>;
}

export const reportService = {
  async generateFinancialReport(startDate?: string, endDate?: string): Promise<FinancialReport> {
    const response = await api.get<{ data: FinancialReport }>('/reports/financial', {
      params: { startDate, endDate }
    });
    return response.data.data;
  },

  async generateOccupancyReport(): Promise<OccupancyReport> {
    const response = await api.get<{ data: OccupancyReport }>('/reports/occupancy');
    return response.data.data;
  },

  async generateAvailabilityReport(): Promise<AvailabilityReport> {
    const response = await api.get<{ data: AvailabilityReport }>('/reports/availability');
    return response.data.data;
  },
};

