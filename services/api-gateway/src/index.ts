import 'dotenv/config';
import http from 'http';
import type { Duplex } from 'stream';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { createDevAuthRouter, getAllDevUsers, findDevUserById, userToPublic, isDevCustomerUser } from './auth/dev';
import { createSearchRouter } from './routes/search';
import { createUsersCompatRouter } from './routes/users-compat';
import { createAiRouter, createReferenceRouter } from './routes/ai-reference';
import { createServiceProxy } from './proxy/utils';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const REQUESTED_DEV_AUTH = (process.env.ENABLE_DEV_AUTH || (NODE_ENV === 'production' ? 'false' : 'true')) === 'true';
const ENABLE_DEV_AUTH = NODE_ENV !== 'production' && REQUESTED_DEV_AUTH;

if (NODE_ENV === 'production' && REQUESTED_DEV_AUTH) {
  console.warn('ENABLE_DEV_AUTH=true was requested but ignored in production mode.');
}

const SERVICE_URLS = {
  users: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  cars: process.env.CAR_SERVICE_URL || 'http://localhost:3003',
  rentals: process.env.RENTAL_SERVICE_URL || 'http://localhost:3004',
  reporting: process.env.REPORTING_SERVICE_URL || 'http://localhost:3009',
  media: process.env.MEDIA_SERVICE_URL || 'http://localhost:3006',
} as const;

interface DevUser {
  id: number;
  username: string;
  email: string;
  role: string;
  fullName?: string;
  address?: string;
  phone?: string;
  password: string;
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

const BUILTIN: DevUser[] =
  NODE_ENV === 'production'
    ? []
    : [
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

function devUserToServiceClientRecord(user: DevUser): ServiceClientRecord {
  const role: ServiceClientRecord['role'] =
    user.role === 'owner' ? 'owner' : user.role === 'user' ? 'renter' : 'renter';
  return {
    id: String(user.id),
    fullName: user.fullName || user.username,
    address: user.address || '',
    phone: user.phone || '',
    email: user.email,
    registrationDate: new Date().toISOString(),
    role,
  };
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

if (ENABLE_DEV_AUTH) {
  app.use('/api/auth', express.json(), createDevAuthRouter());
} else {
  app.use(
    '/api/auth',
    createServiceProxy(SERVICE_URLS.users, {
      pathRewrite: { '^/api/auth': '/api/users/auth' },
    })
  );
}

app.use('/api/search', express.json(), createSearchRouter({
  getAllDevUsers,
  isDevCustomerUser,
  devUserToServiceClientRecord,
}));

app.use('/api/ai', express.json(), createAiRouter());
app.use('/api/reference', createReferenceRouter());

app.use('/api/upload', createServiceProxy(SERVICE_URLS.media));

// Static routes BEFORE /:id pattern
app.use(
  '/api/clients',
  createServiceProxy(SERVICE_URLS.users, {
    pathRewrite: { '^/api/clients': '/api/users/clients' },
  })
);

// Dynamic routes AFTER static ones
app.use('/api/users', express.json(), createUsersCompatRouter({
  getAllDevUsers,
  findDevUserById,
  userToPublic,
  extraUsers,
  BUILTIN,
  saveExtraUsers,
}));
// Fallback: forward unresolved user routes (e.g. /:id/rating) to user-service.
app.use('/api/users', createServiceProxy(SERVICE_URLS.users));
app.use('/api/analytics', createServiceProxy(SERVICE_URLS.reporting));
app.use('/api/reports', createServiceProxy(SERVICE_URLS.reporting));
app.use('/api/penalties', createServiceProxy(SERVICE_URLS.reporting));
app.use(
  '/api/reviews',
  createServiceProxy(SERVICE_URLS.rentals, {
    pathRewrite: {
      '^/api/reviews/eligible$': '/api/rentals/me/reviews/eligible',
      '^/api/reviews/booking': '/api/rentals/me/reviews',
      '^/api/reviews/cars': '/api/rentals/reviews/car',
      '^/api/reviews/users': '/api/rentals/reviews/user',
      '^/api/reviews$': '/api/rentals/reviews',
    },
  })
);

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

app.use('/api/cars', createServiceProxy(SERVICE_URLS.cars));
const rentalsProxy = createServiceProxy(SERVICE_URLS.rentals, { ws: true });
app.use('/api/rentals', rentalsProxy);

const isProd = NODE_ENV === 'production';

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProd ? 'Internal server error' : err.message || 'Internal server error',
    },
  });
});

if (require.main === module) {
  const server = http.createServer(app);
  type ProxyWithUpgrade = {
    upgrade?: (req: http.IncomingMessage, socket: Duplex, head: Buffer) => void;
  };
  server.on('upgrade', (req, socket, head) => {
    const pathOnly = (req.url || '').split('?')[0] || '';
    if (pathOnly.startsWith('/api/rentals')) {
      (rentalsProxy as ProxyWithUpgrade).upgrade?.(req, socket, head);
    }
  });
  server.listen(PORT, () => {
    console.log(`API Gateway on http://localhost:${PORT}`);
    console.log(
      `  user=${SERVICE_URLS.users} car=${SERVICE_URLS.cars} rental=${SERVICE_URLS.rentals} reporting=${SERVICE_URLS.reporting} media=${SERVICE_URLS.media}`
    );
    console.log(`  dev-auth=${ENABLE_DEV_AUTH ? 'enabled' : 'disabled'} env=${NODE_ENV}`);
  });
}
