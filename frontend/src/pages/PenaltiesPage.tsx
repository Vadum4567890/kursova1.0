import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { penaltyService, Penalty } from '../services/penaltyService';
import { rentalService } from '../services/rentalService';

const PenaltiesPage: React.FC = () => {
  const { user } = useAuth();
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rentals, setRentals] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    rentalId: '',
    amount: '',
    reason: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [penaltyToDelete, setPenaltyToDelete] = useState<number | null>(null);
  const [rentalSearchTerm, setRentalSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [penaltiesData, rentalsData] = await Promise.all([
        penaltyService.getAllPenalties(),
        rentalService.getAllRentals(),
      ]);
      setPenalties(penaltiesData);
      setRentals(rentalsData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка завантаження даних');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await penaltyService.createPenalty({
        rentalId: parseInt(formData.rentalId),
        amount: parseFloat(formData.amount),
        reason: formData.reason,
      });
      setDialogOpen(false);
      setFormData({ rentalId: '', amount: '', reason: '' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка створення штрафу');
    }
  };

  const handleDeleteClick = (id: number) => {
    setPenaltyToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!penaltyToDelete) return;
    try {
      await penaltyService.deletePenalty(penaltyToDelete);
      setError('');
      setDeleteDialogOpen(false);
      setPenaltyToDelete(null);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка видалення');
      setDeleteDialogOpen(false);
      setPenaltyToDelete(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Штрафи
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Додати штраф
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Прокат</TableCell>
              <TableCell>Клієнт</TableCell>
              <TableCell>Автомобіль</TableCell>
              <TableCell>Сума</TableCell>
              <TableCell>Причина</TableCell>
              <TableCell>Дата</TableCell>
              {user?.role === 'admin' && <TableCell>Дії</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {penalties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary">Штрафи не знайдено</Typography>
                </TableCell>
              </TableRow>
            ) : (
              penalties.map((penalty) => (
                <TableRow key={penalty.id}>
                  <TableCell>{penalty.id}</TableCell>
                  <TableCell>
                    #{penalty.rental?.id || penalty.rentalId || 'Невідомо'}
                  </TableCell>
                  <TableCell>
                    {penalty.rental?.client?.fullName || 'Невідомо'}
                  </TableCell>
                  <TableCell>
                    {penalty.rental?.car
                      ? `${penalty.rental.car.brand} ${penalty.rental.car.model}`
                      : 'Невідомо'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="error" fontWeight={600}>
                      {penalty.amount} ₴
                    </Typography>
                  </TableCell>
                  <TableCell>{penalty.reason}</TableCell>
                  <TableCell>
                    {new Date(penalty.date).toLocaleDateString('uk-UA')}
                  </TableCell>
                  {user?.role === 'admin' && (
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(penalty.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => {
        setDialogOpen(false);
        setRentalSearchTerm('');
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Додати штраф</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Пошук (клієнт, автомобіль, ID)"
              value={rentalSearchTerm}
              onChange={(e) => setRentalSearchTerm(e.target.value)}
              fullWidth
              placeholder="Введіть ім'я клієнта, марку автомобіля або ID прокату"
            />
            <TextField
              select
              label="Прокат"
              value={formData.rentalId}
              onChange={(e) => setFormData({ ...formData, rentalId: e.target.value })}
              fullWidth
              helperText="Виберіть прокат для нарахування штрафу"
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    style: {
                      maxHeight: 400,
                    },
                  },
                },
              }}
            >
              {rentals
                .filter((rental) => {
                  if (!rentalSearchTerm) return true;
                  const searchLower = rentalSearchTerm.toLowerCase();
                  const clientName = rental.client?.fullName?.toLowerCase() || '';
                  const carBrand = rental.car?.brand?.toLowerCase() || '';
                  const carModel = rental.car?.model?.toLowerCase() || '';
                  const rentalId = rental.id?.toString() || '';
                  return (
                    clientName.includes(searchLower) ||
                    carBrand.includes(searchLower) ||
                    carModel.includes(searchLower) ||
                    rentalId.includes(searchLower) ||
                    `${carBrand} ${carModel}`.includes(searchLower)
                  );
                })
                .sort((a, b) => {
                  // First sort by status: active first, then by date (newest first)
                  const statusOrder: { [key: string]: number } = {
                    'active': 0,
                    'completed': 1,
                    'cancelled': 2,
                  };
                  const statusA = statusOrder[a.status?.toLowerCase() || ''] ?? 3;
                  const statusB = statusOrder[b.status?.toLowerCase() || ''] ?? 3;
                  
                  if (statusA !== statusB) {
                    return statusA - statusB;
                  }
                  
                  // If same status, sort by date (newest first)
                  const dateA = new Date(a.startDate || a.createdAt || 0).getTime();
                  const dateB = new Date(b.startDate || b.createdAt || 0).getTime();
                  return dateB - dateA;
                })
                .map((rental) => {
                  const startDate = rental.startDate 
                    ? new Date(rental.startDate).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : '';
                  const endDate = rental.expectedEndDate || rental.actualEndDate
                    ? new Date(rental.expectedEndDate || rental.actualEndDate).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : '';
                  const statusLabels: { [key: string]: string } = {
                    'active': 'Активний',
                    'completed': 'Завершений',
                    'cancelled': 'Скасований',
                  };
                  const statusLabel = statusLabels[rental.status?.toLowerCase() || ''] || rental.status || '';
                  
                  return (
                    <MenuItem key={rental.id} value={rental.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          #{rental.id} - {rental.client?.fullName || 'Невідомо'} | {rental.car?.brand} {rental.car?.model}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {startDate && endDate ? `${startDate} - ${endDate}` : startDate || 'Дата не вказана'} | {statusLabel}
                        </Typography>
                      </Box>
                    </MenuItem>
                  );
                })}
            </TextField>
            <TextField
              label="Сума"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              fullWidth
            />
            <TextField
              label="Причина"
              multiline
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Скасувати</Button>
          <Button onClick={handleSubmit} variant="contained">
            Створити
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
            Ви впевнені, що хочете видалити цей штраф? Цю дію неможливо скасувати.
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

export default PenaltiesPage;

