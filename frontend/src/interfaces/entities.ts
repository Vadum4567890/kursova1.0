/**
 * Domain entities - core business models
 * These interfaces represent the main entities in the application
 */

export interface Car {
  id: number | string; // string when from car-service (UUID)
  ownerId?: number | null | string;
  brand: string;
  model: string;
  year: number;
  type: 'economy' | 'business' | 'premium' | 'suv' | 'luxury';
  pricePerDay: number;
  deposit: number;
  status: 'available' | 'rented' | 'maintenance';
  description?: string;
  imageUrl?: string;
  imageUrls?: string[]; // Multiple images
  images?: Array<{ imageUrl: string; isPrimary?: boolean }>; // Images from backend
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
  instantBook?: boolean;
  unavailableDates?: string[];
}

export interface Rental {
  /** UUID (rental-service) або числовий id (legacy) */
  id: number | string;
  clientId?: number;
  renterUserId?: string;
  carId: number | string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  depositAmount: number;
  totalCost: number;
  penaltyAmount: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  ownerApprovalStatus?: 'pending' | 'approved' | 'rejected';
  lifecycleState?:
    | 'awaiting_owner_approval'
    | 'awaiting_pickup'
    | 'pickup_partially_confirmed'
    | 'pickup_disputed'
    | 'no_show'
    | 'active'
    | 'return_due'
    | 'return_partially_confirmed'
    | 'return_disputed'
    | 'completed'
    | 'cancelled';
  ownerUserId?: string | null;
  reviewStatus?: 'not_available' | 'waiting' | 'partial' | 'published' | 'expired';
  reviewWindowClosesAt?: string;
  ownerReviewSubmittedAt?: string;
  renterReviewSubmittedAt?: string;
  pickupConfirmedByOwnerAt?: string;
  pickupConfirmedByRenterAt?: string;
  returnConfirmedByOwnerAt?: string;
  returnConfirmedByRenterAt?: string;
  adminResolvedAt?: string;
  adminResolvedByUserId?: string | null;
  adminResolutionNote?: string | null;
  resolutions?: RentalResolution[];
  client?: {
    id: number;
    fullName: string;
    phone: string;
  };
  renter?: {
    id: number | string;
    email: string;
    fullName: string;
  };
  car?: {
    id: number | string;
    brand: string;
    model: string;
    pricePerDay: number;
    year?: number;
    imageUrl?: string;
    imageUrls?: string[];
    images?: Array<{ imageUrl: string; isPrimary?: boolean }>;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface RentalResolution {
  id: string;
  action: string;
  resolutionType:
    | 'admin_activated'
    | 'admin_completed'
    | 'renter_no_show'
    | 'owner_no_show'
    | 'mutual_cancel'
    | 'admin_cancel'
    | 'pickup_dispute'
    | 'return_dispute';
  previousStatus: Rental['status'];
  nextStatus: Rental['status'];
  previousLifecycleState?: Rental['lifecycleState'];
  nextLifecycleState?: Rental['lifecycleState'];
  penaltyAmount: number;
  depositRefundAmount: number;
  note?: string | null;
  actorUserId: string;
  actorRole: string;
  createdAt: string;
}

export interface ReviewableBooking {
  bookingId: string;
  carId: number | string;
  ownerUserId?: string | null;
  renterUserId?: string;
  role: 'owner' | 'renter';
  reviewStatus: 'waiting' | 'partial' | 'published' | 'expired' | 'not_available';
  reviewWindowClosesAt?: string;
  myReviewSubmitted?: boolean;
  counterpartyReviewSubmitted?: boolean;
  canSubmit?: boolean;
  myReview?: Review | null;
}

export interface BookingReviewStatus {
  bookingId: string;
  canSubmit: boolean;
  myReviewSubmitted: boolean;
  counterpartyReviewSubmitted: boolean;
  published: boolean;
  expired: boolean;
  reviewStatus: 'waiting' | 'partial' | 'published' | 'expired' | 'not_available';
  reviewWindowClosesAt?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  reviewerUserId: string;
  revieweeUserId: string;
  carId: string;
  reviewType: 'owner_to_renter' | 'renter_to_owner_and_car';
  revieweeType: 'owner' | 'renter';
  status: 'submitted' | 'published' | 'expired';
  comment?: string | null;
  submittedAt: string;
  publishedAt?: string | null;
  scores: Record<string, number>;
}

export interface CarRatingSummary {
  carId: string;
  rating: number;
  reviewsCount: number;
  cleanlinessAvg: number;
  technicalConditionAvg: number;
  accuracyOfDescriptionAvg: number;
  completedRentalsCount: number;
}

export interface UserRatingSummary {
  userId: string;
  rating: number;
  reviewsCount: number;
  asRenterRating: number;
  asRenterCount: number;
  asOwnerRating: number;
  asOwnerCount: number;
  ownerCommunicationAvg: number;
  ownerHonestyAvg: number;
  ownerResponseSpeedAvg: number;
  renterReturnedOnTimeAvg: number;
  renterDamageFreeReturnAvg: number;
  renterBehaviorAvg: number;
  completedRentalsCount: number;
  updatedAt?: string;
}

export interface User {
  /** Числовий id (dev gateway) або UUID (user-service) */
  id: number | string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'employee' | 'user' | 'renter' | 'owner' | 'both';
  fullName?: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Client {
  id: number | string;
  fullName: string;
  address: string;
  phone: string;
  email?: string;
  /** З user-service: орендар / орендодавець / обидві ролі */
  role?: 'renter' | 'owner' | 'both';
  registrationDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Penalty {
  id: string | number;
  rentalId: string | number;
  amount: number;
  reason: string;
  date?: string; // Legacy field, use createdAt instead
  status?: 'pending' | 'paid'; // Optional for backward compatibility
  createdAt?: string;
  updatedAt?: string;
  rental?: {
    id: string | number;
    clientId?: number;
    carId?: number | string;
    client?: {
      fullName: string;
    };
    car?: {
      brand: string;
      model: string;
    };
  };
}
