/**
 * Service DTOs - Data Transfer Objects for API communication
 * These interfaces are used for creating/updating entities via services
 */

// Car service DTOs
export interface CarFilters {
  type?: string;
  status?: string;
  brand?: string;
  model?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface CreateCarData {
  brand: string;
  model: string;
  year: number;
  type: 'economy' | 'business' | 'premium';
  pricePerDay: number;
  deposit: number;
  description?: string;
  bodyType?: string;
  driveType?: string;
  transmission?: string;
  engine?: string;
  fuelType?: string;
  seats?: number;
  mileage?: number;
  color?: string;
  features?: string;
}

export interface UpdateCarData extends Partial<CreateCarData> {
  status?: 'available' | 'rented' | 'maintenance';
}

// Rental service DTOs
export interface CreateRentalData {
  clientId: number;
  carId: number;
  startDate: string;
  expectedEndDate: string;
}

export interface UpdateRentalData {
  actualEndDate?: string;
  status?: 'active' | 'completed' | 'cancelled';
  penaltyAmount?: number;
}

// User service DTOs
export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'employee';
  fullName?: string;
  address?: string;
  phone?: string;
}

export interface UpdateUserData {
  email?: string;
  fullName?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

// Client service DTOs
export interface CreateClientData {
  fullName: string;
  address: string;
  phone: string;
  email?: string;
}

export interface UpdateClientData {
  fullName?: string;
  address?: string;
  phone?: string;
  email?: string;
}

// Penalty service DTOs
export interface CreatePenaltyData {
  rentalId: number;
  amount: number;
  reason: string;
}

// Auth service DTOs
export interface LoginData {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  address?: string;
  phone?: string;
}

export interface AuthResponse {
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    fullName?: string;
    address?: string;
    phone?: string;
  };
  token: string;
}

// Analytics service DTOs
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

export interface UploadResponse {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  url: string;
  fullUrl: string;
}

// Report service DTOs
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

// Search service DTOs
export interface CarSearchParams {
  brand?: string;
  model?: string;
  type?: 'economy' | 'business' | 'premium';
  status?: 'available' | 'rented' | 'maintenance';
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
}

export interface RentalSearchParams {
  clientId?: number;
  carId?: number;
  status?: 'active' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
}

