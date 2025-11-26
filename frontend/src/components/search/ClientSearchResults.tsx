import React from 'react';
import { formatDate } from '../../utils/dateHelpers';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Client } from '../../interfaces';

interface ClientSearchResultsProps {
  clients: Client[];
}

export const ClientSearchResults: React.FC<ClientSearchResultsProps> = ({ clients }) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>ПІБ</TableCell>
            <TableCell>Телефон</TableCell>
            <TableCell>Адреса</TableCell>
            <TableCell>Дата реєстрації</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>{client.id}</TableCell>
              <TableCell>{client.fullName}</TableCell>
              <TableCell>{client.phone}</TableCell>
              <TableCell>{client.address}</TableCell>
              <TableCell>{formatDate(client.registrationDate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

