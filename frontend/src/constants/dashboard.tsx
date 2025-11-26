/**
 * Dashboard configuration constants
 */
import {
  DirectionsCar,
  People,
  Assignment,
  AttachMoney,
  Gavel,
  Speed,
} from '@mui/icons-material';
import React from 'react';

export interface StatCardConfig {
  title: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  getValue: (stats: any) => string | number;
  showForRoles?: string[];
}

/**
 * Get stat cards configuration based on user role
 */
export function getStatCardsConfig(userRole?: string): StatCardConfig[] {
  const isAdminOrManager = userRole === 'admin' || userRole === 'manager';

  const baseCards: StatCardConfig[] = [
    {
      title: 'Всього автомобілів',
      icon: <DirectionsCar sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      getValue: (stats) => stats?.totalCars || 0,
    },
    {
      title: 'Доступні',
      icon: <DirectionsCar sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
      getValue: (stats) => stats?.availableCars || 0,
    },
    {
      title: 'В прокаті',
      icon: <Assignment sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      getValue: (stats) => stats?.rentedCars || 0,
    },
    {
      title: 'Клієнти',
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      getValue: (stats) => stats?.totalClients || 0,
    },
    {
      title: 'Активні прокати',
      icon: <Assignment sx={{ fontSize: 40 }} />,
      color: '#0288d1',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      getValue: (stats) => stats?.activeRentals || 0,
    },
  ];

  if (!isAdminOrManager) {
    return baseCards;
  }

  return [
    ...baseCards,
    {
      title: 'Загальний дохід',
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      getValue: (stats) => `${(stats?.totalRevenue || 0).toLocaleString()} ₴`,
    },
    {
      title: 'Штрафи',
      icon: <Gavel sx={{ fontSize: 40 }} />,
      color: '#d32f2f',
      gradient: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
      getValue: (stats) => `${(stats?.totalPenalties || 0).toLocaleString()} ₴`,
    },
    {
      title: 'Середня тривалість',
      icon: <Speed sx={{ fontSize: 40 }} />,
      color: '#0288d1',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      getValue: (stats) => `${(stats?.averageRentalDuration || 0).toFixed(1)} дн.`,
    },
  ];
}

