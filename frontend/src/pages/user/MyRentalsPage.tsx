import React, { useEffect, useState, useMemo } from 'react';
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
import { rentalService, Rental } from '../../services/rentalService';

const MyRentalsPage: React.FC = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rentalToCancel, setRentalToCancel] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading rentals for user...');
      const data = await rentalService.getMyRentals();
      console.log('Loaded rentals:', data);
      console.log('Number of rentals:', data?.length || 0);
      setRentals(data || []);
    } catch (err: any) {
      console.error('Error loading rentals:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.error || err.message || 'Помилка завантаження прокатів');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (id: number) => {
    setRentalToCancel(id);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!rentalToCancel) return;
    try {
      await rentalService.cancelRental(rentalToCancel);
      setError('');
      setCancelDialogOpen(false);
      setRentalToCancel(null);
      loadRentals();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка скасування');
      setCancelDialogOpen(false);
      setRentalToCancel(null);
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

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          Підтвердження скасування
        </DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете скасувати цей прокат? Вартість буде перерахована за фактичні дні використання.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Скасувати
          </Button>
          <Button onClick={handleCancelConfirm} variant="contained" color="error">
            Підтвердити скасування
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyRentalsPage;

