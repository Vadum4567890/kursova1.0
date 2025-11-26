/**
 * Domain entities - core business models
 * These interfaces represent the main entities in the application
 */

export interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  type: 'economy' | 'business' | 'premium';
  pricePerDay: number;
  deposit: number;
  status: 'available' | 'rented' | 'maintenance';
  description?: string;
  imageUrl?: string;
  imageUrls?: string[]; // Multiple images
  // Additional specifications
  bodyType?: string;
  driveType?: string;
  transmission?: string;
  engine?: string;
  fuelType?: string;
  seats?: number;
  mileage?: number;
  color?: string;
  features?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Rental {
  id: number;
  clientId: number;
  carId: number;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  depositAmount: number;
  totalCost: number;
  penaltyAmount: number;
  status: 'active' | 'completed' | 'cancelled';
  client?: {
    id: number;
    fullName: string;
    phone: string;
  };
  car?: {
    id: number;
    brand: string;
    model: string;
    pricePerDay: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'employee' | 'user';
  fullName?: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: number;
  fullName: string;
  address: string;
  phone: string;
  email?: string;
  registrationDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Penalty {
  id: number;
  rentalId: number;
  amount: number;
  reason: string;
  date?: string; // Legacy field, use createdAt instead
  status?: 'pending' | 'paid'; // Optional for backward compatibility
  createdAt?: string;
  updatedAt?: string;
  rental?: {
    id: number;
    clientId?: number;
    carId?: number;
    client?: {
      fullName: string;
    };
    car?: {
      brand: string;
      model: string;
    };
  };
}

