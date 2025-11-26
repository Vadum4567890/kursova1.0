import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { usePenalties, useDeletePenalty } from '../hooks/queries/usePenalties';
import { useRentals } from '../hooks/queries/useRentals';
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
import { usePenaltyCreate } from '../hooks/usePenaltyCreate';
import { PenaltyFormData } from '../interfaces';
import {
  filterRentalsBySearchTerm,
  sortRentalsForSelection,
  getRentalStatusLabel,
} from '../utils/rentalHelpers';
import { formatDate, formatRentalDate } from '../utils/dateHelpers';

const PenaltiesPage: React.FC = () => {
  const { user } = useAuth();
  const { data: penalties = [], isLoading: loadingPenalties, error: penaltiesError } = usePenalties();
  const { data: rentals = [], isLoading: loadingRentals } = useRentals();
  const deletePenalty = useDeletePenalty();
  
  const penaltyCreate = usePenaltyCreate({
    onSuccess: () => {
      formDialog.handleSuccess();
    },
  });
  
  const displayError = penaltyCreate.error || penaltiesError?.message;

  const formDialog = useFormDialog<PenaltyFormData>({
    initialData: {
      rentalId: '',
      amount: '',
      reason: '',
    },
  });

  const deleteConfirm = useDeleteConfirm({
    onConfirm: async (id) => {
      await deletePenalty.mutateAsync(id);
      penaltyCreate.clearError();
    },
  });

  const [rentalSearchTerm, setRentalSearchTerm] = useState('');

  const loading = loadingPenalties || loadingRentals || penaltyCreate.isPending || deletePenalty.isPending;

  const filteredRentals = useMemo(() => {
    const filtered = filterRentalsBySearchTerm(rentals, rentalSearchTerm);
    return sortRentalsForSelection(filtered);
  }, [rentals, rentalSearchTerm]);

  const handleSubmit = async () => {
    try {
      await penaltyCreate.create(formDialog.formData);
    } catch {
      // Error already handled by hook
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Штрафи"
        action={{
          label: 'Додати штраф',
          icon: <Add />,
          onClick: () => formDialog.openDialog(),
        }}
      />

      <ErrorAlert message={displayError || ''} onClose={penaltyCreate.clearError} />

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
                    {formatDate(penalty.date || penalty.createdAt)}
                  </TableCell>
                  {user?.role === 'admin' && (
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteConfirm.handleDeleteClick(penalty.id, 'penalty')}
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

      <FormDialog
        open={formDialog.open}
        title="Додати штраф"
        onClose={() => {
          formDialog.closeDialog();
          setRentalSearchTerm('');
        }}
        onSubmit={handleSubmit}
        loading={penaltyCreate.isPending}
        submitLabel="Створити"
        maxWidth="sm"
      >
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
          value={formDialog.formData.rentalId}
          onChange={(e) => formDialog.updateFormData({ rentalId: e.target.value })}
          fullWidth
          required
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
          {filteredRentals.map((rental) => {
            const startDate = formatRentalDate(rental.startDate);
            const endDate = formatRentalDate(rental.expectedEndDate || rental.actualEndDate);
            const statusLabel = getRentalStatusLabel(rental.status);

            return (
              <MenuItem key={rental.id} value={rental.id.toString()}>
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
          value={formDialog.formData.amount}
          onChange={(e) => formDialog.updateFormData({ amount: e.target.value })}
          fullWidth
          required
        />
        <TextField
          label="Причина"
          multiline
          rows={3}
          value={formDialog.formData.reason}
          onChange={(e) => formDialog.updateFormData({ reason: e.target.value })}
          fullWidth
          required
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteConfirm.deleteDialogOpen}
        title="Підтвердження видалення"
        message="Ви впевнені, що хочете видалити цей штраф? Цю дію неможливо скасувати."
        onConfirm={deleteConfirm.handleDeleteConfirm}
        onCancel={deleteConfirm.closeDeleteDialog}
        confirmText="Видалити"
        confirmColor="error"
      />
    </PageContainer>
  );
};

export default PenaltiesPage;

