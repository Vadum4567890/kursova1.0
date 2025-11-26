import React from 'react';
import { Paper, Typography, Box, Button } from '@mui/material';
import { Car } from '../../interfaces';
import { calculateTotalCost, formatCurrency } from '../../utils/calculations';
import { getDurationDays } from '../../utils/dateHelpers';
import { DURATION_OPTIONS } from '../../constants/rental';

interface DurationSelectorProps {
  car: Car;
  selectedDuration: string;
  onDurationChange: (duration: string) => void;
}

const DurationSelector: React.FC<DurationSelectorProps> = ({
  car,
  selectedDuration,
  onDurationChange,
}) => {
  const days = getDurationDays(selectedDuration);
  const { price: totalPrice, deposit: totalDeposit } = calculateTotalCost(
    days,
    car.pricePerDay,
    car.deposit
  );
  const baseDeposit = Number(car.deposit);
  const additionalDeposit = totalDeposit - baseDeposit;

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom>
        Тривалість оренди:
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {DURATION_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={selectedDuration === option.value ? 'contained' : 'outlined'}
            size="small"
            onClick={() => onDurationChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </Box>
      <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Орієнтовна вартість: <strong>{formatCurrency(totalPrice)}</strong> ({days} дн.)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Залог: <strong>{formatCurrency(totalDeposit)}</strong>
          {days > 1 && (
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              (базовий: {formatCurrency(baseDeposit)} + додатково за {days - 1} дн.:{' '}
              {formatCurrency(additionalDeposit)})
            </Typography>
          )}
        </Typography>
      </Box>
    </Paper>
  );
};

export default DurationSelector;

