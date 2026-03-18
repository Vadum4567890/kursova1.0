import React from 'react';
import { Grid, Alert } from '@mui/material';
import { Add } from '@mui/icons-material';
import { Car } from '../../interfaces';
import { useMyCars } from '../../hooks/queries/useCars';
import { useCarManagement, useFormDialog, useDeleteConfirm } from '../../hooks';
import { ErrorAlert, LoadingSpinner, PageHeader, ConfirmDialog, PageContainer } from '../../components/common';
import { CarCard, CarFormDialog } from '../../components/cars';
import { getInitialCarFormData, parseImageUrls } from '../../utils/carHelpers';

const MyCarsPage: React.FC = () => {
  const { data: myCarsResponse, isLoading: loading, error: carsError } = useMyCars();
  const cars = myCarsResponse?.data ?? [];

  const carManagement = useCarManagement({
    onSuccess: () => formDialog.handleSuccess(),
  });

  const formDialog = useFormDialog<Partial<Car>>({
    initialData: getInitialCarFormData(),
  });

  const deleteConfirm = useDeleteConfirm({
    onConfirm: async (id) => {
      if (typeof id !== 'number') return;
      await carManagement.remove(id);
      carManagement.clearError();
    },
  });

  const handleOpenDialog = (car?: Car) => {
    if (car) {
      const imageUrlsArray = parseImageUrls(car);
      formDialog.openDialog({ ...car, imageUrls: imageUrlsArray } as Car);
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
      let finalImageUrl = formDialog.formData.imageUrl;
      let finalImageUrls = formDialog.formData.imageUrls ?? [];
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
      if (formDialog.isEditing && formDialog.editingItem?.id !== undefined && typeof formDialog.editingItem.id === 'number') {
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
      // error handled by hook
    }
  };

  const displayError = carManagement.error || carsError?.message;

  return (
    <PageContainer>
      <PageHeader
        title="Мої авто"
        subtitle="Керуйте своїми автомобілями та цінами"
        action={{
          label: 'Додати автомобіль',
          icon: <Add />,
          onClick: () => handleOpenDialog(),
        }}
      />

      {displayError && <ErrorAlert message={displayError} onClose={() => carManagement.clearError()} />}

      {loading ? (
        <LoadingSpinner />
      ) : cars.length === 0 ? (
        <Alert severity="info">
          У вас ще немає оголошень. Додайте перший автомобіль і вкажіть свої ціни — орендарі зможуть його забронювати.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {cars.map((car: Car) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={car.id}>
              <CarCard
                car={car}
                isUser={false}
                isStaff={true}
                isAdmin={true}
                onEdit={handleOpenDialog}
                onDelete={deleteConfirm.handleDeleteClick}
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

      <ConfirmDialog
        open={deleteConfirm.deleteDialogOpen}
        title="Підтвердження видалення"
        message="Ви впевнені, що хочете видалити це оголошення? Цю дію неможливо скасувати."
        onConfirm={deleteConfirm.handleDeleteConfirm}
        onCancel={deleteConfirm.closeDeleteDialog}
        confirmText="Видалити"
        confirmColor="error"
      />
    </PageContainer>
  );
};

export default MyCarsPage;
