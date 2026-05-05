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
import {
  useActiveRentals,
  useCancelRental,
  useCompleteRental,
  useCreateRental,
  useRentals,
  useResolveRentalLifecycle,
} from '../hooks/queries/useRentals';
import { useCustomers } from '../hooks/queries/useCustomers';
import { useCars } from '../hooks/queries/useCars';
import {
  PageAsyncSection,
  PageHeader,
  FormDialog,
  ConfirmDialog,
  PageContainer,
  StatusChip,
} from '../components/common';
import { useFormDialog } from '../hooks/useFormDialog';
import { useDeleteConfirm } from '../hooks/useDeleteConfirm';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { RentalFormData } from '../interfaces';
import { formatDate } from '../utils/dateHelpers';
import { getRenterDisplayName } from '../utils/rentalDisplay';

function getLifecycleLabel(rental: Rental): string | null {
  switch (rental.lifecycleState) {
    case 'awaiting_owner_approval':
      return 'Очікує рішення орендодавця';
    case 'awaiting_pickup':
      return 'Очікує передачі авто';
    case 'pickup_partially_confirmed':
      return 'Передачу підтвердила одна сторона';
    case 'pickup_disputed':
      return 'Спір щодо передачі';
    case 'no_show':
      return 'No-show';
    case 'return_due':
      return 'Очікує повернення';
    case 'return_partially_confirmed':
      return 'Повернення підтвердила одна сторона';
    case 'return_disputed':
      return 'Спір щодо повернення';
    default:
      return null;
  }
}

const RentalsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  
  // React Query hooks
  const { data: allRentals = [], isLoading: loadingAll, error: rentalsError } = useRentals();
  const { data: activeRentals = [], isLoading: loadingActive, error: activeError } = useActiveRentals();
  const createRental = useCreateRental();
  const cancelRental = useCancelRental();
  const completeRental = useCompleteRental();
  const resolveLifecycle = useResolveRentalLifecycle();
  
  // Load renter/customer records and cars when dialog opens
  const { data: customers = [] } = useCustomers();
  const { data: carsResponse } = useCars();
  const cars = useMemo(() => carsResponse?.data?.filter((c: Car) => c.status === 'available') || [], [carsResponse]);
  const clientNamesByUserId = useMemo(
    () => new Map(customers.map((c: Client) => [String(c.id), c.fullName])),
    [customers]
  );
  
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
      if (id === undefined || id === null || id === '') return;
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
      const carIdRaw = String(formDialog.formData.carId).trim();
      const carId: number | string = /^\d+$/.test(carIdRaw) ? parseInt(carIdRaw, 10) : carIdRaw;
      const renterUserId = String(formDialog.formData.clientId).trim();
      await createRental.mutateAsync({
        clientId: renterUserId || undefined,
        carId,
        renterUserId: renterUserId || undefined,
        startDate: new Date(formDialog.formData.startDate).toISOString(),
        expectedEndDate: new Date(formDialog.formData.expectedEndDate).toISOString(),
      });
      formDialog.handleSuccess();
    } catch (err: any) {
      handleError(err, 'Помилка створення прокату');
    }
  };

  const handleComplete = async (id: number | string) => {
    try {
      clearError();
      await completeRental.mutateAsync({ id });
    } catch (err: any) {
      handleError(err, 'Помилка завершення прокату');
    }
  };

  const handleResolveLifecycle = async (
    id: number | string,
    action:
      | 'activate'
      | 'complete'
      | 'cancel'
      | 'mark_no_show'
      | 'mark_pickup_disputed'
      | 'mark_return_disputed'
  ) => {
    try {
      clearError();
      await resolveLifecycle.mutateAsync({ id, action });
    } catch (err: any) {
      handleError(err, err?.message || 'Не вдалося оновити стан прокату');
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

      <PageAsyncSection error={displayError} onCloseError={clearError} loading={loading}>
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
                  <TableCell>{getRenterDisplayName(rental, clientNamesByUserId)}</TableCell>
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
                    {getLifecycleLabel(rental) && (
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        {getLifecycleLabel(rental)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {(rental.status === 'active' ||
                      rental.status === 'pending' ||
                      rental.lifecycleState === 'return_due' ||
                      rental.lifecycleState === 'return_disputed' ||
                      rental.lifecycleState === 'return_partially_confirmed') && (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {rental.status === 'pending' && rental.ownerApprovalStatus === 'approved' && (
                          <Button
                            size="small"
                            disabled={resolveLifecycle.isPending}
                            onClick={() => handleResolveLifecycle(rental.id, 'activate')}
                          >
                            Активувати
                          </Button>
                        )}
                        {rental.status === 'pending' && (
                          <Button
                            size="small"
                            color="error"
                            disabled={resolveLifecycle.isPending}
                            onClick={() => handleResolveLifecycle(rental.id, 'mark_no_show')}
                          >
                            No-show
                          </Button>
                        )}
                        {(rental.lifecycleState === 'pickup_partially_confirmed' ||
                          rental.lifecycleState === 'pickup_disputed') && (
                          <Button
                            size="small"
                            color="warning"
                            disabled={resolveLifecycle.isPending}
                            onClick={() => handleResolveLifecycle(rental.id, 'mark_pickup_disputed')}
                          >
                            Спір передачі
                          </Button>
                        )}
                        <Button
                          size="small"
                          sx={{
                            display:
                              rental.status === 'active' ||
                              rental.lifecycleState === 'return_due' ||
                              rental.lifecycleState === 'return_partially_confirmed' ||
                              rental.lifecycleState === 'return_disputed'
                                ? 'inline-flex'
                                : 'none',
                          }}
                          startIcon={<CheckCircle />}
                          disabled={completeRental.isPending || resolveLifecycle.isPending}
                          onClick={() =>
                            rental.lifecycleState === 'return_due' ||
                            rental.lifecycleState === 'return_partially_confirmed' ||
                            rental.lifecycleState === 'return_disputed'
                              ? handleResolveLifecycle(rental.id, 'complete')
                              : handleComplete(rental.id)
                          }
                        >
                          Завершити
                        </Button>
                        {rental.status === 'active' && (
                          <Button
                            size="small"
                            color="warning"
                            disabled={resolveLifecycle.isPending}
                            onClick={() => handleResolveLifecycle(rental.id, 'mark_return_disputed')}
                          >
                            Спір повернення
                          </Button>
                        )}
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
      </PageAsyncSection>

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
            {customers.map((customer: Client) => (
              <MenuItem key={customer.id} value={customer.id.toString()}>
                {customer.fullName} ({customer.phone})
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

