import React, { useState, useMemo, useEffect } from 'react';
import { Grid, Alert } from '@mui/material';
import { Add } from '@mui/icons-material';
import { Dayjs } from 'dayjs';
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

const CarsPage: React.FC = () => {
  const { user } = useAuth();

  // Filters and search
  const carFilters = useCarFilters();
  const { filters, searchTerm, setFilters, setSearchTerm, filterCars } = carFilters;

  // React Query hooks
  const { data: carsResponse, isLoading: loading, error: carsError } = useCars(filters);
  const cars = carsResponse?.data || [];
  const createBooking = useCreateBooking();

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
      await carManagement.remove(id);
      carManagement.clearError();
    },
  });

  // Booking
  const [carIdForBooking, setCarIdForBooking] = useState<number | undefined>(undefined);
  const { data: bookedDates = [], isLoading: loadingBookedDates } = useBookedDates(carIdForBooking);

  const booking = useBooking({
    bookedDates,
    onCreateBooking: async (data) => {
      await createBooking.mutateAsync(data);
    },
    onSuccess: () => {
      booking.closeBooking();
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

  // Filtered cars
  const filteredCars = useMemo(() => filterCars(cars), [cars, filterCars]);

  // Role checks
  const isStaff = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'employee';
  const isUser = user?.role === 'user';
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

      if (formDialog.isEditing && formDialog.editingItem && formDialog.editingItem.id) {
        await carManagement.update(
          formDialog.editingItem.id,
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

  const displayError = carManagement.error || carsError?.message;

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
        onFiltersChange={setFilters}
        onSearchChange={setSearchTerm}
      />

      {displayError && <ErrorAlert message={displayError} onClose={() => carManagement.clearError()} />}

      {loading ? (
        <LoadingSpinner />
      ) : filteredCars.length === 0 ? (
        <Alert severity="info">Автомобілі не знайдено</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredCars.map((car: Car) => (
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
        bookedDates={bookedDates}
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
    </PageContainer>
  );
};

export default CarsPage;
