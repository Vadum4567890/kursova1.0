/**
 * DTO for client response (without relations)
 */
export interface ClientResponseDto {
  id: number;
  fullName: string;
  address: string;
  phone: string;
  email?: string;
  registrationDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for client with rental statistics
 */
export interface ClientWithStatsDto extends ClientResponseDto {
  rentalCount?: number;
  totalSpent?: number;
  lastRentalDate?: Date;
}

