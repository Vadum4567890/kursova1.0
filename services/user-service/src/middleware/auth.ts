import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    try {
      // Keycloak removed: treat Bearer as our own JWT and decode it.
      // NOTE: we decode (not verify) for dev simplicity; if you want strict verify,
      // change to jwt.verify with a shared secret/public key.
      const decoded = jwt.decode(token) as any;

      if (!decoded || !decoded.sub) {
        return res.status(401).json({ status: 'error', message: 'Invalid token' });
      }

      req.user = {
        id: decoded.sub,
        email: decoded.email || decoded.preferred_username || '',
        roles: decoded.roles || decoded.realm_access?.roles || [],
      };

      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      return res.status(401).json({ status: 'error', message: 'Invalid token' });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({ status: 'error', message: 'Authentication error' });
  }
};

