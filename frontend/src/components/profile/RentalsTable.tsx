import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import { LoadingSpinner, StatusChip } from '../common';
import { formatRentalDate } from '../../utils/rentalHelpers';

interface Rental {
  id: number;
  carId?: number;
  car?: {
    brand: string;
    model: string;
  };
  startDate: string | Date;
  expectedEndDate: string | Date;
  totalCost: number;
  status: string;
}

interface RentalsTableProps {
  rentals: Rental[];
  loading: boolean;
}

const RentalsTable: React.FC<RentalsTableProps> = ({ rentals, loading }) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (rentals.length === 0) {
    return <Alert severity="info">У вас немає прокатів</Alert>;
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Автомобіль</TableCell>
            <TableCell>Дата початку</TableCell>
            <TableCell>Дата кінця</TableCell>
            <TableCell>Вартість</TableCell>
            <TableCell>Статус</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rentals.slice(0, 10).map((rental) => (
            <TableRow key={rental.id}>
              <TableCell>{rental.id}</TableCell>
              <TableCell>
                {rental.car
                  ? `${rental.car.brand} ${rental.car.model}`
                  : `Автомобіль #${rental.carId}`}
              </TableCell>
              <TableCell>{formatRentalDate(rental.startDate)}</TableCell>
              <TableCell>{formatRentalDate(rental.expectedEndDate)}</TableCell>
              <TableCell>{rental.totalCost.toLocaleString()} ₴</TableCell>
              <TableCell>
                <StatusChip status={rental.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RentalsTable;

