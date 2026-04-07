import { Rental } from '../interfaces';

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

function iso(d: unknown): string {
  if (!d) return '';
  if (typeof d === 'string') return d;
  if (d instanceof Date) return d.toISOString();
  try {
    return new Date(d as string | number).toISOString();
  } catch {
    return '';
  }
}

/**
 * Нормалізує відповідь rental-service (UUID id/carId, snake_case не очікується — entity camelCase).
 */
export function mapRentalFromApi(raw: Record<string, unknown> | null | undefined): Rental {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      carId: '',
      startDate: '',
      expectedEndDate: '',
      depositAmount: 0,
      totalCost: 0,
      penaltyAmount: 0,
      status: 'cancelled',
    };
  }
  const carRaw = raw.car as Record<string, unknown> | undefined;
  const car =
    carRaw && typeof carRaw === 'object'
      ? {
          id: (carRaw.id as number | string) ?? 0,
          brand: String(carRaw.brand ?? carRaw.make ?? ''),
          model: String(carRaw.model ?? ''),
          pricePerDay: num(carRaw.pricePerDay ?? carRaw.dailyRate),
        }
      : undefined;

  const renterRaw = raw.renter as Record<string, unknown> | undefined;
  const renter =
    renterRaw && typeof renterRaw === 'object'
      ? {
          id: renterRaw.id as string | number,
          email: String(renterRaw.email ?? ''),
          fullName: String(renterRaw.fullName ?? renterRaw.username ?? renterRaw.email ?? ''),
        }
      : undefined;

  return {
    id: raw.id as number | string,
    clientId: raw.clientId !== undefined ? num(raw.clientId) : undefined,
    renterUserId: raw.renterUserId !== undefined ? String(raw.renterUserId) : undefined,
    carId: (raw.carId as number | string) ?? 0,
    startDate: iso(raw.startDate),
    expectedEndDate: iso(raw.expectedEndDate),
    actualEndDate: raw.actualEndDate ? iso(raw.actualEndDate) : undefined,
    depositAmount: num(raw.depositAmount),
    totalCost: num(raw.totalCost),
    penaltyAmount: num(raw.penaltyAmount),
    status: (['active', 'completed', 'cancelled'].includes(String(raw.status))
      ? raw.status
      : 'active') as Rental['status'],
    client: raw.client as Rental['client'],
    renter,
    car,
    createdAt: raw.createdAt ? iso(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt ? iso(raw.updatedAt) : undefined,
  };
}

export function mapRentalsList(body: unknown): Rental[] {
  let rows: unknown[] = [];
  if (body && typeof body === 'object' && 'data' in body && Array.isArray((body as { data: unknown }).data)) {
    rows = (body as { data: unknown[] }).data;
  } else if (Array.isArray(body)) {
    rows = body;
  }
  return rows.map((r) => mapRentalFromApi(r as Record<string, unknown>));
}
