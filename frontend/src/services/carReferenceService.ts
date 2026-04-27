import api from './api';

type WrappedList = { success?: boolean; data?: string[] };

const FALLBACK_MAKES = [
  'Acura', 'Alfa Romeo', 'Audi', 'Bentley', 'BMW', 'Bugatti', 'Buick', 'Cadillac', 'Chevrolet',
  'Chrysler', 'Citroen', 'Cupra', 'Dacia', 'Daewoo', 'Dodge', 'Ferrari', 'Fiat', 'Ford', 'Geely',
  'Genesis', 'GMC', 'Great Wall', 'Honda', 'Hyundai', 'Infiniti', 'Isuzu', 'Jaguar', 'Jeep', 'Kia',
  'Lada', 'Lamborghini', 'Land Rover', 'Lexus', 'Lincoln', 'Maserati', 'Mazda', 'McLaren',
  'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan', 'Opel', 'Peugeot', 'Porsche', 'Renault',
  'Rolls-Royce', 'Seat', 'Skoda', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo',
];

function unwrapList(payload: WrappedList | string[]): string[] {
  if (Array.isArray(payload)) return payload.map(String);
  if (Array.isArray(payload?.data)) return payload.data.map(String);
  return [];
}

export const carReferenceService = {
  async getMakes(): Promise<string[]> {
    try {
      const response = await api.get<WrappedList>('/reference/car-makes');
      const rows = unwrapList(response.data);
      return rows.length > 0 ? rows : FALLBACK_MAKES;
    } catch {
      return FALLBACK_MAKES;
    }
  },

  async getModels(make: string): Promise<string[]> {
    if (!make.trim()) return [];
    try {
      const response = await api.get<WrappedList>('/reference/car-models', { params: { make } });
      return unwrapList(response.data);
    } catch {
      return [];
    }
  },
};

