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
import { useFinancialReport, useOccupancyReport, useAvailabilityReport } from '../hooks/queries/useReports';

const ReportsPage: React.FC = () => {
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

  // React Query hooks - enabled only when dates are provided for financial report
  const { 
    data: financialReport, 
    isLoading: loadingFinancial, 
    error: financialError,
    refetch: refetchFinancial 
  } = useFinancialReport(startDate, endDate);
  
  const { 
    data: occupancyReport, 
    isLoading: loadingOccupancy, 
    error: occupancyError,
    refetch: refetchOccupancy 
  } = useOccupancyReport();
  
  const { 
    data: availabilityReport, 
    isLoading: loadingAvailability, 
    error: availabilityError 
  } = useAvailabilityReport();

  const loading = loadingFinancial || loadingOccupancy || loadingAvailability;
  const error = financialError?.message || occupancyError?.message || availabilityError?.message;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Trigger refetch when switching tabs
    if (newValue === 0 && startDate && endDate) {
      refetchFinancial();
    } else if (newValue === 1) {
      refetchOccupancy();
    }
  };

  // Auto-load reports when component mounts or dates change
  React.useEffect(() => {
    if (tabValue === 0 && startDate && endDate) {
      refetchFinancial();
    } else if (tabValue === 1) {
      refetchOccupancy();
    }
  }, [tabValue, startDate, endDate, refetchFinancial, refetchOccupancy]);

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
                onClick={() => refetchFinancial()}
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
              onClick={() => refetchOccupancy()}
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
              onClick={() => {}}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Description />}
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
    </Container>
  );
};

export default ReportsPage;

