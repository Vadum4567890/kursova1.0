import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

function safeCompare(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'utf8');
    const bb = Buffer.from(b, 'utf8');
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

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

/**
 * POST/DELETE до uploads: або Bearer JWT (як у браузера через gateway),
 * або X-Service-Key для довірених backend-викликів.
 */
export function requireMutationAuth(req: Request, res: Response, next: NextFunction): void {
  const expectedService =
    process.env.NODE_ENV === 'production'
      ? process.env.SERVICE_API_KEY || ''
      : process.env.SERVICE_API_KEY || 'internal-service-key';

  const serviceKey = req.headers['x-service-key'] as string | undefined;
  if (expectedService && serviceKey && safeCompare(serviceKey, expectedService)) {
    next();
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    return;
  }

  const token = header.slice(7);
  const secrets = jwtVerifySecrets();
  if (secrets.length === 0) {
    res.status(503).json({
      success: false,
      error: { message: 'Upload auth misconfigured (JWT_VERIFY_SECRETS / JWT_SECRET)' },
    });
    return;
  }

  let verified = false;
  for (const secret of secrets) {
    try {
      jwt.verify(token, secret);
      verified = true;
      break;
    } catch {
      /* try next secret */
    }
  }

  if (!verified) {
    res.status(401).json({ success: false, error: { message: 'Invalid token' } });
    return;
  }

  next();
}
