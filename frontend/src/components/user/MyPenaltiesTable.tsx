import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
} from '@mui/material';
import { Penalty } from '../../interfaces';
import { formatRentalDate } from '../../utils/dateHelpers';

interface MyPenaltiesTableProps {
  penalties: Penalty[];
}

export const MyPenaltiesTable: React.FC<MyPenaltiesTableProps> = ({ penalties }) => {
  if (penalties.length === 0) {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Прокат</TableCell>
              <TableCell>Сума</TableCell>
              <TableCell>Причина</TableCell>
              <TableCell>Дата</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} align="center">
                <Typography color="text.secondary" sx={{ py: 4 }}>
                  У вас немає штрафів
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
            <TableCell>Прокат</TableCell>
            <TableCell>Сума</TableCell>
            <TableCell>Причина</TableCell>
            <TableCell>Дата</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {penalties.map((penalty) => (
            <TableRow key={penalty.id} hover>
              <TableCell>{penalty.id}</TableCell>
              <TableCell>Прокат #{penalty.rental?.id || penalty.rentalId || 'Невідомо'}</TableCell>
              <TableCell>
                <Typography variant="body2" color="error" fontWeight={600}>
                  {penalty.amount.toLocaleString()} ₴
                </Typography>
              </TableCell>
              <TableCell>{penalty.reason}</TableCell>
              <TableCell>{formatRentalDate(penalty.date)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

