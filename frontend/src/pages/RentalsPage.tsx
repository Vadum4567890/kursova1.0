import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add, CheckCircle, Cancel, FileDownload, TableChart, Upload, Error as ErrorIcon, Warning } from '@mui/icons-material';
import { Rental, Client, Car } from '../interfaces';
import { useRentals, useActiveRentals, useCreateRental, useCancelRental, useCompleteRental } from '../hooks/queries/useRentals';
import { useClients } from '../hooks/queries/useClients';
import { useCars } from '../hooks/queries/useCars';
import { rentalService } from '../services/rentalService';
import { 
  ErrorAlert, 
  LoadingSpinner, 
  PageHeader, 
  FormDialog,
  ConfirmDialog,
  PageContainer
} from '../components/common';
import { useFormDialog } from '../hooks/useFormDialog';
import { useDeleteConfirm } from '../hooks/useDeleteConfirm';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { StatusChip } from '../components/common';
import { RentalFormData } from '../interfaces';
import { formatDate } from '../utils/dateHelpers';

const RentalsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResultDialogOpen, setImportResultDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  
  // React Query hooks
  const { data: allRentals = [], isLoading: loadingAll, error: rentalsError } = useRentals();
  const { data: activeRentals = [], isLoading: loadingActive, error: activeError } = useActiveRentals();
  const createRental = useCreateRental();
  const cancelRental = useCancelRental();
  const completeRental = useCompleteRental();
  
  // Load clients and cars when dialog opens
  const { data: clients = [] } = useClients();
  const { data: carsResponse } = useCars();
  const cars = useMemo(() => carsResponse?.data?.filter((c: Car) => c.status === 'available') || [], [carsResponse]);
  
  const { error, handleError, clearError } = useErrorHandler();
  const displayError = error || rentalsError?.message || activeError?.message;

  const formDialog = useFormDialog<RentalFormData>({
    initialData: {
      clientId: '',
      carId: '',
      startDate: '',
      expectedEndDate: '',
    },
  });

  const deleteConfirm = useDeleteConfirm({
    onConfirm: async (id) => {
      await cancelRental.mutateAsync(id);
      clearError();
    },
    onError: handleError,
  });
  
  // Select rentals based on tab
  const rentals = tabValue === 0 ? allRentals : activeRentals;
  const loading = tabValue === 0 ? loadingAll : loadingActive;

  const handleCreateRental = async () => {
    if (!formDialog.formData.clientId || !formDialog.formData.carId || !formDialog.formData.startDate || !formDialog.formData.expectedEndDate) {
      handleError(new Error('Будь ласка, заповніть всі поля'), 'Будь ласка, заповніть всі поля');
      return;
    }
    try {
      clearError();
      await createRental.mutateAsync({
        clientId: parseInt(formDialog.formData.clientId),
        carId: parseInt(formDialog.formData.carId),
        startDate: new Date(formDialog.formData.startDate).toISOString(),
        expectedEndDate: new Date(formDialog.formData.expectedEndDate).toISOString(),
      });
      formDialog.handleSuccess();
    } catch (err: any) {
      handleError(err, 'Помилка створення прокату');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      clearError();
      await completeRental.mutateAsync({ id });
    } catch (err: any) {
      handleError(err, 'Помилка завершення прокату');
    }
  };

  const handleExportExcel = async () => {
    try {
      clearError();
      const blob = await rentalService.exportToExcel();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rentals_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      handleError(err, 'Помилка експорту в Excel');
    }
  };

  const handleExportCSV = async () => {
    try {
      clearError();
      const blob = await rentalService.exportToCSV();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rentals_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      handleError(err, 'Помилка експорту в CSV');
    }
  };

  const handleImportFile = async () => {
    if (!importFile) {
      handleError(new Error('Виберіть файл'), 'Помилка імпорту');
      return;
    }

    try {
      setImporting(true);
      clearError();
      const result = await rentalService.importRentals(importFile);
      
      // Store result and show result dialog
      setImportResult(result);
      setImportDialogOpen(false);
      setImportFile(null);
      setImportResultDialogOpen(true);
    } catch (err: any) {
      handleError(err, 'Помилка імпорту');
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
        handleError(new Error('Невірний формат файлу. Підтримуються тільки Excel (.xlsx, .xls) та CSV (.csv)'), 'Помилка');
        return;
      }
      setImportFile(file);
    }
  };

  const handleDownloadTemplate = async (format: 'excel' | 'csv' = 'excel') => {
    try {
      clearError();
      const blob = await rentalService.downloadTemplate(format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rentals_import_template.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      handleError(err, 'Помилка завантаження шаблону');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Прокати"
        action={{
          label: 'Створити прокат',
          icon: <Add />,
          onClick: () => formDialog.openDialog(),
        }}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<Upload />}
          onClick={() => setImportDialogOpen(true)}
          disabled={loading}
        >
          Імпорт
        </Button>
        <Button
          variant="outlined"
          startIcon={<TableChart />}
          onClick={handleExportExcel}
          disabled={loading}
        >
          Експорт Excel
        </Button>
        <Button
          variant="outlined"
          startIcon={<FileDownload />}
          onClick={handleExportCSV}
          disabled={loading}
        >
          Експорт CSV
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Всі прокати" />
          <Tab label="Активні" />
        </Tabs>
      </Box>

      <ErrorAlert message={displayError || ''} onClose={clearError} />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Клієнт</TableCell>
                <TableCell>Автомобіль</TableCell>
                <TableCell>Початок</TableCell>
                <TableCell>Очікуваний кінець</TableCell>
                <TableCell>Вартість</TableCell>
                <TableCell>Залог</TableCell>
                <TableCell>Повернення</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell align="right">Дії</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rentals.map((rental: Rental) => (
                <TableRow key={rental.id} hover>
                  <TableCell>{rental.id}</TableCell>
                  <TableCell>
                    {rental.client?.fullName || (rental.clientId ? `Клієнт #${rental.clientId}` : 'Невідомо')}
                  </TableCell>
                  <TableCell>
                    {rental.car
                      ? `${rental.car.brand} ${rental.car.model}`
                      : (rental.carId ? `Автомобіль #${rental.carId}` : 'Невідомо')}
                  </TableCell>
                  <TableCell>
                    {formatDate(rental.startDate)}
                  </TableCell>
                  <TableCell>
                    {formatDate(rental.expectedEndDate)}
                    {rental.actualEndDate && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        Фактично: {formatDate(rental.actualEndDate)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {rental.totalCost.toLocaleString()} ₴
                    </Typography>
                    {rental.penaltyAmount > 0 && (
                      <Typography variant="caption" color="error" display="block">
                        Штраф: +{rental.penaltyAmount.toLocaleString()} ₴
                      </Typography>
                    )}
                    {rental.car && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {rental.car.pricePerDay} ₴/день
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="warning.main">
                      {rental.depositAmount.toLocaleString()} ₴
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      // Calculate refund: deposit - penalty (if penalty > deposit, return 0)
                      const refund = Math.max(0, rental.depositAmount - rental.penaltyAmount);
                      if (rental.status === 'cancelled' || rental.status === 'completed') {
                        return (
                          <Typography 
                            variant="body2" 
                            color={refund > 0 ? "success.main" : "text.secondary"}
                            fontWeight={refund > 0 ? 600 : 400}
                          >
                            {refund.toLocaleString()} ₴
                          </Typography>
                        );
                      }
                      // For active rentals, show expected refund (full deposit if no penalties expected)
                      return (
                        <Typography variant="body2" color="text.secondary">
                          {rental.depositAmount.toLocaleString()} ₴
                          <Typography variant="caption" display="block" color="text.secondary">
                            (очікується)
                          </Typography>
                        </Typography>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={rental.status} />
                  </TableCell>
                  <TableCell align="right">
                    {rental.status === 'active' && (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          startIcon={<CheckCircle />}
                          onClick={() => handleComplete(rental.id)}
                        >
                          Завершити
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Cancel />}
                          onClick={() => deleteConfirm.handleDeleteClick(rental.id, 'rental')}
                        >
                          Скасувати
                        </Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <FormDialog
        open={formDialog.open}
        title="Створити прокат"
        onClose={formDialog.closeDialog}
        onSubmit={handleCreateRental}
        loading={createRental.isPending}
        submitLabel="Створити"
        maxWidth="sm"
      >
        <FormControl fullWidth required>
          <InputLabel>Клієнт</InputLabel>
          <Select
            value={formDialog.formData.clientId}
            label="Клієнт"
            onChange={(e) => formDialog.updateFormData({ clientId: e.target.value })}
          >
            {clients.map((client: Client) => (
              <MenuItem key={client.id} value={client.id.toString()}>
                {client.fullName} ({client.phone})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth required>
          <InputLabel>Автомобіль</InputLabel>
          <Select
            value={formDialog.formData.carId}
            label="Автомобіль"
            onChange={(e) => formDialog.updateFormData({ carId: e.target.value })}
          >
            {cars.map((car: Car) => (
              <MenuItem key={car.id} value={car.id.toString()}>
                {car.brand} {car.model} ({car.year}) - {car.pricePerDay} ₴/день
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Дата початку"
          type="datetime-local"
          value={formDialog.formData.startDate}
          onChange={(e) => formDialog.updateFormData({ startDate: e.target.value })}
          fullWidth
          required
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Очікувана дата завершення"
          type="datetime-local"
          value={formDialog.formData.expectedEndDate}
          onChange={(e) => formDialog.updateFormData({ expectedEndDate: e.target.value })}
          fullWidth
          required
          InputLabelProps={{ shrink: true }}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteConfirm.deleteDialogOpen}
        title="Підтвердження скасування"
        message="Ви впевнені, що хочете скасувати цей прокат? Цю дію неможливо скасувати."
        onConfirm={deleteConfirm.handleDeleteConfirm}
        onCancel={deleteConfirm.closeDeleteDialog}
        confirmText="Підтвердити скасування"
        confirmColor="error"
      />

      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Імпорт прокатів</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleDownloadTemplate('excel')}
                startIcon={<TableChart />}
              >
                Завантажити шаблон Excel
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleDownloadTemplate('csv')}
                startIcon={<FileDownload />}
              >
                Завантажити шаблон CSV
              </Button>
            </Box>
            <TextField
              fullWidth
              type="file"
              inputProps={{
                accept: '.xlsx,.xls,.csv',
              }}
              onChange={handleFileChange}
              helperText="Підтримуються формати: Excel (.xlsx, .xls) та CSV (.csv)"
            />
            {importFile && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Вибрано: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Скасувати</Button>
          <Button
            onClick={handleImportFile}
            variant="contained"
            disabled={!importFile || importing}
          >
            {importing ? 'Імпорт...' : 'Імпортувати'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Result Dialog */}
      <Dialog 
        open={importResultDialogOpen} 
        onClose={() => setImportResultDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {importResult && importResult.success > 0 && importResult.failed === 0 ? (
              <>
                <CheckCircle sx={{ color: 'success.main', fontSize: 32 }} />
                <Typography variant="h6">Імпорт успішно завершено</Typography>
              </>
            ) : importResult && importResult.failed > 0 ? (
              <>
                <ErrorIcon sx={{ color: 'error.main', fontSize: 32 }} />
                <Typography variant="h6">Імпорт завершено з помилками</Typography>
              </>
            ) : (
              <>
                <Warning sx={{ color: 'warning.main', fontSize: 32 }} />
                <Typography variant="h6">Результат імпорту</Typography>
              </>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {importResult && (
            <Box sx={{ mt: 1 }}>
              {/* Summary */}
              <Box sx={{ 
                p: 2, 
                borderRadius: 1, 
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: importResult.success > 0 && importResult.failed === 0 
                  ? 'success.main' 
                  : importResult.failed > 0 
                    ? 'error.main' 
                    : 'warning.main',
                mb: 3
              }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Підсумок:
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Успішно імпортовано:</Typography>
                    <Typography variant="h6" color="success.main">{importResult.success}</Typography>
                  </Box>
                  {importResult.failed > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">Помилок:</Typography>
                      <Typography variant="h6" color="error.main">{importResult.failed}</Typography>
                    </Box>
                  )}
                  {importResult.skipped > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">Пропущено (дублікати):</Typography>
                      <Typography variant="h6" color="warning.main">{importResult.skipped}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Errors */}
              {importResult.errors && importResult.errors.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" color="error.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ErrorIcon fontSize="small" />
                    Помилки:
                  </Typography>
                  <Box sx={{ 
                    maxHeight: 200, 
                    overflowY: 'auto',
                    border: '1px solid',
                    borderColor: 'error.light',
                    borderRadius: 1,
                    p: 1
                  }}>
                    {importResult.errors.map((error: any, index: number) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          p: 1, 
                          mb: index < importResult.errors.length - 1 ? 1 : 0,
                          bgcolor: index % 2 === 0 ? 'background.paper' : 'action.hover',
                          borderRadius: 0.5
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Рядок {error.row}:
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          {error.error}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Skipped Items (Duplicates) */}
              {importResult.skippedItems && importResult.skippedItems.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" color="warning.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning fontSize="small" />
                    Пропущено (дублікати):
                  </Typography>
                  <Box sx={{ 
                    maxHeight: 200, 
                    overflowY: 'auto',
                    border: '1px solid',
                    borderColor: 'warning.light',
                    borderRadius: 1,
                    p: 1
                  }}>
                    {importResult.skippedItems.map((item: any, index: number) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          p: 1, 
                          mb: index < importResult.skippedItems.length - 1 ? 1 : 0,
                          bgcolor: index % 2 === 0 ? 'background.paper' : 'action.hover',
                          borderRadius: 0.5
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Рядок {item.row}:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.reason}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Success Message */}
              {importResult.success > 0 && importResult.failed === 0 && (
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 1, 
                  bgcolor: 'success.light',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <CheckCircle sx={{ color: 'success.main' }} />
                  <Typography variant="body1" color="success.dark">
                    Всі прокати успішно імпортовано!
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setImportResultDialogOpen(false);
              // Refresh rentals list to show imported rentals
              window.location.reload();
            }}
            variant="contained"
            color={importResult && importResult.success > 0 && importResult.failed === 0 ? 'success' : 'primary'}
          >
            Закрити
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default RentalsPage;

