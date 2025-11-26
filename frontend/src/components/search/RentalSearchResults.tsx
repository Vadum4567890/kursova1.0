import React from 'react';
import { formatDate } from '../../utils/dateHelpers';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Rental } from '../../interfaces';
import { StatusChip } from '../common';

interface RentalSearchResultsProps {
  rentals: Rental[];
}

export const RentalSearchResults: React.FC<RentalSearchResultsProps> = ({ rentals }) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Клієнт</TableCell>
            <TableCell>Автомобіль</TableCell>
            <TableCell>Дата початку</TableCell>
            <TableCell>Дата кінця</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell>Вартість</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rentals.map((rental) => (
            <TableRow key={rental.id}>
              <TableCell>{rental.id}</TableCell>
              <TableCell>{rental.client?.fullName || 'Невідомо'}</TableCell>
              <TableCell>
                {rental.car ? `${rental.car.brand} ${rental.car.model}` : 'Невідомо'}
              </TableCell>
              <TableCell>{formatDate(rental.startDate)}</TableCell>
              <TableCell>{formatDate(rental.expectedEndDate)}</TableCell>
              <TableCell>
                <StatusChip status={rental.status} />
              </TableCell>
              <TableCell>{rental.totalCost} ₴</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

