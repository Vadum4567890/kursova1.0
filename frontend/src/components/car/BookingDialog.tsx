import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/uk';
import { Car } from '../../interfaces';
import { calculateTotalCost, formatCurrency } from '../../utils/calculations';
import { isDateBooked, isDateRangeValid } from '../../utils/dateHelpers';

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
  onSubmit: () => void;
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
  if (!car) return null;

  const isRangeValid = bookingData.startDate && bookingData.expectedEndDate
    ? isDateRangeValid(bookingData.startDate, bookingData.expectedEndDate, bookedDates)
    : false;

  const days = bookingData.startDate && bookingData.expectedEndDate
    ? bookingData.expectedEndDate.diff(bookingData.startDate, 'day') + 1
    : 0;

  const { price, deposit } = days > 0
    ? calculateTotalCost(days, car.pricePerDay, car.deposit)
    : { price: 0, deposit: 0 };

  const baseDeposit = Number(car.deposit);
  const additionalDeposit = deposit - baseDeposit;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Забронювати автомобіль</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="uk">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {car.brand} {car.model} ({car.year})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ціна: {car.pricePerDay} ₴/день • Базовий завдаток: {car.deposit} ₴
              </Typography>
            </Box>

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
                      if (bookingData.startDate && date.isBefore(bookingData.startDate, 'day'))
                        return true;
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
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'warning.contrastText' }}>
                      Заброньовані періоди:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {bookedDates.map((period, idx) => (
                        <Typography
                          key={idx}
                          variant="caption"
                          display="block"
                          sx={{ color: 'warning.contrastText' }}
                        >
                          {dayjs(period.startDate).format('DD.MM.YYYY')} -{' '}
                          {dayjs(period.endDate).format('DD.MM.YYYY')}
                        </Typography>
                      ))}
                    </Box>
                  </Paper>
                )}

                {bookingData.startDate && bookingData.expectedEndDate && (
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Орієнтовна вартість: {formatCurrency(price)} ({days} дн. ×{' '}
                      {formatCurrency(Number(car.pricePerDay))})
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Залог: {formatCurrency(deposit)}
                      {days > 1 && (
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                          (базовий: {formatCurrency(baseDeposit)} + додатково за {days - 1} дн.:{' '}
                          {formatCurrency(additionalDeposit)})
                        </Typography>
                      )}
                      {days === 1 && (
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                          (базовий завдаток)
                        </Typography>
                      )}
                    </Typography>
                    {!isRangeValid && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        Вибраний період перетинається з заброньованими датами
                      </Alert>
                    )}
                  </Box>
                )}

                {error && (
                  <Alert severity="error" onClose={() => {}}>
                    {error}
                  </Alert>
                )}
              </>
            )}
          </Box>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Скасувати</Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={isPending || !bookingData.startDate || !bookingData.expectedEndDate || !isRangeValid}
        >
          {isPending ? <CircularProgress size={20} /> : 'Забронювати'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingDialog;

