import React, { useEffect } from 'react';
import { Typography, Box, Container, Grid, Card, CardContent, Button, Paper, CircularProgress, Chip } from '@mui/material';
import { DirectionsCar, Assignment, Gavel, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCars } from '../../hooks/queries/useCars';
import { useMyRentals } from '../../hooks/queries/useRentals';
import { useMyPenalties } from '../../hooks/queries/usePenalties';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  // Redirect staff to dashboard
  useEffect(() => {
    if (isAuthenticated && user && (user.role === 'admin' || user.role === 'manager' || user.role === 'employee')) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // For regular users, show their data
  const { data: carsResponse, isLoading: loadingCars } = useCars();
  const { data: rentals = [], isLoading: loadingRentals } = useMyRentals();
  const { data: penalties = [], isLoading: loadingPenalties } = useMyPenalties();

  const cars = carsResponse?.data || [];
  const availableCars = cars.filter((car: any) => car.status === 'available');
  const activeRentals = rentals.filter((r: any) => r.status === 'active');
  const totalPenalties = penalties.reduce((sum: number, p: any) => sum + p.amount, 0);

  // Show login page for unauthenticated users
  if (!isAuthenticated) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Ласкаво просимо до системи прокату автомобілів!
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            Ефективне управління автопарком та угодами прокату
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/login')}
            sx={{ mt: 2 }}
          >
            Увійти в систему
          </Button>
        </Box>
      </Container>
    );
  }

  // For authenticated users, show their dashboard
  const loading = loadingCars || loadingRentals || loadingPenalties;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Головна сторінка
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ласкаво просимо, {user?.fullName || user?.username}!
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Main Action Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 8,
                  },
                }}
                onClick={() => navigate('/cars')}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                        Автомобілі
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {availableCars.length} доступних
                      </Typography>
                    </Box>
                    <Box sx={{ opacity: 0.8 }}>
                      <DirectionsCar sx={{ fontSize: 48 }} />
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/cars');
                    }}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  >
                    Переглянути каталог
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 8,
                  },
                }}
                onClick={() => navigate('/my-rentals')}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                        Мої прокати
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {activeRentals.length} активних
                      </Typography>
                    </Box>
                    <Box sx={{ opacity: 0.8 }}>
                      <Assignment sx={{ fontSize: 48 }} />
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/my-rentals');
                    }}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  >
                    Переглянути прокати
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 8,
                  },
                }}
                onClick={() => navigate('/my-penalties')}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                        Мої штрафи
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {penalties.length} штрафів
                        {totalPenalties > 0 && ` • ${totalPenalties.toLocaleString()} ₴`}
                      </Typography>
                    </Box>
                    <Box sx={{ opacity: 0.8 }}>
                      <Gavel sx={{ fontSize: 48 }} />
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/my-penalties');
                    }}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  >
                    Переглянути штрафи
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recent Rentals */}
          {rentals.length > 0 && (
            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                boxShadow: (theme) => theme.palette.mode === 'dark'
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
                {rentals.slice(0, 3).map((rental: any) => (
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
                          <Chip
                            label={rental.status === 'active' ? 'Активний' : rental.status === 'completed' ? 'Завершений' : 'Скасований'}
                            color={rental.status === 'active' ? 'success' : rental.status === 'completed' ? 'default' : 'error'}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(rental.startDate).toLocaleDateString('uk-UA')} - {new Date(rental.expectedEndDate).toLocaleDateString('uk-UA')}
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
          )}

        </>
      )}
    </Container>
  );
};

export default HomePage;

