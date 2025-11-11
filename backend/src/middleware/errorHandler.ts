import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/Logger';

/**
 * Centralized error handling middleware
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const logger = Logger.getInstance();
  
  // Log error
  logger.error(`Error: ${err.message} - ${req.method} ${req.path}`);

  // Handle known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: err.message,
      statusCode: 400,
    });
    return;
  }

  // Handle database errors
  if (err.name === 'QueryFailedError' || err.name === 'TypeORMError') {
    logger.error(`Database error: ${err.message}`);
    res.status(500).json({
      error: 'Database operation failed',
      statusCode: 500,
    });
    return;
  }

  // Handle unknown errors
  const statusCode = (err as any).statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json({
    error: message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
  });
};

