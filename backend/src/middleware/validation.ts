import { Request, Response, NextFunction } from 'express';
import { CarType, CarStatus } from '../models/Car.entity';
import { RentalStatus } from '../models/Rental.entity';

/**
 * Validation middleware for request data
 */

/**
 * Validate ID parameter
 */
export const validateId = (req: Request, res: Response, next: NextFunction): void => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid ID. Must be a positive integer.' });
    return;
  }
  req.params.id = id.toString();
  next();
};

/**
 * Validate date string
 */
export const validateDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Validate car type
 */
export const validateCarType = (type: string): boolean => {
  return Object.values(CarType).includes(type as CarType);
};

/**
 * Validate car status
 */
export const validateCarStatus = (status: string): boolean => {
  return Object.values(CarStatus).includes(status as CarStatus);
};

/**
 * Validate rental status
 */
export const validateRentalStatus = (status: string): boolean => {
  return Object.values(RentalStatus).includes(status as RentalStatus);
};

/**
 * Validate required fields
 */
export const validateRequired = (fields: string[], data: any): string | null => {
  for (const field of fields) {
    if (!data[field] && data[field] !== 0) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
};

/**
 * Validate phone number format (basic)
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * Validate email format (basic)
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate positive number
 */
export const validatePositiveNumber = (value: any): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
};

/**
 * Validate non-negative number
 */
export const validateNonNegativeNumber = (value: any): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num >= 0;
};

/**
 * Sanitize string input
 */
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Validate car creation data
 */
export const validateCarData = (req: Request, res: Response, next: NextFunction): void => {
  const { brand, model, year, pricePerDay, deposit } = req.body;
  
  const missing = validateRequired(['brand', 'model', 'year', 'pricePerDay', 'deposit'], req.body);
  if (missing) {
    res.status(400).json({ error: missing });
    return;
  }

  if (typeof brand !== 'string' || brand.trim().length === 0) {
    res.status(400).json({ error: 'Brand must be a non-empty string' });
    return;
  }

  if (typeof model !== 'string' || model.trim().length === 0) {
    res.status(400).json({ error: 'Model must be a non-empty string' });
    return;
  }

  const yearNum = parseInt(year);
  if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
    res.status(400).json({ error: 'Year must be a valid year between 1900 and current year + 1' });
    return;
  }

  if (!validatePositiveNumber(pricePerDay)) {
    res.status(400).json({ error: 'pricePerDay must be a positive number' });
    return;
  }

  if (!validateNonNegativeNumber(deposit)) {
    res.status(400).json({ error: 'deposit must be a non-negative number' });
    return;
  }

  if (req.body.type && !validateCarType(req.body.type)) {
    res.status(400).json({ error: `Invalid car type. Must be one of: ${Object.values(CarType).join(', ')}` });
    return;
  }

  next();
};

/**
 * Validate client creation data
 */
export const validateClientData = (req: Request, res: Response, next: NextFunction): void => {
  const { fullName, address, phone } = req.body;
  
  const missing = validateRequired(['fullName', 'address', 'phone'], req.body);
  if (missing) {
    res.status(400).json({ error: missing });
    return;
  }

  if (typeof fullName !== 'string' || fullName.trim().length < 2) {
    res.status(400).json({ error: 'Full name must be at least 2 characters long' });
    return;
  }

  if (typeof address !== 'string' || address.trim().length < 5) {
    res.status(400).json({ error: 'Address must be at least 5 characters long' });
    return;
  }

  if (!validatePhone(phone)) {
    res.status(400).json({ error: 'Invalid phone number format' });
    return;
  }

  next();
};

/**
 * Validate rental creation data
 */
export const validateRentalData = (req: Request, res: Response, next: NextFunction): void => {
  const { clientId, carId, startDate, expectedEndDate } = req.body;
  
  const missing = validateRequired(['clientId', 'carId', 'startDate', 'expectedEndDate'], req.body);
  if (missing) {
    res.status(400).json({ error: missing });
    return;
  }

  const clientIdNum = parseInt(clientId);
  const carIdNum = parseInt(carId);
  
  if (isNaN(clientIdNum) || clientIdNum <= 0) {
    res.status(400).json({ error: 'clientId must be a positive integer' });
    return;
  }

  if (isNaN(carIdNum) || carIdNum <= 0) {
    res.status(400).json({ error: 'carId must be a positive integer' });
    return;
  }

  const start = validateDate(startDate);
  const expectedEnd = validateDate(expectedEndDate);
  
  if (!start) {
    res.status(400).json({ error: 'Invalid startDate format' });
    return;
  }

  if (!expectedEnd) {
    res.status(400).json({ error: 'Invalid expectedEndDate format' });
    return;
  }

  if (start >= expectedEnd) {
    res.status(400).json({ error: 'startDate must be before expectedEndDate' });
    return;
  }

  if (start < new Date()) {
    res.status(400).json({ error: 'startDate cannot be in the past' });
    return;
  }

  next();
};

/**
 * Validate penalty creation data
 */
export const validatePenaltyData = (req: Request, res: Response, next: NextFunction): void => {
  const { amount, reason } = req.body;
  
  const missing = validateRequired(['amount', 'reason'], req.body);
  if (missing) {
    res.status(400).json({ error: missing });
    return;
  }

  if (!validatePositiveNumber(amount)) {
    res.status(400).json({ error: 'amount must be a positive number' });
    return;
  }

  if (typeof reason !== 'string' || reason.trim().length < 3) {
    res.status(400).json({ error: 'reason must be at least 3 characters long' });
    return;
  }

  next();
};

