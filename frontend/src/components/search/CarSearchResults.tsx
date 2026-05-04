import React from 'react';
import { Grid, Card, CardContent, CardMedia, Typography, Box, Chip, Stack } from '@mui/material';
import { Car } from '../../interfaces';
import { resolveCarImageUrlForDisplay, DEFAULT_CAR_IMAGE_PLACEHOLDER } from '../../utils/carHelpers';
import { getTypeLabel, getStatusLabel } from '../../utils/labels';

interface CarSearchResultsProps {
  cars: Car[];
}

const transmissionLabel = (t?: string) => {
  const m: Record<string, string> = { manual: 'Механіка', automatic: 'Автомат', cvt: 'Варіатор' };
  return m[String(t || '').toLowerCase()] || t || '—';
};

const fuelLabel = (f?: string) => {
  const x = String(f || '').toLowerCase();
  const m: Record<string, string> = {
    petrol: 'Бензин',
    gasoline: 'Бензин',
    diesel: 'Дизель',
    electric: 'Електро',
    hybrid: 'Гібрид',
  };
  return m[x] || f || '—';
};

export const CarSearchResults: React.FC<CarSearchResultsProps> = ({ cars }) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DEFAULT_CAR_IMAGE_PLACEHOLDER;
  };

  return (
    <Grid container spacing={2}>
      {cars.map((car) => (
        <Grid item xs={12} sm={6} md={4} key={car.id}>
          <Card>
            <CardMedia
              component="img"
              height="150"
              image={resolveCarImageUrlForDisplay(car)}
              alt={`${car.brand} ${car.model}`}
              sx={{ backgroundColor: '#f0f0f0', objectFit: 'cover' }}
              onError={handleImageError}
            />
            <CardContent>
              <Typography variant="h6" component="div" noWrap title={`${car.brand} ${car.model}`}>
                {car.brand} {car.model}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.5, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {car.year} р. • {getTypeLabel(car.type)}
                </Typography>
                <Chip size="small" label={getStatusLabel(car.status)} color="success" variant="outlined" />
              </Stack>
              <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                {Number(car.pricePerDay ?? 0).toLocaleString('uk-UA')} ₴/день
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {transmissionLabel(car.transmission)} · {fuelLabel(car.fuelType)}
                  {car.seats != null ? ` · ${car.seats} місць` : ''}
                </Typography>
                {(car.mileage != null && car.mileage > 0) || car.color ? (
                  <Typography variant="caption" color="text.secondary">
                    {(car.mileage != null && car.mileage > 0) ? `Пробіг: ${car.mileage.toLocaleString('uk-UA')} км` : ''}
                    {(car.mileage != null && car.mileage > 0) && car.color ? ' · ' : ''}
                    {car.color ? `Колір: ${car.color}` : ''}
                  </Typography>
                ) : null}
                {car.description ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} noWrap title={car.description}>
                    {car.description.length > 120 ? `${car.description.slice(0, 117)}…` : car.description}
                  </Typography>
                ) : null}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
