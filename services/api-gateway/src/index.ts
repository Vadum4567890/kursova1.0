import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import { v5 as uuidv5 } from 'uuid';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import fs from 'fs';
import path from 'path';

const LEGACY_UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-gateway-secret-change-me';
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || 'internal-service-key';
const ENABLE_DEV_AUTH = (process.env.ENABLE_DEV_AUTH || (NODE_ENV === 'production' ? 'false' : 'true')) === 'true';

const SERVICE_URLS = {
  users: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  cars: process.env.CAR_SERVICE_URL || 'http://localhost:3003',
  rentals: process.env.RENTAL_SERVICE_URL || 'http://localhost:3004',
  reporting: process.env.REPORTING_SERVICE_URL || 'http://localhost:3009',
  media: process.env.MEDIA_SERVICE_URL || 'http://localhost:3006',
} as const;

type Role = 'admin' | 'manager' | 'employee' | 'user' | 'renter' | 'owner';

interface DevUser {
  id: number;
  username: string;
  email: string;
  role: Role;
  fullName?: string;
  address?: string;
  phone?: string;
  password: string;
}

const BUILTIN: DevUser[] = [
  { id: 1, username: 'admin', email: 'admin@local.test', role: 'admin', fullName: 'Admin', password: 'admin123' },
  { id: 2, username: 'manager', email: 'manager@local.test', role: 'manager', fullName: 'Manager', password: 'manager123' },
  { id: 3, username: 'employee', email: 'employee@local.test', role: 'employee', fullName: 'Employee', password: 'employee123' },
];

const extraUsers = new Map<string, DevUser>();

function loadExtraUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return;
    const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) as DevUser[];
    data.forEach((u) => extraUsers.set(u.email.toLowerCase(), u));
    console.log(`Loaded ${extraUsers.size} extra user(s) from ${USERS_FILE}`);
  } catch {
    /* ignore */
  }
}

function saveExtraUsers() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify([...extraUsers.values()], null, 2));
  } catch {
    /* ignore */
  }
}

loadExtraUsers();

function findUser(usernameOrEmail: string, password: string): DevUser | null {
  const q = usernameOrEmail.trim().toLowerCase();

  for (const user of BUILTIN) {
    if ((user.username.toLowerCase() === q || user.email.toLowerCase() === q) && user.password === password) {
      return user;
    }
  }

  for (const user of extraUsers.values()) {
    if ((user.username.toLowerCase() === q || user.email.toLowerCase() === q) && user.password === password) {
      return user;
    }
  }

  return null;
}

function userToPublic(user: DevUser) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    address: user.address,
    phone: user.phone,
    isActive: true,
  };
}

function signToken(user: DevUser): string {
  return jwt.sign(
    {
      sub: String(user.id),
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function getUserFromRequest(req: Request): ReturnType<typeof userToPublic> | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & {
      id?: number;
      username?: string;
      email?: string;
      role?: string;
      fullName?: string;
    };
    const id = Number(payload.id ?? payload.sub);
    if (!Number.isFinite(id)) return null;

    return {
      id,
      username: payload.username || '',
      email: payload.email || '',
      role: (payload.role as Role) || 'user',
      fullName: payload.fullName,
      address: undefined,
      phone: undefined,
      isActive: true,
    };
  } catch {
    return null;
  }
}

function onProxyError(err: Error, _req: Request, res: Response) {
  console.error('[proxy]', err.message);
  if (!res.headersSent) {
    res.status(502).json({
      success: false,
      error: {
        message: 'Upstream service unavailable',
        detail: err.message,
      },
    });
  }
}

export function createServiceProxy(target: string, extraOptions: Partial<Options> = {}) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    onError: onProxyError,
    ...extraOptions,
  });
}

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
  const parts = [brand, model].filter(Boolean);
  if (parts.length) {
    params.set('searchQuery', parts.join(' '));
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

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  })
);
app.use(morgan('combined'));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    environment: NODE_ENV,
    devAuthEnabled: ENABLE_DEV_AUTH,
    ts: new Date().toISOString(),
  });
});

function registerDevAuthRoutes() {
  app.post('/api/auth/login', express.json(), (req: Request, res: Response) => {
    const { usernameOrEmail, password } = req.body || {};
    if (!usernameOrEmail || !password) {
      res.status(400).json({ message: 'Login and password are required' });
      return;
    }

    const user = findUser(String(usernameOrEmail), String(password));
    if (!user) {
      res.status(401).json({ message: 'Invalid username or password', error: 'Unauthorized' });
      return;
    }

    res.json({ message: 'OK', data: { token: signToken(user), user: userToPublic(user) } });
  });

  app.post('/api/auth/register', express.json(), (req: Request, res: Response) => {
    const { username, email, password, fullName, address, phone, role: roleRaw } = req.body || {};
    if (!username || !email || !password) {
      res.status(400).json({ message: 'username, email, password are required' });
      return;
    }

    const emailKey = String(email).trim().toLowerCase();
    const usernameKey = String(username).trim().toLowerCase();
    const alreadyExists =
      extraUsers.has(emailKey) ||
      BUILTIN.some((user) => user.email.toLowerCase() === emailKey || user.username.toLowerCase() === usernameKey);

    if (alreadyExists) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }

    let role: Role = 'user';
    if (roleRaw === 'owner') role = 'owner';
    if (roleRaw === 'renter') role = 'renter';

    const user: DevUser = {
      id: 10000 + extraUsers.size,
      username: String(username).trim(),
      email: String(email).trim(),
      role,
      fullName: fullName ? String(fullName) : undefined,
      address: address ? String(address) : undefined,
      phone: phone ? String(phone) : undefined,
      password: String(password),
    };

    extraUsers.set(emailKey, user);
    saveExtraUsers();
    res.status(201).json({ message: 'OK', data: { token: signToken(user), user: userToPublic(user) } });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    res.json({ data: user });
  });

  app.put('/api/auth/profile', express.json(), (req: Request, res: Response) => {
    const user = getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const target =
      BUILTIN.find((candidate) => candidate.id === user.id) ||
      extraUsers.get(user.email.toLowerCase()) ||
      [...extraUsers.values()].find((candidate) => candidate.id === user.id);

    if (!target) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const { email, fullName, address, phone } = req.body || {};
    if (email) target.email = String(email);
    if (fullName !== undefined) target.fullName = fullName ? String(fullName) : undefined;
    if (address !== undefined) target.address = address ? String(address) : undefined;
    if (phone !== undefined) target.phone = phone ? String(phone) : undefined;

    if (!BUILTIN.some((candidate) => candidate.id === target.id)) {
      extraUsers.set(target.email.toLowerCase(), target);
      saveExtraUsers();
    }

    res.json({ message: 'OK', data: userToPublic(target) });
  });

  app.put('/api/auth/password', express.json(), (req: Request, res: Response) => {
    const user = getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { currentPassword, newPassword } = req.body || {};
    const target =
      BUILTIN.find((candidate) => candidate.id === user.id) ||
      extraUsers.get(user.email.toLowerCase()) ||
      [...extraUsers.values()].find((candidate) => candidate.id === user.id);

    if (!target || target.password !== String(currentPassword || '')) {
      res.status(400).json({ message: 'Invalid current password' });
      return;
    }

    target.password = String(newPassword || '');
    if (!BUILTIN.some((candidate) => candidate.id === target.id)) {
      extraUsers.set(target.email.toLowerCase(), target);
      saveExtraUsers();
    }

    res.json({ message: 'Password updated' });
  });
}

function getAllDevUsers(): DevUser[] {
  return [...BUILTIN, ...extraUsers.values()];
}

function findDevUserById(id: number): DevUser | undefined {
  return BUILTIN.find((u) => u.id === id) || [...extraUsers.values()].find((u) => u.id === id);
}

function registerUserManagementRoutes() {
  /** GET /api/users — list all, optionally ?role=renter */
  app.get('/api/users', (req: Request, res: Response) => {
    const role = req.query.role as string | undefined;
    let users = getAllDevUsers();
    if (role) users = users.filter((u) => u.role === role);
    res.json({ data: users.map(userToPublic) });
  });

  /** GET /api/users/role/:role */
  app.get('/api/users/role/:role', (req: Request, res: Response) => {
    const { role } = req.params;
    const users = getAllDevUsers().filter((u) => u.role === role);
    res.json({ data: users.map(userToPublic) });
  });

  /** GET /api/users/:id — numeric or UUID lookup in dev store, then proxy to user-service */
  app.get('/api/users/:id', (req: Request, res: Response, next: NextFunction) => {
    const rawId = req.params.id;
    const numId = Number(rawId);

    // Numeric ID — direct lookup
    if (Number.isFinite(numId) && !rawId.includes('-')) {
      const user = findDevUserById(numId);
      if (user) {
        res.json({ status: 'success', data: userToPublic(user) });
        return;
      }
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // UUID — check if it matches any dev user's legacy UUID
    if (rawId.includes('-')) {
      const devUser = getAllDevUsers().find(
        (u) => uuidv5(`legacy:${u.id}`, LEGACY_UUID_NAMESPACE) === rawId
      );
      if (devUser) {
        res.json({ status: 'success', data: userToPublic(devUser) });
        return;
      }
    }

    // Forward to user-service
    next();
  });

  /** POST /api/users — admin creates user */
  app.post('/api/users', express.json(), (req: Request, res: Response) => {
    const { username, email, password, fullName, address, phone, role: roleRaw } = req.body || {};
    if (!username || !email || !password) {
      res.status(400).json({ message: 'username, email, password are required' });
      return;
    }
    const emailKey = String(email).trim().toLowerCase();
    if (
      extraUsers.has(emailKey) ||
      BUILTIN.some((u) => u.email.toLowerCase() === emailKey || u.username.toLowerCase() === String(username).toLowerCase())
    ) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }
    let role: Role = 'user';
    const allowed: Role[] = ['admin', 'manager', 'employee', 'user', 'renter', 'owner'];
    if (allowed.includes(roleRaw)) role = roleRaw as Role;

    const user: DevUser = {
      id: 10000 + extraUsers.size,
      username: String(username).trim(),
      email: String(email).trim(),
      role,
      fullName: fullName ? String(fullName) : undefined,
      address: address ? String(address) : undefined,
      phone: phone ? String(phone) : undefined,
      password: String(password),
    };
    extraUsers.set(emailKey, user);
    saveExtraUsers();
    res.status(201).json({ data: userToPublic(user) });
  });

  /** PUT /api/users/:id/role */
  app.put('/api/users/:id/role', express.json(), (req: Request, res: Response) => {
    const numId = Number(req.params.id);
    const user = findDevUserById(numId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const allowed: Role[] = ['admin', 'manager', 'employee', 'user', 'renter', 'owner'];
    const newRole = req.body?.role;
    if (!allowed.includes(newRole)) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }
    user.role = newRole as Role;
    res.json({ data: userToPublic(user) });
  });

  /** PUT /api/users/:id/status — noop in dev (all users active) */
  app.put('/api/users/:id/status', express.json(), (req: Request, res: Response) => {
    const numId = Number(req.params.id);
    const user = findDevUserById(numId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ data: userToPublic(user) });
  });

  /** DELETE /api/users/:id */
  app.delete('/api/users/:id', (req: Request, res: Response) => {
    const numId = Number(req.params.id);
    if (BUILTIN.some((u) => u.id === numId)) {
      res.status(403).json({ message: 'Cannot delete built-in user' });
      return;
    }
    const entry = [...extraUsers.entries()].find(([, u]) => u.id === numId);
    if (!entry) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    extraUsers.delete(entry[0]);
    saveExtraUsers();
    res.status(204).end();
  });
}

registerUserManagementRoutes();

if (ENABLE_DEV_AUTH) {
  registerDevAuthRoutes();
} else {
  app.use('/api/auth', (_req, res) => {
    res.status(501).json({
      success: false,
      error: {
        message: 'Dev auth is disabled in this environment',
        detail: 'Set ENABLE_DEV_AUTH=true for local compatibility or move auth to user-service.',
      },
    });
  });
}

app.post('/api/search/cars', express.json(), async (req: Request, res: Response) => {
  try {
    const params = new URLSearchParams(mapCarSearchBody((req.body || {}) as Record<string, unknown>));
    const { status, body } = await fetchServiceJson<unknown>(
      `${SERVICE_URLS.cars}/api/cars/search${params.toString() ? `?${params.toString()}` : ''}`
    );
    const list = extractArrayPayload(body);
    res.status(status < 500 ? status : 200).json({ data: list });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(502).json({
      success: false,
      error: { message: 'Car search failed', detail: message },
      data: [],
    });
  }
});

app.get('/api/search/clients', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();

  try {
    const { status, body } = await fetchServiceJson<unknown>(`${SERVICE_URLS.users}/api/users/clients`);
    const list = extractArrayPayload(body);
    const filtered = !q
      ? list
      : list.filter((client) => {
          const name = String(client.fullName ?? '').toLowerCase();
          const phone = String(client.phone ?? '').toLowerCase();
          const email = String(client.email ?? '').toLowerCase();
          return name.includes(q) || phone.includes(q) || email.includes(q);
        });
    res.status(status < 500 ? status : 200).json({ data: filtered });
  } catch {
    res.json({ data: [] });
  }
});

app.post('/api/search/rentals', express.json(), async (req: Request, res: Response) => {
  try {
    const { status, body } = await fetchServiceJson<unknown>(`${SERVICE_URLS.rentals}/api/rentals`);
    const rows = extractArrayPayload(body);
    const filters = (req.body || {}) as Record<string, unknown>;
    const requestedStatus = filters.status ? String(filters.status) : undefined;
    const carId = filters.carId != null ? String(filters.carId) : undefined;
    const clientId = filters.clientId != null ? String(filters.clientId) : undefined;
    const startDate = filters.startDate ? new Date(String(filters.startDate)).getTime() : undefined;
    const endDate = filters.endDate ? new Date(String(filters.endDate)).getTime() : undefined;

    const filtered = rows.filter((row) => {
      if (requestedStatus && String(row.status) !== requestedStatus) return false;
      if (carId && String(row.carId) !== carId) return false;
      if (clientId && String(row.renterUserId ?? row.clientId ?? '') !== clientId) return false;
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

app.use('/api/upload', createServiceProxy(SERVICE_URLS.media));
app.use(
  '/api/clients',
  createServiceProxy(SERVICE_URLS.users, {
    pathRewrite: { '^/api/clients': '/api/users/clients' },
  })
);
app.use('/api/analytics', createServiceProxy(SERVICE_URLS.reporting));
app.use('/api/reports', createServiceProxy(SERVICE_URLS.reporting));
app.use('/api/penalties', createServiceProxy(SERVICE_URLS.reporting));

app.use(
  '/api/rentals/my',
  createServiceProxy(SERVICE_URLS.rentals, {
    pathRewrite: { '^/api/rentals/my': '/api/rentals/me' },
  })
);

app.use(
  '/api/rentals/client',
  createServiceProxy(SERVICE_URLS.rentals, {
    pathRewrite: { '^/api/rentals/client': '/api/rentals/renter' },
  })
);

app.use('/api/users', createServiceProxy(SERVICE_URLS.users));
app.use('/api/cars', createServiceProxy(SERVICE_URLS.cars));
app.use('/api/rentals', createServiceProxy(SERVICE_URLS.rentals));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ success: false, error: { message: err.message } });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API Gateway on http://localhost:${PORT}`);
    console.log(
      `  user=${SERVICE_URLS.users} car=${SERVICE_URLS.cars} rental=${SERVICE_URLS.rentals} reporting=${SERVICE_URLS.reporting} media=${SERVICE_URLS.media}`
    );
    console.log(`  dev-auth=${ENABLE_DEV_AUTH ? 'enabled' : 'disabled'} env=${NODE_ENV}`);
  });
}
