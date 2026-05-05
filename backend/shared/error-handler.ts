import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from './error';

/**
 * Global error handler middleware
 * Converts all errors to unified format
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    const status = err.getStatus();
    const response = err.toResponse();
    console.error(`[${err.code}] ${err.message}`, err.details);
    return res.status(status).json(response);
  }

  // Unknown error
  console.error('Unhandled error', err.message, err.stack);
  const status = 500;
  res.status(status).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Internal server error',
    },
  });
}

/**
 * Async route wrapper to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
