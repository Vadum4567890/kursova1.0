import { fetchJson, internalHeaders } from './serviceHttp';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function fetchCarBrandModel(carId: string): Promise<{ brand: string; model: string } | null> {
  if (!isUuid(carId)) return null;
  const base = process.env.CAR_SERVICE_URL || 'http://localhost:3003';
  try {
    const body = await fetchJson<{ success?: boolean; data?: { make?: string; brand?: string; model?: string } }>(
      `${base}/api/cars/${carId}`,
      { headers: internalHeaders() }
    );
    const d = body?.data;
    if (!d) return null;
    const brand = String(d.make ?? d.brand ?? '').trim();
    const model = String(d.model ?? '').trim();
    if (!brand && !model) return null;
    return { brand: brand || 'Авто', model: model || carId.slice(0, 8) };
  } catch {
    return null;
  }
}

export interface ReportingCarSnapshot {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  status: string;
  dailyRate: number;
}

export async function fetchCarsCatalog(limit: number = 1000): Promise<ReportingCarSnapshot[]> {
  const base = process.env.CAR_SERVICE_URL || 'http://localhost:3003';
  try {
    const body = await fetchJson<{
      data?: Array<{
        id: string;
        make?: string;
        brand?: string;
        model?: string;
        year?: number;
        category?: string;
        status?: string;
        pricing?: {
          dailyRate?: number;
        } | null;
      }>;
    }>(`${base}/api/cars?limit=${limit}`, {
      headers: internalHeaders(),
    });

    return (body?.data || []).map((car) => ({
      id: String(car.id),
      brand: String(car.make ?? car.brand ?? '').trim() || 'Авто',
      model: String(car.model ?? '').trim() || String(car.id).slice(0, 8),
      year: Number(car.year || 0),
      category: String(car.category ?? '').trim() || 'unknown',
      status: String(car.status ?? '').trim() || 'active',
      dailyRate: Number(car.pricing?.dailyRate || 0),
    }));
  } catch {
    return [];
  }
}
