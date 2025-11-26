import React, { useMemo } from 'react';
import {
  Grid,
  Typography,
  Box,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { 
  ErrorAlert,
  LoadingSpinner,
  PageContainer
} from '../components/common';
import {
  RevenueChart,
  CarStatusChart,
  PopularCarsChart,
  OccupancyRateCard,
  RentalStatsTable,
} from '../components/dashboard';
import { StatCard } from '../components/common';
import { useDashboardData } from '../hooks/useDashboardData';
import { formatRevenueData, formatPopularCarsData, formatCarStatusData } from '../utils/chartHelpers';
import { getStatCardsConfig } from '../constants/dashboard';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { stats, popularCars, revenueStats, loading, error, isAdminOrManager } = useDashboardData(user?.role);

  const revenueData = useMemo(() => formatRevenueData(revenueStats), [revenueStats]);
  const popularCarsData = useMemo(() => formatPopularCarsData(popularCars), [popularCars]);
  const carStatusData = useMemo(() => formatCarStatusData(stats || undefined), [stats]);
  const statCardsConfig = useMemo(() => getStatCardsConfig(user?.role), [user?.role]);

  const occupancyRate = stats ? ((stats as any).occupancyRate || 0) : 0;

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorAlert message={error} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
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
        {statCardsConfig.map((cardConfig, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <StatCard
              title={cardConfig.title}
              value={cardConfig.getValue(stats)}
              icon={cardConfig.icon}
              gradient={cardConfig.gradient}
              showGradient={true}
            />
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      {isAdminOrManager && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Revenue Chart */}
          <Grid item xs={12} md={8}>
            <RevenueChart data={revenueData} />
          </Grid>

          {/* Car Status Pie Chart */}
          <Grid item xs={12} md={4}>
            <CarStatusChart data={carStatusData} />
          </Grid>

          {/* Popular Cars Chart */}
          {popularCars.length > 0 && (
            <Grid item xs={12}>
              <PopularCarsChart data={popularCarsData} />
            </Grid>
          )}

          {/* Occupancy Rate */}
          <Grid item xs={12} md={6}>
            <OccupancyRateCard
              occupancyRate={occupancyRate}
              rentedCars={stats?.rentedCars || 0}
              totalCars={stats?.totalCars || 0}
            />
          </Grid>

          {/* Recent Activity Table */}
          <Grid item xs={12} md={6}>
            <RentalStatsTable stats={stats || undefined} />
          </Grid>
        </Grid>
      )}
    </PageContainer>
  );
};

export default DashboardPage;
