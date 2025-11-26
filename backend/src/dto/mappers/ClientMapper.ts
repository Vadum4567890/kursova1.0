import { Client } from '../../models/Client.entity';
import { CreateClientDto, UpdateClientDto } from '../requests/ClientRequest.dto';
import { ClientResponseDto } from '../responses/ClientResponse.dto';

/**
 * Mapper for converting between Client Entity and DTOs
 */
export class ClientMapper {
  /**
   * Convert Entity to Response DTO
   */
  static toResponseDto(client: Client): ClientResponseDto {
    return {
      id: client.id,
      fullName: client.fullName,
      address: client.address,
      phone: client.phone,
      email: client.email,
      registrationDate: client.registrationDate,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  }

  /**
   * Convert Create DTO to Entity partial
   */
  static fromCreateDto(dto: CreateClientDto): Partial<Client> {
    return {
      fullName: dto.fullName,
      address: dto.address,
      phone: dto.phone,
      email: dto.email,
    };
  }

  /**
   * Convert Update DTO to Entity partial
   */
  static fromUpdateDto(dto: UpdateClientDto): Partial<Client> {
    const entity: Partial<Client> = {};
    
    if (dto.fullName !== undefined) entity.fullName = dto.fullName;
    if (dto.address !== undefined) entity.address = dto.address;
    if (dto.phone !== undefined) entity.phone = dto.phone;
    if (dto.email !== undefined) entity.email = dto.email;

    return entity;
  }

  /**
   * Convert multiple entities to response DTOs
   */
  static toResponseDtoList(clients: Client[]): ClientResponseDto[] {
    return clients.map(client => this.toResponseDto(client));
  }
}

