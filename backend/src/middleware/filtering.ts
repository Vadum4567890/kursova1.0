import { Request, Response, NextFunction } from 'express';

/**
 * Filtering utilities for query parameters
 */

export interface FilterOptions {
  [key: string]: any;
}

/**
 * Parse filter query parameters
 */
export const parseFilters = (req: Request, allowedFilters: string[]): FilterOptions => {
  const filters: FilterOptions = {};
  
  for (const filter of allowedFilters) {
    if (req.query[filter] !== undefined) {
      filters[filter] = req.query[filter];
    }
  }
  
  return filters;
};

/**
 * Parse sort query parameter
 * Format: ?sort=field:asc or ?sort=field:desc
 */
export const parseSort = (req: Request, defaultSort: string = 'id:asc'): { field: string; order: 'ASC' | 'DESC' } => {
  const sortParam = (req.query.sort as string) || defaultSort;
  const [field, order] = sortParam.split(':');
  
  return {
    field: field || 'id',
    order: (order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC') as 'ASC' | 'DESC',
  };
};

/**
 * Parse date range filters
 */
export const parseDateRange = (req: Request): { startDate?: Date; endDate?: Date } => {
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  
  return {
    startDate: startDate && !isNaN(startDate.getTime()) ? startDate : undefined,
    endDate: endDate && !isNaN(endDate.getTime()) ? endDate : undefined,
  };
};

/**
 * Add filtering to request object
 */
export const filteringMiddleware = (allowedFilters: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    req.filters = parseFilters(req, allowedFilters);
    req.sort = parseSort(req);
    next();
  };
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      filters?: FilterOptions;
      sort?: { field: string; order: 'ASC' | 'DESC' };
    }
  }
}

