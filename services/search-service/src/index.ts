import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import axios from 'axios';

const PORT = Number(process.env.PORT) || 3005;
const CAR_URL = process.env.CAR_SERVICE_URL || 'http://localhost:3003';
const RENTAL_URL = process.env.RENTAL_SERVICE_URL || 'http://localhost:3004';
const CLIENT_URL = process.env.CLIENT_SERVICE_URL || 'http://localhost:3007';
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || 'internal-service-key';

const app = express();
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'search-service', ts: new Date().toISOString() });
});

/** Мапінг тіла запиту фронта → query car-service SearchCarsDto */
export function mapCarSearchQuery(body: Record<string, unknown>): Record<string, string | number | boolean> {
  const q: Record<string, string | number | boolean> = {};
  const minPrice = body.minPrice;
  const maxPrice = body.maxPrice;
  if (minPrice !== undefined && minPrice !== '') q.minPrice = Number(minPrice);
  if (maxPrice !== undefined && maxPrice !== '') q.maxPrice = Number(maxPrice);

  const type = String(body.type || '').toLowerCase();
  if (type === 'business') q.category = 'comfort';
  else if (['economy', 'premium', 'suv', 'luxury', 'comfort'].includes(type)) q.category = type;

  const status = String(body.status || '').toLowerCase();
  if (status === 'available') q.status = 'active';
  else if (['rented', 'maintenance', 'active', 'inactive'].includes(status)) q.status = status;

  const brand = String(body.brand || '').trim();
  const model = String(body.model || '').trim();
  const parts = [brand, model].filter(Boolean);
  if (parts.length) q.searchQuery = parts.join(' ');

  return q;
}

function getServiceHeaders(): Record<string, string> {
  return {
    'X-Service-Key': SERVICE_API_KEY,
  };
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

app.post('/api/search/cars', async (req: Request, res: Response) => {
  try {
    const params = mapCarSearchQuery((req.body || {}) as Record<string, unknown>);
    const { data } = await axios.get(`${CAR_URL}/api/cars/search`, {
      params,
      timeout: 15000,
      headers: getServiceHeaders(),
    });
    const list = extractArrayPayload(data);
    res.json({ data: list });
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: unknown }; message?: string };
    const status = err.response?.status && err.response.status < 500 ? err.response.status : 502;
    res.status(status).json({
      success: false,
      error: { message: 'Car search failed', detail: err.message },
      data: [],
    });
  }
});

/** Пошук клієнтів — після появи client-service можна проксувати; зараз порожньо */
app.get('/api/search/clients', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  try {
    const { data } = await axios.get(`${CLIENT_URL}/api/clients`, {
      timeout: 8000,
      headers: getServiceHeaders(),
    });
    const list = extractArrayPayload(data);
    if (!q) {
      res.json({ data: list });
      return;
    }
    const filtered = list.filter((c: Record<string, unknown>) => {
      const name = String(c.fullName ?? '').toLowerCase();
      const phone = String(c.phone ?? '');
      const email = String(c.email ?? '').toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q);
    });
    res.json({ data: filtered });
  } catch {
    res.json({ data: [] });
  }
});

app.post('/api/search/rentals', async (req: Request, res: Response) => {
  try {
    const { data } = await axios.get(`${RENTAL_URL}/api/rentals`, {
      timeout: 15000,
      headers: getServiceHeaders(),
    });
    const rows = extractArrayPayload(data);
    const body = (req.body || {}) as Record<string, unknown>;
    const status = body.status as string | undefined;
    const carId = body.carId != null ? String(body.carId) : undefined;
    const clientId = body.clientId != null ? Number(body.clientId) : undefined;
    const startDate = body.startDate ? new Date(String(body.startDate)).getTime() : undefined;
    const endDate = body.endDate ? new Date(String(body.endDate)).getTime() : undefined;

    const filtered = rows.filter((r: Record<string, unknown>) => {
      if (status && String(r.status) !== status) return false;
      if (carId && String(r.carId) !== carId) return false;
      if (clientId != null && !Number.isNaN(clientId)) {
        const rid = r.renterUserId ?? r.clientId;
        if (String(rid) !== String(clientId)) return false;
      }
      if (startDate != null && r.startDate) {
        if (new Date(String(r.startDate)).getTime() < startDate) return false;
      }
      if (endDate != null && r.expectedEndDate) {
        if (new Date(String(r.expectedEndDate)).getTime() > endDate) return false;
      }
      return true;
    });
    res.json({ data: filtered });
  } catch (e: unknown) {
    const err = e as { message?: string };
    res.status(502).json({
      success: false,
      error: { message: 'Rental search failed', detail: err.message },
      data: [],
    });
  }
});

export { app };

if (require.main === module) {
  // eslint-disable-next-line no-console
  app.listen(PORT, () => console.log(`search-service on http://localhost:${PORT}`));
}
