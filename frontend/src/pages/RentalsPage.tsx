import React, { useState, useMemo } from 'react';
import {
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
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add, CheckCircle, Cancel } from '@mui/icons-material';
import { Rental, Client, Car } from '../interfaces';
import { useRentals, useActiveRentals, useCreateRental, useCancelRental, useCompleteRental } from '../hooks/queries/useRentals';
import { useClients } from '../hooks/queries/useClients';
import { useCars } from '../hooks/queries/useCars';
import { 
  ErrorAlert, 
  LoadingSpinner, 
  PageHeader, 
  FormDialog,
  ConfirmDialog,
  PageContainer
} from '../components/common';
import { useFormDialog } from '../hooks/useFormDialog';
import { useDeleteConfirm } from '../hooks/useDeleteConfirm';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { StatusChip } from '../components/common';
import { RentalFormData } from '../interfaces';
import { formatDate } from '../utils/dateHelpers';

const RentalsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  
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
  
  const { error, handleError, clearError } = useErrorHandler();
  const displayError = error || rentalsError?.message || activeError?.message;

  const formDialog = useFormDialog<RentalFormData>({
    initialData: {
      clientId: '',
      carId: '',
      startDate: '',
      expectedEndDate: '',
    },
  });

  const deleteConfirm = useDeleteConfirm({
    onConfirm: async (id) => {
      await cancelRental.mutateAsync(id);
      clearError();
    },
    onError: handleError,
  });
  
  // Select rentals based on tab
  const rentals = tabValue === 0 ? allRentals : activeRentals;
  const loading = tabValue === 0 ? loadingAll : loadingActive;

  const handleCreateRental = async () => {
    if (!formDialog.formData.clientId || !formDialog.formData.carId || !formDialog.formData.startDate || !formDialog.formData.expectedEndDate) {
      handleError(new Error('Будь ласка, заповніть всі поля'), 'Будь ласка, заповніть всі поля');
      return;
    }
    try {
      clearError();
      await createRental.mutateAsync({
        clientId: parseInt(formDialog.formData.clientId),
        carId: parseInt(formDialog.formData.carId),
        startDate: new Date(formDialog.formData.startDate).toISOString(),
        expectedEndDate: new Date(formDialog.formData.expectedEndDate).toISOString(),
      });
      formDialog.handleSuccess();
    } catch (err: any) {
      handleError(err, 'Помилка створення прокату');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      clearError();
      await completeRental.mutateAsync({ id });
    } catch (err: any) {
      handleError(err, 'Помилка завершення прокату');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Прокати"
        action={{
          label: 'Створити прокат',
          icon: <Add />,
          onClick: () => formDialog.openDialog(),
        }}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Всі прокати" />
          <Tab label="Активні" />
        </Tabs>
      </Box>

      <ErrorAlert message={displayError || ''} onClose={clearError} />

      {loading ? (
        <LoadingSpinner />
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
                    {formatDate(rental.startDate)}
                  </TableCell>
                  <TableCell>
                    {formatDate(rental.expectedEndDate)}
                    {rental.actualEndDate && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        Фактично: {formatDate(rental.actualEndDate)}
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
                    <StatusChip status={rental.status} />
                  </TableCell>
                  <TableCell align="right">
                    {rental.status === 'active' && (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          startIcon={<CheckCircle />}
                          onClick={() => handleComplete(rental.id)}
                        >
                          Завершити
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Cancel />}
                          onClick={() => deleteConfirm.handleDeleteClick(rental.id, 'rental')}
                        >
                          Скасувати
                        </Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <FormDialog
        open={formDialog.open}
        title="Створити прокат"
        onClose={formDialog.closeDialog}
        onSubmit={handleCreateRental}
        loading={createRental.isPending}
        submitLabel="Створити"
        maxWidth="sm"
      >
        <FormControl fullWidth required>
          <InputLabel>Клієнт</InputLabel>
          <Select
            value={formDialog.formData.clientId}
            label="Клієнт"
            onChange={(e) => formDialog.updateFormData({ clientId: e.target.value })}
          >
            {clients.map((client: Client) => (
              <MenuItem key={client.id} value={client.id.toString()}>
                {client.fullName} ({client.phone})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth required>
          <InputLabel>Автомобіль</InputLabel>
          <Select
            value={formDialog.formData.carId}
            label="Автомобіль"
            onChange={(e) => formDialog.updateFormData({ carId: e.target.value })}
          >
            {cars.map((car: Car) => (
              <MenuItem key={car.id} value={car.id.toString()}>
                {car.brand} {car.model} ({car.year}) - {car.pricePerDay} ₴/день
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Дата початку"
          type="datetime-local"
          value={formDialog.formData.startDate}
          onChange={(e) => formDialog.updateFormData({ startDate: e.target.value })}
          fullWidth
          required
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Очікувана дата завершення"
          type="datetime-local"
          value={formDialog.formData.expectedEndDate}
          onChange={(e) => formDialog.updateFormData({ expectedEndDate: e.target.value })}
          fullWidth
          required
          InputLabelProps={{ shrink: true }}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteConfirm.deleteDialogOpen}
        title="Підтвердження скасування"
        message="Ви впевнені, що хочете скасувати цей прокат? Цю дію неможливо скасувати."
        onConfirm={deleteConfirm.handleDeleteConfirm}
        onCancel={deleteConfirm.closeDeleteDialog}
        confirmText="Підтвердити скасування"
        confirmColor="error"
      />
    </PageContainer>
  );
};

export default RentalsPage;

