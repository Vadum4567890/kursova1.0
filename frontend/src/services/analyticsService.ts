import api from './api';

export interface DashboardStats {
  totalCars: number;
  availableCars: number;
  rentedCars: number;
  maintenanceCars?: number;
  totalClients: number;
  activeRentals: number;
  completedRentals?: number;
  totalRevenue: number;
  totalPenalties: number;
  averageRentalDuration: number;
  occupancyRate?: number;
  averageRevenuePerRental?: number;
}

export interface PopularCar {
  car: {
    id: number;
    brand: string;
    model: string;
  };
  rentalCount: number;
  totalRevenue: number;
}

export interface TopClient {
  client: {
    id: number;
    fullName: string;
    phone: string;
  };
  totalSpent: number; // For backward compatibility
  totalReceived: number; // Total money received from client
  totalCost: number; // Total rental cost
  totalPenalties: number; // Total penalties
  totalDeposits: number; // Total deposits paid
  totalToReturn: number; // Total deposit to return
  netRevenue: number; // Net revenue (cost + penalties - deposit return)
  rentalCount: number;
}

export const analyticsService = {
  async getDashboardStats(startDate?: string, endDate?: string): Promise<DashboardStats> {
    const response = await api.get<{ data: DashboardStats }>('/analytics/dashboard', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  async getRevenueStats(startDate?: string, endDate?: string): Promise<any> {
    const response = await api.get('/analytics/revenue', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  async getPopularCars(limit: number = 10): Promise<PopularCar[]> {
    const response = await api.get<{ data: PopularCar[] }>('/analytics/popular-cars', {
      params: { limit },
    });
    return response.data.data;
  },

  async getTopClients(limit: number = 10): Promise<TopClient[]> {
    const response = await api.get<{ data: TopClient[] }>('/analytics/top-clients', {
      params: { limit },
    });
    return response.data.data;
  },

  async getOccupancyRate(): Promise<number> {
    const response = await api.get<{ data: { occupancyRate: number } }>('/analytics/occupancy-rate');
    return response.data.data.occupancyRate;
  },

  async getRevenueForecast(): Promise<any> {
    const response = await api.get('/analytics/revenue-forecast');
    return response.data.data;
  },
};

