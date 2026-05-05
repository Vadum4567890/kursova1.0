import React, { useMemo, useState } from 'react';
import { useMyRentals, useCancelRental } from '../../hooks/queries/useRentals';
import {
  useEligibleReviews,
  useSubmitReview,
  useUpdateReview,
} from '../../hooks/queries/useReviews';
import { useDeleteConfirm, useErrorHandler } from '../../hooks';
import {
  PageHeader,
  PageAsyncSection,
  ConfirmDialog,
  PageContainer,
  SuccessSnackbar,
} from '../../components/common';
import { MyRentalsTable, StatusFilter } from '../../components/user';
import { filterRentalsByStatus } from '../../utils/rentalHelpers';
import { ReviewableBooking } from '../../interfaces';
import ReviewDialog from '../../components/reviews/ReviewDialog';

type SuccessState = {
  open: boolean;
  title: string;
  message: string;
};

const MyRentalsPage: React.FC = () => {
  const { data: rentals = [], isLoading: loading, error: rentalsError } = useMyRentals();
  const { data: eligibleReviews = [] } = useEligibleReviews();
  const submitReview = useSubmitReview();
  const updateReview = useUpdateReview();
  const cancelRental = useCancelRental();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<ReviewableBooking | null>(null);
  const [successState, setSuccessState] = useState<SuccessState>({
    open: false,
    title: '',
    message: '',
  });
  const { error, handleError, clearError } = useErrorHandler();

  const deleteConfirm = useDeleteConfirm({
    onConfirm: async (id) => {
      if (id === undefined || id === null || id === '') return;
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

  const reviewableByRentalId = useMemo(
    () => new Map(eligibleReviews.map((item) => [String(item.bookingId), item])),
    [eligibleReviews]
  );

  const displayError = error || rentalsError?.message;

  const handleReviewSubmit = async (payload: {
    bookingId: string;
    comment?: string;
    scores: Record<string, number>;
  }) => {
    try {
      clearError();

      if (selectedBooking?.myReviewSubmitted) {
        await updateReview.mutateAsync({
          bookingId: payload.bookingId,
          payload: {
            comment: payload.comment,
            scores: payload.scores,
          },
        });
        setSuccessState({
          open: true,
          title: 'Відгук оновлено',
          message: 'Оновлений відгук збережено. Після відповіді другої сторони він стане публічним.',
        });
      } else {
        await submitReview.mutateAsync(payload);
        setSuccessState({
          open: true,
          title: 'Відгук надіслано',
          message: 'Відгук збережено. Він стане публічним, коли друга сторона теж залишить свій review.',
        });
      }

      setSelectedBooking(null);
    } catch (err: any) {
      handleError(err, err?.message || 'Не вдалося зберегти відгук');
    }
  };

  const isReviewPending = submitReview.isPending || updateReview.isPending;

  return (
    <PageContainer>
      <PageHeader title="Мої прокати">
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
      </PageHeader>

      <PageAsyncSection error={displayError} onCloseError={clearError} loading={loading}>
        <MyRentalsTable
          rentals={filteredRentals}
          onCancelClick={(id) => deleteConfirm.handleDeleteClick(id, 'rental')}
          reviewableByRentalId={reviewableByRentalId}
          onReviewClick={setSelectedBooking}
        />
      </PageAsyncSection>

      <ConfirmDialog
        open={deleteConfirm.deleteDialogOpen}
        title="Підтвердження скасування"
        message="Ви впевнені, що хочете скасувати цей прокат? Вартість буде перерахована за фактичні дні використання."
        onCancel={deleteConfirm.closeDeleteDialog}
        onConfirm={deleteConfirm.handleDeleteConfirm}
        confirmText="Підтвердити скасування"
        confirmColor="error"
      />

      <ReviewDialog
        open={!!selectedBooking}
        booking={selectedBooking}
        loading={isReviewPending}
        onClose={() => setSelectedBooking(null)}
        onSubmit={handleReviewSubmit}
      />

      <SuccessSnackbar
        open={successState.open}
        title={successState.title}
        message={successState.message}
        onClose={() => setSuccessState((prev) => ({ ...prev, open: false }))}
        autoHideDuration={2800}
      />
    </PageContainer>
  );
};

export default MyRentalsPage;
