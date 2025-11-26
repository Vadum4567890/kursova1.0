import React from 'react';
import { Paper, Grid, Box, Typography } from '@mui/material';
import {
  DirectionsCar,
  Settings,
  LocalGasStation,
  EventSeat,
  Speed,
  Palette,
} from '@mui/icons-material';
import { Car } from '../../interfaces';
import {
  getDriveTypeLabel,
  getTransmissionLabel,
  getFuelTypeLabel,
} from '../../utils/labels';

interface CarSpecificationsProps {
  car: Car;
}

const CarSpecifications: React.FC<CarSpecificationsProps> = ({ car }) => {
  return (
    <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
      <Grid container spacing={2}>
        {car.year && (
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DirectionsCar color="action" />
              <Typography variant="body2">
                <strong>{car.year} р.</strong>
              </Typography>
            </Box>
          </Grid>
        )}
        {car.driveType && (
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings color="action" />
              <Typography variant="body2">
                {getDriveTypeLabel(car.driveType)}
              </Typography>
            </Box>
          </Grid>
        )}
        {car.transmission && (
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings color="action" />
              <Typography variant="body2">
                {getTransmissionLabel(car.transmission)}
              </Typography>
            </Box>
          </Grid>
        )}
        {car.engine && car.fuelType && (
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalGasStation color="action" />
              <Typography variant="body2">
                {car.engine}, {getFuelTypeLabel(car.fuelType)}
              </Typography>
            </Box>
          </Grid>
        )}
        {car.seats && (
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventSeat color="action" />
              <Typography variant="body2">
                {car.seats} місць
              </Typography>
            </Box>
          </Grid>
        )}
        {car.mileage && (
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Speed color="action" />
              <Typography variant="body2">
                {car.mileage.toLocaleString()} км
              </Typography>
            </Box>
          </Grid>
        )}
        {car.color && (
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Palette color="action" />
              <Typography variant="body2">
                {car.color}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default CarSpecifications;

