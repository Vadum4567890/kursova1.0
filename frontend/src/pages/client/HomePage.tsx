import React from 'react';
import { Typography, Box, Container, Grid, Card, CardContent, Button } from '@mui/material';
import { DirectionsCar, People, Assignment, Analytics } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      title: 'Автомобілі',
      description: 'Перегляньте наш каталог автомобілів',
      icon: <DirectionsCar sx={{ fontSize: 48 }} />,
      path: '/cars',
      color: '#1976d2',
    },
    {
      title: 'Клієнти',
      description: 'Управління клієнтською базою',
      icon: <People sx={{ fontSize: 48 }} />,
      path: '/clients',
      color: '#9c27b0',
      requiresAuth: true,
    },
    {
      title: 'Прокати',
      description: 'Створення та управління угодами прокату',
      icon: <Assignment sx={{ fontSize: 48 }} />,
      path: '/rentals',
      color: '#ed6c02',
      requiresAuth: true,
    },
    {
      title: 'Аналітика',
      description: 'Статистика та звіти',
      icon: <Analytics sx={{ fontSize: 48 }} />,
      path: '/analytics',
      color: '#2e7d32',
      requiresAuth: true,
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Ласкаво просимо до системи прокату автомобілів!
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Ефективне управління автопарком та угодами прокату
        </Typography>
        {!isAuthenticated && (
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/login')}
            sx={{ mt: 2 }}
          >
            Увійти в систему
          </Button>
        )}
      </Box>

      <Grid container spacing={4}>
        {features
          .filter((feature) => !feature.requiresAuth || isAuthenticated)
          .map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  },
                }}
                onClick={() => navigate(feature.path)}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ color: feature.color, mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
    </Container>
  );
};

export default HomePage;

