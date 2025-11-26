import React from 'react';
import { Paper, Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Rental } from '../../interfaces';
import { formatRentalDate } from '../../utils/rentalHelpers';
import { StatusChip } from '../common';

interface RecentRentalsSectionProps {
  rentals: Rental[];
}

export const RecentRentalsSection: React.FC<RecentRentalsSectionProps> = ({ rentals }) => {
  const navigate = useNavigate();

  if (rentals.length === 0) {
    return null;
  }

  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0,0,0,0.4)'
            : '0 8px 32px rgba(0,0,0,0.08)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Останні прокати
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate('/my-rentals')}
          endIcon={<ArrowForward />}
        >
          Всі прокати
        </Button>
      </Box>
      <Grid container spacing={2}>
        {rentals.slice(0, 3).map((rental) => (
          <Grid item xs={12} sm={6} md={4} key={rental.id}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              onClick={() => navigate('/my-rentals')}
            >
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {rental.car ? `${rental.car.brand} ${rental.car.model}` : 'Автомобіль'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  <StatusChip status={rental.status} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {formatRentalDate(rental.startDate)} - {formatRentalDate(rental.expectedEndDate)}
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
                  {rental.totalCost.toLocaleString()} ₴
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

