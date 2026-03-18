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
function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function isNumericLike(value: string): boolean {
  return /^\d+$/.test(value);
}

export function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { message: 'No token provided' } });
  }

  const token = header.substring(7);

  try {
    const decoded: any = jwt.decode(token);
    const id =
      decoded?.sub ??
      decoded?.id ??
      decoded?.userId ??
      decoded?.user?.id;

    if (!decoded || !id) {
      return res.status(401).json({ success: false, error: { message: 'Invalid token' } });
    }

    const rawId = String(id);
    // If monolith token uses numeric IDs, convert deterministically to UUID so DB (uuid columns) won't crash.
    const normalizedId =
      isUuidLike(rawId) ? rawId : isNumericLike(rawId) ? uuidv5(`legacy:${rawId}`, LEGACY_ID_NAMESPACE) : rawId;

    req.user = {
      id: normalizedId,
      email: decoded.email || decoded.preferred_username,
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: { message: 'Invalid token' } });
  }
}

