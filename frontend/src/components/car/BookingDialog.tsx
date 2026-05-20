import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CardMedia,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/uk';
import { Car } from '../../interfaces';
import { calculateTotalCost, formatCurrency } from '../../utils/calculations';
import { isDateBooked, isDateRangeValid } from '../../utils/dateHelpers';
import { resolvePublicMediaUrl } from '../../utils/mediaUrls';

interface BookedPeriod {
  startDate: string;
  endDate: string;
}

interface BookingDialogProps {
  open: boolean;
  onClose: () => void;
  car: Car | null;
  bookedDates: BookedPeriod[];
  loadingBookedDates: boolean;
  bookingData: {
    startDate: Dayjs | null;
    expectedEndDate: Dayjs | null;
  };
  onStartDateChange: (date: Dayjs | null) => void;
  onEndDateChange: (date: Dayjs | null) => void;
  onSubmit: () => Promise<void> | void;
  isPending: boolean;
  error?: string;
}

const BookingDialog: React.FC<BookingDialogProps> = ({
  open,
  onClose,
  car,
  bookedDates,
  loadingBookedDates,
  bookingData,
  onStartDateChange,
  onEndDateChange,
  onSubmit,
  isPending,
  error,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const carImageUrl = useMemo(() => {
    const first =
      car?.imageUrls?.[0] ||
      car?.images?.find((image) => image.isPrimary)?.imageUrl ||
      car?.images?.[0]?.imageUrl ||
      car?.imageUrl;
    return resolvePublicMediaUrl(first) || '';
  }, [car]);

  useEffect(() => {
    if (!open) {
      setConfirmOpen(false);
    }
  }, [open]);

  const isRangeValid =
    bookingData.startDate && bookingData.expectedEndDate
      ? isDateRangeValid(bookingData.startDate, bookingData.expectedEndDate, bookedDates)
      : false;

  const days =
    bookingData.startDate && bookingData.expectedEndDate
      ? bookingData.expectedEndDate.diff(bookingData.startDate, 'day') + 1
      : 0;

  const pricing = useMemo(() => {
    if (!car || days <= 0) {
      return {
        price: 0,
        deposit: 0,
        baseDeposit: 0,
        additionalDeposit: 0,
      };
    }

    const { price, deposit } = calculateTotalCost(days, car.pricePerDay, car.deposit);
    const baseDeposit = Number(car.deposit);

    return {
      price,
      deposit,
      baseDeposit,
      additionalDeposit: deposit - baseDeposit,
    };
  }, [car, days]);

  const totalToReserve = pricing.price + pricing.deposit;

  const submitLabel = car?.instantBook ? 'Підтвердити умови' : 'Надіслати на підтвердження';
  const finalConfirmLabel = car?.instantBook ? 'Погоджуюсь і бронюю' : 'Погоджуюсь і надсилаю заявку';
  const helperAlert = car?.instantBook
    ? 'Миттєве бронювання: після підтвердження умов авто одразу резервується на ваші дати.'
    : 'Бронювання за запитом: після підтвердження умов заявка піде орендодавцю на ручне схвалення.';

  const handleOpenConfirm = () => {
    if (!bookingData.startDate || !bookingData.expectedEndDate || !isRangeValid) {
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmBooking = async () => {
    try {
      await Promise.resolve(onSubmit());
      setConfirmOpen(false);
    } catch {
      setConfirmOpen(false);
    }
  };

  if (!car) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Забронювати автомобіль</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="uk">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '180px 1fr' },
                  gap: 2,
                  alignItems: 'stretch',
                }}
              >
                <Box
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: 'action.hover',
                    minHeight: 120,
                  }}
                >
                  {carImageUrl ? (
                    <CardMedia
                      component="img"
                      image={carImageUrl}
                      alt={`${car.brand} ${car.model}`}
                      sx={{ width: '100%', height: '100%', minHeight: 120, objectFit: 'cover' }}
                    />
                  ) : (
                    <Box sx={{ height: 120, display: 'grid', placeItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Фото авто
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Box>
                <Typography variant="h6" gutterBottom>
                  {car.brand} {car.model} ({car.year})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ціна: {car.pricePerDay} ₴/день • Базовий завдаток: {car.deposit} ₴
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                  <Chip size="small" label={`${car.year} рік`} />
                  <Chip size="small" label={car.type} />
                  {car.seats ? <Chip size="small" label={`${car.seats} місць`} /> : null}
                  <Chip
                    size="small"
                    color={car.instantBook ? 'success' : 'info'}
                    label={car.instantBook ? 'Миттєве бронювання' : 'Потребує підтвердження'}
                  />
                </Stack>
                <Alert severity={car.instantBook ? 'success' : 'info'} sx={{ mt: 1.5 }}>
                  {helperAlert}
                </Alert>
              </Box>
              </Paper>

              {loadingBookedDates ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <DatePicker
                      label="Дата початку"
                      value={bookingData.startDate}
                      onChange={onStartDateChange}
                      shouldDisableDate={(date: Dayjs) => {
                        if (date.isBefore(dayjs(), 'day')) return true;
                        return isDateBooked(date, bookedDates);
                      }}
                      minDate={dayjs()}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                        },
                      }}
                    />
                    <DatePicker
                      label="Дата повернення"
                      value={bookingData.expectedEndDate}
                      onChange={onEndDateChange}
                      shouldDisableDate={(date: Dayjs) => {
                        if (date.isBefore(dayjs(), 'day')) return true;
                        if (bookingData.startDate && date.isBefore(bookingData.startDate, 'day')) return true;
                        return isDateBooked(date, bookedDates);
                      }}
                      minDate={bookingData.startDate || dayjs()}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                        },
                      }}
                    />
                  </Box>

                  {bookedDates.length > 0 && (
                    <Paper sx={{ p: 2, bgcolor: 'warning.main', borderRadius: 1 }}>
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        sx={{ color: 'warning.contrastText' }}
                      >
                        Уже заброньовані періоди
                      </Typography>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {bookedDates.map((period, idx) => (
                          <Typography
                            key={`${period.startDate}-${period.endDate}-${idx}`}
                            variant="caption"
                            display="block"
                            sx={{ color: 'warning.contrastText' }}
                          >
                            {dayjs(period.startDate).format('DD.MM.YYYY')} -{' '}
                            {dayjs(period.endDate).format('DD.MM.YYYY')}
                          </Typography>
                        ))}
                      </Stack>
                    </Paper>
                  )}

                  {bookingData.startDate && bookingData.expectedEndDate && (
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Початок
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {bookingData.startDate.format('DD.MM.YYYY')}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Повернення
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {bookingData.expectedEndDate.format('DD.MM.YYYY')}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Тривалість
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {days} дн.
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            До резервування
                          </Typography>
                          <Typography variant="body2" fontWeight={800} color="primary">
                            {formatCurrency(totalToReserve)}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ mb: 1.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        Орієнтовна вартість: {formatCurrency(pricing.price)} ({days} дн.)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Завдаток: {formatCurrency(pricing.deposit)}
                      </Typography>
                      {days > 1 ? (
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          Базовий: {formatCurrency(pricing.baseDeposit)} + додатково за {days - 1}{' '}
                          дн.: {formatCurrency(pricing.additionalDeposit)}
                        </Typography>
                      ) : (
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          Базовий завдаток без доплат
                        </Typography>
                      )}
                      {!isRangeValid && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          Вибраний період перетинається з уже заброньованими датами.
                        </Alert>
                      )}
                    </Box>
                  )}

                  {error && <Alert severity="error">{error}</Alert>}
                </>
              )}
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Скасувати</Button>
          <Button
            onClick={handleOpenConfirm}
            variant="contained"
            disabled={isPending || !bookingData.startDate || !bookingData.expectedEndDate || !isRangeValid}
          >
            {submitLabel}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onClose={() => !isPending && setConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Підтвердження бронювання</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <Alert severity={car.instantBook ? 'success' : 'info'}>
              {car.instantBook
                ? 'Після підтвердження авто буде одразу зарезервовано на вибрані дати.'
                : 'Після підтвердження заявка піде орендодавцю. Поки він не відповість, статус буде “очікує підтвердження”.'}
            </Alert>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {car.brand} {car.model}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Період: {bookingData.startDate?.format('DD.MM.YYYY')} -{' '}
                {bookingData.expectedEndDate?.format('DD.MM.YYYY')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Тривалість: {days} дн.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Вартість оренди: <strong>{formatCurrency(pricing.price)}</strong>
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Завдаток: <strong>{formatCurrency(pricing.deposit)}</strong>
              </Typography>
            </Paper>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.default',
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Договір оренди
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Тут з&apos;явиться текст або PDF договору оренди, який ви надасте пізніше.
                Структуру confirm-flow уже підготовлено, тож наступним кроком сюди можна
                вбудувати повний документ, чекбокс ознайомлення й підпис.
              </Typography>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={isPending}>
            Назад
          </Button>
          <Button onClick={handleConfirmBooking} variant="contained" disabled={isPending}>
            {isPending ? <CircularProgress size={20} /> : finalConfirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BookingDialog;
