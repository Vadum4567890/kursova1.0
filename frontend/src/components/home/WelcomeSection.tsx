import React from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const WelcomeSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Ласкаво просимо до системи прокату автомобілів!
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Ефективне управління автопарком та угодами прокату
        </Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/login')} sx={{ mt: 2 }}>
          Увійти в систему
        </Button>
      </Box>
    </Container>
  );
};

