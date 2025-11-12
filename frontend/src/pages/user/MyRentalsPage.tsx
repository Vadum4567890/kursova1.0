import React, { useState, useMemo } from 'react';
import {
  Container,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Cancel } from '@mui/icons-material';
import { useMyRentals } from '../../hooks/queries/useRentals';
import { useCancelRental } from '../../hooks/queries/useRentals';
import { useUIStore } from '../../stores/uiStore';

const MyRentalsPage: React.FC = () => {
  const { data: rentals = [], isLoading: loading, error: rentalsError } = useMyRentals();
  const cancelRental = useCancelRental();
  const { deleteDialogOpen, deleteDialogItemId, openDeleteDialog, closeDeleteDialog } = useUIStore();
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const displayError = error || rentalsError?.message;

  const handleCancelClick = (id: number) => {
    openDeleteDialog(id, 'rental');
  };

  const handleCancelConfirm = async () => {
    if (!deleteDialogItemId) return;
    try {
      await cancelRental.mutateAsync(deleteDialogItemId);
      setError('');
      closeDeleteDialog();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Помилка скасування');
      closeDeleteDialog();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активний';
      case 'completed':
        return 'Завершений';
      case 'cancelled':
        return 'Скасований';
      default:
        return status;
    }
  };

  // Filter rentals by status
  const filteredRentals = useMemo(() => {
    if (statusFilter === 'all') {
      return rentals;
    }
    return rentals.filter(rental => rental.status === statusFilter);
  }, [rentals, statusFilter]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Мої прокати
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Фільтр за статусом</InputLabel>
          <Select
            value={statusFilter}
            label="Фільтр за статусом"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">Всі</MenuItem>
            <MenuItem value="active">Активні</MenuItem>
            <MenuItem value="completed">Завершені</MenuItem>
            <MenuItem value="cancelled">Скасовані</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {displayError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {displayError}
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
                <TableCell>Автомобіль</TableCell>
                <TableCell>Початок</TableCell>
                <TableCell>Очікуваний кінець</TableCell>
                <TableCell>Вартість</TableCell>
                <TableCell>Залог</TableCell>
                <TableCell>Повернення</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell align="right">Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRentals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>
                      {rentals.length === 0 
                        ? 'У вас немає прокатів'
                        : 'Немає прокатів з обраним статусом'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRentals.map((rental) => (
                  <TableRow key={rental.id} hover>
                    <TableCell>{rental.id}</TableCell>
                    <TableCell>
                      {rental.car
                        ? `${rental.car.brand} ${rental.car.model}`
                        : (rental.carId ? `Автомобіль #${rental.carId}` : 'Невідомо')}
                    </TableCell>
                    <TableCell>
                      {new Date(rental.startDate).toLocaleDateString('uk-UA')}
                    </TableCell>
                    <TableCell>
                      {new Date(rental.expectedEndDate).toLocaleDateString('uk-UA')}
                      {rental.actualEndDate && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Фактично: {new Date(rental.actualEndDate).toLocaleDateString('uk-UA')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {rental.totalCost.toLocaleString()} ₴
                      </Typography>
                      {rental.penaltyAmount > 0 && (
                        <Typography variant="caption" color="error" display="block">
                          Штраф: +{rental.penaltyAmount.toLocaleString()} ₴
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="warning.main">
                        {rental.depositAmount.toLocaleString()} ₴
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const refund = Math.max(0, rental.depositAmount - rental.penaltyAmount);
                        if (rental.status === 'cancelled' || rental.status === 'completed') {
                          return (
                            <Typography
                              variant="body2"
                              color={refund > 0 ? "success.main" : "text.secondary"}
                              fontWeight={refund > 0 ? 600 : 400}
                            >
                              {refund.toLocaleString()} ₴
                            </Typography>
                          );
                        }
                        return (
                          <Typography variant="body2" color="text.secondary">
                            {rental.depositAmount.toLocaleString()} ₴
                            <Typography variant="caption" display="block" color="text.secondary">
                              (очікується)
                            </Typography>
                          </Typography>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(rental.status)}
                        color={getStatusColor(rental.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {rental.status === 'active' && (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Cancel />}
                          onClick={() => handleCancelClick(rental.id)}
                        >
                          Скасувати
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          Підтвердження скасування
        </DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете скасувати цей прокат? Вартість буде перерахована за фактичні дні використання.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDeleteDialog}>
            Скасувати
          </Button>
          <Button onClick={handleCancelConfirm} variant="contained" color="error" disabled={cancelRental.isPending}>
            Підтвердити скасування
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyRentalsPage;

