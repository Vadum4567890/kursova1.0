import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './auth';

/**
 * For internal server-to-server calls (e.g. from monolith, car-service):
 * if X-Service-Key is valid, allow request without Bearer.
 * Otherwise run normal auth middleware.
 */
export function internalOrAuth(req: Request, res: Response, next: NextFunction): void {
  const serviceKey = req.headers['x-service-key'] as string;
  const expectedKey = process.env.SERVICE_API_KEY || 'internal-service-key';
  if (serviceKey && serviceKey === expectedKey) {
    return next();
  }
  authMiddleware(req, res, next);
}
