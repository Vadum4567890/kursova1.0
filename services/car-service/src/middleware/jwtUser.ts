import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { v5 as uuidv5 } from 'uuid';
import { AuthRequest } from '../controllers/CarController';

const LEGACY_NS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOW_INSECURE_JWT_DECODE =
  (process.env.ALLOW_INSECURE_JWT_DECODE || (NODE_ENV === 'production' ? 'false' : 'true')) === 'true';

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isNumericLike(value: string): boolean {
  return /^\d+$/.test(value);
}

/**
 * Декодує Bearer JWT і виставляє req.userId (UUID-рядок), без перевірки підпису —
 * сумісно з rental-service та dev-токенами з api-gateway.
 */
function readJwtPayload(token: string): Record<string, unknown> | null {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    try {
      return jwt.verify(token, secret) as Record<string, unknown>;
    } catch {
      if (!ALLOW_INSECURE_JWT_DECODE) {
        return null;
      }
    }
  } else if (!ALLOW_INSECURE_JWT_DECODE) {
    return null;
  }

  return (jwt.decode(token) as Record<string, unknown> | null) ?? null;
}

function setUserIdFromToken(req: AuthRequest, token: string): boolean {
  try {
    const decoded = readJwtPayload(token);
    const raw =
      decoded?.sub ?? decoded?.id ?? (decoded?.userId as string | undefined) ?? (decoded?.user as { id?: string } | undefined)?.id;
    if (raw === undefined || raw === null) {
      return false;
    }
    const s = String(raw);
    req.userId = isUuidLike(s) ? s : isNumericLike(s) ? uuidv5(`legacy:${s}`, LEGACY_NS) : s;
    return true;
  } catch {
    return false;
  }
}

/** Якщо є Bearer — виставляє userId; інакше пропускає без змін (для POST /api/cars без обовʼязкового JWT). */
export function optionalJwtUser(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }
  const token = header.substring(7);
  if (!setUserIdFromToken(req, token)) {
    res.status(401).json({ success: false, error: { message: 'Invalid token' } });
    return;
  }
  next();
}

export function requireJwtUser(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    return;
  }
  const token = header.substring(7);
  if (!setUserIdFromToken(req, token)) {
    res.status(401).json({ success: false, error: { message: 'Invalid token' } });
    return;
  }
  next();
}
