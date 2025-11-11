import { Request, Response, NextFunction } from 'express';

/**
 * Pagination middleware and utilities
 */

export interface PaginationOptions {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Parse pagination query parameters
 */
export const parsePagination = (req: Request): PaginationOptions => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Create paginated response
 */
export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  options: PaginationOptions
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / options.limit);
  
  return {
    data,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages,
      hasNext: options.page < totalPages,
      hasPrev: options.page > 1,
    },
  };
};

/**
 * Add pagination to request object
 */
export const paginationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.pagination = parsePagination(req);
  next();
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      pagination?: PaginationOptions;
    }
  }
}

