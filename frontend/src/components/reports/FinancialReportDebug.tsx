import React from 'react';
import { Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

interface FinancialReportDebugProps {
  report: {
    debug: {
      completedRentalsCount: number;
      activeRentalsCount: number;
      cancelledRentalsCount: number;
      totalRevenueFromCompleted: number;
      expectedRevenueFromActive: number;
      depositsToReturnFromCompleted: number;
      cancelledDepositsToReturn: number;
      completedNetRevenue: number;
      cancelledNetRevenue: number;
      calculation: {
        completed: Array<{
          id: number;
          cost: number;
          penalty: number;
          deposit: number;
          depositToReturn: number;
          net: number;
        }>;
        cancelled?: Array<{
          id: number;
          cost: number;
          penalty: number;
          deposit: number;
          depositToReturn: number;
          net: number;
        }>;
      };
    };
    netRevenue: number;
  };
}

const FinancialReportDebug: React.FC<FinancialReportDebugProps> = ({ report }) => {
  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Детальна інформація про розрахунки
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" gutterBottom>
          <strong>Завершені прокати:</strong> {report.debug.completedRentalsCount}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Активні прокати:</strong> {report.debug.activeRentalsCount}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Скасовані прокати:</strong> {report.debug.cancelledRentalsCount}
        </Typography>
        <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
          <strong>Дохід з завершених:</strong> {report.debug.totalRevenueFromCompleted.toLocaleString()} ₴
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Очікуваний дохід з активних:</strong> {report.debug.expectedRevenueFromActive.toLocaleString()} ₴
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Депозити, які потрібно повернути (завершені):</strong>{' '}
          {report.debug.depositsToReturnFromCompleted.toLocaleString()} ₴
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Депозити, які потрібно повернути (скасовані):</strong>{' '}
          {report.debug.cancelledDepositsToReturn.toLocaleString()} ₴
        </Typography>
        <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
          <strong>Чистий дохід (завершені):</strong> {report.debug.completedNetRevenue.toLocaleString()} ₴
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Чистий дохід (скасовані):</strong> {report.debug.cancelledNetRevenue.toLocaleString()} ₴
        </Typography>
        <Typography variant="body2" gutterBottom sx={{ mt: 2, color: 'primary.main' }}>
          <strong>Загальний чистий дохід:</strong> {report.netRevenue.toLocaleString()} ₴
        </Typography>

        {report.debug.calculation.completed.length > 0 && (
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
                  {report.debug.calculation.completed.map((r) => (
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

        {report.debug.calculation.cancelled && report.debug.calculation.cancelled.length > 0 && (
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
                  {report.debug.calculation.cancelled.map((r) => (
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
  );
};

export default FinancialReportDebug;

