import { Request, Response, NextFunction, Router } from 'express';
import { v5 as uuidv5 } from 'uuid';

const LEGACY_UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

type Role = 'admin' | 'manager' | 'employee' | 'user' | 'renter' | 'owner' | 'both';

interface ServiceClientRecord {
  id: string;
  fullName: string;
  address: string;
  phone: string;
  email: string | null;
  registrationDate: string;
  role?: 'renter' | 'owner' | 'both';
}

const SERVICE_URLS = {
  users: process.env.USER_SERVICE_URL || 'http://localhost:3002',
} as const;

const SERVICE_API_KEY =
  process.env.NODE_ENV === 'production'
    ? process.env.SERVICE_API_KEY || ''
    : process.env.SERVICE_API_KEY || 'internal-service-key';

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

function extractArrayPayload(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data as Record<string, unknown>[];
  }

  if (data && typeof data === 'object' && 'data' in data) {
    const nested = (data as { data?: unknown }).data;
    return Array.isArray(nested) ? (nested as Record<string, unknown>[]) : [];
  }

  return [];
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

function mapServiceClientRoleToGatewayRole(role?: ServiceClientRecord['role']): Role {
  if (role === 'owner') return 'owner';
  if (role === 'both') return 'both';
  return 'renter';
}

function clientRecordToAdminUser(c: ServiceClientRecord) {
  const email = String(c.email || '').trim();
  const fallbackEmail =
    email ||
    `client+${String(c.phone || '').replace(/\D/g, '') || 'unknown'}@local.user-service`;
  const usernameFromEmail = email.includes('@') ? email.split('@')[0]! : '';
  return {
    id: c.id,
    username:
      usernameFromEmail ||
      String(c.phone || '').replace(/\D/g, '') ||
      `renter-${String(c.id).slice(0, 8)}`,
    email: fallbackEmail,
    role: mapServiceClientRoleToGatewayRole(c.role),
    fullName: c.fullName,
    address: c.address,
    phone: c.phone,
    isActive: true,
    createdAt: c.registrationDate,
  };
}

function mergeDevUsersWithServiceClients(
  devUsers: Array<{ id: number | string; email: string; role: string; [key: string]: any }>,
  clients: ServiceClientRecord[]
): Array<any> {
  const devEmails = new Set(devUsers.map((u) => String(u.email || '').toLowerCase()).filter(Boolean));
  const fromService = clients
    .filter((c) => {
      const em = String(c.email || '').trim().toLowerCase();
      if (em && devEmails.has(em)) return false;
      return true;
    })
    .map(clientRecordToAdminUser);
  return [...devUsers, ...fromService];
}

function matchesRoleFilter(requestedRole: string, userRole: string): boolean {
  if (requestedRole === 'user' || requestedRole === 'renter') {
    return userRole === 'user' || userRole === 'renter' || userRole === 'both';
  }
  if (requestedRole === 'owner') {
    return userRole === 'owner' || userRole === 'both';
  }
  return userRole === requestedRole;
}

export function createUsersCompatRouter(devUserHelpers: {
  getAllDevUsers: () => Array<{ id: number; username: string; email: string; role: string; fullName?: string; address?: string; phone?: string; password: string }>;
  findDevUserById: (id: number) => any | undefined;
  userToPublic: (user: any) => any;
  extraUsers: Map<string, any>;
  BUILTIN: Array<any>;
  saveExtraUsers: () => void;
}): Router {
  const router = Router();

  router.get('/clients', async (req: Request, res: Response) => {
    const clients = await fetchClientsFromUserService();
    res.json({ data: clients });
  });

  router.get('/role/:role', async (req: Request, res: Response) => {
    const { role } = req.params;
    const dev = devUserHelpers.getAllDevUsers().map(devUserHelpers.userToPublic);
    const clients = await fetchClientsFromUserService();
    let combined = mergeDevUsersWithServiceClients(dev, clients);
    combined = combined.filter((u) => matchesRoleFilter(role, u.role));
    res.json({ data: combined });
  });

  router.get('/', async (req: Request, res: Response) => {
    const role = req.query.role as string | undefined;
    const dev = devUserHelpers.getAllDevUsers().map(devUserHelpers.userToPublic);
    const clients = await fetchClientsFromUserService();
    let combined = mergeDevUsersWithServiceClients(dev, clients);
    if (role) {
      combined = combined.filter((u) => matchesRoleFilter(role, u.role));
    }
    res.json({ data: combined });
  });

  router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
    const rawId = req.params.id;
    const numId = Number(rawId);

    if (Number.isFinite(numId) && !rawId.includes('-')) {
      const user = devUserHelpers.findDevUserById(numId);
      if (user) {
        res.json({ status: 'success', data: devUserHelpers.userToPublic(user) });
        return;
      }
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (rawId.includes('-')) {
      const devUser = devUserHelpers.getAllDevUsers().find(
        (u) => uuidv5(`legacy:${u.id}`, LEGACY_UUID_NAMESPACE) === rawId
      );
      if (devUser) {
        res.json({ status: 'success', data: devUserHelpers.userToPublic(devUser) });
        return;
      }
    }

    next();
  });

  router.post('/', (req: Request, res: Response) => {
    const { username, email, password, fullName, address, phone, role: roleRaw } = req.body || {};
    if (!username || !email || !password) {
      res.status(400).json({ message: 'username, email, password are required' });
      return;
    }
    const emailKey = String(email).trim().toLowerCase();
    if (
      devUserHelpers.extraUsers.has(emailKey) ||
      devUserHelpers.BUILTIN.some((u) => u.email.toLowerCase() === emailKey || u.username.toLowerCase() === String(username).toLowerCase())
    ) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }
    let role: Role = 'user';
    const allowed: Role[] = ['admin', 'manager', 'employee', 'user', 'renter', 'owner'];
    if (allowed.includes(roleRaw)) role = roleRaw as Role;

    const user = {
      id: 10000 + devUserHelpers.extraUsers.size,
      username: String(username).trim(),
      email: String(email).trim(),
      role,
      fullName: fullName ? String(fullName) : undefined,
      address: address ? String(address) : undefined,
      phone: phone ? String(phone) : undefined,
      password: String(password),
    };
    devUserHelpers.extraUsers.set(emailKey, user);
    devUserHelpers.saveExtraUsers();
    res.status(201).json({ data: devUserHelpers.userToPublic(user) });
  });

  router.put('/:id/role', (req: Request, res: Response) => {
    const numId = Number(req.params.id);
    const user = devUserHelpers.findDevUserById(numId);
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
    res.json({ data: devUserHelpers.userToPublic(user) });
  });

  router.put('/:id/status', (req: Request, res: Response) => {
    const numId = Number(req.params.id);
    const user = devUserHelpers.findDevUserById(numId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ data: devUserHelpers.userToPublic(user) });
  });

  router.delete('/:id', (req: Request, res: Response) => {
    const numId = Number(req.params.id);
    if (devUserHelpers.BUILTIN.some((u) => u.id === numId)) {
      res.status(403).json({ message: 'Cannot delete built-in user' });
      return;
    }
    const entry = [...devUserHelpers.extraUsers.entries()].find(([, u]) => u.id === numId);
    if (!entry) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    devUserHelpers.extraUsers.delete(entry[0]);
    devUserHelpers.saveExtraUsers();
    res.status(204).end();
  });

  return router;
}
