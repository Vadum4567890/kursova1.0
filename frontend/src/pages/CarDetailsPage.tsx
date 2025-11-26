import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Chip,
} from '@mui/material';
import { ArrowBack, BookOnline } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import {
  ImageSlider,
  CarSpecifications,
  CarPriceCard,
  DurationSelector,
  CarDetailsTabs,
  BookingDialog,
} from '../components/car';
import { getTypeLabel, getBodyTypeLabel } from '../utils/labels';
import { StatusChip } from '../components/common';
import { useCar, useBookedDates } from '../hooks/queries/useCars';
import { getAllCarImages } from '../utils/calculations';
import { useCarBooking } from '../hooks/useCarBooking';
import { ErrorAlert, LoadingSpinner, PageContainer } from '../components/common';

const CarDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const carId = id ? Number(id) : undefined;

  // React Query hooks
  const { data: car, isLoading: loading, error: carError } = useCar(carId);
  const { data: bookedDates = [], isLoading: loadingBookedDates } = useBookedDates(carId);

  // Redirect if no ID provided
  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      navigate('/cars');
    }
  }, [id, navigate]);

  // Booking hook
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const booking = useCarBooking({
    carId: car?.id,
    bookedDates,
    onSuccess: () => {
      setBookingDialogOpen(false);
    },
  });

  const [selectedDuration, setSelectedDuration] = useState<string>('1-2');
  const isUser = user?.role === 'user';

  // Get all images using utility function
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
              <StatusChip status={car.status} />
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

            {isUser && (
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
        <CarDetailsTabs car={car} isUser={isUser} />
      </Box>

      <BookingDialog
        open={bookingDialogOpen}
        onClose={handleBookingClose}
        car={car}
        bookedDates={bookedDates}
        loadingBookedDates={loadingBookedDates}
        bookingData={booking.bookingData}
        onStartDateChange={booking.updateStartDate}
        onEndDateChange={booking.updateEndDate}
        onSubmit={booking.submitBooking}
        isPending={booking.isPending}
        error={booking.error}
      />
    </PageContainer>
  );
};

export default CarDetailsPage;

