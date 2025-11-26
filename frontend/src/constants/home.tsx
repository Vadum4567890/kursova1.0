/**
 * Home page configuration constants
 */
import React from 'react';
import { DirectionsCar, Assignment, Gavel } from '@mui/icons-material';

export interface ActionCardConfig {
  title: string;
  subtitle: (data: {
    availableCars: number;
    activeRentals: number;
    penalties: number;
    totalPenalties: number;
  }) => string;
  icon: React.ReactNode;
  gradient: string;
  route: string;
  buttonLabel: string;
}

/**
 * Get action cards configuration
 */
export function getActionCardsConfig(): ActionCardConfig[] {
  return [
    {
      title: 'Автомобілі',
      subtitle: (data) => `${data.availableCars} доступних`,
      icon: <DirectionsCar sx={{ fontSize: 48 }} />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      route: '/cars',
      buttonLabel: 'Переглянути каталог',
    },
    {
      title: 'Мої прокати',
      subtitle: (data) => `${data.activeRentals} активних`,
      icon: <Assignment sx={{ fontSize: 48 }} />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      route: '/my-rentals',
      buttonLabel: 'Переглянути прокати',
    },
    {
      title: 'Мої штрафи',
      subtitle: (data) =>
        `${data.penalties} штрафів${data.totalPenalties > 0 ? ` • ${data.totalPenalties.toLocaleString()} ₴` : ''}`,
      icon: <Gavel sx={{ fontSize: 48 }} />,
      gradient: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
      route: '/my-penalties',
      buttonLabel: 'Переглянути штрафи',
    },
  ];
}

