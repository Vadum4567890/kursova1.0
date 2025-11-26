import React from 'react';
import { Paper, Box, Typography, LinearProgress } from '@mui/material';
import { AccountBalance } from '@mui/icons-material';
import { useAppTheme } from '../../context/ThemeContext';

interface OccupancyRateCardProps {
  occupancyRate: number;
  rentedCars: number;
  totalCars: number;
}

const OccupancyRateCard: React.FC<OccupancyRateCardProps> = ({
  occupancyRate,
  rentedCars,
  totalCars,
}) => {
  const { theme } = useAppTheme();

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <AccountBalance sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Зайнятість автопарку
        </Typography>
      </Box>
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Зайнятість
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {occupancyRate.toFixed(1)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={occupancyRate}
          sx={{
            height: 12,
            borderRadius: 6,
            backgroundColor:
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 6,
              background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
            },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {rentedCars} з {totalCars} автомобілів в прокаті
        </Typography>
      </Box>
    </Paper>
  );
};

export default OccupancyRateCard;

