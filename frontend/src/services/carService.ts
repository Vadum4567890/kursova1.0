import api from './api';
import { Car, CarFilters } from '../interfaces';
import { PaginatedResponse } from '../types/common';

type CarServiceDto = any;

function mapCarFromService(dto: CarServiceDto): Car {
  if (!dto) {
    return {
      id: 0,
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      type: 'economy',
      pricePerDay: 0,
      deposit: 0,
      status: 'available',
    };
  }

  const pricing = dto.pricing || {};
  const images = dto.images || [];
  const primaryImage =
    images.find((img: any) => img.isPrimary) || images[0] || null;

  return {
    id: dto.id,
    ownerId: dto.ownerId ?? null,
    brand: dto.make ?? dto.brand ?? '',
    model: dto.model ?? '',
    year: dto.year ?? new Date().getFullYear(),
    type: dto.category ?? dto.type ?? 'economy',
    pricePerDay:
      Number(pricing.dailyRate ?? dto.pricePerDay ?? 0) || 0,
    deposit:
      Number(pricing.depositAmount ?? dto.deposit ?? 0) || 0,
    status: dto.status ?? 'available',
    description: dto.description ?? '',
    imageUrl: primaryImage?.imageUrl ?? dto.imageUrl,
    imageUrls:
      images.length > 0
        ? images.map((img: any) => img.imageUrl)
        : dto.imageUrls ?? [],
    bodyType: dto.bodyType,
    driveType: dto.driveType,
    transmission: dto.transmission,
    engine:
      typeof dto.engine === 'number'
        ? String(dto.engine)
        : dto.engine,
    fuelType: dto.fuelType,
    seats: dto.seats,
    mileage: dto.mileage,
    color: dto.color,
    features: dto.features,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export const carService = {
  async getAllCars(filters?: CarFilters): Promise<PaginatedResponse<Car>> {
    const response = await api.get<any>('/cars', { params: filters });
    const data = response.data;

    if ('success' in data && Array.isArray(data.data)) {
      return {
        data: data.data.map(mapCarFromService),
        total: data.count ?? data.data.length,
        page: data.page ?? 1,
        limit: data.limit ?? data.data.length,
        totalPages: data.totalPages ?? 1,
      };
    }

    return data;
  },

  async getAvailableCars(filters?: CarFilters): Promise<PaginatedResponse<Car>> {
    const response = await api.get<any>('/cars/available', { params: filters });
    const data = response.data;
    if ('success' in data && Array.isArray(data.data)) {
      return {
        data: data.data.map(mapCarFromService),
        total: data.count ?? data.data.length,
        page: data.page ?? 1,
        limit: data.limit ?? data.data.length,
        totalPages: data.totalPages ?? 1,
      };
    }
    return data;
  },

  async getCarById(id: number | string): Promise<Car> {
    const response = await api.get<any>(`/cars/${id}`);
    const data = response.data;
    if (data && 'success' in data && data.data) {
      return mapCarFromService(data.data);
    }
    return mapCarFromService(data);
  },

  async getCarsByType(type: string, filters?: CarFilters): Promise<PaginatedResponse<Car>> {
    const response = await api.get<any>(`/cars/type/${type}`, {
      params: filters,
    });
    const data = response.data;
    if ('success' in data && Array.isArray(data.data)) {
      return {
        data: data.data.map(mapCarFromService),
        total: data.count ?? data.data.length,
        page: data.page ?? 1,
        limit: data.limit ?? data.data.length,
        totalPages: data.totalPages ?? 1,
      };
    }
    return data;
  },

  async createCar(data: any): Promise<Car> {
    const response = await api.post<any>('/cars', data);
    const resData = response.data;
    const dto = 'success' in resData ? resData.data : resData;
    return mapCarFromService(dto);
  },

  async updateCar(id: number, data: any): Promise<Car> {
    const response = await api.put<{ data: Car }>(`/cars/${id}`, data);
    return response.data.data;
  },

  async updateCarStatus(id: number, status: Car['status']): Promise<Car> {
    const response = await api.patch<{ data: Car }>(`/cars/${id}/status`, { status });
    return response.data.data;
  },

  async deleteCar(id: number): Promise<void> {
    await api.delete(`/cars/${id}`);
  },

  async getBookedDates(id: number | string): Promise<Array<{ startDate: string; endDate: string }>> {
    const response = await api.get<Array<{ startDate: string; endDate: string }>>(`/cars/${id}/booked-dates`);
    return response.data;
  },

  /** Marketplace: cars of current user (owner) */
  async getMyCars(): Promise<{ data: Car[]; count: number }> {
    const response = await api.get<any>('/cars/my');
    const data = response.data;
    if ('success' in data && Array.isArray(data.data)) {
      return {
        data: data.data.map(mapCarFromService),
        count: data.count ?? data.data.length,
      };
    }
    return {
      data: (data.data as Car[] | undefined) ?? [],
      count: data.count ?? (data.data?.length ?? 0),
    };
  },
};

