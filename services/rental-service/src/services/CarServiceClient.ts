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
  instantBook?: boolean;
  pricing?: CarPricingInfo;
}

/**
 * HTTP client for Car Service.
 * Used to get car details, pricing, and update status (e.g. rented/available).
 */
export class CarServiceClient {
  private serviceApiKey(): string {
    return process.env.NODE_ENV === 'production'
      ? process.env.SERVICE_API_KEY || ''
      : process.env.SERVICE_API_KEY || 'internal-service-key';
  }

  private writeBaseUrl(): string {
    return (process.env.CAR_SERVICE_URL || 'http://localhost:3003').replace(/\/$/, '');
  }

  /** Спочатку gateway (той самий вхід, що й фронт), потім прямий car-service — якщо один недоступний, спрацює інший. */
  private getCandidateBaseUrls(): string[] {
    const gw = (process.env.GATEWAY_URL || '').replace(/\/$/, '').trim();
    const direct = (process.env.CAR_SERVICE_URL || '').trim();
    const out: string[] = [];
    if (gw) out.push(gw);
    if (direct && direct !== gw) out.push(direct);
    if (out.length === 0) out.push('http://localhost:3003');
    return out;
  }

  private isUuidLike(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  /** Accept { success, data }, { data }, or a bare car object; normalize ownerId. */
  private parseCarPayload(rawRoot: unknown): CarInfo | null {
    if (rawRoot == null || typeof rawRoot !== 'object') return null;
    const root = rawRoot as Record<string, unknown>;
    let inner: unknown = root;
    if ('data' in root && root.data != null && typeof root.data === 'object') {
      inner = root.data;
    }
    if (!inner || typeof inner !== 'object') return null;
    const d = inner as Record<string, unknown>;
    const id = d.id;
    const ownerNested =
      d.owner && typeof d.owner === 'object' && d.owner !== null ? (d.owner as Record<string, unknown>) : null;
    const ownerId =
      (typeof d.ownerId === 'string' && d.ownerId) ||
      (typeof d.owner_id === 'string' && d.owner_id) ||
      (ownerNested && typeof ownerNested.id === 'string' ? ownerNested.id : undefined);
    if (typeof id !== 'string' || !ownerId) {
      logger.warn('Car payload missing id or ownerId', { id, hasOwner: !!ownerId });
      return null;
    }
    return {
      id,
      ownerId,
      make: String(d.make ?? ''),
      model: String(d.model ?? ''),
      year: typeof d.year === 'number' ? d.year : Number(d.year) || 0,
      status: String(d.status ?? ''),
      instantBook: Boolean(d.instantBook),
      pricing: d.pricing as CarPricingInfo | undefined,
    };
  }

  private async fetchCarFromBase(baseUrl: string, carId: string): Promise<CarInfo | null> {
    try {
      const response = await axios.get(`${baseUrl}/api/cars/${encodeURIComponent(carId)}`, {
        timeout: 8000,
        headers: {
          'X-Service-Key': this.serviceApiKey(),
        },
      });

      const body = response.data;
      if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        if (b.success === false) return null;
        const parsed = this.parseCarPayload(body);
        if (parsed) return parsed;
      }
      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      logger.warn('Car lookup attempt failed', { baseUrl, carId, err: error.message });
      return null;
    }
  }

  /** Список авто власника (для прокатів / непрочитаних). */
  async getCarsByOwner(ownerId: string): Promise<CarInfo[]> {
    if (!ownerId) return [];
    const bases = this.getCandidateBaseUrls();
    for (const baseUrl of bases) {
      try {
        const response = await axios.get(
          `${baseUrl}/api/cars/owner/${encodeURIComponent(ownerId)}`,
          {
            timeout: 12000,
            headers: {
              'X-Service-Key': this.serviceApiKey(),
            },
          }
        );
        const body = response.data;
        if (body && typeof body === 'object') {
          const b = body as Record<string, unknown>;
          const raw = Array.isArray(b.data) ? b.data : [];
          const out: CarInfo[] = [];
          for (const item of raw) {
            const parsed = this.parseCarPayload(item);
            if (parsed) out.push(parsed);
          }
          return out;
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        logger.warn('getCarsByOwner attempt failed', { baseUrl, ownerId, err: msg });
      }
    }
    return [];
  }

  async getCarById(carId: string): Promise<CarInfo | null> {
    // In microservice mode, car-service expects UUID ids.
    if (!this.isUuidLike(carId)) {
      logger.warn('Skipping car lookup for non-UUID carId in microservice mode', { carId });
      return null;
    }

    const bases = this.getCandidateBaseUrls();
    for (const baseUrl of bases) {
      const car = await this.fetchCarFromBase(baseUrl, carId);
      if (car) return car;
    }
    logger.warn('Car not resolved from any base URL', { carId, bases });
    return null;
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
    for (const baseUrl of this.getCandidateBaseUrls()) {
      try {
        await axios.patch(
          `${baseUrl}/api/cars/${encodeURIComponent(carId)}/status`,
          { status },
          {
            timeout: 5000,
            headers: {
              'X-Service-Key': this.serviceApiKey(),
            },
          }
        );
        return true;
      } catch (error: any) {
        logger.warn('updateCarStatus attempt failed', { baseUrl, carId, status, err: error.message });
      }
    }
    return false;
  }

  async incrementCompletedRentals(carId: string): Promise<void> {
    await axios.post(
      `${this.writeBaseUrl()}/api/cars/${encodeURIComponent(carId)}/rating/completed-rental`,
      {},
      {
        timeout: 5000,
        headers: {
          'X-Service-Key': this.serviceApiKey(),
        },
      }
    );
  }

  async applyPublishedReviewAggregate(
    carId: string,
    payload: {
      overallScore: number;
      categories: Record<string, number>;
    }
  ): Promise<void> {
    await axios.post(
      `${this.writeBaseUrl()}/api/cars/${encodeURIComponent(carId)}/rating/aggregate`,
      payload,
      {
        timeout: 5000,
        headers: {
          'X-Service-Key': this.serviceApiKey(),
        },
      }
    );
  }
}
