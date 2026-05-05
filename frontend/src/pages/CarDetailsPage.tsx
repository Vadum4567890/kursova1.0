import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Chip,
  Paper,
  Stack,
  Divider,
  Alert,
  Snackbar,
  Zoom,
} from '@mui/material';
import { ArrowBack, BookOnline, Chat, CheckCircle, Edit, RateReview } from '@mui/icons-material';
import { keyframes } from '@mui/system';
import { useAuth } from '../context/AuthContext';
import {
  ImageSlider,
  CarSpecifications,
  CarPriceCard,
  DurationSelector,
  CarDetailsTabs,
  BookingDialog,
} from '../components/car';
import { getTypeLabel, getBodyTypeLabel, getCarListingLabel, getCarListingColor } from '../utils/labels';
import { useCar, useBookedDates } from '../hooks/queries/useCars';
import { useMyRentals, useRentalsByCar } from '../hooks/queries/useRentals';
import {
  useCarRating,
  useCarReviews,
  useEligibleReviews,
  useSubmitReview,
  useUpdateReview,
} from '../hooks/queries/useReviews';
import { getAllCarImages } from '../utils/calculations';
import { useCarBooking } from '../hooks/useCarBooking';
import { ErrorAlert, LoadingSpinner, PageContainer } from '../components/common';
import ReviewDialog from '../components/reviews/ReviewDialog';
import RatingSummaryCard from '../components/reviews/RatingSummaryCard';
import ReviewList from '../components/reviews/ReviewList';
import { Rental, ReviewableBooking } from '../interfaces';

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

const CarDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const carId: number | string | undefined = id
    ? id.includes('-')
      ? id
      : (Number(id) || undefined)
    : undefined;

  const { data: car, isLoading: loading, error: carError } = useCar(carId);
  const { data: bookedDates = [], isLoading: loadingBookedDates } = useBookedDates(carId);
  const { data: myRentals = [] } = useMyRentals();
  const { data: carRentals = [] } = useRentalsByCar(carId);
  const { data: carRating } = useCarRating(carId);
  const { data: carReviews = [] } = useCarReviews(carId);
  const { data: eligibleReviews = [] } = useEligibleReviews();
  const submitReview = useSubmitReview();
  const updateReview = useUpdateReview();

  useEffect(() => {
    if (!id || (isNaN(Number(id)) && !id.includes('-'))) {
      navigate('/cars');
    }
  }, [id, navigate]);

  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedReviewBooking, setSelectedReviewBooking] = useState<ReviewableBooking | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState({
    open: false,
    title: '',
    message: '',
  });
  const [reviewSuccess, setReviewSuccess] = useState({
    open: false,
    title: '',
    message: '',
  });
  const booking = useCarBooking({
    carId: car?.id,
    bookedDates: [
      ...bookedDates,
      ...((car?.unavailableDates || []).map((date) => ({ startDate: date, endDate: date }))),
    ],
    onSuccess: (rental: Rental) => {
      setBookingDialogOpen(false);
      setBookingSuccess({
        open: true,
        title:
          rental.ownerApprovalStatus === 'approved'
            ? 'Бронювання підтверджено'
            : 'Заявку надіслано',
        message:
          rental.ownerApprovalStatus === 'approved'
            ? rental.status === 'active'
              ? 'Оренда вже активна. Авто закріплено за вами.'
              : 'Авто зарезервовано на ваші дати. До старту оренди статус залишатиметься очікувальним.'
            : 'Орендодавець отримає ваш запит і зможе підтвердити його у своєму кабінеті.',
      });
    },
  });

  const [selectedDuration, setSelectedDuration] = useState<string>('1-2');
  const canBook = !!user && ['user', 'renter', 'both'].includes(user.role);
  const canManageOwnerReviews = !!user && ['owner', 'both'].includes(user.role);

  const viewerRental = useMemo(() => {
    if (!car) return null;
    return (
      myRentals.find(
        (r) =>
          String(r.carId) === String(car.id) &&
          (r.status === 'pending' || r.status === 'active')
      ) ?? null
    );
  }, [car, myRentals]);

  const hasBookedThisCar = useMemo(() => {
    if (!car) return false;
    return myRentals.some(
      (r) => String(r.carId) === String(car.id) && r.status !== 'cancelled'
    );
  }, [car, myRentals]);

  const ownerReviewableBookings = useMemo(
    () =>
      eligibleReviews.filter(
        (item) => String(item.carId) === String(car?.id) && item.role === 'owner'
      ),
    [eligibleReviews, car?.id]
  );

  const completedRentalsById = useMemo(
    () => new Map(carRentals.map((rental) => [String(rental.id), rental])),
    [carRentals]
  );

  const images = useMemo(() => getAllCarImages(car || null), [car]);

  const handleBookClick = () => {
    if (!car) return;

    if (car.status === 'maintenance') {
      booking.setError('Цей автомобіль на обслуговуванні і недоступний для бронювання');
      return;
    }

    setBookingDialogOpen(true);
    booking.clearError();
    booking.setDefaultDates();
  };

  const handleBookingClose = () => {
    setBookingDialogOpen(false);
    booking.resetBookingData();
    booking.clearError();
  };

  const handleReviewSubmit = async (payload: {
    bookingId: string;
    comment?: string;
    scores: Record<string, number>;
  }) => {
    try {
      if (selectedReviewBooking?.myReviewSubmitted) {
        await updateReview.mutateAsync({
          bookingId: payload.bookingId,
          payload: {
            comment: payload.comment,
            scores: payload.scores,
          },
        });
        setReviewSuccess({
          open: true,
          title: 'Відгук оновлено',
          message: 'Зміни збережено. Відгук буде опубліковано після відповіді другої сторони.',
        });
      } else {
        await submitReview.mutateAsync(payload);
        setReviewSuccess({
          open: true,
          title: 'Відгук надіслано',
          message: 'Відгук збережено. Він стане публічним після відповіді другої сторони.',
        });
      }
      setSelectedReviewBooking(null);
    } catch (err: any) {
      booking.setError(err?.message || 'Не вдалося зберегти відгук');
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (carError && !car) {
    return (
      <PageContainer>
        <ErrorAlert message={carError.message || 'Помилка завантаження автомобіля'} />
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/cars')} sx={{ mt: 2 }}>
          Повернутися до каталогу
        </Button>
      </PageContainer>
    );
  }

  if (!car) {
    return null;
  }

  return (
    <PageContainer>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/cars')}
        sx={{ mb: 3 }}
      >
        Повернутися до каталогу
      </Button>

      {booking.error && (
        <ErrorAlert message={booking.error} onClose={booking.clearError} />
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Card sx={{ position: 'relative', overflow: 'hidden' }}>
            <ImageSlider images={images} height={500} />
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {car.brand} {car.model}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip
                label={getCarListingLabel(car.status, viewerRental)}
                color={getCarListingColor(car.status, viewerRental)}
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

            <CarSpecifications car={car} />
            <CarPriceCard car={car} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Рейтинг авто
              </Typography>
              <RatingSummaryCard rating={carRating} />
            </Box>

            {canManageOwnerReviews && ownerReviewableBookings.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Відгуки, що очікують на вас
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Після вашого review система опублікує обидва відгуки, якщо орендар уже відповів.
                  </Typography>
                  {ownerReviewableBookings.map((bookingItem) => (
                    <Stack
                      key={bookingItem.bookingId}
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Бронювання #{bookingItem.bookingId.slice(0, 8)}
                        {completedRentalsById.get(String(bookingItem.bookingId))?.actualEndDate
                          ? ` • завершено ${new Date(
                              completedRentalsById.get(String(bookingItem.bookingId))!.actualEndDate!
                            ).toLocaleDateString('uk-UA')}`
                          : ''}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={bookingItem.myReviewSubmitted ? <Edit /> : <RateReview />}
                        onClick={() => setSelectedReviewBooking(bookingItem)}
                      >
                        {bookingItem.myReviewSubmitted ? 'Редагувати відгук' : 'Оцінити орендаря'}
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            )}

            {canBook && hasBookedThisCar && (
              <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Орендодавець і чат
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Напишіть власнику в чаті. Активна поїздка не обовʼязкова — можна переписуватися і під час
                    очікування підтвердження, і після завершення оренди.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Chat />}
                    onClick={() => navigate(`/cars/${car.id}/chat`)}
                  >
                    Перейти у чат
                  </Button>
                </Stack>
              </Paper>
            )}

            {canBook && (
              <>
                <DurationSelector
                  car={car}
                  selectedDuration={selectedDuration}
                  onDurationChange={setSelectedDuration}
                />

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
              </>
            )}
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <CarDetailsTabs car={car} isUser={canBook} />
      </Box>

      <Box sx={{ mt: 4 }}>
        <Stack spacing={2}>
          <Divider />
          <Typography variant="h5">Опубліковані відгуки</Typography>
          <ReviewList reviews={carReviews} />
        </Stack>
      </Box>

      <BookingDialog
        open={bookingDialogOpen}
        onClose={handleBookingClose}
        car={car}
        bookedDates={[
          ...bookedDates,
          ...((car.unavailableDates || []).map((date) => ({ startDate: date, endDate: date }))),
        ]}
        loadingBookedDates={loadingBookedDates}
        bookingData={booking.bookingData}
        onStartDateChange={booking.updateStartDate}
        onEndDateChange={booking.updateEndDate}
        onSubmit={booking.submitBooking}
        isPending={booking.isPending}
        error={booking.error}
      />

      <ReviewDialog
        open={!!selectedReviewBooking}
        booking={selectedReviewBooking}
        loading={submitReview.isPending || updateReview.isPending}
        onClose={() => setSelectedReviewBooking(null)}
        onSubmit={handleReviewSubmit}
      />

      <Snackbar
        open={bookingSuccess.open}
        autoHideDuration={3200}
        onClose={() => setBookingSuccess((prev) => ({ ...prev, open: false }))}
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
          <strong>{bookingSuccess.title}</strong>
          <span>{bookingSuccess.message}</span>
        </Alert>
      </Snackbar>

      <Snackbar
        open={reviewSuccess.open}
        autoHideDuration={2800}
        onClose={() => setReviewSuccess((prev) => ({ ...prev, open: false }))}
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
          <strong>{reviewSuccess.title}</strong>
          <span>{reviewSuccess.message}</span>
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default CarDetailsPage;
