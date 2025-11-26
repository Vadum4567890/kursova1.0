import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import { Cancel } from '@mui/icons-material';
import { Rental } from '../../interfaces';
import { formatRentalDate } from '../../utils/rentalHelpers';
import { StatusChip } from '../common';

interface MyRentalsTableProps {
  rentals: Rental[];
  onCancelClick: (id: number) => void;
}

export const MyRentalsTable: React.FC<MyRentalsTableProps> = ({ rentals, onCancelClick }) => {
  if (rentals.length === 0) {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Автомобіль</TableCell>
              <TableCell>Початок</TableCell>
              <TableCell>Очікуваний кінець</TableCell>
              <TableCell>Вартість</TableCell>
              <TableCell>Залог</TableCell>
              <TableCell>Повернення</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Дії</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={9} align="center">
                <Typography color="text.secondary" sx={{ py: 4 }}>
                  Немає прокатів для відображення
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Автомобіль</TableCell>
            <TableCell>Початок</TableCell>
            <TableCell>Очікуваний кінець</TableCell>
            <TableCell>Вартість</TableCell>
            <TableCell>Залог</TableCell>
            <TableCell>Повернення</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell align="right">Дії</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rentals.map((rental) => {
            const refund = Math.max(0, rental.depositAmount - rental.penaltyAmount);
            const isCompletedOrCancelled = rental.status === 'cancelled' || rental.status === 'completed';

            return (
              <TableRow key={rental.id} hover>
                <TableCell>{rental.id}</TableCell>
                <TableCell>
                  {rental.car
                    ? `${rental.car.brand} ${rental.car.model}`
                    : rental.carId
                    ? `Автомобіль #${rental.carId}`
                    : 'Невідомо'}
                </TableCell>
                <TableCell>{formatRentalDate(rental.startDate)}</TableCell>
                <TableCell>
                  {formatRentalDate(rental.expectedEndDate)}
                  {rental.actualEndDate && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      Фактично: {formatRentalDate(rental.actualEndDate)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {rental.totalCost.toLocaleString()} ₴
                  </Typography>
                  {rental.penaltyAmount > 0 && (
                    <Typography variant="caption" color="error" display="block">
                      Штраф: +{rental.penaltyAmount.toLocaleString()} ₴
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="warning.main">
                    {rental.depositAmount.toLocaleString()} ₴
                  </Typography>
                </TableCell>
                <TableCell>
                  {isCompletedOrCancelled ? (
                    <Typography
                      variant="body2"
                      color={refund > 0 ? 'success.main' : 'text.secondary'}
                      fontWeight={refund > 0 ? 600 : 400}
                    >
                      {refund.toLocaleString()} ₴
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {rental.depositAmount.toLocaleString()} ₴
                      <Typography variant="caption" display="block" color="text.secondary">
                        (очікується)
                      </Typography>
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <StatusChip status={rental.status} />
                </TableCell>
                <TableCell align="right">
                  {rental.status === 'active' && (
                    <Button
                      size="small"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => onCancelClick(rental.id)}
                    >
                      Скасувати
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

