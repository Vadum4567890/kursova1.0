import React from 'react';
import {
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  Grid,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  DirectionsCar,
  Settings,
  LocalGasStation,
  EventSeat,
  Speed,
  Palette,
  CheckCircle,
} from '@mui/icons-material';
import { Car } from '../../interfaces';
import {
  getTypeLabel,
  getBodyTypeLabel,
  getDriveTypeLabel,
  getTransmissionLabel,
  getFuelTypeLabel,
} from '../../utils/labels';
import { RENTAL_TERMS } from '../../constants/rental';

interface CarDetailsTabsProps {
  car: Car;
  isUser: boolean;
}

const CarDetailsTabs: React.FC<CarDetailsTabsProps> = ({ car, isUser }) => {
  const [tabValue, setTabValue] = React.useState(0);

  return (
    <Paper>
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
        <Tab label="Опис" />
        <Tab label="Характеристики" />
        {isUser && <Tab label="Умови оренди" />}
      </Tabs>

      <Box sx={{ p: 3 }}>
        {tabValue === 0 && (
          <Typography variant="body1" color="text.secondary">
            {car.description || 'Опис відсутній'}
          </Typography>
        )}

        {tabValue === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                  <DirectionsCar />
                </ListItemIcon>
                <ListItemText 
                  primary="Марка та модель" 
                  secondary={`${car.brand} ${car.model}`}
                  secondaryTypographyProps={{ color: 'text.primary', fontWeight: 500 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                  <DirectionsCar />
                </ListItemIcon>
                <ListItemText 
                  primary="Рік випуску" 
                  secondary={car.year}
                  secondaryTypographyProps={{ color: 'text.primary', fontWeight: 500 }}
                />
              </Box>
            </Grid>
            {car.bodyType && (
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                    <DirectionsCar />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Тип кузова" 
                    secondary={getBodyTypeLabel(car.bodyType)}
                    secondaryTypographyProps={{ color: 'text.primary', fontWeight: 500 }}
                  />
                </Box>
              </Grid>
            )}
            {car.driveType && (
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                    <Settings />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Привід" 
                    secondary={getDriveTypeLabel(car.driveType)}
                    secondaryTypographyProps={{ color: 'text.primary', fontWeight: 500 }}
                  />
                </Box>
              </Grid>
            )}
            {car.transmission && (
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                    <Settings />
                  </ListItemIcon>
                  <ListItemText
                    primary="Коробка передач"
                    secondary={getTransmissionLabel(car.transmission)}
                    secondaryTypographyProps={{ color: 'text.primary', fontWeight: 500 }}
                  />
                </Box>
              </Grid>
            )}
            {car.engine && (
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                    <LocalGasStation />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Двигун" 
                    secondary={car.engine}
                    secondaryTypographyProps={{ color: 'text.primary', fontWeight: 500 }}
                  />
                </Box>
              </Grid>
            )}
            {car.fuelType && (
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                    <LocalGasStation />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Тип палива" 
                    secondary={getFuelTypeLabel(car.fuelType)}
                    secondaryTypographyProps={{ color: 'text.primary', fontWeight: 500 }}
                  />
                </Box>
              </Grid>
            )}
            {car.seats && (
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                    <EventSeat />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Кількість місць" 
                    secondary={car.seats}
                    secondaryTypographyProps={{ color: 'text.primary', fontWeight: 500 }}
                  />
                </Box>
              </Grid>
            )}
            {car.mileage && (
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                    <Speed />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Пробіг" 
                    secondary={`${car.mileage.toLocaleString()} км`}
                    secondaryTypographyProps={{ color: 'text.primary', fontWeight: 500 }}
                  />
                </Box>
              </Grid>
            )}
            {car.color && (
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                    <Palette />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Колір" 
                    secondary={car.color}
                    secondaryTypographyProps={{ color: 'text.primary', fontWeight: 500 }}
                  />
                </Box>
              </Grid>
            )}
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                  <CheckCircle />
                </ListItemIcon>
                <ListItemText 
                  primary="Клас" 
                  secondary={getTypeLabel(car.type)}
                  secondaryTypographyProps={{ color: 'text.primary', fontWeight: 500 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                  <CheckCircle />
                </ListItemIcon>
                <ListItemText 
                  primary="Ціна за день" 
                  secondary={`${car.pricePerDay.toLocaleString()} ₴`}
                  secondaryTypographyProps={{ color: 'text.primary', fontWeight: 500 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                  <CheckCircle />
                </ListItemIcon>
                <ListItemText 
                  primary="Базовий завдаток" 
                  secondary={`${car.deposit.toLocaleString()} ₴`}
                  secondaryTypographyProps={{ color: 'text.primary', fontWeight: 500 }}
                />
              </Box>
            </Grid>
          </Grid>
        )}

        {tabValue === 2 && isUser && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Умови оренди
            </Typography>
            <Divider sx={{ my: 2 }} />
            {RENTAL_TERMS.map((term, index) => (
              <Typography key={index} variant="body2" paragraph>
                <strong>{term.title}:</strong> {term.description}
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default CarDetailsTabs;

