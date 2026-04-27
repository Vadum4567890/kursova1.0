import api from './api';
import { Car } from '../interfaces';

export type AiPriceSuggestion = {
  pricePerDay: number;
  deposit: number;
  confidence: 'low' | 'medium' | 'high';
  reasons: string[];
  warnings: string[];
  provider?: 'openai' | 'heuristic';
};

type WrappedResponse = { success?: boolean; data?: AiPriceSuggestion };

function isAiPriceSuggestion(value: unknown): value is AiPriceSuggestion {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.pricePerDay === 'number' && typeof row.deposit === 'number';
}

export const aiPricingService = {
  async getCarPriceSuggestion(formData: Partial<Car>): Promise<AiPriceSuggestion> {
    const response = await api.post<WrappedResponse>('/ai/car-price-suggestion', {
      brand: formData.brand,
      model: formData.model,
      year: formData.year,
      type: formData.type,
      bodyType: formData.bodyType,
      driveType: formData.driveType,
      transmission: formData.transmission,
      engine: formData.engine,
      fuelType: formData.fuelType,
      seats: formData.seats,
      mileage: formData.mileage,
      color: formData.color,
      features: formData.features,
      description: formData.description,
    });

    const data: unknown = response.data?.data ?? response.data;
    if (!isAiPriceSuggestion(data)) {
      throw new Error('Некоректна відповідь AI сервісу');
    }
    return data;
  },
};

