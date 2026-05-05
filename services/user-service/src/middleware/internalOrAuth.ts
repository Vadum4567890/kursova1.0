import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './auth';

function safeServiceKeyEqual(received: string, expected: string): boolean {
  try {
    const a = Buffer.from(received, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * For internal server-to-server calls (e.g. from monolith, car-service):
 * if X-Service-Key is valid, allow request without Bearer.
 * Otherwise run normal auth middleware.
 */
export function internalOrAuth(req: Request, res: Response, next: NextFunction): void {
  const serviceKey = req.headers['x-service-key'] as string | undefined;
  const expectedKey =
    process.env.NODE_ENV === 'production'
      ? process.env.SERVICE_API_KEY || ''
      : process.env.SERVICE_API_KEY || 'internal-service-key';
  if (serviceKey && expectedKey && safeServiceKeyEqual(serviceKey, expectedKey)) {
    return next();
  }
  authMiddleware(req, res, next);
}
