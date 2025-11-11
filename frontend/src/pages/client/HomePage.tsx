import React from 'react';
import { Typography, Box } from '@mui/material';

const HomePage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        Ласкаво просимо до системи прокату автомобілів!
      </Typography>
      <Typography variant="body1" paragraph>
        Система знаходиться в розробці. Скоро тут буде доступний повний функціонал.
      </Typography>
    </Box>
  );
};

export default HomePage;

