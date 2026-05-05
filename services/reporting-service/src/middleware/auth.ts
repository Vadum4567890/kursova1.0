import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { v5 as uuidv5 } from 'uuid';

export interface AuthUser {
  id: string;
  email?: string;
  /** Нормалізована роль з JWT (`role` або перший елемент `roles`) */
  role?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

const LEGACY_ID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOW_INSECURE_JWT_DECODE =
  (process.env.ALLOW_INSECURE_JWT_DECODE || (NODE_ENV === 'production' ? 'false' : 'true')) === 'true';

/** Кілька секретів через кому: gateway dev-auth + user-service тощо */
function jwtVerifySecrets(): string[] {
  const multi = process.env.JWT_VERIFY_SECRETS || process.env.JWT_SECRETS;
  if (multi) {
    return multi
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const single = process.env.JWT_SECRET;
  return single ? [single] : [];
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function isNumericLike(value: string): boolean {
  return /^\d+$/.test(value);
}

function verifyJwtPayload(token: string): Record<string, unknown> | null {
  const secrets = jwtVerifySecrets();
  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret) as Record<string, unknown>;
    } catch {
      /* next secret */
    }
  }
  if (!ALLOW_INSECURE_JWT_DECODE) {
    return null;
  }
  return (jwt.decode(token) as Record<string, unknown> | null) ?? null;
}

function extractRole(decoded: Record<string, unknown>): string | undefined {
  const direct = decoded.role;
  if (typeof direct === 'string') return direct.toLowerCase();
  const roles = decoded.roles as unknown;
  if (Array.isArray(roles) && typeof roles[0] === 'string') return roles[0].toLowerCase();
  const ra = decoded.realm_access as { roles?: string[] } | undefined;
  if (ra?.roles?.length && typeof ra.roles[0] === 'string') return ra.roles[0].toLowerCase();
  return undefined;
}

export function auth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { message: 'No token provided' } });
    return;
  }

  const token = header.substring(7);

  try {
    const decoded = verifyJwtPayload(token);
    const nestedUser = decoded?.user as { id?: unknown } | undefined;
    const id = decoded?.sub ?? decoded?.id ?? decoded?.userId ?? nestedUser?.id;

    if (!decoded || id == null || id === '') {
      res.status(401).json({ success: false, error: { message: 'Invalid token' } });
      return;
    }

    const rawId = String(id);
    const normalizedId =
      isUuidLike(rawId) ? rawId : isNumericLike(rawId) ? uuidv5(`legacy:${rawId}`, LEGACY_ID_NAMESPACE) : rawId;

    req.user = {
      id: normalizedId,
      email:
        typeof decoded.email === 'string'
          ? decoded.email
          : typeof decoded.preferred_username === 'string'
            ? decoded.preferred_username
            : undefined,
      role: extractRole(decoded),
    };

    next();
  } catch {
    res.status(401).json({ success: false, error: { message: 'Invalid token' } });
  }
}

const STAFF_ROLES = new Set(['admin', 'manager', 'employee']);
const ADMIN_MANAGER_ROLES = new Set(['admin', 'manager']);

export function requireStaff(req: AuthRequest, res: Response, next: NextFunction): void {
  const role = req.user?.role;
  if (!role || !STAFF_ROLES.has(role)) {
    res.status(403).json({ success: false, error: { message: 'Forbidden' } });
    return;
  }
  next();
}

export function requireAdminOrManager(req: AuthRequest, res: Response, next: NextFunction): void {
  const role = req.user?.role;
  if (!role || !ADMIN_MANAGER_ROLES.has(role)) {
    res.status(403).json({ success: false, error: { message: 'Forbidden' } });
    return;
  }
  next();
}
