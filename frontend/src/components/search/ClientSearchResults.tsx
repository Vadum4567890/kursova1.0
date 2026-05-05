import React from 'react';
import { formatDate } from '../../utils/dateHelpers';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Client } from '../../interfaces';

interface ClientSearchResultsProps {
  clients: Client[];
}

function roleLabel(role?: Client['role']): string {
  switch (role) {
    case 'owner':
      return 'Орендодавець';
    case 'both':
      return 'Орендар і орендодавець';
    case 'renter':
    default:
      return 'Орендар';
  }
}

export const ClientSearchResults: React.FC<ClientSearchResultsProps> = ({ clients }) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Роль</TableCell>
            <TableCell>ПІБ</TableCell>
            <TableCell>Телефон</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Адреса</TableCell>
            <TableCell>Дата реєстрації</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>{client.id}</TableCell>
              <TableCell>{roleLabel(client.role)}</TableCell>
              <TableCell>{client.fullName}</TableCell>
              <TableCell>{client.phone}</TableCell>
              <TableCell>{client.email ?? '—'}</TableCell>
              <TableCell>{client.address}</TableCell>
              <TableCell>{formatDate(client.registrationDate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
