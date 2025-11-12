import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Edit, Delete, PersonAdd, Block, CheckCircle } from '@mui/icons-material';
import { userService, User } from '../../services/userService';

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  useEffect(() => {
    loadUsers();
  }, [tabValue]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      let data: User[];
      if (tabValue === 0) {
        data = await userService.getAllUsers();
      } else {
        const role = ['admin', 'manager', 'employee', 'user'][tabValue - 1];
        data = await userService.getUsersByRole(role);
      }
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка завантаження користувачів');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    try {
      await userService.updateUserRole(selectedUser.id, role);
      setDialogOpen(false);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка оновлення ролі');
    }
  };

  const handleUpdateStatus = async (id: number, isActive: boolean) => {
    try {
      await userService.updateUserStatus(id, isActive);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка оновлення статусу');
    }
  };

  const handleDeleteClick = (id: number) => {
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await userService.deleteUser(userToDelete);
      setError('');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка видалення');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      case 'employee':
        return 'default';
      case 'user':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Адмін';
      case 'manager':
        return 'Менеджер';
      case 'employee':
        return 'Співробітник';
      case 'user':
        return 'Клієнт';
      default:
        return role;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Управління користувачами
        </Typography>
        <Button variant="contained" startIcon={<PersonAdd />}>
          Додати користувача
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Всі користувачі" />
          <Tab label="Адміністратори" />
          <Tab label="Менеджери" />
          <Tab label="Співробітники" />
          <Tab label="Клієнти" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Логін</TableCell>
                <TableCell>Email</TableCell>
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
                  <TableCell>{user.email}</TableCell>
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
                      onClick={() => {
                        setSelectedUser(user);
                        setRole(user.role);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color={user.isActive ? 'error' : 'success'}
                      onClick={() => handleUpdateStatus(user.id, !user.isActive)}
                    >
                      {user.isActive ? <Block /> : <CheckCircle />}
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(user.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Змінити роль користувача</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Роль</InputLabel>
            <Select value={role} label="Роль" onChange={(e) => setRole(e.target.value)}>
              <MenuItem value="admin">Адмін</MenuItem>
              <MenuItem value="manager">Менеджер</MenuItem>
              <MenuItem value="employee">Співробітник</MenuItem>
              <MenuItem value="user">Клієнт</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Скасувати</Button>
          <Button onClick={handleUpdateRole} variant="contained">
            Зберегти
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          Підтвердження видалення
        </DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете видалити цього користувача? Цю дію неможливо скасувати.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Скасувати
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Видалити
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPage;

