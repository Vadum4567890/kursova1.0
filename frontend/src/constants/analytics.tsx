/**
 * Analytics configuration constants
 */
import React from 'react';
import { AttachMoney, TrendingUp, Gavel, Speed } from '@mui/icons-material';

export interface AnalyticsStatCardConfig {
  title: string;
  icon: React.ReactNode;
  gradient: string;
  getValue: (stats: any, occupancyRate: number) => string;
}

/**
 * Get analytics stat cards configuration
 */
export function getAnalyticsStatCardsConfig(): AnalyticsStatCardConfig[] {
  return [
    {
      title: 'Загальний дохід',
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      getValue: (stats) => `${(stats?.totalRevenue || 0).toLocaleString()} ₴`,
    },
    {
      title: 'Зайнятість',
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
      getValue: (_stats, occupancyRate) => `${occupancyRate.toFixed(1)}%`,
    },
    {
      title: 'Штрафи',
      icon: <Gavel sx={{ fontSize: 40 }} />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      getValue: (stats) => `${(stats?.totalPenalties || 0).toLocaleString()} ₴`,
    },
    {
      title: 'Середня тривалість',
      icon: <Speed sx={{ fontSize: 40 }} />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      getValue: (stats) => `${(stats?.averageRentalDuration?.toFixed(1) || 0)} днів`,
    },
  ];
}

