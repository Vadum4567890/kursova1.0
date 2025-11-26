/**
 * Helper functions for car-related operations
 */

import { Car } from '../interfaces';

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
  };
}

/**
 * Prepare car data for submission
 */
export function prepareCarDataForSubmit(formData: Partial<Car>, imageUrl?: string, imageUrls?: string[]): Partial<Car> {
  // Get the final list of additional images (excluding the main image)
  const finalImageUrls = (imageUrls !== undefined ? imageUrls : formData.imageUrls || []).filter(
    url => url && url !== imageUrl && url !== formData.imageUrl
  );

  return {
    ...formData,
    imageUrl: imageUrl || formData.imageUrl,
    // Always include imageUrls, even if empty array, so backend knows to clear it
    imageUrls: finalImageUrls,
  };
}

