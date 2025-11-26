import React from 'react';
import { Box, Paper, Grid, Button, TextField, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Description } from '@mui/icons-material';
import { useAppTheme } from '../../context/ThemeContext';
import { StatCard, StatusChip } from '../common';

interface CarReportTabProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onGenerate: () => void;
  loading: boolean;
  report: any;
}

const CarReportTab: React.FC<CarReportTabProps> = ({
  dateRange,
  onStartDateChange,
  onEndDateChange,
  onGenerate,
  loading,
  report,
}) => {
  const { theme } = useAppTheme();

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Дата початку"
            type="date"
            value={dateRange.startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Дата кінця"
            type="date"
            value={dateRange.endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="contained"
            onClick={onGenerate}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Description />}
          >
            Згенерувати звіт
          </Button>
        </Box>
      </Paper>

      {report && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <StatCard title="Всього автомобілів" value={report.summary.totalCars} variant="h5" />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Загальний дохід"
                value={`${report.summary.totalRevenue.toLocaleString()} ₴`}
                color="primary"
                variant="h5"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Чистий дохід"
                value={`${report.summary.totalNetRevenue.toLocaleString()} ₴`}
                color="success"
                variant="h5"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Середня зайнятість"
                value={`${report.summary.averageOccupancyRate.toFixed(1)}%`}
                variant="h5"
              />
            </Grid>
          </Grid>

          {/* Cars Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                  <TableCell sx={{ fontWeight: 700 }}>Автомобіль</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Статус
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Зайнятість
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Прокатів
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Дохід
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Чистий дохід
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Штрафи
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Середній дохід/прокат
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.cars.map((item: any) => (
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
                      <StatusChip status={item.car.status} />
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
                      <Typography variant="body2">{item.occupancy.rentalCount}</Typography>
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
  );
};

export default CarReportTab;

