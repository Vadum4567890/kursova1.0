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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
  Avatar,
  Stack,
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
import { resolvePublicMediaUrl } from '../utils/mediaUrls';

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

function getRentalCarImage(rental: Rental, carFromCatalog?: Car): string {
  const car = rental.car;
  const first =
    car?.imageUrls?.[0] ||
    car?.images?.find((image) => image.isPrimary)?.imageUrl ||
    car?.images?.[0]?.imageUrl ||
    car?.imageUrl ||
    carFromCatalog?.imageUrls?.[0] ||
    carFromCatalog?.images?.find((image) => image.isPrimary)?.imageUrl ||
    carFromCatalog?.images?.[0]?.imageUrl ||
    carFromCatalog?.imageUrl;
  return resolvePublicMediaUrl(first);
}

function getShortId(id: number | string): string {
  const value = String(id);
  return value.length > 8 ? `${value.slice(0, 8)}...` : value;
}

type AdminLifecycleAction =
  | 'activate'
  | 'complete'
  | 'cancel'
  | 'mark_no_show'
  | 'mark_pickup_disputed'
  | 'mark_return_disputed';

type RentalResolutionType =
  | 'admin_activated'
  | 'admin_completed'
  | 'renter_no_show'
  | 'owner_no_show'
  | 'mutual_cancel'
  | 'admin_cancel'
  | 'pickup_dispute'
  | 'return_dispute';

interface ResolutionDialogState {
  open: boolean;
  rental: Rental | null;
  action: AdminLifecycleAction | null;
  title: string;
  note: string;
  resolutionType?: RentalResolutionType;
  penaltyAmount: string;
  depositRefundAmount: string;
}

const RentalsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [resolutionDialog, setResolutionDialog] = useState<ResolutionDialogState>({
    open: false,
    rental: null,
    action: null,
    title: '',
    note: '',
    penaltyAmount: '0',
    depositRefundAmount: '0',
  });
  
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
  const allCars = useMemo(() => carsResponse?.data || [], [carsResponse]);
  const cars = useMemo(() => allCars.filter((c: Car) => c.status === 'available'), [allCars]);
  const carsById = useMemo(
    () => new Map(allCars.map((car: Car) => [String(car.id), car])),
    [allCars]
  );
  const clientNamesByUserId = useMemo(
    () => new Map(customers.map((c: Client) => [String(c.id), c.fullName])),
    [customers]
  );
  const clientsById = useMemo(
    () => new Map(customers.map((c: Client) => [String(c.id), c])),
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

  const openResolutionDialog = (
    rental: Rental,
    action: AdminLifecycleAction,
    title: string,
    resolutionType?: RentalResolutionType
  ) => {
    const defaultPenalty = action === 'mark_no_show' ? rental.depositAmount : rental.penaltyAmount || 0;
    setResolutionDialog({
      open: true,
      rental,
      action,
      title,
      note: '',
      resolutionType,
      penaltyAmount: String(defaultPenalty),
      depositRefundAmount: String(Math.max(0, rental.depositAmount - defaultPenalty)),
    });
  };

  const closeResolutionDialog = () => {
    setResolutionDialog((prev) => ({ ...prev, open: false }));
  };

  const handleResolveLifecycle = async () => {
    const rental = resolutionDialog.rental;
    const action = resolutionDialog.action;
    if (!rental || !action) return;
    const note = resolutionDialog.note.trim();
    if (!note) {
      handleError(new Error('Вкажіть причину рішення'), 'Вкажіть причину рішення');
      return;
    }
    try {
      clearError();
      await resolveLifecycle.mutateAsync({
        id: rental.id,
        action,
        note,
        resolutionType: resolutionDialog.resolutionType,
        penaltyAmount: Number(resolutionDialog.penaltyAmount || 0),
        depositRefundAmount: Number(resolutionDialog.depositRefundAmount || 0),
      });
      closeResolutionDialog();
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
              {rentals.map((rental: Rental) => {
                const catalogCar = carsById.get(String(rental.carId));
                const carImage = getRentalCarImage(rental, catalogCar);
                const client = rental.clientId != null ? clientsById.get(String(rental.clientId)) : undefined;
                const renterName = getRenterDisplayName(rental, clientNamesByUserId);
                const renterPhone = rental.client?.phone || client?.phone;
                const renterEmail = rental.renter?.email || client?.email;
                const carTitle = rental.car
                  ? `${rental.car.brand} ${rental.car.model}`
                  : catalogCar
                    ? `${catalogCar.brand} ${catalogCar.model}`
                    : (rental.carId ? `Авто #${getShortId(rental.carId)}` : 'Невідомо');

                return (
                <TableRow key={rental.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      #{getShortId(rental.id)}
                    </Typography>
                    {rental.createdAt && (
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(rental.createdAt)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {renterName}
                    </Typography>
                    {renterPhone && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {renterPhone}
                      </Typography>
                    )}
                    {renterEmail && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {renterEmail}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 220 }}>
                      <Avatar
                        variant="rounded"
                        src={carImage || undefined}
                        alt={carTitle}
                        sx={{ width: 72, height: 48, bgcolor: 'action.hover' }}
                      >
                        {carTitle.slice(0, 1)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {carTitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {rental.car?.year || catalogCar?.year || 'Рік не вказано'}
                          {catalogCar?.type ? ` • ${catalogCar.type}` : ''}
                        </Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ display: 'none' }}>
                    {rental.car
                      ? `${rental.car.brand} ${rental.car.model}`
                      : (rental.carId ? `Автомобіль #${rental.carId}` : 'Невідомо')}
                    </Box>
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
                            onClick={() =>
                              openResolutionDialog(rental, 'activate', 'Підтвердити передачу авто адміном', 'admin_activated')
                            }
                          >
                            Активувати
                          </Button>
                        )}
                        {rental.status === 'pending' && (
                          <Button
                            size="small"
                            color="error"
                            disabled={resolveLifecycle.isPending}
                            onClick={() =>
                              openResolutionDialog(rental, 'mark_no_show', 'Позначити неявку орендаря', 'renter_no_show')
                            }
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
                            onClick={() =>
                              openResolutionDialog(rental, 'mark_pickup_disputed', 'Відкрити спір щодо передачі', 'pickup_dispute')
                            }
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
                              ? openResolutionDialog(rental, 'complete', 'Завершити прокат рішенням адміна', 'admin_completed')
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
                            onClick={() =>
                              openResolutionDialog(rental, 'mark_return_disputed', 'Відкрити спір щодо повернення', 'return_dispute')
                            }
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
                );
              })}
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

      <Dialog open={resolutionDialog.open} onClose={closeResolutionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{resolutionDialog.title}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Це рішення змінить стан прокату і буде записане в журнал дій адміністратора.
          </Alert>
          {resolutionDialog.rental && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Прокат #{resolutionDialog.rental.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Поточний статус: {resolutionDialog.rental.status}
                {resolutionDialog.rental.lifecycleState ? ` / ${getLifecycleLabel(resolutionDialog.rental) || resolutionDialog.rental.lifecycleState}` : ''}
              </Typography>
            </Box>
          )}

          {resolutionDialog.action === 'mark_no_show' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Тип рішення</InputLabel>
              <Select
                label="Тип рішення"
                value={resolutionDialog.resolutionType || 'renter_no_show'}
                onChange={(event) =>
                  setResolutionDialog((prev) => ({
                    ...prev,
                    resolutionType: event.target.value as RentalResolutionType,
                  }))
                }
              >
                <MenuItem value="renter_no_show">Орендар не з’явився</MenuItem>
                <MenuItem value="owner_no_show">Орендодавець не передав авто</MenuItem>
                <MenuItem value="mutual_cancel">Сторони домовились скасувати</MenuItem>
              </Select>
            </FormControl>
          )}

          {(resolutionDialog.action === 'mark_no_show' || resolutionDialog.action === 'complete') && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                label="Штраф, ₴"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={resolutionDialog.penaltyAmount}
                onChange={(event) => {
                  const penalty = Number(event.target.value || 0);
                  const deposit = Number(resolutionDialog.rental?.depositAmount || 0);
                  setResolutionDialog((prev) => ({
                    ...prev,
                    penaltyAmount: event.target.value,
                    depositRefundAmount: String(Math.max(0, deposit - penalty)),
                  }));
                }}
              />
              <TextField
                label="Повернення депозиту, ₴"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={resolutionDialog.depositRefundAmount}
                onChange={(event) =>
                  setResolutionDialog((prev) => ({ ...prev, depositRefundAmount: event.target.value }))
                }
              />
            </Box>
          )}

          <TextField
            label="Причина рішення"
            multiline
            minRows={3}
            fullWidth
            required
            value={resolutionDialog.note}
            onChange={(event) =>
              setResolutionDialog((prev) => ({ ...prev, note: event.target.value }))
            }
            helperText="Наприклад: орендар не прибув у погоджений час, підтверджено дзвінком"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeResolutionDialog} disabled={resolveLifecycle.isPending}>
            Скасувати
          </Button>
          <Button
            variant="contained"
            color={resolutionDialog.action === 'mark_no_show' ? 'error' : 'primary'}
            onClick={() => {
              void handleResolveLifecycle();
            }}
            disabled={resolveLifecycle.isPending}
          >
            Підтвердити рішення
          </Button>
        </DialogActions>
      </Dialog>

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

