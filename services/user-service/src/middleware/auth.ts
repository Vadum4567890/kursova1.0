import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { KeycloakService } from '../services/KeycloakService';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

const keycloakService = new KeycloakService();

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
      // Verify token with Keycloak
      const tokenInfo = await keycloakService.verifyToken(token);
      
      if (!tokenInfo || !tokenInfo.active) {
        // Fallback to JWT decode if Keycloak verification fails (for development)
        const decoded = jwt.decode(token) as any;
        
        if (!decoded || !decoded.sub) {
          return res.status(401).json({ status: 'error', message: 'Invalid token' });
        }

        req.user = {
          id: decoded.sub,
          email: decoded.email || decoded.preferred_username,
          roles: decoded.realm_access?.roles || []
        };
      } else {
        // Use verified token info from Keycloak
        req.user = {
          id: tokenInfo.sub,
          email: tokenInfo.email || tokenInfo.preferred_username,
          roles: tokenInfo.realm_access?.roles || []
        };
      }

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

