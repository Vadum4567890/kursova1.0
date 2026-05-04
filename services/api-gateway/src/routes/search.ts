import { Request, Response, Router } from 'express';

const SERVICE_URLS = {
  users: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  cars: process.env.CAR_SERVICE_URL || 'http://localhost:3003',
  rentals: process.env.RENTAL_SERVICE_URL || 'http://localhost:3004',
} as const;

const SERVICE_API_KEY = process.env.SERVICE_API_KEY || 'internal-service-key';

function getInternalHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'X-Service-Key': SERVICE_API_KEY,
    ...extra,
  };
}

async function readJsonResponse<T>(response: globalThis.Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

async function fetchServiceJson<T>(url: string): Promise<{ status: number; body: T }> {
  const response = await fetch(url, {
    headers: getInternalHeaders(),
    signal: AbortSignal.timeout(15000),
  });

  return {
    status: response.status,
    body: await readJsonResponse<T>(response),
  };
}

export function mapCarSearchBody(body: Record<string, unknown>): Record<string, string> {
  const params = new URLSearchParams();
  const minPrice = body.minPrice;
  const maxPrice = body.maxPrice;
  if (minPrice !== undefined && minPrice !== '') params.set('minPrice', String(Number(minPrice)));
  if (maxPrice !== undefined && maxPrice !== '') params.set('maxPrice', String(Number(maxPrice)));

  const type = String(body.type || '').toLowerCase();
  if (type === 'business') params.set('category', 'comfort');
  else if (['economy', 'premium', 'suv', 'luxury', 'comfort'].includes(type)) params.set('category', type);

  const status = String(body.status || '').toLowerCase();
  if (status === 'available') params.set('status', 'active');
  else if (['rented', 'maintenance', 'active', 'inactive'].includes(status)) params.set('status', status);

  const brand = String(body.brand || '').trim();
  const model = String(body.model || '').trim();
  const searchQuery = [brand, model].filter(Boolean).join(' ').trim();
  if (searchQuery) {
    params.set('searchQuery', searchQuery);
  }

  const page = body.page;
  const limit = body.limit;
  if (page !== undefined && page !== '') {
    const p = Math.max(1, Math.floor(Number(page)));
    if (Number.isFinite(p)) params.set('page', String(p));
  }
  if (limit !== undefined && limit !== '') {
    const l = Math.min(100, Math.max(1, Math.floor(Number(limit))));
    if (Number.isFinite(l)) params.set('limit', String(l));
  }

  return Object.fromEntries(params.entries());
}

export function extractArrayPayload(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data as Record<string, unknown>[];
  }

  if (data && typeof data === 'object' && 'data' in data) {
    const nested = (data as { data?: unknown }).data;
    return Array.isArray(nested) ? (nested as Record<string, unknown>[]) : [];
  }

  return [];
}

interface ServiceClientRecord {
  id: string;
  fullName: string;
  address: string;
  phone: string;
  email: string | null;
  registrationDate: string;
  role?: 'renter' | 'owner' | 'both';
}

async function fetchClientsFromUserService(searchQuery?: string): Promise<ServiceClientRecord[]> {
  try {
    const qs =
      searchQuery !== undefined && searchQuery !== ''
        ? `?q=${encodeURIComponent(searchQuery)}`
        : '';
    const { status, body } = await fetchServiceJson<unknown>(
      `${SERVICE_URLS.users}/api/users/clients${qs}`
    );
    if (status >= 400) return [];
    const rows = extractArrayPayload(body);
    return rows as unknown as ServiceClientRecord[];
  } catch {
    return [];
  }
}

function matchesClientSearchTokens(row: ServiceClientRecord, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const fields = [
    String(row.id ?? ''),
    row.fullName ?? '',
    row.phone ?? '',
    row.email ?? '',
    row.address ?? '',
  ].map((v) => String(v).toLowerCase());
  const phoneDigits = String(row.phone ?? '').replace(/\D/g, '');
  return tokens.every((token) => {
    if (fields.some((f) => f.includes(token))) return true;
    const td = token.replace(/\D/g, '');
    if (td.length >= 2 && phoneDigits.includes(td)) return true;
    return false;
  });
}

function mergeSearchClientLists(
  fromService: ServiceClientRecord[],
  fromDev: ServiceClientRecord[]
): ServiceClientRecord[] {
  const map = new Map<string, ServiceClientRecord>();
  for (const d of fromDev) {
    const em = String(d.email || '').trim().toLowerCase();
    const key = em ? `e:${em}` : `id:${d.id}`;
    map.set(key, d);
  }
  for (const s of fromService) {
    const em = String(s.email || '').trim().toLowerCase();
    const key = em ? `e:${em}` : `id:${s.id}`;
    map.set(key, s);
  }
  return [...map.values()];
}

export function createSearchRouter(devUserHelpers: {
  getAllDevUsers: () => Array<{ id: number; username: string; email: string; role: string; fullName?: string; address?: string; phone?: string; password: string }>;
  isDevCustomerUser: (user: any) => boolean;
  devUserToServiceClientRecord: (user: any) => ServiceClientRecord;
}): Router {
  const router = Router();

  router.post('/cars', async (req: Request, res: Response) => {
    try {
      const params = new URLSearchParams(mapCarSearchBody((req.body || {}) as Record<string, unknown>));
      const { status, body } = await fetchServiceJson<unknown>(
        `${SERVICE_URLS.cars}/api/cars/search${params.toString() ? `?${params.toString()}` : ''}`
      );
      const list = extractArrayPayload(body);
      const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
      const total = typeof b.total === 'number' ? b.total : list.length;
      const page = typeof b.page === 'number' ? b.page : 1;
      const limit =
        typeof b.limit === 'number' ? b.limit : list.length > 0 ? list.length : 12;
      const totalPages =
        typeof b.totalPages === 'number'
          ? b.totalPages
          : Math.max(1, Math.ceil(total / (limit || 1)));
      res.status(status < 500 ? status : 200).json({
        data: list,
        total,
        page,
        limit,
        totalPages,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(502).json({
        success: false,
        error: { message: 'Car search failed', detail: message },
        data: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 1,
      });
    }
  });

  router.get('/clients', async (req: Request, res: Response) => {
    const q = String(req.query.q || '').trim();
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);

    try {
      const fromService = await fetchClientsFromUserService(q);
      const filteredFromService = fromService.filter((row) => matchesClientSearchTokens(row, tokens));
      const devCandidates = devUserHelpers.getAllDevUsers()
        .filter(devUserHelpers.isDevCustomerUser)
        .map(devUserHelpers.devUserToServiceClientRecord)
        .filter((row) => matchesClientSearchTokens(row, tokens));

      const merged = mergeSearchClientLists(filteredFromService, devCandidates);
      res.json({ data: merged });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[api/search/clients]', message);
      res.status(502).json({
        success: false,
        error: { message: 'Client search failed', detail: message },
        data: [],
      });
    }
  });

  router.post('/rentals', async (req: Request, res: Response) => {
    try {
      const { status, body } = await fetchServiceJson<unknown>(`${SERVICE_URLS.rentals}/api/rentals`);
      const rows = extractArrayPayload(body);
      const filters = (req.body || {}) as Record<string, unknown>;
      const requestedStatus = filters.status ? String(filters.status) : undefined;
      const carId = filters.carId != null ? String(filters.carId) : undefined;
      const clientId = filters.clientId != null ? String(filters.clientId) : undefined;
      const searchQuery = filters.searchQuery ? String(filters.searchQuery).toLowerCase().trim() : undefined;
      const startDate = filters.startDate ? new Date(String(filters.startDate)).getTime() : undefined;
      const endDate = filters.endDate ? new Date(String(filters.endDate)).getTime() : undefined;

      const filtered = rows.filter((row) => {
        if (requestedStatus && String(row.status) !== requestedStatus) return false;
        if (carId && String(row.carId) !== carId) return false;
        if (clientId) {
          const rowClientId = String(row.renterUserId ?? row.clientId ?? '');
          if (rowClientId !== clientId && !rowClientId.includes(clientId)) return false;
        }

        if (searchQuery) {
          const renter = row.renter as { fullName?: string; email?: string } | undefined;
          const car = row.car as { brand?: string; model?: string } | undefined;

          const renterName = String(renter?.fullName ?? renter?.email ?? '').toLowerCase();
          const carBrand = String(car?.brand ?? '').toLowerCase();
          const carModel = String(car?.model ?? '').toLowerCase();
          const carFullName = `${carBrand} ${carModel}`.trim();

          if (!renterName.includes(searchQuery) &&
              !carBrand.includes(searchQuery) &&
              !carModel.includes(searchQuery) &&
              !carFullName.includes(searchQuery)) {
            return false;
          }
        }

        if (startDate != null && row.startDate && new Date(String(row.startDate)).getTime() < startDate) return false;
        if (endDate != null && row.expectedEndDate && new Date(String(row.expectedEndDate)).getTime() > endDate) return false;
        return true;
      });

      res.status(status < 500 ? status : 200).json({ data: filtered });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(502).json({
        success: false,
        error: { message: 'Rental search failed', detail: message },
        data: [],
      });
    }
  });

  return router;
}
