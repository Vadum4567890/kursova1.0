import React from 'react';
import { Paper, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { Assignment } from '@mui/icons-material';
import { useAppTheme } from '../../context/ThemeContext';

interface DashboardStats {
  activeRentals?: number;
  completedRentals?: number;
  averageRentalDuration?: number;
  averageRevenuePerRental?: number;
}

interface RentalStatsTableProps {
  stats?: DashboardStats;
}

const RentalStatsTable: React.FC<RentalStatsTableProps> = ({ stats }) => {
  const { theme } = useAppTheme();

  return (
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
            <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
              <TableCell sx={{ fontWeight: 600 }}>Показник</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Значення
              </TableCell>
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
                <Chip label={stats?.completedRentals || 0} color="success" size="small" />
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
                  {(stats?.averageRevenuePerRental || 0).toLocaleString()} ₴
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default RentalStatsTable;

