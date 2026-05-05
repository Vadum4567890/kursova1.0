import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Zoom,
} from '@mui/material';
import { Check, CheckCircle, Close } from '@mui/icons-material';
import { keyframes } from '@mui/system';
import { Rental } from '../../interfaces';
import { formatRentalDate } from '../../utils/dateHelpers';
import {
  useApproveBookingAsOwner,
  useConfirmRentalPickup,
  useConfirmRentalReturn,
  useOwnerBookings,
  useRejectBookingAsOwner,
} from '../../hooks/queries/useRentals';

const popIn = keyframes`
  0% {
    transform: scale(0.85);
    opacity: 0;
  }
  60% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
`;

type SuccessState = {
  open: boolean;
  title: string;
  message: string;
};

function rentalLabel(rental: Rental): string {
  const car = rental.car;
  if (car?.brand || car?.model) {
    return [car.brand, car.model].filter(Boolean).join(' ').trim();
  }
  return `Авто ${String(rental.carId).slice(0, 8)}…`;
}

function ownerBookingStateLabel(rental: Rental): string {
  if (rental.status === 'cancelled') return 'Відхилено';
  if (rental.status === 'completed') return 'Завершено';
  if (rental.status === 'active') return 'Активна оренда';
  if (rental.status === 'pending' && rental.ownerApprovalStatus === 'approved') {
    return 'Підтверджено, очікує старту';
  }
  return 'Очікує рішення';
}

function ownerBookingStateColor(
  rental: Rental
): 'success' | 'warning' | 'default' | 'info' | 'error' {
  if (rental.status === 'cancelled') return 'error';
  if (rental.status === 'completed') return 'default';
  if (rental.status === 'active') return 'success';
  if (rental.ownerApprovalStatus === 'approved') return 'info';
  return 'warning';
}

export const OwnerBookingRequestsPanel: React.FC = () => {
  const { data: bookings = [], isLoading, error, refetch } = useOwnerBookings();
  const approve = useApproveBookingAsOwner();
  const reject = useRejectBookingAsOwner();
  const confirmPickup = useConfirmRentalPickup();
  const confirmReturn = useConfirmRentalReturn();
  const [successState, setSuccessState] = useState<SuccessState>({
    open: false,
    title: '',
    message: '',
  });
  const mutationError =
    (approve.error as Error | null) ||
    (reject.error as Error | null) ||
    (confirmPickup.error as Error | null) ||
    (confirmReturn.error as Error | null);

  const requests = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === 'pending' &&
          (booking.ownerApprovalStatus ?? 'pending') === 'pending'
      ),
    [bookings]
  );

  const other = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          !(
            booking.status === 'pending' &&
            (booking.ownerApprovalStatus ?? 'pending') === 'pending'
          )
      ),
    [bookings]
  );

  const handleApprove = async (rental: Rental) => {
    await approve.mutateAsync(String(rental.id));
    await refetch();
    setSuccessState({
      open: true,
      title: 'Заявку підтверджено',
        message:
          new Date(rental.startDate).toDateString() === new Date().toDateString()
          ? 'Оренду активовано. Орендар уже бачить, що бронювання погоджено.'
          : 'Орендар побачить, що заявку схвалено, а авто зарезервовано на обраний період.',
    });
  };

  const handleConfirmPickup = async (rental: Rental) => {
    await confirmPickup.mutateAsync(String(rental.id));
    await refetch();
    setSuccessState({
      open: true,
      title: 'Передачу авто підтверджено',
      message: rental.pickupConfirmedByRenterAt
        ? 'Обидві сторони підтвердили передачу. Прокат активовано.'
        : 'Очікується підтвердження отримання від орендаря.',
    });
  };

  const handleConfirmReturn = async (rental: Rental) => {
    await confirmReturn.mutateAsync(String(rental.id));
    await refetch();
    setSuccessState({
      open: true,
      title: 'Повернення авто підтверджено',
      message: rental.returnConfirmedByRenterAt
        ? 'Обидві сторони підтвердили повернення. Прокат завершено.'
        : 'Очікується підтвердження повернення від орендаря.',
    });
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Не вдалося завантажити заявки: {(error as Error).message}
      </Alert>
    );
  }

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Заявки на бронювання
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Тут з’являються нові запити по ваших авто. Для ручного підтвердження натисніть
          «Підтвердити» або «Відхилити».
        </Typography>

        {mutationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {mutationError.message}
          </Alert>
        )}

        {isLoading ? (
          <Typography color="text.secondary">Завантаження…</Typography>
        ) : requests.length === 0 ? (
          <Alert severity="info" sx={{ mb: other.length > 0 ? 2 : 0 }}>
            Немає заявок, що очікують вашої відповіді.
          </Alert>
        ) : (
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Авто</TableCell>
                <TableCell>Період</TableCell>
                <TableCell>Орендар</TableCell>
                <TableCell>Сума</TableCell>
                <TableCell align="right">Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((rental) => (
                <TableRow key={String(rental.id)}>
                  <TableCell>{rentalLabel(rental)}</TableCell>
                  <TableCell>
                    {formatRentalDate(rental.startDate)} — {formatRentalDate(rental.expectedEndDate)}
                  </TableCell>
                  <TableCell>{rental.renter?.fullName || rental.renter?.email || '—'}</TableCell>
                  <TableCell>{Number(rental.totalCost).toFixed(2)} ₴</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<Check />}
                        disabled={approve.isPending || reject.isPending}
                        onClick={() => {
                          void handleApprove(rental).catch(() => undefined);
                        }}
                      >
                        Підтвердити
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Close />}
                        disabled={approve.isPending || reject.isPending}
                        onClick={() => {
                          void reject
                            .mutateAsync(String(rental.id))
                            .then(async () => {
                              await refetch();
                              setSuccessState({
                                open: true,
                                title: 'Заявку відхилено',
                                message:
                                  'Орендар побачить, що бронювання відхилено, і зможе обрати інші дати або інше авто.',
                              });
                            })
                            .catch(() => undefined);
                        }}
                      >
                        Відхилити
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {other.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Інші бронювання по ваших авто
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Авто</TableCell>
                  <TableCell>Період</TableCell>
                  <TableCell>Стан</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {other.slice(0, 15).map((rental) => (
                  <TableRow key={String(rental.id)}>
                    <TableCell>{rentalLabel(rental)}</TableCell>
                    <TableCell>
                      {formatRentalDate(rental.startDate)} — {formatRentalDate(rental.expectedEndDate)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={ownerBookingStateLabel(rental)}
                        color={ownerBookingStateColor(rental)}
                        variant={rental.status === 'completed' ? 'outlined' : 'filled'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Stack spacing={1} sx={{ mt: 2 }}>
              {other.slice(0, 15).map((rental) => {
                const startDay = new Date(rental.startDate);
                startDay.setHours(0, 0, 0, 0);
                const canConfirmPickup =
                  rental.status === 'pending' &&
                  rental.ownerApprovalStatus === 'approved' &&
                  new Date() >= startDay &&
                  !rental.pickupConfirmedByOwnerAt;
                const canConfirmReturn =
                  rental.status === 'active' && !rental.returnConfirmedByOwnerAt;
                const lifecyclePending = confirmPickup.isPending || confirmReturn.isPending;

                if (!canConfirmPickup && !canConfirmReturn) {
                  return null;
                }

                return (
                  <Stack
                    key={`lifecycle-${String(rental.id)}`}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="space-between"
                    flexWrap="wrap"
                  >
                    <Typography variant="body2" color="text.secondary">
                      {rentalLabel(rental)}
                    </Typography>
                    {canConfirmPickup && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Check />}
                        disabled={lifecyclePending}
                        onClick={() => {
                          void handleConfirmPickup(rental).catch(() => undefined);
                        }}
                      >
                        Передав авто
                      </Button>
                    )}
                    {canConfirmReturn && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<Check />}
                        disabled={lifecyclePending}
                        onClick={() => {
                          void handleConfirmReturn(rental).catch(() => undefined);
                        }}
                      >
                        Прийняв авто
                      </Button>
                    )}
                  </Stack>
                );
              })}
            </Stack>
            {other.length > 15 && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Показано 15 з {other.length}
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      <Snackbar
        open={successState.open}
        autoHideDuration={2800}
        onClose={() => setSuccessState((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Zoom}
      >
        <Alert
          severity="success"
          variant="filled"
          icon={
            <CheckCircle
              sx={{
                animation: `${popIn} 360ms ease-out`,
              }}
            />
          }
          sx={{
            minWidth: 320,
            boxShadow: 6,
            '& .MuiAlert-message': {
              display: 'grid',
              gap: 0.5,
            },
          }}
        >
          <strong>{successState.title}</strong>
          <span>{successState.message}</span>
        </Alert>
      </Snackbar>
    </>
  );
};

export default OwnerBookingRequestsPanel;
