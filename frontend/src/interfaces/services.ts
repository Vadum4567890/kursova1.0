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
  type: 'economy' | 'business' | 'premium' | 'suv' | 'luxury';
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
  clientId?: number | string;
  carId: number | string;
  renterUserId?: string;
  startDate: string;
  expectedEndDate: string;
}

export interface UpdateRentalData {
  actualEndDate?: string;
  status?: 'active' | 'completed' | 'cancelled';
  penaltyAmount?: number;
}

export interface SubmitReviewData {
  bookingId: string;
  comment?: string;
  scores: Record<string, number>;
}

export interface UpdateReviewData {
  comment?: string;
  scores: Record<string, number>;
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
  rentalId: string;
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
  role?: 'renter' | 'owner';
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
  totalRentalRevenue?: number;
  systemRevenue?: number;
  landlordRevenue?: number;
  systemCommissionRate?: number;
  totalPenalties: number;
  averageRentalDuration: number;
  occupancyRate?: number;
  averageRevenuePerRental?: number;
}

export interface PopularCar {
  car: {
    id: number | string;
    brand: string;
    model: string;
  };
  rentalCount: number;
  totalRevenue: number;
}

export interface TopClient {
  client: {
    id: number | string;
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
  systemCommissionRate?: number;
  totalRentalRevenue?: number;
  systemRevenue?: number;
  landlordRevenue?: number;
  totalRevenue: number;
  totalPenalties: number;
  totalDeposits: number;
  depositLiability?: number;
  netRevenue: number;
  projectedRevenue?: number;
  averageCompletedTicket?: number;
  averagePenaltyPerCompletedRental?: number;
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
  statusBreakdown?: Array<{
    status: string;
    count: number;
    revenue: number;
  }>;
  transactions?: Array<{
    rentalId: string | number;
    renterUserId: string;
    renterDisplayName?: string | null;
    carId: string | number;
    status: string;
    startDate: string;
    expectedEndDate: string;
    actualEndDate?: string | null;
    durationDays: number;
    totalCost: number;
    penaltyAmount: number;
    depositAmount: number;
    depositToReturn: number;
    recognizedRevenue: number;
    systemCommission?: number;
    landlordEarnings?: number;
  }>;
  revenueTimeline?: Array<{
    period: string;
    recognizedRevenue: number;
    penalties: number;
    rentalsCompleted: number;
  }>;
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
      systemRevenue?: number;
      landlordRevenue?: number;
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
  /** Пагінація (передається в car-service через api-gateway) */
  page?: number;
  limit?: number;
}

export interface RentalSearchParams {
  clientId?: number | string;
  carId?: number | string;
  status?: 'pending' | 'active' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  searchQuery?: string; // Пошук за ім'ям орендаря або маркою авто
}
