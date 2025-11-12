import React, { useEffect, useState } from 'react';
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
import { rentalService, Rental } from '../services/rentalService';
import { clientService, Client } from '../services/clientService';
import { carService, Car } from '../services/carService';

const RentalsPage: React.FC = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rentalToCancel, setRentalToCancel] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    carId: '',
    startDate: '',
    expectedEndDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRentals();
  }, [tabValue]);

  useEffect(() => {
    if (createDialogOpen) {
      loadClientsAndCars();
    }
  }, [createDialogOpen]);

  const loadRentals = async () => {
    try {
      setLoading(true);
      const data =
        tabValue === 0
          ? await rentalService.getAllRentals()
          : await rentalService.getActiveRentals();
      setRentals(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка завантаження прокатів');
    } finally {
      setLoading(false);
    }
  };

  const loadClientsAndCars = async () => {
    try {
      const [clientsData, carsData] = await Promise.all([
        clientService.getAllClients(),
        carService.getAllCars(),
      ]);
      setClients(clientsData);
      setCars(carsData.data.filter(c => c.status === 'available'));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка завантаження даних');
    }
  };

  const handleCreateRental = async () => {
    if (!formData.clientId || !formData.carId || !formData.startDate || !formData.expectedEndDate) {
      setError('Будь ласка, заповніть всі поля');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await rentalService.createRental({
        clientId: parseInt(formData.clientId),
        carId: parseInt(formData.carId),
        startDate: new Date(formData.startDate).toISOString(),
        expectedEndDate: new Date(formData.expectedEndDate).toISOString(),
      });
      setCreateDialogOpen(false);
      setFormData({ clientId: '', carId: '', startDate: '', expectedEndDate: '' });
      loadRentals();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка створення прокату');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await rentalService.completeRental(id);
      loadRentals();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка завершення прокату');
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
              {rentals.map((rental) => (
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
                {clients.map((client) => (
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
                {cars.map((car) => (
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
          <Button onClick={handleCreateRental} variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : 'Створити'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          Підтвердження скасування
        </DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете скасувати цей прокат? Цю дію неможливо скасувати.
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

export default RentalsPage;

