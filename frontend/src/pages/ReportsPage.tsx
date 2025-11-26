import React, { useState } from 'react';
import { Typography, Box, Paper, Tabs, Tab } from '@mui/material';
import { useFinancialReport, useOccupancyReport, useAvailabilityReport, useCarReport } from '../hooks/queries/useReports';
import { useReports } from '../hooks';
import {
  FinancialReportTab,
  OccupancyReportTab,
  AvailabilityReportTab,
  CarReportTab,
} from '../components/reports';
import { ErrorAlert, PageContainer } from '../components/common';

const ReportsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const reports = useReports();

  // React Query hooks - enabled only when explicitly requested, but data persists in cache
  const {
    data: financialReport,
    isLoading: loadingFinancial,
    error: financialError,
    refetch: refetchFinancial,
  } = useFinancialReport(reports.startDate, reports.endDate, reports.shouldLoadFinancial);

  const {
    data: occupancyReport,
    isLoading: loadingOccupancy,
    error: occupancyError,
    refetch: refetchOccupancy,
  } = useOccupancyReport(reports.shouldLoadOccupancy);

  const {
    data: availabilityReport,
    isLoading: loadingAvailability,
    error: availabilityError,
    refetch: refetchAvailability,
  } = useAvailabilityReport(reports.shouldLoadAvailability);

  const {
    data: carReport,
    isLoading: loadingCarReport,
    error: carReportError,
    refetch: refetchCarReport,
  } = useCarReport(reports.startDate, reports.endDate, reports.shouldLoadCarReport);

  const error =
    financialError?.message ||
    occupancyError?.message ||
    availabilityError?.message ||
    carReportError?.message;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Don't reset load flags - keep them so data persists when switching tabs
  };

  const handleGenerateFinancial = () => {
    if (reports.startDate && reports.endDate) {
      reports.enableFinancial();
      refetchFinancial();
    }
  };

  const handleGenerateOccupancy = () => {
    reports.enableOccupancy();
    refetchOccupancy();
  };

  const handleGenerateAvailability = () => {
    reports.enableAvailability();
    refetchAvailability();
  };

  const handleGenerateCarReport = () => {
    reports.enableCarReport();
    refetchCarReport();
  };

  return (
    <PageContainer>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Звіти
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Генерація фінансових звітів та аналітика зайнятості
        </Typography>
      </Box>

      {error && <ErrorAlert message={error} />}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Фінансовий звіт" />
          <Tab label="Зайнятість" />
          <Tab label="Доступність" />
          <Tab label="Автомобілі" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <FinancialReportTab
          dateRange={reports.dateRange}
          onStartDateChange={reports.updateStartDate}
          onEndDateChange={reports.updateEndDate}
          onGenerate={handleGenerateFinancial}
          loading={loadingFinancial}
          report={financialReport}
        />
      )}

      {tabValue === 1 && (
        <OccupancyReportTab
          onGenerate={handleGenerateOccupancy}
          loading={loadingOccupancy}
          report={occupancyReport}
        />
      )}

      {tabValue === 2 && (
        <AvailabilityReportTab
          onGenerate={handleGenerateAvailability}
          loading={loadingAvailability}
          report={availabilityReport}
        />
      )}

      {tabValue === 3 && (
        <CarReportTab
          dateRange={reports.dateRange}
          onStartDateChange={reports.updateStartDate}
          onEndDateChange={reports.updateEndDate}
          onGenerate={handleGenerateCarReport}
          loading={loadingCarReport}
          report={carReport}
        />
      )}
    </PageContainer>
  );
};

export default ReportsPage;

