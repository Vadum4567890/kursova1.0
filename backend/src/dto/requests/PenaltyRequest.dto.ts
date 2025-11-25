/**
 * DTO for creating a new penalty
 */
export interface CreatePenaltyDto {
  rentalId: number;
  amount: number;
  reason: string;
}

/**
 * DTO for updating a penalty
 */
export interface UpdatePenaltyDto {
  amount?: number;
  reason?: string;
}

