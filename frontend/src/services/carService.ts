import api from './api';
import { Car, CarFilters } from '../interfaces';
import { PaginatedResponse } from '../types/common';
import {
  emptyCarPaginated,
  emptyMyCars,
  isUpstreamUnavailable,
} from '../utils/upstreamErrors';

type CarServiceDto = any;

/** Мапінг UI (brand/type/available) ↔ car-service (make/category/active) */
function mapUiCategoryToService(type?: string): string {
  const t = (type || 'economy').toLowerCase();
  if (t === 'business') return 'comfort';
  const direct = ['economy', 'premium', 'suv', 'luxury', 'comfort'];
  if (direct.includes(t)) return t;
  return 'economy';
}

function mapServiceCategoryToUi(category?: string): Car['type'] {
  const c = (category || 'economy').toLowerCase();
  if (c === 'comfort') return 'business';
  if (['economy', 'premium', 'suv', 'luxury'].includes(c)) return c as Car['type'];
  return 'economy';
}

function mapUiStatusToService(status?: Car['status']): string {
  const s = status || 'available';
  if (s === 'available') return 'active';
  return s;
}

function mapServiceStatusToUi(status?: string): Car['status'] {
  const s = (status || '').toLowerCase();
  if (s === 'active') return 'available';
  if (s === 'rented' || s === 'maintenance') return s;
  return 'available';
}

function mapFuelToService(fuel?: string): string {
  const f = (fuel || 'gasoline').toLowerCase();
  const m: Record<string, string> = {
    gasoline: 'petrol',
    gas: 'petrol',
    petrol: 'petrol',
    diesel: 'diesel',
    hybrid: 'hybrid',
    electric: 'electric',
  };
  return m[f] || 'petrol';
}

function mapFuelToUi(fuel?: string): string | undefined {
  const f = (fuel || '').toLowerCase();
  if (f === 'petrol') return 'gasoline';
  if (['diesel', 'hybrid', 'electric'].includes(f)) return f;
  return fuel || undefined;
}

export function mapCarFormToCreateBody(form: Partial<Car>): Record<string, unknown> {
  const transmission = (form.transmission || 'manual').toLowerCase();
  const tr = ['manual', 'automatic', 'cvt'].includes(transmission) ? transmission : 'manual';

  return {
    make: form.brand ?? '',
    model: form.model ?? '',
    year: form.year ?? new Date().getFullYear(),
    category: mapUiCategoryToService(form.type),
    transmission: tr,
    fuelType: mapFuelToService(form.fuelType),
    seats: form.seats ?? 5,
    mileage: form.mileage,
    color: form.color || undefined,
    description: form.description || undefined,
    instantBook: false,
    dailyRate: form.pricePerDay ?? 0,
    depositAmount: form.deposit ?? 0,
  };
}

function mapCarFormToUpdateBody(form: Partial<Car>): Record<string, unknown> {
  const full = mapCarFormToCreateBody(form);
  const { dailyRate, depositAmount, ...rest } = full;
  return {
    ...rest,
    ...(form.status !== undefined && { status: mapUiStatusToService(form.status) }),
  };
}

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
    type: mapServiceCategoryToUi(dto.category ?? dto.type),
    pricePerDay:
      Number(pricing.dailyRate ?? dto.pricePerDay ?? 0) || 0,
    deposit:
      Number(pricing.depositAmount ?? dto.deposit ?? 0) || 0,
    status: mapServiceStatusToUi(dto.status),
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
    fuelType: mapFuelToUi(dto.fuelType) || dto.fuelType,
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
    try {
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
    } catch (err) {
      if (isUpstreamUnavailable(err)) return emptyCarPaginated();
      throw err;
    }
  },

  async getAvailableCars(filters?: CarFilters): Promise<PaginatedResponse<Car>> {
    try {
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
    } catch (err) {
      if (isUpstreamUnavailable(err)) return emptyCarPaginated();
      throw err;
    }
  },

  async getCarById(id: number | string): Promise<Car> {
    try {
      const response = await api.get<any>(`/cars/${id}`);
      const data = response.data;
      if (data && 'success' in data && data.data) {
        return mapCarFromService(data.data);
      }
      return mapCarFromService(data);
    } catch (err) {
      if (isUpstreamUnavailable(err)) {
        throw new Error('Сервіс автомобілів тимчасово недоступний. Спробуйте пізніше.');
      }
      throw err;
    }
  },

  async getCarsByType(type: string, filters?: CarFilters): Promise<PaginatedResponse<Car>> {
    try {
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
    } catch (err) {
      if (isUpstreamUnavailable(err)) return emptyCarPaginated();
      throw err;
    }
  },

  async createCar(data: Partial<Car>): Promise<Car> {
    const response = await api.post<any>('/cars', mapCarFormToCreateBody(data));
    const resData = response.data;
    const dto = 'success' in resData ? resData.data : resData;
    const car = mapCarFromService(dto);

    // Save images after creation (main first, then additional)
    const imageList: Array<{ url: string; isPrimary: boolean; order: number }> = [];
    if (data.imageUrl) imageList.push({ url: data.imageUrl, isPrimary: true, order: 0 });
    (data.imageUrls ?? []).forEach((url, i) => {
      if (url) imageList.push({ url, isPrimary: !data.imageUrl && i === 0, order: i + 1 });
    });
    if (imageList.length > 0) {
      await Promise.all(
        imageList.map((img) =>
          api.post(`/cars/${car.id}/images`, { imageUrl: img.url, isPrimary: img.isPrimary, displayOrder: img.order }).catch(() => {})
        )
      );
      return this.getCarById(car.id);
    }
    return car;
  },

  async updateCar(id: number | string, data: Partial<Car>): Promise<Car> {
    const full = mapCarFormToCreateBody(data);
    const { dailyRate, depositAmount } = full;
    const carOnly = mapCarFormToUpdateBody(data);
    await api.put(`/cars/${id}`, carOnly);
    await api.post(`/cars/${id}/pricing`, {
      dailyRate: Number(data.pricePerDay ?? dailyRate ?? 0),
      depositAmount: Number(data.deposit ?? depositAmount ?? 0),
      depositRequired: Number(data.deposit ?? depositAmount ?? 0) > 0,
      currency: 'UAH',
    });
    // Save new images if provided
    const imageList: Array<{ url: string; isPrimary: boolean; order: number }> = [];
    if (data.imageUrl) imageList.push({ url: data.imageUrl, isPrimary: true, order: 0 });
    (data.imageUrls ?? []).forEach((url, i) => {
      if (url) imageList.push({ url, isPrimary: !data.imageUrl && i === 0, order: i + 1 });
    });
    if (imageList.length > 0) {
      await Promise.all(
        imageList.map((img) =>
          api.post(`/cars/${id}/images`, { imageUrl: img.url, isPrimary: img.isPrimary, displayOrder: img.order }).catch(() => {})
        )
      );
    }
    return this.getCarById(id);
  },

  async updateCarStatus(id: number | string, status: Car['status']): Promise<Car> {
    const response = await api.patch<any>(`/cars/${id}/status`, {
      status: mapUiStatusToService(status),
    });
    const resData = response.data;
    const dto = resData?.data ?? resData;
    return mapCarFromService(dto);
  },

  async deleteCar(id: number | string): Promise<void> {
    await api.delete(`/cars/${id}`);
  },

  async getBookedDates(id: number | string): Promise<Array<{ startDate: string; endDate: string }>> {
    try {
      const response = await api.get<{ success?: boolean; data: Array<{ startDate: string; endDate: string }> }>(
        `/rentals/car/${id}/booked-dates`
      );
      const body = response.data;
      const rows = 'data' in body && Array.isArray(body.data) ? body.data : [];
      return rows.map((r) => ({
        startDate: typeof r.startDate === 'string' ? r.startDate : String((r as any).startDate),
        endDate: typeof r.endDate === 'string' ? r.endDate : String((r as any).endDate),
      }));
    } catch (err) {
      if (isUpstreamUnavailable(err)) return [];
      throw err;
    }
  },

  /** Marketplace: cars of current user (owner) */
  async getMyCars(): Promise<{ data: Car[]; count: number }> {
    try {
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
    } catch (err) {
      if (isUpstreamUnavailable(err)) return emptyMyCars();
      throw err;
    }
  },
};

