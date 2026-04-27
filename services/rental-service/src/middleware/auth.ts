import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { v5 as uuidv5 } from 'uuid';

export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

const LEGACY_ID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // DNS namespace (stable)
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOW_INSECURE_JWT_DECODE =
  (process.env.ALLOW_INSECURE_JWT_DECODE || (NODE_ENV === 'production' ? 'false' : 'true')) === 'true';

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function isNumericLike(value: string): boolean {
  return /^\d+$/.test(value);
}

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

/** Той самий user id, що в HTTP auth (для WebSocket query token). */
export function getUserIdFromBearerToken(token: string): string | null {
  try {
    const decoded = readJwtPayload(token);
    const nestedUser = decoded?.user as { id?: unknown } | undefined;
    const id =
      decoded?.sub ?? decoded?.id ?? decoded?.userId ?? nestedUser?.id;

    if (!decoded || id == null) {
      return null;
    }

    const rawId = String(id);
    const normalizedId =
      isUuidLike(rawId) ? rawId : isNumericLike(rawId) ? uuidv5(`legacy:${rawId}`, LEGACY_ID_NAMESPACE) : rawId;

    return normalizedId;
  } catch {
    return null;
  }
}

export function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { message: 'No token provided' } });
  }

  const token = header.substring(7);

  try {
    const decoded = readJwtPayload(token);
    const normalizedId = getUserIdFromBearerToken(token);

    if (!decoded || !normalizedId) {
      return res.status(401).json({ success: false, error: { message: 'Invalid token' } });
    }

    req.user = {
      id: normalizedId,
      email: typeof decoded.email === 'string' ? decoded.email : typeof decoded.preferred_username === 'string' ? decoded.preferred_username : undefined,
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: { message: 'Invalid token' } });
  }
}

