import React from 'react';
import { Grid, Card, CardContent, CardMedia, Typography } from '@mui/material';
import { Car } from '../../interfaces';

interface CarSearchResultsProps {
  cars: Car[];
}

const DEFAULT_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';

export const CarSearchResults: React.FC<CarSearchResultsProps> = ({ cars }) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DEFAULT_IMAGE;
  };

  return (
    <Grid container spacing={2}>
      {cars.map((car) => (
        <Grid item xs={12} sm={6} md={4} key={car.id}>
          <Card>
            <CardMedia
              component="img"
              height="150"
              image={
                car.imageUrl
                  ? car.imageUrl.startsWith('http')
                    ? car.imageUrl
                    : car.imageUrl
                  : DEFAULT_IMAGE
              }
              alt={`${car.brand} ${car.model}`}
              sx={{ backgroundColor: '#f0f0f0' }}
              onError={handleImageError}
            />
            <CardContent>
              <Typography variant="h6">
                {car.brand} {car.model}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {car.year} • {car.type}
              </Typography>
              <Typography variant="h6" color="primary">
                {car.pricePerDay} ₴/день
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

