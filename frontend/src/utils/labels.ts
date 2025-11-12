/**
 * Utility functions for translating labels
 */

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'available':
      return 'Доступний';
    case 'rented':
      return 'В прокаті';
    case 'maintenance':
      return 'На обслуговуванні';
    case 'completed':
      return 'Завершений';
    case 'active':
      return 'Активний';
    case 'cancelled':
      return 'Скасований';
    default:
      return status;
  }
};

export const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'available':
    case 'completed':
      return 'success';
    case 'rented':
    case 'active':
      return 'warning';
    case 'maintenance':
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

export const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'economy':
      return 'Економ';
    case 'business':
      return 'Бізнес';
    case 'premium':
      return 'Преміум';
    default:
      return type;
  }
};

export const getBodyTypeLabel = (bodyType?: string): string | null => {
  if (!bodyType) return null;
  const labels: { [key: string]: string } = {
    'sedan': 'Седан',
    'hatchback': 'Хетчбек',
    'suv': 'Позашляховик',
    'coupe': 'Купе',
    'wagon': 'Універсал',
    'convertible': 'Кабріолет',
  };
  return labels[bodyType.toLowerCase()] || bodyType;
};

export const getDriveTypeLabel = (driveType?: string): string | null => {
  if (!driveType) return null;
  const labels: { [key: string]: string } = {
    'front-wheel': 'Передній привід',
    'rear-wheel': 'Задній привід',
    'all-wheel': 'Повний привід',
  };
  return labels[driveType.toLowerCase()] || driveType;
};

export const getTransmissionLabel = (transmission?: string): string | null => {
  if (!transmission) return null;
  const labels: { [key: string]: string } = {
    'manual': 'Механіка',
    'automatic': 'Автомат',
    'cvt': 'Вариатор',
  };
  return labels[transmission.toLowerCase()] || transmission;
};

export const getFuelTypeLabel = (fuelType?: string): string | null => {
  if (!fuelType) return null;
  const labels: { [key: string]: string } = {
    'gasoline': 'Бензин',
    'diesel': 'Дизель',
    'hybrid': 'Гібрид',
    'electric': 'Електричний',
  };
  return labels[fuelType.toLowerCase()] || fuelType;
};

export const getRoleLabel = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'Адміністратор';
    case 'manager':
      return 'Менеджер';
    case 'employee':
      return 'Співробітник';
    case 'user':
      return 'Користувач';
    default:
      return role;
  }
};

