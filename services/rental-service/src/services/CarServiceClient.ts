import axios from 'axios';
import logger from '../utils/logger';

export interface CarPricingInfo {
  carId: string;
  dailyRate: number;
  depositAmount: number | null;
  hourlyRate?: number | null;
  weeklyRate?: number | null;
  monthlyRate?: number | null;
}

export interface CarInfo {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  status: string;
  pricing?: CarPricingInfo;
}

/**
 * HTTP client for Car Service.
 * Used to get car details, pricing, and update status (e.g. rented/available).
 */
export class CarServiceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.CAR_SERVICE_URL || 'http://localhost:3003';
  }

  private isUuidLike(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  async getCarById(carId: string): Promise<CarInfo | null> {
    try {
      // In microservice mode, car-service expects UUID ids.
      // If we got a legacy numeric id (e.g. "9" or "10"), treat it as "car not found"
      // instead of letting car-service/Postgres throw 500 (invalid uuid syntax).
      if (!this.isUuidLike(carId)) {
        logger.warn('Skipping car lookup for non-UUID carId in microservice mode', { carId });
        return null;
      }

      const response = await axios.get(`${this.baseUrl}/api/cars/${carId}`, {
        timeout: 5000,
        headers: {
          'X-Service-Key': process.env.SERVICE_API_KEY || 'internal-service-key',
        },
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.warn('Car lookup failed; treating as not found', { carId, err: error.message });
      return null;
    }
  }

  /**
   * Check if car exists, is not deleted/maintenance, and return pricing for cost calculation.
   */
  async getCarForRental(carId: string): Promise<{ car: CarInfo; dailyRate: number; depositAmount: number } | null> {
    const car = await this.getCarById(carId);
    if (!car) return null;

    const status = (car.status || '').toLowerCase();
    if (status === 'maintenance' || status === 'deleted' || status === 'inactive') {
      return null;
    }

    let dailyRate = 0;
    let depositAmount = 0;
    if (car.pricing) {
      dailyRate = Number(car.pricing.dailyRate) || 0;
      depositAmount = Number(car.pricing.depositAmount) || 0;
    }
    return { car, dailyRate, depositAmount };
  }

  /**
   * Update car status (e.g. rented / active). Requires car-service to expose PATCH /api/cars/:id/status.
   */
  async updateCarStatus(carId: string, status: string): Promise<boolean> {
    try {
      await axios.patch(
        `${this.baseUrl}/api/cars/${carId}/status`,
        { status },
        {
          timeout: 5000,
          headers: {
            'X-Service-Key': process.env.SERVICE_API_KEY || 'internal-service-key',
          },
        }
      );
      return true;
    } catch (error: any) {
      logger.warn('Failed to update car status (car-service may not support it yet)', {
        carId,
        status,
        error: error.message,
      });
      return false;
    }
  }
}
