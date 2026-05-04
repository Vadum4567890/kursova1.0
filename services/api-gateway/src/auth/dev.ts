import { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-gateway-secret-change-me';

type Role = 'admin' | 'manager' | 'employee' | 'user' | 'renter' | 'owner' | 'both';

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

export const BUILTIN: DevUser[] = [
  { id: 1, username: 'admin', email: 'admin@local.test', role: 'admin', fullName: 'Admin', password: 'admin123' },
  { id: 2, username: 'manager', email: 'manager@local.test', role: 'manager', fullName: 'Manager', password: 'manager123' },
  { id: 3, username: 'employee', email: 'employee@local.test', role: 'employee', fullName: 'Employee', password: 'employee123' },
];

export const extraUsers = new Map<string, DevUser>();

export function loadExtraUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return;
    const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) as DevUser[];
    data.forEach((u) => extraUsers.set(u.email.toLowerCase(), u));
    console.log(`Loaded ${extraUsers.size} extra user(s) from ${USERS_FILE}`);
  } catch {
    /* ignore */
  }
}

export function saveExtraUsers() {
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

export function userToPublic(user: DevUser) {
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

export function getUserFromRequest(req: Request): ReturnType<typeof userToPublic> | null {
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

export function getAllDevUsers(): DevUser[] {
  return [...BUILTIN, ...extraUsers.values()];
}

export function findDevUserById(id: number): DevUser | undefined {
  return BUILTIN.find((u) => u.id === id) || [...extraUsers.values()].find((u) => u.id === id);
}

export function isDevCustomerUser(user: DevUser): boolean {
  return user.role === 'renter' || user.role === 'owner' || user.role === 'user';
}

export function createDevAuthRouter(): Router {
  const router = Router();

  router.post('/login', (req: Request, res: Response) => {
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

  router.post('/register', (req: Request, res: Response) => {
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

  router.get('/me', (req: Request, res: Response) => {
    const user = getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    res.json({ data: user });
  });

  router.put('/profile', (req: Request, res: Response) => {
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

  router.put('/password', (req: Request, res: Response) => {
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

  return router;
}
