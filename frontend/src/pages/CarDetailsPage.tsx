import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Chip,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  BookOnline,
  DirectionsCar,
  Settings,
  LocalGasStation,
  EventSeat,
  Speed,
  Palette,
  CheckCircle,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/uk';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useAuth } from '../context/AuthContext';
import ImageSlider from '../components/car/ImageSlider';
import {
  getStatusLabel,
  getStatusColor,
  getTypeLabel,
  getBodyTypeLabel,
  getDriveTypeLabel,
  getTransmissionLabel,
  getFuelTypeLabel,
} from '../utils/labels';
import { useCar, useBookedDates } from '../hooks/queries/useCars';
import { useCreateBooking } from '../hooks/queries/useRentals';
import {
  getAllCarImages,
  calculateTotalCost,
  formatCurrency,
} from '../utils/calculations';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const CarDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const carId = id ? Number(id) : undefined;
  
  // React Query hooks
  const { data: car, isLoading: loading, error: carError } = useCar(carId);
  const { data: bookedDates = [], isLoading: loadingBookedDates } = useBookedDates(carId);
  const createBooking = useCreateBooking();
  
  // Local UI state
  const [error, setError] = useState('');
  
  // Combine errors
  const displayError = error || carError?.message;
  const [tabValue, setTabValue] = useState(0);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingData, setBookingData] = useState({
    startDate: null as Dayjs | null,
    expectedEndDate: null as Dayjs | null,
  });
  const [selectedDuration, setSelectedDuration] = useState<string>('1-2');

  const isUser = user?.role === 'user';

  // Get all images using utility function
  const images = useMemo(() => getAllCarImages(car || null), [car]);

  const handleBookClick = () => {
    if (!car) return;
    
    if (car.status === 'maintenance') {
      setError('Цей автомобіль на обслуговуванні і недоступний для бронювання');
      return;
    }
    
    setBookingDialogOpen(true);
    setError('');
    
    // Set default dates (tomorrow and 3 days from tomorrow)
    const tomorrow = dayjs().add(1, 'day');
    const in4Days = tomorrow.add(3, 'day');
    setBookingData({
      startDate: tomorrow,
      expectedEndDate: in4Days,
    });
  };

  const isDateBooked = (date: Dayjs): boolean => {
    return bookedDates.some((period: { startDate: string; endDate: string }) => {
      const start = dayjs(period.startDate);
      const end = dayjs(period.endDate);
      return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day');
    });
  };

  const isDateRangeValid = (start: Dayjs | null, end: Dayjs | null): boolean => {
    if (!start || !end || start.isAfter(end)) return false;
    
    return !bookedDates.some((period: { startDate: string; endDate: string }) => {
      const bookedStart = dayjs(period.startDate);
      const bookedEnd = dayjs(period.endDate);
      return (start.isSameOrBefore(bookedEnd, 'day') && end.isSameOrAfter(bookedStart, 'day'));
    });
  };

  const handleBookingSubmit = async () => {
    if (!car || !bookingData.startDate || !bookingData.expectedEndDate) {
      setError('Будь ласка, виберіть дати');
      return;
    }

    if (!isDateRangeValid(bookingData.startDate, bookingData.expectedEndDate)) {
      setError('Вибраний період перетинається з заброньованими датами');
      return;
    }

    if (bookingData.startDate.isBefore(dayjs(), 'day')) {
      setError('Дата початку не може бути в минулому');
      return;
    }

    try {
      setError('');
      // Format dates as YYYY-MM-DD (date only, no time)
      const startDateStr = bookingData.startDate.format('YYYY-MM-DD');
      const expectedEndDateStr = bookingData.expectedEndDate.format('YYYY-MM-DD');
      
      await createBooking.mutateAsync({
        carId: Number(car.id),
        startDate: startDateStr,
        expectedEndDate: expectedEndDateStr,
      });
      setBookingDialogOpen(false);
      setBookingData({ startDate: null, expectedEndDate: null });
      navigate('/my-rentals');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка бронювання');
    }
  };




  const getDurationDays = (duration: string): number => {
    switch (duration) {
      case '1-2':
        return 2;
      case '3-7':
        return 7;
      case '8-30':
        return 30;
      case '31-99':
        return 99;
      case '100-360':
        return 360;
      default:
        return 2;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (displayError && !car) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {displayError}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/cars')}>
          Повернутися до каталогу
        </Button>
      </Container>
    );
  }

  if (!car) {
    return null;
  }

  const days = getDurationDays(selectedDuration);
  const { price: totalPrice, deposit: totalDeposit } = car
    ? calculateTotalCost(days, car.pricePerDay, car.deposit)
    : { price: 0, deposit: 0 };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/cars')}
        sx={{ mb: 3 }}
      >
        Повернутися до каталогу
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Left Column - Image Slider */}
        <Grid item xs={12} md={7}>
          <Card sx={{ position: 'relative', overflow: 'hidden' }}>
            <ImageSlider images={images} height={500} />
          </Card>
        </Grid>

        {/* Right Column - Details and Booking */}
        <Grid item xs={12} md={5}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {car.brand} {car.model}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip
                label={getStatusLabel(car.status)}
                color={getStatusColor(car.status)}
                size="small"
              />
              <Chip
                label={getTypeLabel(car.type)}
                variant="outlined"
                size="small"
              />
              {car.bodyType && (
                <Chip
                  label={getBodyTypeLabel(car.bodyType)}
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>

            {/* Specifications */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Grid container spacing={2}>
                {car.year && (
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DirectionsCar color="action" />
                      <Typography variant="body2">
                        <strong>{car.year} р.</strong>
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {car.driveType && (
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Settings color="action" />
                      <Typography variant="body2">
                        {getDriveTypeLabel(car.driveType)}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {car.transmission && (
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Settings color="action" />
                      <Typography variant="body2">
                        {getTransmissionLabel(car.transmission)}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {car.engine && car.fuelType && (
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalGasStation color="action" />
                      <Typography variant="body2">
                        {car.engine}, {getFuelTypeLabel(car.fuelType)}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {car.seats && (
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventSeat color="action" />
                      <Typography variant="body2">
                        {car.seats} місць
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {car.mileage && (
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Speed color="action" />
                      <Typography variant="body2">
                        {car.mileage.toLocaleString()} км
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {car.color && (
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Palette color="action" />
                      <Typography variant="body2">
                        {car.color}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Price and Deposit */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
              <Typography variant="h3" gutterBottom>
                {car.pricePerDay.toLocaleString()} ₴
                <Typography component="span" variant="h6">
                  /день
                </Typography>
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Залог: {car.deposit.toLocaleString()} ₴
              </Typography>
            </Paper>

            {/* Duration Selection */}
            {isUser && (
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Тривалість оренди:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {['1-2', '3-7', '8-30', '31-99', '100-360'].map((duration) => (
                    <Button
                      key={duration}
                      variant={selectedDuration === duration ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setSelectedDuration(duration)}
                    >
                      {duration === '1-2' && '1-2 дні'}
                      {duration === '3-7' && '3-7 днів'}
                      {duration === '8-30' && '8-30 днів'}
                      {duration === '31-99' && '31-99 днів'}
                      {duration === '100-360' && '100-360 днів'}
                    </Button>
                  ))}
                </Box>
                <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Орієнтовна вартість: <strong>{formatCurrency(totalPrice)}</strong> ({days} дн.)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Залог: <strong>{formatCurrency(totalDeposit)}</strong>
                    {days > 1 && (() => {
                      const baseDeposit = Number(car.deposit);
                      const additionalDeposit = totalDeposit - baseDeposit;
                      return (
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                          (базовий: {formatCurrency(baseDeposit)} + додатково за {days - 1} дн.: {formatCurrency(additionalDeposit)})
                        </Typography>
                      );
                    })()}
                  </Typography>
                </Box>
              </Paper>
            )}

            {/* Booking Button */}
            {isUser && (
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<BookOnline />}
                onClick={handleBookClick}
                disabled={car.status === 'maintenance'}
                sx={{ py: 1.5, mb: 3 }}
              >
                {car.status === 'maintenance'
                  ? 'На обслуговуванні'
                  : car.status === 'rented'
                  ? 'Забронювати (на інші дати)'
                  : 'Забронювати'}
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Description and Details Tabs */}
      <Box sx={{ mt: 4 }}>
        <Paper>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label="Опис" />
            <Tab label="Характеристики" />
            {isUser && <Tab label="Умови оренди" />}
          </Tabs>

          <Box sx={{ p: 3 }}>
            {tabValue === 0 && (
              <Typography variant="body1" color="text.secondary">
                {car.description || 'Опис відсутній'}
              </Typography>
            )}

            {tabValue === 1 && (
              <List>
                <ListItem>
                  <ListItemIcon>
                    <DirectionsCar />
                  </ListItemIcon>
                  <ListItemText
                    primary="Марка та модель"
                    secondary={`${car.brand} ${car.model}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <DirectionsCar />
                  </ListItemIcon>
                  <ListItemText
                    primary="Рік випуску"
                    secondary={car.year}
                  />
                </ListItem>
                {car.bodyType && (
                  <ListItem>
                    <ListItemIcon>
                      <DirectionsCar />
                    </ListItemIcon>
                    <ListItemText
                      primary="Тип кузова"
                      secondary={getBodyTypeLabel(car.bodyType)}
                    />
                  </ListItem>
                )}
                {car.driveType && (
                  <ListItem>
                    <ListItemIcon>
                      <Settings />
                    </ListItemIcon>
                    <ListItemText
                      primary="Привід"
                      secondary={getDriveTypeLabel(car.driveType)}
                    />
                  </ListItem>
                )}
                {car.transmission && (
                  <ListItem>
                    <ListItemIcon>
                      <Settings />
                    </ListItemIcon>
                    <ListItemText
                      primary="Коробка передач"
                      secondary={getTransmissionLabel(car.transmission)}
                    />
                  </ListItem>
                )}
                {car.engine && (
                  <ListItem>
                    <ListItemIcon>
                      <LocalGasStation />
                    </ListItemIcon>
                    <ListItemText
                      primary="Двигун"
                      secondary={car.engine}
                    />
                  </ListItem>
                )}
                {car.fuelType && (
                  <ListItem>
                    <ListItemIcon>
                      <LocalGasStation />
                    </ListItemIcon>
                    <ListItemText
                      primary="Тип палива"
                      secondary={getFuelTypeLabel(car.fuelType)}
                    />
                  </ListItem>
                )}
                {car.seats && (
                  <ListItem>
                    <ListItemIcon>
                      <EventSeat />
                    </ListItemIcon>
                    <ListItemText
                      primary="Кількість місць"
                      secondary={car.seats}
                    />
                  </ListItem>
                )}
                {car.mileage && (
                  <ListItem>
                    <ListItemIcon>
                      <Speed />
                    </ListItemIcon>
                    <ListItemText
                      primary="Пробіг"
                      secondary={`${car.mileage.toLocaleString()} км`}
                    />
                  </ListItem>
                )}
                {car.color && (
                  <ListItem>
                    <ListItemIcon>
                      <Palette />
                    </ListItemIcon>
                    <ListItemText
                      primary="Колір"
                      secondary={car.color}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle />
                  </ListItemIcon>
                  <ListItemText
                    primary="Клас"
                    secondary={getTypeLabel(car.type)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle />
                  </ListItemIcon>
                  <ListItemText
                    primary="Ціна за день"
                    secondary={`${car.pricePerDay.toLocaleString()} ₴`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle />
                  </ListItemIcon>
                  <ListItemText
                    primary="Базовий завдаток"
                    secondary={`${car.deposit.toLocaleString()} ₴`}
                  />
                </ListItem>
              </List>
            )}

            {tabValue === 2 && isUser && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Умови оренди
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" paragraph>
                  <strong>Залог:</strong> Залог збільшується на 15% від ціни за день за кожен додатковий день прокату (починаючи з другого дня).
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Повернення:</strong> Автомобіль повинен бути повернутий в тому ж стані, в якому він був виданий. За пошкодження нараховуються штрафи.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Паливо:</strong> Автомобіль видається з повним баком і повинен бути повернутий з повним баком.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Скасування:</strong> Ви можете скасувати бронювання. Вартість буде перерахована за фактичні дні використання.
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onClose={() => setBookingDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Забронювати автомобіль</DialogTitle>
        <DialogContent>
          {car && (
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
                        onChange={(newValue: Dayjs | null) => {
                          if (newValue && bookingData.expectedEndDate && newValue.isAfter(bookingData.expectedEndDate)) {
                            setBookingData({
                              startDate: newValue,
                              expectedEndDate: newValue.add(1, 'day'),
                            });
                          } else {
                            setBookingData({ ...bookingData, startDate: newValue });
                          }
                        }}
                        shouldDisableDate={(date: Dayjs) => {
                          if (date.isBefore(dayjs(), 'day')) return true;
                          return isDateBooked(date);
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
                        onChange={(newValue: Dayjs | null) => setBookingData({ ...bookingData, expectedEndDate: newValue })}
                        shouldDisableDate={(date: Dayjs) => {
                          if (date.isBefore(dayjs(), 'day')) return true;
                          if (bookingData.startDate && date.isBefore(bookingData.startDate, 'day')) return true;
                          return isDateBooked(date);
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
                      <Paper sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Заброньовані періоди:
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {bookedDates.map((period: { startDate: string; endDate: string }, idx: number) => (
                            <Typography key={idx} variant="caption" display="block">
                              {dayjs(period.startDate).format('DD.MM.YYYY')} - {dayjs(period.endDate).format('DD.MM.YYYY')}
                            </Typography>
                          ))}
                        </Box>
                      </Paper>
                    )}

                    {bookingData.startDate && bookingData.expectedEndDate && (() => {
                      const days = bookingData.expectedEndDate.diff(bookingData.startDate, 'day') + 1;
                      const { price, deposit } = calculateTotalCost(days, car.pricePerDay, car.deposit);
                      const baseDeposit = Number(car.deposit);
                      const additionalDeposit = deposit - baseDeposit;
                      
                      return (
                        <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Орієнтовна вартість: {formatCurrency(price)} ({days} дн. × {formatCurrency(Number(car.pricePerDay))})
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Залог: {formatCurrency(deposit)}
                            {days > 1 && (
                              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                (базовий: {formatCurrency(baseDeposit)} + додатково за {days - 1} дн.: {formatCurrency(additionalDeposit)})
                              </Typography>
                            )}
                            {days === 1 && (
                              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                (базовий завдаток)
                              </Typography>
                            )}
                          </Typography>
                          {!isDateRangeValid(bookingData.startDate, bookingData.expectedEndDate) && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                              Вибраний період перетинається з заброньованими датами
                            </Alert>
                          )}
                        </Box>
                      );
                    })()}
                  </>
                )}
              </Box>
            </LocalizationProvider>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setBookingDialogOpen(false);
            setBookingData({ startDate: null, expectedEndDate: null });
          }}>
            Скасувати
          </Button>
          <Button
            onClick={handleBookingSubmit}
            variant="contained"
            disabled={createBooking.isPending || !bookingData.startDate || !bookingData.expectedEndDate || !isDateRangeValid(bookingData.startDate, bookingData.expectedEndDate)}
          >
            {createBooking.isPending ? <CircularProgress size={20} /> : 'Забронювати'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CarDetailsPage;

