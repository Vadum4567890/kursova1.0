import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
} from '@mui/material';
import { LoadingSpinner } from '../common';
import { formatRentalDate } from '../../utils/rentalHelpers';
import { Penalty } from '../../interfaces';

interface PenaltyTableItem {
  id: number;
  rentalId?: number;
  rental?: {
    id: number;
  };
  amount: number;
  reason: string;
  date?: string;
  createdAt?: string;
}

interface PenaltiesTableProps {
  penalties: PenaltyTableItem[];
  loading: boolean;
}

const PenaltiesTable: React.FC<PenaltiesTableProps> = ({ penalties, loading }) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (penalties.length === 0) {
    return <Alert severity="info">У вас немає штрафів</Alert>;
  }

  return (
    <TableContainer>
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
          {penalties.slice(0, 10).map((penalty) => (
            <TableRow key={penalty.id}>
              <TableCell>{penalty.id}</TableCell>
              <TableCell>
                #{penalty.rental?.id || penalty.rentalId || 'Невідомо'}
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="error" fontWeight={600}>
                  {penalty.amount} ₴
                </Typography>
              </TableCell>
              <TableCell>{penalty.reason}</TableCell>
              <TableCell>
                {penalty.date || penalty.createdAt
                  ? formatRentalDate(penalty.date || penalty.createdAt!)
                  : 'Невідомо'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PenaltiesTable;

