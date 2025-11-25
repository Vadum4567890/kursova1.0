import { User, UserRole } from '../../models/User.entity';
import { RegisterUserDto, UpdateProfileDto, UpdateUserDto } from '../requests/UserRequest.dto';
import { UserResponseDto } from '../responses/UserResponse.dto';

/**
 * Mapper for converting between User Entity and DTOs
 */
export class UserMapper {
  /**
   * Convert Entity to Response DTO (without password)
   */
  static toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      address: user.address,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Convert Register DTO to Entity partial
   */
  static fromRegisterDto(dto: RegisterUserDto): Partial<User> {
    return {
      username: dto.username,
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
      address: dto.address,
      role: dto.role || UserRole.EMPLOYEE,
    };
  }

  /**
   * Convert Update Profile DTO to Entity partial
   */
  static fromUpdateProfileDto(dto: UpdateProfileDto): Partial<User> {
    const entity: Partial<User> = {};
    
    if (dto.email !== undefined) entity.email = dto.email;
    if (dto.fullName !== undefined) entity.fullName = dto.fullName;
    if (dto.address !== undefined) entity.address = dto.address;

    return entity;
  }

  /**
   * Convert Update User DTO to Entity partial
   */
  static fromUpdateUserDto(dto: UpdateUserDto): Partial<User> {
    const entity: Partial<User> = {};
    
    if (dto.email !== undefined) entity.email = dto.email;
    if (dto.fullName !== undefined) entity.fullName = dto.fullName;
    if (dto.address !== undefined) entity.address = dto.address;
    if (dto.password !== undefined) entity.password = dto.password; 

    return entity;
  }

  /**
   * Convert multiple entities to response DTOs
   */
  static toResponseDtoList(users: User[]): UserResponseDto[] {
    return users.map(user => this.toResponseDto(user));
  }
}

