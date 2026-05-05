import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = Number(err.statusCode ?? err.status ?? 500) || 500;
  const isDev = process.env.NODE_ENV === 'development';

  logger.error('Request failed', {
    errMessage: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode,
  });

  const clientMessage =
    statusCode >= 500 && !isDev ? 'Internal server error' : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: { message: clientMessage },
    ...(isDev && err.stack ? { detail: err.stack } : {}),
  });
}
