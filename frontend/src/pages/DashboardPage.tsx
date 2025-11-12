import React from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  DirectionsCar,
  People,
  Assignment,
  AttachMoney,
  TrendingUp,
  Gavel,
  AccountBalance,
  Speed,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { DashboardStats, PopularCar } from '../services/analyticsService';
import { useDashboardStats, usePopularCars, useRevenueStats } from '../hooks/queries/useAnalytics';
import { useCars } from '../hooks/queries/useCars';
import { useClients } from '../hooks/queries/useClients';
import { useRentals } from '../hooks/queries/useRentals';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
  
  // React Query hooks for admin/manager
  const { data: dashboardStats, isLoading: loadingStats, error: statsError } = useDashboardStats();
  const { data: popularCars = [], isLoading: loadingPopular, error: popularError } = usePopularCars(5);
  const { data: revenueStats, isLoading: loadingRevenue, error: revenueError } = useRevenueStats();
  
  // React Query hooks for employees
  const { data: carsResponse, isLoading: loadingCars } = useCars();
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { data: rentals = [], isLoading: loadingRentals } = useRentals();
  
  // Calculate employee stats from data
  const employeeStats: DashboardStats | null = React.useMemo(() => {
    if (isAdminOrManager || !carsResponse?.data) return null;
    const cars = carsResponse.data;
    return {
      totalCars: cars.length,
      availableCars: cars.filter((c: any) => c.status === 'available').length,
      rentedCars: cars.filter((c: any) => c.status === 'rented').length,
      totalClients: clients.length,
      activeRentals: rentals.filter((r: any) => r.status === 'active').length,
      totalRevenue: 0,
      totalPenalties: 0,
      averageRentalDuration: 0,
    };
  }, [carsResponse, clients, rentals, isAdminOrManager]);
  
  // Select stats based on role
  const stats = isAdminOrManager ? dashboardStats : employeeStats;
  const loading = isAdminOrManager 
    ? (loadingStats || loadingPopular || loadingRevenue)
    : (loadingCars || loadingClients || loadingRentals);
  const error = statsError?.message || popularError?.message || revenueError?.message;
  
  // Format revenue data for chart
  const revenueData = React.useMemo(() => {
    if (!revenueStats?.revenueByDay) return [];
    return revenueStats.revenueByDay
      .slice(-7)
      .map((item: any) => ({
        date: new Date(item.date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }),
        Дохід: Math.round(item.amount),
      }));
  }, [revenueStats]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  // Prepare data for charts
  const carStatusData = stats ? [
    { name: 'Доступні', value: stats.availableCars, color: '#2e7d32' },
    { name: 'В прокаті', value: stats.rentedCars, color: '#ed6c02' },
    { name: 'На обслуговуванні', value: (stats as any).maintenanceCars || 0, color: '#d32f2f' },
  ].filter(item => item.value > 0) : [];

  const popularCarsData = popularCars.map((car: PopularCar) => ({
    name: `${car.car.brand} ${car.car.model}`,
    Прокатів: car.rentalCount,
    Дохід: Math.round(car.totalRevenue),
  }));

  const statCards = [
    {
      title: 'Всього автомобілів',
      value: stats?.totalCars || 0,
      icon: <DirectionsCar sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      title: 'Доступні',
      value: stats?.availableCars || 0,
      icon: <DirectionsCar sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    },
    {
      title: 'В прокаті',
      value: stats?.rentedCars || 0,
      icon: <Assignment sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      title: 'Клієнти',
      value: stats?.totalClients || 0,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      title: 'Активні прокати',
      value: stats?.activeRentals || 0,
      icon: <Assignment sx={{ fontSize: 40 }} />,
      color: '#0288d1',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
    ...(user?.role === 'admin' || user?.role === 'manager'
      ? [
          {
            title: 'Загальний дохід',
            value: `${(stats?.totalRevenue || 0).toLocaleString()} ₴`,
            icon: <AttachMoney sx={{ fontSize: 40 }} />,
            color: '#2e7d32',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          },
          {
            title: 'Штрафи',
            value: `${(stats?.totalPenalties || 0).toLocaleString()} ₴`,
            icon: <Gavel sx={{ fontSize: 40 }} />,
            color: '#d32f2f',
            gradient: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
          },
          {
            title: 'Середня тривалість',
            value: `${(stats?.averageRentalDuration || 0).toFixed(1)} дн.`,
            icon: <Speed sx={{ fontSize: 40 }} />,
            color: '#0288d1',
            gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
          },
        ]
      : []),
  ];

  const occupancyRate = stats ? ((stats as any).occupancyRate || 0) : 0;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Панель управління
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ласкаво просимо, {user?.fullName || user?.username}!
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card
              sx={{
                height: '100%',
                background: card.gradient,
                color: 'white',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 8,
                },
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255, 255, 255, 0.1)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                },
                '&:hover::before': {
                  opacity: 1,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontWeight: 500 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ opacity: 0.8 }}>{card.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      {(user?.role === 'admin' || user?.role === 'manager') && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Revenue Chart */}
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 2,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Дохід за останні 7 днів
                </Typography>
              </Box>
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Дохід"
                      stroke="#1976d2"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <Typography color="text.secondary">Немає даних для відображення</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Car Status Pie Chart */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 2,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <DirectionsCar sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Статуси автомобілів
                </Typography>
              </Box>
              {carStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={carStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {carStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <Typography color="text.secondary">Немає даних</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Popular Cars Chart */}
          {popularCars.length > 0 && (
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 2,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <DirectionsCar sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Популярні автомобілі
                  </Typography>
                </Box>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={popularCarsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      stroke="#666"
                      interval={0}
                    />
                    <YAxis stroke="#666" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Прокатів" fill="#1976d2" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Дохід" fill="#2e7d32" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}

          {/* Occupancy Rate */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalance sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Зайнятість автопарку
                </Typography>
              </Box>
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Зайнятість
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {occupancyRate.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={occupancyRate}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 6,
                      background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {stats?.rentedCars || 0} з {stats?.totalCars || 0} автомобілів в прокаті
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Recent Activity Table */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assignment sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Статистика прокатів
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Показник</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Значення</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Активні прокати</TableCell>
                      <TableCell align="right">
                        <Chip label={stats?.activeRentals || 0} color="primary" size="small" />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Завершені прокати</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={(stats as any)?.completedRentals || 0}
                          color="success"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Середня тривалість</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {(stats?.averageRentalDuration || 0).toFixed(1)} дн.
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Середній дохід з прокату</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          {((stats as any)?.averageRevenuePerRental || 0).toLocaleString()} ₴
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default DashboardPage;
