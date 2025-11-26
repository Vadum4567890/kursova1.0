import { Rental } from '../interfaces';
import { formatDate } from './dateHelpers';

export const filterRentalsBySearchTerm = (
  rentals: Rental[],
  searchTerm: string
): Rental[] => {
  if (!searchTerm.trim()) return rentals;
  const lowerSearchTerm = searchTerm.toLowerCase();
  return rentals.filter((rental) => {
    const clientName = rental.client?.fullName?.toLowerCase() || '';
    const carInfo = rental.car ? `${rental.car.brand} ${rental.car.model}`.toLowerCase() : '';
    const rentalId = rental.id?.toString() || '';
    return clientName.includes(lowerSearchTerm) ||
           carInfo.includes(lowerSearchTerm) ||
           rentalId.includes(lowerSearchTerm);
  });
};

export const sortRentalsForSelection = (rentals: Rental[]): Rental[] => {
  return [...rentals].sort((a, b) => {
    const statusOrder: { [key: string]: number } = {
      'active': 0,
      'completed': 1,
      'cancelled': 2,
    };
    const statusA = statusOrder[a.status?.toLowerCase() || ''] ?? 3;
    const statusB = statusOrder[b.status?.toLowerCase() || ''] ?? 3;

    if (statusA !== statusB) {
      return statusA - statusB;
    }

    const dateA = new Date(a.startDate || a.createdAt || 0).getTime();
    const dateB = new Date(b.startDate || b.createdAt || 0).getTime();
    return dateB - dateA;
  });
};

// formatRentalDate is now exported from dateHelpers.ts
// Import it directly: import { formatRentalDate } from '../../utils/dateHelpers';

export const getRentalStatusLabel = (status: string): string => {
  const statusLabels: { [key: string]: string } = {
    'active': 'Активний',
    'completed': 'Завершений',
    'cancelled': 'Скасований',
  };
  return statusLabels[status?.toLowerCase()] || status || '';
};

/**
 * Filter rentals by status
 */
export const filterRentalsByStatus = (rentals: Rental[], statusFilter: string): Rental[] => {
  if (statusFilter === 'all') {
    return rentals;
  }
  return rentals.filter((rental) => rental.status === statusFilter);
};
