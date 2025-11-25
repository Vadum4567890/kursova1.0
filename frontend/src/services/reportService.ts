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

export interface CarReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalCars: number;
    totalRevenue: number;
    totalNetRevenue: number;
    totalPenalties: number;
    averageOccupancyRate: number;
  };
  cars: Array<{
    car: {
      id: number;
      brand: string;
      model: string;
      year: number;
      type: string;
      pricePerDay: number;
      status: string;
    };
    occupancy: {
      totalRentalDays: number;
      periodDays: number;
      occupancyRate: string;
      rentalCount: number;
      completedCount: number;
      activeCount: number;
      cancelledCount: number;
      isCurrentlyRented: boolean;
      nextAvailableDate?: string;
    };
    financial: {
      totalRevenue: number;
      expectedRevenue: number;
      totalPenalties: number;
      totalDeposits: number;
      netRevenue: number;
      averageRevenuePerRental: number;
    };
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

  async generateCarReport(startDate?: string, endDate?: string): Promise<CarReport> {
    const response = await api.get<{ data: CarReport }>('/reports/cars', {
      params: { startDate, endDate }
    });
    return response.data.data;
  },
};

