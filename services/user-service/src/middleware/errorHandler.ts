import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  const rawMessage = err.message || 'Internal server error';
  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd && statusCode >= 500 ? 'Internal server error' : rawMessage;

  logger.error({
    message: rawMessage,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode
  });

  res.status(statusCode).json({
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

