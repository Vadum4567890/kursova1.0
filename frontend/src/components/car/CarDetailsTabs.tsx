import React from 'react';
import {
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  List,
  ListItem,
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
          <List>
            <ListItem>
              <ListItemIcon>
                <DirectionsCar />
              </ListItemIcon>
              <ListItemText primary="Марка та модель" secondary={`${car.brand} ${car.model}`} />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <DirectionsCar />
              </ListItemIcon>
              <ListItemText primary="Рік випуску" secondary={car.year} />
            </ListItem>
            {car.bodyType && (
              <ListItem>
                <ListItemIcon>
                  <DirectionsCar />
                </ListItemIcon>
                <ListItemText primary="Тип кузова" secondary={getBodyTypeLabel(car.bodyType)} />
              </ListItem>
            )}
            {car.driveType && (
              <ListItem>
                <ListItemIcon>
                  <Settings />
                </ListItemIcon>
                <ListItemText primary="Привід" secondary={getDriveTypeLabel(car.driveType)} />
              </ListItem>
            )}
            {car.transmission && (
              <ListItem>
                <ListItemIcon>
                  <Settings />
                </ListItemIcon>
                <ListItemText
                  primary="Коробка передач"
                  secondary={getTransmissionLabel(car.transmission)}
                />
              </ListItem>
            )}
            {car.engine && (
              <ListItem>
                <ListItemIcon>
                  <LocalGasStation />
                </ListItemIcon>
                <ListItemText primary="Двигун" secondary={car.engine} />
              </ListItem>
            )}
            {car.fuelType && (
              <ListItem>
                <ListItemIcon>
                  <LocalGasStation />
                </ListItemIcon>
                <ListItemText primary="Тип палива" secondary={getFuelTypeLabel(car.fuelType)} />
              </ListItem>
            )}
            {car.seats && (
              <ListItem>
                <ListItemIcon>
                  <EventSeat />
                </ListItemIcon>
                <ListItemText primary="Кількість місць" secondary={car.seats} />
              </ListItem>
            )}
            {car.mileage && (
              <ListItem>
                <ListItemIcon>
                  <Speed />
                </ListItemIcon>
                <ListItemText primary="Пробіг" secondary={`${car.mileage.toLocaleString()} км`} />
              </ListItem>
            )}
            {car.color && (
              <ListItem>
                <ListItemIcon>
                  <Palette />
                </ListItemIcon>
                <ListItemText primary="Колір" secondary={car.color} />
              </ListItem>
            )}
            <ListItem>
              <ListItemIcon>
                <CheckCircle />
              </ListItemIcon>
              <ListItemText primary="Клас" secondary={getTypeLabel(car.type)} />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle />
              </ListItemIcon>
              <ListItemText primary="Ціна за день" secondary={`${car.pricePerDay.toLocaleString()} ₴`} />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle />
              </ListItemIcon>
              <ListItemText primary="Базовий завдаток" secondary={`${car.deposit.toLocaleString()} ₴`} />
            </ListItem>
          </List>
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

