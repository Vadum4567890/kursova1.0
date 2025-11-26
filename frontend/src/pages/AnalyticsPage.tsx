import React, { useMemo } from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { RevenueChart } from '../components/dashboard';
import {
  DateRangeFilter,
  PopularCarsBarChart,
  TopClientsTable,
  AnalyticsOccupancyCard,
} from '../components/analytics';
import { StatCard } from '../components/common';
import { useAnalyticsFilters, useAnalyticsData } from '../hooks';
import { getAnalyticsStatCardsConfig } from '../constants/analytics';
import { ErrorAlert, LoadingSpinner, PageContainer } from '../components/common';

const AnalyticsPage: React.FC = () => {
  const filters = useAnalyticsFilters({
    onFilterChange: () => {
      // Filters will trigger refetch automatically via useAnalyticsData
    },
  });

  const analyticsData = useAnalyticsData(filters.startDate, filters.endDate);

  const statCardsConfig = useMemo(
    () => getAnalyticsStatCardsConfig(),
    []
  );

  if (analyticsData.loading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (analyticsData.error) {
    return (
      <PageContainer>
        <ErrorAlert message={analyticsData.error} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Аналітика
        </Typography>
        <DateRangeFilter
          startDate={filters.dateRange.startDate}
          endDate={filters.dateRange.endDate}
          onStartDateChange={filters.updateStartDate}
          onEndDateChange={filters.updateEndDate}
          onApply={analyticsData.refetchFilteredData}
          onReset={filters.resetFilters}
          hasActiveFilters={filters.hasActiveFilters}
          loading={analyticsData.loading}
        />
      </Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Детальна аналітика роботи системи прокату
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCardsConfig.map((cardConfig, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard
              title={cardConfig.title}
              value={cardConfig.getValue(analyticsData.dashboardStats, analyticsData.occupancyRate)}
              icon={cardConfig.icon}
              gradient={cardConfig.gradient}
              variant="h5"
              showGradient={true}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Revenue Chart */}
        <Grid item xs={12} md={8}>
          <RevenueChart data={analyticsData.revenueData} />
        </Grid>

        {/* Occupancy Rate */}
        <Grid item xs={12} md={4}>
          <AnalyticsOccupancyCard
            occupancyRate={analyticsData.occupancyRate}
            rentedCars={analyticsData.dashboardStats?.rentedCars || 0}
            totalCars={analyticsData.dashboardStats?.totalCars || 0}
          />
        </Grid>

        {/* Popular Cars Chart */}
        <Grid item xs={12}>
          <PopularCarsBarChart data={analyticsData.popularCarsData} />
        </Grid>

        {/* Top Clients Table */}
        <Grid item xs={12}>
          <TopClientsTable clients={analyticsData.topClients} />
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default AnalyticsPage;
