import React from 'react';
import { Chip } from '@mui/material';
import { getStatusLabel, getStatusColor } from '../../utils/labels';

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'small' }) => {
  return (
    <Chip
      label={getStatusLabel(status)}
      color={getStatusColor(status)}
      size={size}
    />
  );
};

export default StatusChip;

