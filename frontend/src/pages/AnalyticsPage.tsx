import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  TextField,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  DirectionsCar,
  AttachMoney,
  Gavel,
  Speed,
  People,
  AccountBalance,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { analyticsService, PopularCar, TopClient } from '../services/analyticsService';

const AnalyticsPage: React.FC = () => {
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [popularCars, setPopularCars] = useState<PopularCar[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [occupancyRate, setOccupancyRate] = useState<number>(0);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const startDate = dateRange.startDate || undefined;
      const endDate = dateRange.endDate || undefined;
      
      const [stats, popular, top, occupancy, revenueStats] = await Promise.all([
        analyticsService.getDashboardStats(startDate, endDate),
        analyticsService.getPopularCars(5),
        analyticsService.getTopClients(5),
        analyticsService.getOccupancyRate(),
        analyticsService.getRevenueStats(startDate, endDate),
      ]);
      setDashboardStats(stats);
      setPopularCars(popular);
      setTopClients(top);
      setOccupancyRate(occupancy);
      
      // Format revenue data for chart
      const formattedRevenue = revenueStats?.revenueByDay
            ?.slice(-7)
            .map((item: any) => ({
              date: new Date(item.date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }),
              Дохід: Math.round(item.amount),
            })) || [];
      setRevenueData(formattedRevenue);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      const errorMessage = err.message || err.response?.data?.error || 'Помилка завантаження аналітики';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const popularCarsData = popularCars.map((item) => ({
    name: `${item.car.brand} ${item.car.model}`,
    Кількість: item.rentalCount,
    Дохід: Math.round(item.totalRevenue),
  }));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
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

  const statCards = [
    {
      title: 'Загальний дохід',
      value: `${(dashboardStats?.totalRevenue || 0).toLocaleString()} ₴`,
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      title: 'Зайнятість',
      value: `${occupancyRate.toFixed(1)}%`,
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    },
    {
      title: 'Штрафи',
      value: `${(dashboardStats?.totalPenalties || 0).toLocaleString()} ₴`,
      icon: <Gavel sx={{ fontSize: 40 }} />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      title: 'Середня тривалість',
      value: `${(dashboardStats?.averageRentalDuration?.toFixed(1) || 0)} днів`,
      icon: <Speed sx={{ fontSize: 40 }} />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Аналітика
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Дата початку"
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            label="Дата кінця"
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <Button
            variant="contained"
            onClick={loadAnalytics}
            disabled={loading}
          >
            Застосувати фільтр
          </Button>
          {(dateRange.startDate || dateRange.endDate) && (
            <Button
              variant="outlined"
              onClick={() => {
                setDateRange({ startDate: '', endDate: '' });
                setTimeout(() => loadAnalytics(), 100);
              }}
            >
              Скинути
            </Button>
          )}
        </Box>
      </Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Детальна аналітика роботи системи прокату
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
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
                    <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
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

      <Grid container spacing={3}>
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

        {/* Occupancy Rate */}
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
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {occupancyRate.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={occupancyRate}
                sx={{
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 8,
                    background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {dashboardStats?.rentedCars || 0} з {dashboardStats?.totalCars || 0} автомобілів в прокаті
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Popular Cars Chart */}
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
            {popularCarsData.length > 0 ? (
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
                  <Bar dataKey="Кількість" fill="#1976d2" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Дохід" fill="#2e7d32" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
                <Typography color="text.secondary">Немає даних</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Top Clients Table */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <People sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Топ клієнти
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Клієнт</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Всього отримано</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Вартість</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Штрафи</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Залог</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Повернути</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Чистий дохід</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary" sx={{ py: 4 }}>
                          Немає даних
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    topClients.map((item, index) => (
                      <TableRow key={item.client.id} hover sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {index + 1}. {item.client.fullName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.rentalCount} прокат{item.rentalCount > 1 ? 'ів' : item.rentalCount === 1 ? '' : 'ів'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {item.totalReceived.toLocaleString()} ₴
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {item.totalCost.toLocaleString()} ₴
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {item.totalPenalties > 0 ? (
                            <Chip
                              label={`${item.totalPenalties.toLocaleString()} ₴`}
                              color="error"
                              size="small"
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              0 ₴
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${item.totalDeposits.toLocaleString()} ₴`}
                            sx={{ backgroundColor: '#ff9800', color: 'white' }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {item.totalToReturn > 0 ? (
                            <Chip
                              label={`${item.totalToReturn.toLocaleString()} ₴`}
                              color="info"
                              size="small"
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              0 ₴
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${item.netRevenue.toLocaleString()} ₴`}
                            color={item.netRevenue >= 0 ? 'success' : 'error'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                            Чистий прибуток
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AnalyticsPage;
