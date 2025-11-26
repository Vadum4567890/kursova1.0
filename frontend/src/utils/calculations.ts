/**
 * Business logic calculations
 * All financial and date calculations should be centralized here
 */

import { Car } from '../interfaces';

/**
 * Calculate rental price based on days and car price per day
 */
export const calculateRentalPrice = (days: number, pricePerDay: number): number => {
  return days * Number(pricePerDay);
};

/**
 * Calculate deposit amount
 * Base deposit + additional deposit for each day beyond the first day
 * Additional deposit = 15% of price per day per additional day
 */
export const calculateDeposit = (days: number, baseDeposit: number, pricePerDay: number): number => {
  const base = Number(baseDeposit);
  const price = Number(pricePerDay);
  const additionalPerDay = price * 0.15;
  const additionalDays = Math.max(0, days - 1);
  const additionalDeposit = additionalPerDay * additionalDays;
  return base + additionalDeposit;
};

/**
 * Calculate total cost for a rental
 */
export const calculateTotalCost = (
  days: number,
  pricePerDay: number,
  baseDeposit: number
): { price: number; deposit: number; total: number } => {
  const price = calculateRentalPrice(days, pricePerDay);
  const deposit = calculateDeposit(days, baseDeposit, pricePerDay);
  return {
    price,
    deposit,
    total: price + deposit,
  };
};

/**
 * Get all images for a car (main + additional)
 */
export const getAllCarImages = (car: Car | null): string[] => {
  if (!car) return [];

  const images: string[] = [];

  // Add main image first if it exists
  if (car.imageUrl) {
    images.push(car.imageUrl);
  }

  // Handle imageUrls - can be array or JSON string
  let imageUrlsArray: string[] = [];
  if (car.imageUrls) {
    if (Array.isArray(car.imageUrls)) {
      imageUrlsArray = car.imageUrls;
    } else if (typeof car.imageUrls === 'string') {
      try {
        imageUrlsArray = JSON.parse(car.imageUrls);
      } catch {
        // If parsing fails, treat as single URL
        imageUrlsArray = [car.imageUrls];
      }
    }
  }

  // Add additional images, but avoid duplicates with main image
  imageUrlsArray.forEach(url => {
    if (url && !images.includes(url)) {
      images.push(url);
    }
  });

  return images;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number, currency: string = '₴'): string => {
  return `${amount.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};

/**
 * Calculate days between two dates
 */
export const calculateDays = (startDate: string | Date, endDate: string | Date): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 1; // Minimum 1 day
};

/**
 * Get image URL (handles both absolute and relative URLs)
 */
export const getImageUrl = (url: string): string => {
  if (url.startsWith('http')) return url;
  return `${window.location.protocol}//${window.location.hostname}:3000${url}`;
};

