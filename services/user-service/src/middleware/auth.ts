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

const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOW_INSECURE_JWT_DECODE =
  (process.env.ALLOW_INSECURE_JWT_DECODE || (NODE_ENV === 'production' ? 'false' : 'true')) === 'true';

function readJwtPayload(token: string): any | null {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    try {
      return jwt.verify(token, secret);
    } catch {
      if (!ALLOW_INSECURE_JWT_DECODE) {
        return null;
      }
    }
  } else if (!ALLOW_INSECURE_JWT_DECODE) {
    return null;
  }

  return jwt.decode(token);
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
      const decoded = readJwtPayload(token);

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

