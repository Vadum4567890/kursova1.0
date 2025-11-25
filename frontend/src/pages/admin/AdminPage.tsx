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
  TextField,
  InputAdornment,
} from '@mui/material';
import { Edit, Delete, PersonAdd, Block, CheckCircle, Visibility, VisibilityOff } from '@mui/icons-material';
import { userService, User, CreateUserData } from '../../services/userService';

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState<CreateUserData>({
    username: '',
    email: '',
    password: '',
    fullName: '',
    address: '',
    phone: '',
    role: 'employee',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);

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

  const handleCreateUser = async () => {
    if (!createUserForm.username || !createUserForm.email || !createUserForm.password) {
      setError('Логін, email та пароль обов\'язкові');
      return;
    }

    if (createUserForm.password.length < 6) {
      setError('Пароль повинен містити мінімум 6 символів');
      return;
    }

    try {
      setCreating(true);
      setError('');
      await userService.createUser(createUserForm);
      setCreateDialogOpen(false);
      setCreateUserForm({
        username: '',
        email: '',
        password: '',
        fullName: '',
        address: '',
        phone: '',
        role: 'employee',
      });
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Помилка створення користувача');
    } finally {
      setCreating(false);
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
        <Button 
          variant="contained" 
          startIcon={<PersonAdd />}
          onClick={() => setCreateDialogOpen(true)}
        >
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

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Додати нового користувача</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Логін *"
              value={createUserForm.username}
              onChange={(e) => setCreateUserForm({ ...createUserForm, username: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Email *"
              type="email"
              value={createUserForm.email}
              onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Пароль *"
              type={showPassword ? 'text' : 'password'}
              value={createUserForm.password}
              onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
              fullWidth
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="ПІБ"
              value={createUserForm.fullName}
              onChange={(e) => setCreateUserForm({ ...createUserForm, fullName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Адреса"
              value={createUserForm.address}
              onChange={(e) => setCreateUserForm({ ...createUserForm, address: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Телефон"
              value={createUserForm.phone}
              onChange={(e) => setCreateUserForm({ ...createUserForm, phone: e.target.value })}
              fullWidth
              placeholder="+380501234567"
            />
            <FormControl fullWidth>
              <InputLabel>Роль *</InputLabel>
              <Select
                value={createUserForm.role}
                label="Роль *"
                onChange={(e) => setCreateUserForm({ ...createUserForm, role: e.target.value as any })}
              >
                <MenuItem value="admin">Адмін</MenuItem>
                <MenuItem value="manager">Менеджер</MenuItem>
                <MenuItem value="employee">Співробітник</MenuItem>
                <MenuItem value="user">Клієнт</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={creating}>
            Скасувати
          </Button>
          <Button onClick={handleCreateUser} variant="contained" disabled={creating}>
            {creating ? <CircularProgress size={20} /> : 'Створити'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPage;

