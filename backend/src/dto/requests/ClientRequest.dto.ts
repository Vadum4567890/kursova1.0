/**
 * DTO for creating a new client
 */
export interface CreateClientDto {
  fullName: string;
  address: string;
  phone: string;
  email?: string;
}

/**
 * DTO for updating a client
 */
export interface UpdateClientDto {
  fullName?: string;
  address?: string;
  phone?: string;
  email?: string;
}

/**
 * DTO for registering or getting existing client
 */
export interface RegisterClientDto {
  fullName: string;
  address: string;
  phone: string;
}

