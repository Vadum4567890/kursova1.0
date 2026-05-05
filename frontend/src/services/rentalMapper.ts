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
      ? (() => {
          const profile = renterRaw.profile as Record<string, unknown> | undefined;
          const fromProfile =
            profile && typeof profile === 'object'
              ? [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim()
              : '';
          const fullName = String(
            renterRaw.fullName || fromProfile || renterRaw.username || renterRaw.email || ''
          ).trim();
          return {
            id: renterRaw.id as string | number,
            email: String(renterRaw.email ?? ''),
            fullName: fullName || String(renterRaw.email ?? ''),
          };
        })()
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
    status: (['pending', 'active', 'completed', 'cancelled'].includes(String(raw.status))
      ? raw.status
      : 'active') as Rental['status'],
    ownerApprovalStatus: ['pending', 'approved', 'rejected'].includes(String(raw.ownerApprovalStatus))
      ? (String(raw.ownerApprovalStatus) as Rental['ownerApprovalStatus'])
      : undefined,
    lifecycleState: [
      'awaiting_owner_approval',
      'awaiting_pickup',
      'pickup_partially_confirmed',
      'pickup_disputed',
      'no_show',
      'active',
      'return_due',
      'return_partially_confirmed',
      'return_disputed',
      'completed',
      'cancelled',
    ].includes(String(raw.lifecycleState))
      ? (String(raw.lifecycleState) as Rental['lifecycleState'])
      : undefined,
    ownerUserId: raw.ownerUserId !== undefined && raw.ownerUserId !== null ? String(raw.ownerUserId) : undefined,
    reviewStatus: ['not_available', 'waiting', 'partial', 'published', 'expired'].includes(String(raw.reviewStatus))
      ? (String(raw.reviewStatus) as Rental['reviewStatus'])
      : undefined,
    reviewWindowClosesAt: raw.reviewWindowClosesAt ? iso(raw.reviewWindowClosesAt) : undefined,
    ownerReviewSubmittedAt: raw.ownerReviewSubmittedAt ? iso(raw.ownerReviewSubmittedAt) : undefined,
    renterReviewSubmittedAt: raw.renterReviewSubmittedAt ? iso(raw.renterReviewSubmittedAt) : undefined,
    pickupConfirmedByOwnerAt: raw.pickupConfirmedByOwnerAt ? iso(raw.pickupConfirmedByOwnerAt) : undefined,
    pickupConfirmedByRenterAt: raw.pickupConfirmedByRenterAt ? iso(raw.pickupConfirmedByRenterAt) : undefined,
    returnConfirmedByOwnerAt: raw.returnConfirmedByOwnerAt ? iso(raw.returnConfirmedByOwnerAt) : undefined,
    returnConfirmedByRenterAt: raw.returnConfirmedByRenterAt ? iso(raw.returnConfirmedByRenterAt) : undefined,
    adminResolvedAt: raw.adminResolvedAt ? iso(raw.adminResolvedAt) : undefined,
    adminResolvedByUserId:
      raw.adminResolvedByUserId !== undefined && raw.adminResolvedByUserId !== null
        ? String(raw.adminResolvedByUserId)
        : undefined,
    adminResolutionNote:
      raw.adminResolutionNote !== undefined && raw.adminResolutionNote !== null
        ? String(raw.adminResolutionNote)
        : undefined,
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
