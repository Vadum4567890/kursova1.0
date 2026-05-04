/**
 * Helper functions for car-related operations
 */

import { Car } from '../interfaces';

/** Узгоджено з CarCard / CarSearchResults — placeholder без зовнішніх запитів */
export const DEFAULT_CAR_IMAGE_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';

function getApiPublicOrigin(): string {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  return String(base).replace(/\/api\/?$/, '');
}

type CarWithImages = Car & { images?: Array<{ imageUrl: string; isPrimary?: boolean }> };

/**
 * URL головного зображення для картки (відносні шляхи — через origin API-гейта)
 */
export function resolveCarImageUrlForDisplay(car: CarWithImages): string {
  if (car.imageUrls && Array.isArray(car.imageUrls) && car.imageUrls.length > 0) {
    const u = String(car.imageUrls[0] || '').trim();
    if (!u) return DEFAULT_CAR_IMAGE_PLACEHOLDER;
    if (u.startsWith('http') || u.startsWith('data:')) return u;
    return `${getApiPublicOrigin()}${u.startsWith('/') ? u : `/${u}`}`;
  }
  if (car.images && Array.isArray(car.images) && car.images.length > 0) {
    const primary = car.images.find((i) => i.isPrimary) || car.images[0];
    const imageUrl = primary?.imageUrl;
    if (imageUrl) {
      const u = String(imageUrl).trim();
      if (u.startsWith('http') || u.startsWith('data:')) return u;
      return `${getApiPublicOrigin()}${u.startsWith('/') ? u : `/${u}`}`;
    }
  }
  if (car.imageUrl) {
    const u = String(car.imageUrl).trim();
    if (u.startsWith('http') || u.startsWith('data:')) return u;
    return `${getApiPublicOrigin()}${u.startsWith('/') ? u : `/${u}`}`;
  }
  return DEFAULT_CAR_IMAGE_PLACEHOLDER;
}

/**
 * Parse imageUrls from string (JSON) or array
 */
export function parseImageUrls(car: Car): string[] {
  if (!car.imageUrls) return [];
  
  if (Array.isArray(car.imageUrls)) {
    return car.imageUrls;
  }
  
  if (typeof car.imageUrls === 'string') {
    try {
      return JSON.parse(car.imageUrls);
    } catch {
      // If parsing fails, treat as single URL
      return [car.imageUrls];
    }
  }
  
  return [];
}

/**
 * Get initial form data for car
 */
export function getInitialCarFormData(): Partial<Car> {
  return {
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'economy' as Car['type'],
    pricePerDay: 0,
    deposit: 0,
    status: 'available' as Car['status'],
    description: '',
    imageUrl: '',
    imageUrls: [],
    bodyType: '',
    driveType: '',
    transmission: '',
    engine: '',
    fuelType: '',
    seats: undefined,
    mileage: undefined,
    color: '',
    features: '',
    instantBook: false,
    unavailableDates: [],
  };
}

/**
 * Prepare car data for submission
 */
export function prepareCarDataForSubmit(formData: Partial<Car>, imageUrl?: string, imageUrls?: string[]): Partial<Car> {
  // Get the final list of additional images (excluding the main image)
  const finalImageUrls = (imageUrls !== undefined ? imageUrls : formData.imageUrls || [])
    .filter(url => url && url !== imageUrl && url !== formData.imageUrl)
    .filter((url, index, arr) => arr.indexOf(url) === index);

  return {
    ...formData,
    imageUrl: imageUrl || formData.imageUrl,
    // Always include imageUrls, even if empty array, so backend knows to clear it
    imageUrls: finalImageUrls,
  };
}
