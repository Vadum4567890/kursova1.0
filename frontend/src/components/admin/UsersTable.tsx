import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
} from '@mui/material';
import { Edit, Delete, Block, CheckCircle } from '@mui/icons-material';
import { User } from '../../interfaces';
import { getRoleLabel, getRoleColor } from '../../utils/labels';

interface UsersTableProps {
  users: User[];
  onEditRole: (user: User) => void;
  onToggleStatus: (id: number, isActive: boolean) => void;
  onDelete: (id: number) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  onEditRole,
  onToggleStatus,
  onDelete,
}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Логін</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Телефон</TableCell>
            <TableCell>ПІБ</TableCell>
            <TableCell>Роль</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell align="right">Дії</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} hover>
              <TableCell>{user.id}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email || '-'}</TableCell>
              <TableCell>{user.phone || '-'}</TableCell>
              <TableCell>{user.fullName || '-'}</TableCell>
              <TableCell>
                <Chip
                  label={getRoleLabel(user.role)}
                  color={getRoleColor(user.role)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={user.isActive ? 'Активний' : 'Неактивний'}
                  color={user.isActive ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  onClick={() => onEditRole(user)}
                  title="Змінити роль"
                >
                  <Edit />
                </IconButton>
                <IconButton
                  size="small"
                  color={user.isActive ? 'error' : 'success'}
                  onClick={() => onToggleStatus(user.id, !user.isActive)}
                  title={user.isActive ? 'Заблокувати' : 'Активувати'}
                >
                  {user.isActive ? <Block /> : <CheckCircle />}
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDelete(user.id)}
                  title="Видалити"
                >
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

