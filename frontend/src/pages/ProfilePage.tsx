import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import {
  Edit,
  Lock,
  Assignment,
  Gavel,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useUpdateProfile, useChangePassword } from '../hooks/queries/useAuth';
import { useMyRentals, useRentals } from '../hooks/queries/useRentals';
import { useMyPenalties, usePenalties } from '../hooks/queries/usePenalties';

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  
  // React Query hooks - load data based on user role
  const { data: myRentals = [], isLoading: loadingMyRentals } = useMyRentals();
  const { data: allRentals = [], isLoading: loadingAllRentals } = useRentals();
  const { data: myPenalties = [], isLoading: loadingMyPenalties } = useMyPenalties();
  const { data: allPenalties = [], isLoading: loadingAllPenalties } = usePenalties();
  
  const rentals = user?.role === 'user' ? myRentals : allRentals;
  const penalties = user?.role === 'user' ? myPenalties : allPenalties;
  const loadingData = user?.role === 'user' 
    ? (loadingMyRentals || loadingMyPenalties)
    : (loadingAllRentals || loadingAllPenalties);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    email: user?.email || '',
    fullName: user?.fullName || '',
    address: user?.address || '',
    phone: user?.phone || '',
  });
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  React.useEffect(() => {
    if (user) {
      setProfileForm({
        email: user.email || '',
        fullName: user.fullName || '',
        address: user.address || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    try {
      setError('');
      await updateProfile.mutateAsync(profileForm);
      await refreshUser();
      setProfileDialogOpen(false);
      setSuccess('Профіль успішно оновлено');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Помилка оновлення профілю');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Нові паролі не співпадають');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('Пароль повинен містити мінімум 6 символів');
      return;
    }

    try {
      setError('');
      await changePassword.mutateAsync({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordDialogOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Пароль успішно змінено');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Помилка зміни пароля');
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
        return 'Користувач';
      default:
        return 'Користувач';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Мій профіль
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Управління особистими даними та налаштуваннями
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Info Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', pt: 4 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '3rem',
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {user?.fullName || user?.username}
              </Typography>
              <Chip
                label={getRoleLabel(user?.role || '')}
                color={getRoleColor(user?.role || '')}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user?.email}
              </Typography>
              {user?.address && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  📍 {user.address}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                @{user?.username}
              </Typography>
              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => {
                    setProfileForm({
                      email: user?.email || '',
                      fullName: user?.fullName || '',
                      address: user?.address || '',
                      phone: user?.phone || '',
                    });
                    setProfileDialogOpen(true);
                  }}
                >
                  Редагувати профіль
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Lock />}
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  Змінити пароль
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* User Data */}
        <Grid item xs={12} md={8}>
          <Paper>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
              <Tab label="Прокати" icon={<Assignment />} iconPosition="start" />
              <Tab label="Штрафи" icon={<Gavel />} iconPosition="start" />
            </Tabs>

            {tabValue === 0 && (
              <Box sx={{ p: 3 }}>
                {loadingData ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : rentals.length === 0 ? (
                  <Alert severity="info">У вас немає прокатів</Alert>
                ) : (
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
                            <TableCell>
                              {new Date(rental.startDate).toLocaleDateString('uk-UA')}
                            </TableCell>
                            <TableCell>
                              {new Date(rental.expectedEndDate).toLocaleDateString('uk-UA')}
                            </TableCell>
                            <TableCell>{rental.totalCost.toLocaleString()} ₴</TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  rental.status === 'active'
                                    ? 'Активний'
                                    : rental.status === 'completed'
                                    ? 'Завершений'
                                    : 'Скасований'
                                }
                                color={
                                  rental.status === 'active'
                                    ? 'success'
                                    : rental.status === 'completed'
                                    ? 'default'
                                    : 'error'
                                }
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                {loadingData ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : penalties.length === 0 ? (
                  <Alert severity="info">У вас немає штрафів</Alert>
                ) : (
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
                            <TableCell>#{penalty.rental?.id || penalty.rentalId || 'Невідомо'}</TableCell>
                            <TableCell>
                              <Typography variant="body2" color="error" fontWeight={600}>
                                {penalty.amount} ₴
                              </Typography>
                            </TableCell>
                            <TableCell>{penalty.reason}</TableCell>
                            <TableCell>
                              {new Date(penalty.date).toLocaleDateString('uk-UA')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Update Profile Dialog */}
      <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Редагувати профіль</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="ПІБ"
              value={profileForm.fullName}
              onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Адреса"
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              fullWidth
              placeholder="Місце проживання"
              multiline
              rows={2}
            />
            <TextField
              label="Телефон"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              fullWidth
              placeholder="+380501234567"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialogOpen(false)}>Скасувати</Button>
          <Button onClick={handleUpdateProfile} variant="contained" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? <CircularProgress size={20} /> : 'Зберегти'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Змінити пароль</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Поточний пароль"
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}>
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Новий пароль"
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}>
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Підтвердити новий пароль"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}>
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Скасувати</Button>
          <Button onClick={handleChangePassword} variant="contained" disabled={changePassword.isPending}>
            {changePassword.isPending ? <CircularProgress size={20} /> : 'Змінити'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;

