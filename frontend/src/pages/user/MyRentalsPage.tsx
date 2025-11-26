import React, { useState, useMemo } from 'react';
import { useMyRentals, useCancelRental } from '../../hooks/queries/useRentals';
import { useDeleteConfirm, useErrorHandler } from '../../hooks';
import { PageHeader, ErrorAlert, LoadingSpinner, ConfirmDialog, PageContainer } from '../../components/common';
import { MyRentalsTable, StatusFilter } from '../../components/user';
import { filterRentalsByStatus } from '../../utils/rentalHelpers';

const MyRentalsPage: React.FC = () => {
  const { data: rentals = [], isLoading: loading, error: rentalsError } = useMyRentals();
  const cancelRental = useCancelRental();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { error, handleError, clearError } = useErrorHandler();

  const deleteConfirm = useDeleteConfirm({
    onConfirm: async (id) => {
      await cancelRental.mutateAsync(id);
      clearError();
    },
    onError: (errorMessage) => {
      handleError(new Error(errorMessage), errorMessage);
    },
  });

  const filteredRentals = useMemo(
    () => filterRentalsByStatus(rentals, statusFilter),
    [rentals, statusFilter]
  );

  const displayError = error || rentalsError?.message;

  return (
    <PageContainer>
      <PageHeader title="Мої прокати">
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
      </PageHeader>

      {displayError && <ErrorAlert message={displayError} onClose={clearError} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <MyRentalsTable
          rentals={filteredRentals}
          onCancelClick={(id) => deleteConfirm.handleDeleteClick(id, 'rental')}
        />
      )}

      <ConfirmDialog
        open={deleteConfirm.deleteDialogOpen}
        title="Підтвердження скасування"
        message="Ви впевнені, що хочете скасувати цей прокат? Вартість буде перерахована за фактичні дні використання."
        onCancel={deleteConfirm.closeDeleteDialog}
        onConfirm={deleteConfirm.handleDeleteConfirm}
        confirmText="Підтвердити скасування"
        confirmColor="error"
      />
    </PageContainer>
  );
};

export default MyRentalsPage;

