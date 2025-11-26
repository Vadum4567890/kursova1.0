import React from 'react';
import { Paper, Typography } from '@mui/material';
import { Car } from '../../interfaces';

interface CarPriceCardProps {
  car: Car;
}

const CarPriceCard: React.FC<CarPriceCardProps> = ({ car }) => {
  return (
    <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
      <Typography variant="h3" gutterBottom>
        {car.pricePerDay.toLocaleString()} ₴
        <Typography component="span" variant="h6">
          /день
        </Typography>
      </Typography>
      <Typography variant="body1" sx={{ opacity: 0.9 }}>
        Залог: {car.deposit.toLocaleString()} ₴
      </Typography>
    </Paper>
  );
};

export default CarPriceCard;

