import React from 'react';
import { Chip } from '@mui/material';

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'small' }) => {
  const getStatusConfig = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'available' || statusLower === 'доступний' || statusLower === 'completed' || statusLower === 'завершений') {
      return { label: statusLower === 'available' ? 'Доступний' : statusLower === 'completed' ? 'Завершений' : status, color: 'success' as const };
    }
    if (statusLower === 'rented' || statusLower === 'в прокаті' || statusLower === 'active' || statusLower === 'активний') {
      return { label: statusLower === 'rented' ? 'В прокаті' : statusLower === 'active' ? 'Активний' : status, color: 'warning' as const };
    }
    if (statusLower === 'maintenance' || statusLower === 'на обслуговуванні' || statusLower === 'cancelled' || statusLower === 'скасований') {
      return { label: statusLower === 'maintenance' ? 'На обслуговуванні' : statusLower === 'cancelled' ? 'Скасований' : status, color: 'error' as const };
    }
    if (statusLower === 'economy' || statusLower === 'економ') {
      return { label: 'Економ', color: 'default' as const };
    }
    if (statusLower === 'business' || statusLower === 'бізнес') {
      return { label: 'Бізнес', color: 'primary' as const };
    }
    if (statusLower === 'premium' || statusLower === 'преміум') {
      return { label: 'Преміум', color: 'secondary' as const };
    }
    
    return { label: status, color: 'default' as const };
  };

  const config = getStatusConfig(status);

  return <Chip label={config.label} color={config.color} size={size} />;
};

export default StatusChip;

