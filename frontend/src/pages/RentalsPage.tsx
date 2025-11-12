import React, { useState, useMemo } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add, CheckCircle, Cancel } from '@mui/icons-material';
import { Rental } from '../services/rentalService';
import { Client } from '../services/clientService';
import { Car } from '../services/carService';
import { useRentals, useActiveRentals, useCreateRental, useCancelRental, useCompleteRental } from '../hooks/queries/useRentals';
import { useClients } from '../hooks/queries/useClients';
import { useCars } from '../hooks/queries/useCars';
import { useUIStore } from '../stores';
import { getStatusLabel, getStatusColor } from '../utils/labels';

const RentalsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    carId: '',
    startDate: '',
    expectedEndDate: '',
  });
  const [error, setError] = useState('');
  
  // React Query hooks
  const { data: allRentals = [], isLoading: loadingAll, error: rentalsError } = useRentals();
  const { data: activeRentals = [], isLoading: loadingActive, error: activeError } = useActiveRentals();
  const createRental = useCreateRental();
  const cancelRental = useCancelRental();
  const completeRental = useCompleteRental();
  
  // Load clients and cars when dialog opens
  const { data: clients = [] } = useClients();
  const { data: carsResponse } = useCars();
  const cars = useMemo(() => carsResponse?.data?.filter((c: Car) => c.status === 'available') || [], [carsResponse]);
  
  // Zustand store for cancel dialog
  const { deleteDialogOpen, deleteDialogItemId, openDeleteDialog, closeDeleteDialog } = useUIStore();
  
  // Select rentals based on tab
  const rentals = tabValue === 0 ? allRentals : activeRentals;
  const loading = tabValue === 0 ? loadingAll : loadingActive;
  const displayError = error || rentalsError?.message || activeError?.message;

  const handleCreateRental = async () => {
    if (!formData.clientId || !formData.carId || !formData.startDate || !formData.expectedEndDate) {
      setError('Будь ласка, заповніть всі поля');
      return;
    }
    try {
      setError('');
      await createRental.mutateAsync({
        clientId: parseInt(formData.clientId),
        carId: parseInt(formData.carId),
        startDate: new Date(formData.startDate).toISOString(),
        expectedEndDate: new Date(formData.expectedEndDate).toISOString(),
      });
      setCreateDialogOpen(false);
      setFormData({ clientId: '', carId: '', startDate: '', expectedEndDate: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка створення прокату');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await completeRental.mutateAsync({ id });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка завершення прокату');
    }
  };

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
      setError(err.response?.data?.error || 'Помилка скасування');
      closeDeleteDialog();
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Прокати
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
          Створити прокат
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Всі прокати" />
          <Tab label="Активні" />
        </Tabs>
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
                <TableCell>Клієнт</TableCell>
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
              {rentals.map((rental: Rental) => (
                <TableRow key={rental.id} hover>
                  <TableCell>{rental.id}</TableCell>
                  <TableCell>
                    {rental.client?.fullName || (rental.clientId ? `Клієнт #${rental.clientId}` : 'Невідомо')}
                  </TableCell>
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
                    {rental.car && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {rental.car.pricePerDay} ₴/день
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
                      // Calculate refund: deposit - penalty (if penalty > deposit, return 0)
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
                      // For active rentals, show expected refund (full deposit if no penalties expected)
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
                      <>
                        <Button
                          size="small"
                          startIcon={<CheckCircle />}
                          onClick={() => handleComplete(rental.id)}
                          sx={{ mr: 1 }}
                        >
                          Завершити
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Cancel />}
                          onClick={() => handleCancelClick(rental.id)}
                        >
                          Скасувати
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Rental Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Створити прокат</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Клієнт</InputLabel>
              <Select
                value={formData.clientId}
                label="Клієнт"
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              >
                {clients.map((client: Client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.fullName} ({client.phone})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Автомобіль</InputLabel>
              <Select
                value={formData.carId}
                label="Автомобіль"
                onChange={(e) => setFormData({ ...formData, carId: e.target.value })}
              >
                {cars.map((car: Car) => (
                  <MenuItem key={car.id} value={car.id}>
                    {car.brand} {car.model} ({car.year}) - {car.pricePerDay} ₴/день
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Дата початку"
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Очікувана дата завершення"
              type="datetime-local"
              value={formData.expectedEndDate}
              onChange={(e) => setFormData({ ...formData, expectedEndDate: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Скасувати</Button>
          <Button onClick={handleCreateRental} variant="contained" disabled={createRental.isPending}>
            {createRental.isPending ? <CircularProgress size={20} /> : 'Створити'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          Підтвердження скасування
        </DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете скасувати цей прокат? Цю дію неможливо скасувати.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDeleteDialog}>
            Скасувати
          </Button>
          <Button onClick={handleCancelConfirm} variant="contained" color="error" disabled={cancelRental.isPending}>
            {cancelRental.isPending ? <CircularProgress size={20} /> : 'Підтвердити скасування'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RentalsPage;

