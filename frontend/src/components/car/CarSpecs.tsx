import React from 'react';
import { Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  DirectionsCar,
  Settings,
  LocalGasStation,
  EventSeat,
  Speed,
  Palette,
} from '@mui/icons-material';
import { Car } from '../../services/carService';

interface CarSpecsProps {
  car: Car;
}

const CarSpecs: React.FC<CarSpecsProps> = ({ car }) => {
  const specs = [
    { icon: <DirectionsCar />, label: 'Тип кузова', value: car.bodyType },
    { icon: <Settings />, label: 'Привід', value: car.driveType },
    { icon: <Settings />, label: 'Коробка передач', value: car.transmission },
    { icon: <LocalGasStation />, label: 'Двигун', value: car.engine },
    { icon: <LocalGasStation />, label: 'Тип палива', value: car.fuelType },
    { icon: <EventSeat />, label: 'Кількість місць', value: car.seats?.toString() },
    { icon: <Speed />, label: 'Пробіг', value: car.mileage ? `${car.mileage.toLocaleString()} км` : undefined },
    { icon: <Palette />, label: 'Колір', value: car.color },
  ].filter(spec => spec.value);

  if (specs.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
        Характеристики не вказані
      </Typography>
    );
  }

  return (
    <List>
      {specs.map((spec, index) => (
        <ListItem key={index}>
          <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
            {spec.icon}
          </ListItemIcon>
          <ListItemText
            primary={spec.label}
            secondary={spec.value}
            secondaryTypographyProps={{ color: 'text.primary', fontWeight: 500 }}
          />
        </ListItem>
      ))}
      {car.features && (
        <ListItem>
          <ListItemText
            primary="Особливості"
            secondary={car.features}
            secondaryTypographyProps={{ color: 'text.secondary' }}
          />
        </ListItem>
      )}
    </List>
  );
};

export default CarSpecs;

