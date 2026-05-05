import React from 'react';
import {
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Cancel, DirectionsCar, Edit, KeyboardReturn, RateReview } from '@mui/icons-material';
import { Rental, ReviewableBooking } from '../../interfaces';
import { formatRentalDate } from '../../utils/dateHelpers';
import { StatusChip } from '../common';

interface MyRentalsTableProps {
  rentals: Rental[];
  onCancelClick: (id: number | string) => void;
  reviewableByRentalId?: Map<string, ReviewableBooking>;
  onReviewClick?: (booking: ReviewableBooking) => void;
  onConfirmPickup?: (id: number | string) => void;
  onConfirmReturn?: (id: number | string) => void;
  lifecycleActionPending?: boolean;
}

export const MyRentalsTable: React.FC<MyRentalsTableProps> = ({
  rentals,
  onCancelClick,
  reviewableByRentalId,
  onReviewClick,
  onConfirmPickup,
  onConfirmReturn,
  lifecycleActionPending = false,
}) => {
  if (rentals.length === 0) {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Автомобіль</TableCell>
              <TableCell>Початок</TableCell>
              <TableCell>Очікуване повернення</TableCell>
              <TableCell>Вартість</TableCell>
              <TableCell>Залог</TableCell>
              <TableCell>Повернення</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Дії</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={9} align="center">
                <Typography color="text.secondary" sx={{ py: 4 }}>
                  Немає прокатів для відображення
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Автомобіль</TableCell>
            <TableCell>Початок</TableCell>
            <TableCell>Очікуване повернення</TableCell>
            <TableCell>Вартість</TableCell>
            <TableCell>Залог</TableCell>
            <TableCell>Повернення</TableCell>
            <TableCell>Статус</TableCell>
            <TableCell align="right">Дії</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rentals.map((rental) => {
            const refund = Math.max(0, rental.depositAmount - rental.penaltyAmount);
            const isCompletedOrCancelled =
              rental.status === 'cancelled' || rental.status === 'completed';
            const reviewable = reviewableByRentalId?.get(String(rental.id));
            const isEditMode = Boolean(reviewable?.myReviewSubmitted);
            const pendingHint =
              rental.status === 'pending'
                ? rental.ownerApprovalStatus === 'approved'
                  ? 'Підтверджено, очікує старту'
                  : 'Очікує підтвердження орендодавця'
                : null;
            const lifecycleHint =
              rental.status === 'pending' &&
              rental.ownerApprovalStatus === 'approved' &&
              rental.pickupConfirmedByRenterAt
                ? 'Ви підтвердили отримання. Очікується підтвердження орендодавця'
                : pendingHint;
            const today = new Date();
            const startDay = new Date(rental.startDate);
            startDay.setHours(0, 0, 0, 0);
            const canConfirmPickup =
              rental.status === 'pending' &&
              rental.ownerApprovalStatus === 'approved' &&
              today >= startDay &&
              !rental.pickupConfirmedByRenterAt;
            const canConfirmReturn =
              rental.status === 'active' && !rental.returnConfirmedByRenterAt;

            return (
              <TableRow key={rental.id} hover>
                <TableCell>{rental.id}</TableCell>
                <TableCell>
                  {rental.car
                    ? `${rental.car.brand} ${rental.car.model}`
                    : rental.carId
                      ? `Автомобіль #${rental.carId}`
                      : 'Невідомо'}
                </TableCell>
                <TableCell>{formatRentalDate(rental.startDate)}</TableCell>
                <TableCell>
                  {formatRentalDate(rental.expectedEndDate)}
                  {rental.actualEndDate && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      Фактично: {formatRentalDate(rental.actualEndDate)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {rental.totalCost.toLocaleString()} грн
                  </Typography>
                  {rental.penaltyAmount > 0 && (
                    <Typography variant="caption" color="error" display="block">
                      Штраф: +{rental.penaltyAmount.toLocaleString()} грн
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="warning.main">
                    {rental.depositAmount.toLocaleString()} грн
                  </Typography>
                </TableCell>
                <TableCell>
                  {isCompletedOrCancelled ? (
                    <Typography
                      variant="body2"
                      color={refund > 0 ? 'success.main' : 'text.secondary'}
                      fontWeight={refund > 0 ? 600 : 400}
                    >
                      {refund.toLocaleString()} грн
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {rental.depositAmount.toLocaleString()} грн
                      <Typography variant="caption" display="block" color="text.secondary">
                        (очікується)
                      </Typography>
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <StatusChip status={rental.status} />
                  {lifecycleHint && (
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                      {lifecycleHint}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {rental.status === 'active' && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => onCancelClick(rental.id)}
                      >
                        Скасувати
                      </Button>
                    )}

                    {canConfirmPickup && onConfirmPickup && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<DirectionsCar />}
                        disabled={lifecycleActionPending}
                        onClick={() => onConfirmPickup(rental.id)}
                      >
                        Отримав авто
                      </Button>
                    )}

                    {canConfirmReturn && onConfirmReturn && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<KeyboardReturn />}
                        disabled={lifecycleActionPending}
                        onClick={() => onConfirmReturn(rental.id)}
                      >
                        Повернув авто
                      </Button>
                    )}

                    {rental.status === 'active' && rental.returnConfirmedByRenterAt && (
                      <Typography variant="caption" color="text.secondary">
                        Очікується підтвердження повернення від орендодавця
                      </Typography>
                    )}

                    {rental.status === 'completed' && reviewable && onReviewClick && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={isEditMode ? <Edit /> : <RateReview />}
                        onClick={() => onReviewClick(reviewable)}
                      >
                        {isEditMode ? 'Редагувати відгук' : 'Залишити відгук'}
                      </Button>
                    )}

                    {rental.status === 'completed' &&
                      !reviewable &&
                      rental.reviewStatus === 'partial' && (
                        <Typography variant="caption" color="text.secondary">
                          Ваш відгук надіслано
                        </Typography>
                      )}

                    {rental.status === 'completed' && rental.reviewStatus === 'published' && (
                      <Typography variant="caption" color="success.main">
                        Відгуки опубліковано
                      </Typography>
                    )}

                    {rental.status === 'completed' && rental.reviewStatus === 'expired' && (
                      <Typography variant="caption" color="text.secondary">
                        Вікно відгуку завершено
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
