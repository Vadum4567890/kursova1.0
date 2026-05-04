import React, { useState, useMemo, useEffect } from 'react';
import { Grid, Alert, Box, Pagination, Snackbar, Typography, Zoom } from '@mui/material';
import { Add, CheckCircle } from '@mui/icons-material';
import { Dayjs } from 'dayjs';
import { keyframes } from '@mui/system';
import { useAuth } from '../context/AuthContext';
import { Car } from '../interfaces';
import { useCars, useBookedDates } from '../hooks/queries/useCars';
import { useCreateBooking } from '../hooks/queries/useRentals';
import { useCarManagement, useCarFilters } from '../hooks';
import { useFormDialog } from '../hooks/useFormDialog';
import { useDeleteConfirm } from '../hooks/useDeleteConfirm';
import { useBooking } from '../hooks/useBooking';
import { ErrorAlert, LoadingSpinner, PageHeader, ConfirmDialog, PageContainer } from '../components/common';
import { CarCard, CarFiltersBar, CarFormDialog } from '../components/cars';
import BookingDialog from '../components/car/BookingDialog';
import { parseImageUrls, getInitialCarFormData } from '../utils/carHelpers';

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

const CarsPage: React.FC = () => {
  const { user } = useAuth();

  // Filters and search
  const carFilters = useCarFilters({ initialFilters: { page: 1, limit: 12 } });
  const { filters, searchTerm, setFilters, setSearchTerm } = carFilters;

  // React Query hooks
  const serverFilters = useMemo(
    () => ({
      ...filters,
      brand: searchTerm.trim() || undefined,
    }),
    [filters, searchTerm]
  );
  const { data: carsResponse, isLoading: loading, error: carsError } = useCars(serverFilters);
  const cars = carsResponse?.data || [];
  const totalCars = carsResponse?.total ?? cars.length;
  const currentPage = carsResponse?.page ?? filters.page ?? 1;
  const totalPages = carsResponse?.totalPages ?? 1;
  const createBooking = useCreateBooking();
  const [bookingSuccess, setBookingSuccess] = useState({
    open: false,
    title: '',
    message: '',
  });

  // Car management
  const carManagement = useCarManagement({
    onSuccess: () => {
      // Close dialog and let React Query refetch update the list
      formDialog.handleSuccess();
    },
  });

  // Form dialog
  const formDialog = useFormDialog<Partial<Car>>({
    initialData: getInitialCarFormData(),
  });

  // Delete confirmation
  const deleteConfirm = useDeleteConfirm({
    onConfirm: async (id) => {
      if (id === undefined || id === null || id === '') return;
      await carManagement.remove(id);
      carManagement.clearError();
    },
  });

  // Booking
  const [carIdForBooking, setCarIdForBooking] = useState<number | string | undefined>(undefined);
  const { data: bookedDates = [], isLoading: loadingBookedDates } = useBookedDates(carIdForBooking);
  const carForBooking = useMemo(
    () => cars.find((car: Car) => String(car.id) === String(carIdForBooking)) || null,
    [carIdForBooking, cars]
  );
  const effectiveBookedDates = useMemo(() => {
    const blocked = (carForBooking?.unavailableDates || []).map((date) => ({ startDate: date, endDate: date }));
    return [...bookedDates, ...blocked];
  }, [bookedDates, carForBooking?.unavailableDates]);

  const booking = useBooking({
    bookedDates: effectiveBookedDates,
    onCreateBooking: async (data) => {
      return createBooking.mutateAsync(data);
    },
    onSuccess: (rental) => {
      booking.closeBooking();
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
              : 'Авто зарезервовано на ваші дати. До старту оренди статус буде очікувальним.'
            : 'Орендодавець отримає ваш запит і підтвердить його у своєму кабінеті.',
      });
    },
  });

  // Update carIdForBooking when booking opens
  useEffect(() => {
    if (booking.carId) {
      setCarIdForBooking(booking.carId);
    } else {
      setCarIdForBooking(undefined);
    }
  }, [booking.carId]);

  // Get car object for booking dialog
  const carToBook = useMemo(() => {
    if (!booking.carId) return null;
    return cars.find((c: Car) => c.id === booking.carId) || null;
  }, [booking.carId, cars]);

  // Role checks
  const isStaff = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'employee';
  const isUser = user?.role === 'user' || user?.role === 'renter';
  const isAdmin = user?.role === 'admin';

  // Handlers
  const handleOpenDialog = (car?: Car) => {
    if (car) {
      const imageUrlsArray = parseImageUrls(car);
      formDialog.openDialog({
        ...car,
        imageUrls: imageUrlsArray,
      } as Car);
    } else {
      formDialog.openDialog();
    }
    carManagement.imageUpload.reset();
  };

  const handleCloseDialog = () => {
    formDialog.closeDialog();
    carManagement.imageUpload.reset();
  };

  const handleSubmit = async () => {
    try {
      carManagement.clearError();

      // Upload pending files if any
      let finalImageUrl = formDialog.formData.imageUrl;
      // Use the current formData.imageUrls (which may be empty array if user deleted all)
      // Important: preserve empty array to signal backend to clear images
      let finalImageUrls = formDialog.formData.imageUrls !== undefined 
        ? formDialog.formData.imageUrls 
        : [];

      if (carManagement.imageUpload.selectedFile && !finalImageUrl) {
        finalImageUrl = await carManagement.imageUpload.uploadSingleImage(
          carManagement.imageUpload.selectedFile
        );
      }

      if (carManagement.imageUpload.selectedFiles.length > 0) {
        const urls = await carManagement.imageUpload.uploadMultipleImages(
          carManagement.imageUpload.selectedFiles
        );
        finalImageUrls = [...finalImageUrls, ...urls];
      }

      if (formDialog.isEditing && formDialog.editingItem && formDialog.editingItem.id !== undefined) {
        const editId = formDialog.editingItem.id;
        await carManagement.update(
          editId,
          formDialog.formData,
          finalImageUrl,
          finalImageUrls
        );
      } else {
        await carManagement.create(formDialog.formData, finalImageUrl, finalImageUrls);
      }
    } catch {
      // Error already handled by hook
    }
  };

  const handleBookClick = (car: Car) => {
    if (car.status === 'maintenance') {
      carManagement.handleError(
        new Error('Цей автомобіль на обслуговуванні і недоступний для бронювання'),
        'Цей автомобіль на обслуговуванні і недоступний для бронювання'
      );
      return;
    }
    booking.openBooking(car.id);
  };

  const handleStartDateChange = (date: Dayjs | null) => {
    if (date && booking.bookingData.expectedEndDate && date.isAfter(booking.bookingData.expectedEndDate)) {
      booking.updateBookingData({
        startDate: date,
        expectedEndDate: date.add(1, 'day'),
      });
    } else {
      booking.updateBookingData({ startDate: date });
    }
  };

  const displayError =
    carManagement.error ||
    (carsError as Error & { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
      ?.message ||
    (carsError as Error)?.message;

  const hasActiveFilters = Boolean(searchTerm.trim() || filters.type || filters.status);
  const emptyCatalog = !loading && totalCars === 0 && !hasActiveFilters;
  const emptyAfterFilters = !loading && totalCars === 0 && hasActiveFilters;

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setFilters((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const handleFiltersChange = (nextFilters: typeof filters) => {
    setFilters({
      ...nextFilters,
      page: 1,
      limit: nextFilters.limit ?? filters.limit ?? 12,
    });
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
      limit: prev.limit ?? 12,
    }));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Автомобілі"
        action={
          (user?.role === 'admin' || user?.role === 'manager')
            ? {
                label: 'Додати автомобіль',
                icon: <Add />,
                onClick: () => handleOpenDialog(),
              }
            : undefined
        }
      />

      <CarFiltersBar
        filters={filters}
        searchTerm={searchTerm}
        onFiltersChange={handleFiltersChange}
        onSearchChange={handleSearchChange}
      />

      {displayError && <ErrorAlert message={displayError} onClose={() => carManagement.clearError()} />}

      {loading ? (
        <LoadingSpinner />
      ) : emptyCatalog ? (
        <Alert severity="info">
          Немає автомобілів у каталозі. Якщо ви адміністратор або менеджер — додайте перше авто кнопкою «Додати
          автомобіль».
        </Alert>
      ) : emptyAfterFilters ? (
        <Alert severity="info">За обраними фільтрами нічого не знайдено. Спробуйте змінити умови пошуку.</Alert>
      ) : (
        <Grid container spacing={3}>
          {cars.map((car: Car) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={car.id}>
              <CarCard
                car={car}
                isUser={isUser}
                isStaff={isStaff}
                isAdmin={isAdmin}
                onEdit={handleOpenDialog}
                onDelete={deleteConfirm.handleDeleteClick}
                onBook={handleBookClick}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && totalPages > 1 && (
        <Box
          sx={{
            mt: 4,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Показано {cars.length} з {totalCars} авто
          </Typography>
          <Pagination
            page={currentPage}
            count={totalPages}
            color="primary"
            onChange={handlePageChange}
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      <CarFormDialog
        open={formDialog.open}
        isEditing={formDialog.isEditing}
        formData={formDialog.formData}
        loading={carManagement.isPending}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        onFormDataChange={formDialog.updateFormData}
        onMainImageChange={(url) => formDialog.updateFormData({ imageUrl: url })}
        onAdditionalImagesChange={(urls) => formDialog.updateFormData({ imageUrls: urls })}
        mainImageUrl={formDialog.formData.imageUrl}
        additionalImageUrls={formDialog.formData.imageUrls || []}
        uploading={carManagement.imageUpload.uploading}
      />

      <BookingDialog
        open={booking.open}
        onClose={booking.closeBooking}
        car={carToBook}
        bookedDates={effectiveBookedDates}
        loadingBookedDates={loadingBookedDates}
        bookingData={booking.bookingData}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={(date) => booking.updateBookingData({ expectedEndDate: date })}
        onSubmit={booking.submitBooking}
        isPending={createBooking.isPending}
        error={booking.error}
      />

      <ConfirmDialog
        open={deleteConfirm.deleteDialogOpen}
        title="Підтвердження видалення"
        message="Ви впевнені, що хочете видалити цей автомобіль? Цю дію неможливо скасувати."
        onConfirm={deleteConfirm.handleDeleteConfirm}
        onCancel={deleteConfirm.closeDeleteDialog}
        confirmText="Видалити"
        confirmColor="error"
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
    </PageContainer>
  );
};

export default CarsPage;
