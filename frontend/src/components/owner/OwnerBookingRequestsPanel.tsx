import React, { useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import { Rental } from '../../interfaces';
import { formatRentalDate } from '../../utils/dateHelpers';
import {
  useApproveBookingAsOwner,
  useOwnerBookings,
  useRejectBookingAsOwner,
} from '../../hooks/queries/useRentals';

function rentalLabel(r: Rental): string {
  const c = r.car;
  if (c?.brand || c?.model) {
    return [c.brand, c.model].filter(Boolean).join(' ').trim();
  }
  return `Авто ${String(r.carId).slice(0, 8)}…`;
}

export const OwnerBookingRequestsPanel: React.FC = () => {
  const { data: bookings = [], isLoading, error, refetch } = useOwnerBookings();
  const approve = useApproveBookingAsOwner();
  const reject = useRejectBookingAsOwner();

  const pending = useMemo(
    () => bookings.filter((b) => b.status === 'pending'),
    [bookings]
  );

  const other = useMemo(
    () => bookings.filter((b) => b.status !== 'pending'),
    [bookings]
  );

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Не вдалося завантажити заявки: {(error as Error).message}
      </Alert>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Заявки на бронювання
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Тут з’являються нові запити по ваших авто. Для режиму «підтвердження орендодавцем» натисніть
        «Підтвердити» або «Відхилити».
      </Typography>

      {isLoading ? (
        <Typography color="text.secondary">Завантаження…</Typography>
      ) : pending.length === 0 ? (
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
            {pending.map((r) => (
              <TableRow key={String(r.id)}>
                <TableCell>{rentalLabel(r)}</TableCell>
                <TableCell>
                  {formatRentalDate(r.startDate)} — {formatRentalDate(r.expectedEndDate)}
                </TableCell>
                <TableCell>{r.renter?.fullName || r.renter?.email || '—'}</TableCell>
                <TableCell>{Number(r.totalCost).toFixed(2)} ₴</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<Check />}
                      disabled={approve.isPending || reject.isPending}
                      onClick={() => void approve.mutateAsync(String(r.id)).then(() => refetch())}
                    >
                      Підтвердити
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<Close />}
                      disabled={approve.isPending || reject.isPending}
                      onClick={() => void reject.mutateAsync(String(r.id)).then(() => refetch())}
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
                <TableCell>Статус</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {other.slice(0, 15).map((r) => (
                <TableRow key={String(r.id)}>
                  <TableCell>{rentalLabel(r)}</TableCell>
                  <TableCell>
                    {formatRentalDate(r.startDate)} — {formatRentalDate(r.expectedEndDate)}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={r.status} variant="outlined" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {other.length > 15 && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Показано 15 з {other.length}
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default OwnerBookingRequestsPanel;
