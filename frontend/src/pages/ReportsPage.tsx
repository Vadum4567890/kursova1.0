import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  TextField,
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
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import { Description } from '@mui/icons-material';
import dayjs from 'dayjs';
// Types are inferred from hooks
import { useFinancialReport, useOccupancyReport, useAvailabilityReport, useCarReport } from '../hooks/queries/useReports';
import { useAppTheme } from '../context/ThemeContext';

const ReportsPage: React.FC = () => {
  const { theme } = useAppTheme();
  const [tabValue, setTabValue] = useState(0);
  // Set default dates: start of current year to today
  const defaultStartDate = dayjs().startOf('year').format('YYYY-MM-DD');
  const defaultEndDate = dayjs().format('YYYY-MM-DD');
  
  const [dateRange, setDateRange] = useState({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
  });

  const startDate = dateRange.startDate || undefined;
  const endDate = dateRange.endDate || undefined;

  // State to track if reports should be loaded
  const [shouldLoadFinancial, setShouldLoadFinancial] = useState(false);
  const [shouldLoadOccupancy, setShouldLoadOccupancy] = useState(false);
  const [shouldLoadAvailability, setShouldLoadAvailability] = useState(false);
  const [shouldLoadCarReport, setShouldLoadCarReport] = useState(false);

  // React Query hooks - enabled only when explicitly requested, but data persists in cache
  const { 
    data: financialReport, 
    isLoading: loadingFinancial, 
    error: financialError,
    refetch: refetchFinancial 
  } = useFinancialReport(
    startDate, 
    endDate,
    shouldLoadFinancial
  );
  
  const { 
    data: occupancyReport, 
    isLoading: loadingOccupancy, 
    error: occupancyError,
    refetch: refetchOccupancy 
  } = useOccupancyReport(shouldLoadOccupancy);
  
  const { 
    data: availabilityReport, 
    isLoading: loadingAvailability, 
    error: availabilityError,
    refetch: refetchAvailability
  } = useAvailabilityReport(shouldLoadAvailability);

  const {
    data: carReport,
    isLoading: loadingCarReport,
    error: carReportError,
    refetch: refetchCarReport
  } = useCarReport(
    startDate,
    endDate,
    shouldLoadCarReport
  );

  const error = financialError?.message || occupancyError?.message || availabilityError?.message || carReportError?.message;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Don't reset load flags - keep them so data persists when switching tabs
  };

  const handleGenerateFinancial = () => {
    if (startDate && endDate) {
      setShouldLoadFinancial(true);
      refetchFinancial();
    }
  };

  const handleGenerateOccupancy = () => {
    setShouldLoadOccupancy(true);
    refetchOccupancy();
  };

  const handleGenerateAvailability = () => {
    setShouldLoadAvailability(true);
    refetchAvailability();
  };

  const handleGenerateCarReport = () => {
    setShouldLoadCarReport(true);
    refetchCarReport();
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Звіти
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Генерація фінансових звітів та аналітика зайнятості
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Фінансовий звіт" />
          <Tab label="Зайнятість" />
          <Tab label="Доступність" />
          <Tab label="Автомобілі" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Дата початку"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Дата кінця"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="contained"
                onClick={handleGenerateFinancial}
                disabled={loadingFinancial || !startDate || !endDate}
                startIcon={loadingFinancial ? <CircularProgress size={20} /> : <Description />}
              >
                Згенерувати звіт
              </Button>
            </Box>
          </Paper>

          {financialReport && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Загальний дохід
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {(financialReport?.totalRevenue ?? 0).toLocaleString()} ₴
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Штрафи
                    </Typography>
                    <Typography variant="h5" color="error">
                      {(financialReport?.totalPenalties ?? 0).toLocaleString()} ₴
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Депозити
                    </Typography>
                    <Typography variant="h5">
                      {(financialReport?.totalDeposits ?? 0).toLocaleString()} ₴
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Чистий дохід
                    </Typography>
                    <Typography variant="h5" color="success.main">
                      {(financialReport?.netRevenue ?? 0).toLocaleString()} ₴
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {financialReport?.debug && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Детальна інформація про розрахунки
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Завершені прокати:</strong> {financialReport.debug.completedRentalsCount}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Активні прокати:</strong> {financialReport.debug.activeRentalsCount}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Скасовані прокати:</strong> {financialReport.debug.cancelledRentalsCount}
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
                  <strong>Дохід з завершених:</strong> {financialReport.debug.totalRevenueFromCompleted.toLocaleString()} ₴
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Очікуваний дохід з активних:</strong> {financialReport.debug.expectedRevenueFromActive.toLocaleString()} ₴
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Депозити, які потрібно повернути (завершені):</strong> {financialReport.debug.depositsToReturnFromCompleted.toLocaleString()} ₴
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Депозити, які потрібно повернути (скасовані):</strong> {financialReport.debug.cancelledDepositsToReturn.toLocaleString()} ₴
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
                  <strong>Чистий дохід (завершені):</strong> {financialReport.debug.completedNetRevenue.toLocaleString()} ₴
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Чистий дохід (скасовані):</strong> {financialReport.debug.cancelledNetRevenue.toLocaleString()} ₴
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ mt: 2, color: 'primary.main' }}>
                  <strong>Загальний чистий дохід:</strong> {financialReport.netRevenue.toLocaleString()} ₴
                </Typography>
                
                {financialReport.debug.calculation.completed.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Деталі по завершених прокатах:
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell align="right">Вартість</TableCell>
                            <TableCell align="right">Штраф</TableCell>
                            <TableCell align="right">Депозит</TableCell>
                            <TableCell align="right">Повернути</TableCell>
                            <TableCell align="right">Чистий дохід</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {financialReport.debug.calculation.completed.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell>#{r.id}</TableCell>
                              <TableCell align="right">{r.cost.toLocaleString()} ₴</TableCell>
                              <TableCell align="right">{r.penalty.toLocaleString()} ₴</TableCell>
                              <TableCell align="right">{r.deposit.toLocaleString()} ₴</TableCell>
                              <TableCell align="right">{r.depositToReturn.toLocaleString()} ₴</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                {r.net.toLocaleString()} ₴
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {financialReport.debug.calculation.cancelled && financialReport.debug.calculation.cancelled.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Деталі по скасованих прокатах:
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell align="right">Вартість</TableCell>
                            <TableCell align="right">Штраф</TableCell>
                            <TableCell align="right">Депозит</TableCell>
                            <TableCell align="right">Повернути</TableCell>
                            <TableCell align="right">Чистий дохід</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {financialReport.debug.calculation.cancelled.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell>#{r.id}</TableCell>
                              <TableCell align="right">{r.cost.toLocaleString()} ₴</TableCell>
                              <TableCell align="right">{r.penalty.toLocaleString()} ₴</TableCell>
                              <TableCell align="right">{r.deposit.toLocaleString()} ₴</TableCell>
                              <TableCell align="right">{r.depositToReturn.toLocaleString()} ₴</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                {r.net.toLocaleString()} ₴
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Button
              variant="contained"
              onClick={handleGenerateOccupancy}
              disabled={loadingOccupancy}
              startIcon={loadingOccupancy ? <CircularProgress size={20} /> : <Description />}
            >
              Згенерувати звіт
            </Button>
          </Paper>

          {occupancyReport && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Загальна зайнятість
                    </Typography>
                    <Typography variant="h4">
                      {(occupancyReport?.occupancyRate ?? 0).toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Доступні
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {occupancyReport?.availableCars ?? 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      В прокаті
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {occupancyReport?.rentedCars ?? 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Button
              variant="contained"
              onClick={handleGenerateAvailability}
              disabled={loadingAvailability}
              startIcon={loadingAvailability ? <CircularProgress size={20} /> : <Description />}
            >
              Згенерувати звіт
            </Button>
          </Paper>

          {availabilityReport && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Автомобіль</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Дата доступності</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(availabilityReport?.cars || []).map((car) => (
                    <TableRow key={car.id}>
                      <TableCell>{car.brand} {car.model}</TableCell>
                      <TableCell>
                        <Chip
                          label={car.status === 'available' ? 'Доступний' : car.status}
                          color={car.status === 'available' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {car.nextAvailableDate
                          ? new Date(car.nextAvailableDate).toLocaleDateString('uk-UA')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {tabValue === 3 && (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                label="Дата початку"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Дата кінця"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="contained"
                onClick={handleGenerateCarReport}
                disabled={loadingCarReport}
                startIcon={loadingCarReport ? <CircularProgress size={20} /> : <Description />}
              >
                Згенерувати звіт
              </Button>
            </Box>
          </Paper>

          {carReport && (
            <>
              {/* Summary Cards */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Всього автомобілів
                      </Typography>
                      <Typography variant="h5">
                        {carReport.summary.totalCars}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Загальний дохід
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {carReport.summary.totalRevenue.toLocaleString()} ₴
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Чистий дохід
                      </Typography>
                      <Typography variant="h5" color="success.main">
                        {carReport.summary.totalNetRevenue.toLocaleString()} ₴
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Середня зайнятість
                      </Typography>
                      <Typography variant="h5">
                        {carReport.summary.averageOccupancyRate.toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Cars Table */}
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                      <TableCell sx={{ fontWeight: 700 }}>Автомобіль</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Статус</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Зайнятість</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Прокатів</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Дохід</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Чистий дохід</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Штрафи</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Середній дохід/прокат</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {carReport.cars.map((item) => (
                      <TableRow key={item.car.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.car.brand} {item.car.model}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.car.year} • {item.car.type}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={
                              item.car.status === 'available' ? 'Доступний' :
                              item.car.status === 'rented' ? 'В прокаті' :
                              item.car.status === 'maintenance' ? 'На обслуговуванні' :
                              item.car.status
                            }
                            color={
                              item.car.status === 'available' ? 'success' :
                              item.car.status === 'rented' ? 'warning' :
                              'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {parseFloat(item.occupancy.occupancyRate).toFixed(1)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.occupancy.totalRentalDays} дн. / {item.occupancy.periodDays} дн.
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {item.occupancy.rentalCount}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Завершено: {item.occupancy.completedCount}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.financial.totalRevenue.toLocaleString()} ₴
                          </Typography>
                          {item.financial.expectedRevenue > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              Очікується: {item.financial.expectedRevenue.toLocaleString()} ₴
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                            {item.financial.netRevenue.toLocaleString()} ₴
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="error.main">
                            {item.financial.totalPenalties.toLocaleString()} ₴
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {item.financial.averageRevenuePerRental.toLocaleString()} ₴
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      )}
    </Container>
  );
};

export default ReportsPage;

