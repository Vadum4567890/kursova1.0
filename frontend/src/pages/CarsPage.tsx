import React, { useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/uk';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
import {
  Edit,
  Delete,
  Add,
  Search,
  BookOnline,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, CarFilters } from '../services/carService';
import { uploadService } from '../services/uploadService';
import { useCars, useBookedDates, useCreateCar, useUpdateCar, useDeleteCar } from '../hooks/queries/useCars';
import { useCreateBooking } from '../hooks/queries/useRentals';
import { useUIStore } from '../stores';

const CarsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Filters and search
  const [filters, setFilters] = useState<CarFilters>({ page: 1, limit: 12 });
  const [searchTerm, setSearchTerm] = useState('');
  
  // React Query hooks
  const { data: carsResponse, isLoading: loading, error: carsError } = useCars(filters);
  const cars = carsResponse?.data || [];
  const createCar = useCreateCar();
  const updateCar = useUpdateCar();
  const deleteCar = useDeleteCar();
  const createBooking = useCreateBooking();
  
  // UI state
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [formData, setFormData] = useState<Partial<Car>>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'economy' as Car['type'],
    pricePerDay: 0,
    deposit: 0,
    status: 'available' as Car['status'],
    description: '',
    imageUrl: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [carToBook, setCarToBook] = useState<Car | null>(null);
  const [bookingData, setBookingData] = useState({
    startDate: null as Dayjs | null,
    expectedEndDate: null as Dayjs | null,
  });
  
  // Zustand store for delete dialog
  const { deleteDialogOpen, deleteDialogItemId, openDeleteDialog, closeDeleteDialog } = useUIStore();
  
  // Booked dates for booking dialog
  const { data: bookedDates = [], isLoading: loadingBookedDates } = useBookedDates(carToBook?.id);
  
  // Combine errors
  const displayError = error || carsError?.message;

  const handleDeleteClick = (id: number) => {
    openDeleteDialog(id, 'car');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialogItemId) return;
    try {
      await deleteCar.mutateAsync(deleteDialogItemId);
      setError('');
      closeDeleteDialog();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка видалення');
      closeDeleteDialog();
    }
  };

  const handleOpenDialog = (car?: Car) => {
    if (car) {
      setEditingCar(car);
      
      // Parse imageUrls if it's a string (JSON)
      let imageUrlsArray: string[] = [];
      if (car.imageUrls) {
        if (Array.isArray(car.imageUrls)) {
          imageUrlsArray = car.imageUrls;
        } else if (typeof car.imageUrls === 'string') {
          try {
            imageUrlsArray = JSON.parse(car.imageUrls);
          } catch {
            // If parsing fails, treat as single URL
            imageUrlsArray = [car.imageUrls];
          }
        }
      }
      
      setFormData({
        brand: car.brand,
        model: car.model,
        year: car.year,
        type: car.type,
        pricePerDay: car.pricePerDay,
        deposit: car.deposit,
        status: car.status,
        description: car.description || '',
        imageUrl: car.imageUrl || '',
        imageUrls: imageUrlsArray,
        bodyType: car.bodyType || '',
        driveType: car.driveType || '',
        transmission: car.transmission || '',
        engine: car.engine || '',
        fuelType: car.fuelType || '',
        seats: car.seats,
        mileage: car.mileage,
        color: car.color || '',
        features: car.features || '',
      });
    } else {
      setEditingCar(null);
      setFormData({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        type: 'economy' as Car['type'],
        pricePerDay: 0,
        deposit: 0,
        status: 'available' as Car['status'],
        description: '',
        imageUrl: '',
        imageUrls: [],
        bodyType: '',
        driveType: '',
        transmission: '',
        engine: '',
        fuelType: '',
        seats: undefined,
        mileage: undefined,
        color: '',
        features: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCar(null);
    setImagePreview(null);
    setSelectedFile(null);
    setSelectedFiles([]);
    setUploadedImageUrls([]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - only allowed image formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Непідтримуваний формат файлу. Дозволені формати: JPEG, PNG, GIF, WebP');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Розмір файлу не повинен перевищувати 5MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      setUploadingImage(true);
      const response = await uploadService.uploadImage(file);
      setFormData({ ...formData, imageUrl: response.url });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка завантаження зображення');
      setSelectedFile(null);
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleMultipleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setError('Непідтримуваний формат файлу. Дозволені формати: JPEG, PNG, GIF, WebP');
      return;
    }

    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError('Деякі файли перевищують 5MB');
      return;
    }

    if (files.length > 10) {
      setError('Максимум 10 файлів одночасно');
      return;
    }

    setSelectedFiles(files);
    setError('');

    // Upload files
    try {
      setUploadingImage(true);
      const responses = await uploadService.uploadImages(files);
      const urls = responses.map(r => r.url);
      const existingUrls = formData.imageUrls || [];
      setFormData({ ...formData, imageUrls: [...existingUrls, ...urls] });
      setUploadedImageUrls([...uploadedImageUrls, ...urls]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка завантаження зображень');
      setSelectedFiles([]);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      // If there's a selected file but not uploaded yet, upload it first
      if (selectedFile && !formData.imageUrl) {
        const response = await uploadService.uploadImage(selectedFile);
        formData.imageUrl = response.url;
      }

      // If there are selected files but not uploaded yet, upload them
      if (selectedFiles.length > 0) {
        const responses = await uploadService.uploadImages(selectedFiles);
        const urls = responses.map(r => r.url);
        const existingUrls = formData.imageUrls || [];
        formData.imageUrls = [...existingUrls, ...urls];
      }

      // Remove main image from imageUrls array if it's there (to avoid duplicates)
      const finalImageUrls = (formData.imageUrls || []).filter(url => url !== formData.imageUrl);

      const dataToSubmit = {
        ...formData,
        imageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
      };

      if (editingCar) {
        await updateCar.mutateAsync({ id: editingCar.id, data: dataToSubmit });
      } else {
        await createCar.mutateAsync(dataToSubmit);
      }
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка збереження');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'rented':
        return 'warning';
      case 'maintenance':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Доступний';
      case 'rented':
        return 'В прокаті';
      case 'maintenance':
        return 'На обслуговуванні';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'economy':
        return 'Економ';
      case 'business':
        return 'Бізнес';
      case 'premium':
        return 'Преміум';
      default:
        return type;
    }
  };

  const handleBookClick = (car: Car) => {
    // Prevent booking only if car is in maintenance
    if (car.status === 'maintenance') {
      setError('Цей автомобіль на обслуговуванні і недоступний для бронювання');
      return;
    }
    
    setCarToBook(car);
    setBookingDialogOpen(true);
    setError(''); // Clear any previous errors
    
    // Set default dates (tomorrow and 3 days from tomorrow)
    const tomorrow = dayjs().add(1, 'day');
    const in4Days = tomorrow.add(3, 'day');
    setBookingData({
      startDate: tomorrow,
      expectedEndDate: in4Days,
    });
  };

  // Check if a date is booked
  const isDateBooked = (date: Dayjs): boolean => {
    return bookedDates.some((period: { startDate: string; endDate: string }) => {
      const start = dayjs(period.startDate);
      const end = dayjs(period.endDate);
      return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day');
    });
  };

  // Check if date range overlaps with booked dates
  const isDateRangeValid = (start: Dayjs | null, end: Dayjs | null): boolean => {
    if (!start || !end || start.isAfter(end)) return false;
    
    return !bookedDates.some((period: { startDate: string; endDate: string }) => {
      const bookedStart = dayjs(period.startDate);
      const bookedEnd = dayjs(period.endDate);
      // Check if ranges overlap
      return (start.isSameOrBefore(bookedEnd, 'day') && end.isSameOrAfter(bookedStart, 'day'));
    });
  };

  const handleBookingSubmit = async () => {
    if (!carToBook || !bookingData.startDate || !bookingData.expectedEndDate) {
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
        carId: Number(carToBook.id),
        startDate: startDateStr,
        expectedEndDate: expectedEndDateStr,
      });
      setBookingDialogOpen(false);
      setCarToBook(null);
      setBookingData({ startDate: null, expectedEndDate: null });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка бронювання');
    }
  };

  const isStaff = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'employee';
  const isUser = user?.role === 'user';

  const filteredCars = cars.filter((car: Car) =>
    car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Автомобілі
        </Typography>
          {(user?.role === 'admin' || user?.role === 'manager') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Додати автомобіль
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Пошук за маркою або моделлю..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Тип</InputLabel>
          <Select
            value={filters.type || ''}
            label="Тип"
            onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined })}
          >
            <MenuItem value="">Всі</MenuItem>
            <MenuItem value="economy">Економ</MenuItem>
            <MenuItem value="business">Бізнес</MenuItem>
            <MenuItem value="premium">Преміум</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Статус</InputLabel>
          <Select
            value={filters.status || ''}
            label="Статус"
            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
          >
            <MenuItem value="">Всі</MenuItem>
            <MenuItem value="available">Доступні</MenuItem>
            <MenuItem value="rented">В прокаті</MenuItem>
            <MenuItem value="maintenance">На обслуговуванні</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {displayError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {displayError}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredCars.length === 0 ? (
        <Alert severity="info">Автомобілі не знайдено</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredCars.map((car: Car) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={car.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={car.imageUrl ? (car.imageUrl.startsWith('http') ? car.imageUrl : `${window.location.protocol}//${window.location.hostname}:3000${car.imageUrl}`) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='}
                  alt={`${car.brand} ${car.model}`}
                  crossOrigin="anonymous"
                  sx={{ objectFit: 'cover', backgroundColor: '#f0f0f0' }}
                  onError={(e: any) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                  }}
                />
                <CardContent 
                  sx={{ flexGrow: 1, cursor: 'pointer' }} 
                  onClick={(e) => {
                    // Don't navigate if clicking on buttons
                    if ((e.target as HTMLElement).closest('button')) {
                      return;
                    }
                    navigate(`/cars/${car.id}`);
                  }}
                >
                  <Typography variant="h6" component="h2" gutterBottom>
                    {car.brand} {car.model}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {car.year} рік • {getTypeLabel(car.type)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={getStatusLabel(car.status)}
                      color={getStatusColor(car.status)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="h6" color="primary" gutterBottom>
                    {car.pricePerDay} ₴/день
                  </Typography>
                  {car.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {car.description}
                    </Typography>
                  )}
                  {isUser && (
                    <Button
                      fullWidth
                      variant={car.status === 'maintenance' ? 'outlined' : 'contained'}
                      startIcon={<BookOnline />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookClick(car);
                      }}
                      disabled={car.status === 'maintenance'}
                      sx={{ mt: 'auto' }}
                    >
                      {car.status === 'maintenance' 
                        ? 'На обслуговуванні' 
                        : car.status === 'rented' 
                        ? 'Забронювати (на інші дати)' 
                        : 'Забронювати'}
                    </Button>
                  )}
                  {isStaff && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(car);
                        }}
                      >
                        Редагувати
                      </Button>
                      {user?.role === 'admin' && (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Delete />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(car.id);
                          }}
                        >
                          Видалити
                        </Button>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Car Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCar ? 'Редагувати автомобіль' : 'Додати автомобіль'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Марка"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Модель"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                fullWidth
                required
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Рік"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                fullWidth
                required
              />
              <FormControl fullWidth>
                <InputLabel>Тип</InputLabel>
                <Select
                  value={formData.type}
                  label="Тип"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Car['type'] })}
                >
                  <MenuItem value="economy">Економ</MenuItem>
                  <MenuItem value="business">Бізнес</MenuItem>
                  <MenuItem value="premium">Преміум</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Ціна за день (₴)"
                type="number"
                value={formData.pricePerDay}
                onChange={(e) => setFormData({ ...formData, pricePerDay: parseFloat(e.target.value) })}
                fullWidth
                required
              />
              <TextField
                label="Залог (₴)"
                type="number"
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: parseFloat(e.target.value) })}
                fullWidth
                required
              />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Статус</InputLabel>
              <Select
                value={formData.status}
                label="Статус"
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Car['status'] })}
              >
                <MenuItem value="available">Доступний</MenuItem>
                <MenuItem value="rented">В прокаті</MenuItem>
                <MenuItem value="maintenance">На обслуговуванні</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Опис"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Тип кузова</InputLabel>
                <Select
                  value={formData.bodyType || ''}
                  label="Тип кузова"
                  onChange={(e) => setFormData({ ...formData, bodyType: e.target.value || undefined })}
                >
                  <MenuItem value="">Не вказано</MenuItem>
                  <MenuItem value="sedan">Седан</MenuItem>
                  <MenuItem value="hatchback">Хетчбек</MenuItem>
                  <MenuItem value="suv">Позашляховик</MenuItem>
                  <MenuItem value="coupe">Купе</MenuItem>
                  <MenuItem value="wagon">Універсал</MenuItem>
                  <MenuItem value="convertible">Кабріолет</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Привід</InputLabel>
                <Select
                  value={formData.driveType || ''}
                  label="Привід"
                  onChange={(e) => setFormData({ ...formData, driveType: e.target.value || undefined })}
                >
                  <MenuItem value="">Не вказано</MenuItem>
                  <MenuItem value="front-wheel">Передній привід</MenuItem>
                  <MenuItem value="rear-wheel">Задній привід</MenuItem>
                  <MenuItem value="all-wheel">Повний привід</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Коробка передач</InputLabel>
                <Select
                  value={formData.transmission || ''}
                  label="Коробка передач"
                  onChange={(e) => setFormData({ ...formData, transmission: e.target.value || undefined })}
                >
                  <MenuItem value="">Не вказано</MenuItem>
                  <MenuItem value="manual">Механіка</MenuItem>
                  <MenuItem value="automatic">Автомат</MenuItem>
                  <MenuItem value="cvt">Вариатор</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Двигун"
                value={formData.engine || ''}
                onChange={(e) => setFormData({ ...formData, engine: e.target.value || undefined })}
                fullWidth
                placeholder="1.4, 2.0, etc."
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Тип палива</InputLabel>
                <Select
                  value={formData.fuelType || ''}
                  label="Тип палива"
                  onChange={(e) => setFormData({ ...formData, fuelType: e.target.value || undefined })}
                >
                  <MenuItem value="">Не вказано</MenuItem>
                  <MenuItem value="gasoline">Бензин</MenuItem>
                  <MenuItem value="diesel">Дизель</MenuItem>
                  <MenuItem value="hybrid">Гібрид</MenuItem>
                  <MenuItem value="electric">Електричний</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Кількість місць"
                type="number"
                value={formData.seats || ''}
                onChange={(e) => setFormData({ ...formData, seats: e.target.value ? parseInt(e.target.value) : undefined })}
                fullWidth
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Пробіг (км)"
                type="number"
                value={formData.mileage || ''}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value ? parseInt(e.target.value) : undefined })}
                fullWidth
              />
              <TextField
                label="Колір"
                value={formData.color || ''}
                onChange={(e) => setFormData({ ...formData, color: e.target.value || undefined })}
                fullWidth
              />
            </Box>
            <TextField
              label="Особливості (через кому)"
              value={formData.features || ''}
              onChange={(e) => setFormData({ ...formData, features: e.target.value || undefined })}
              fullWidth
              placeholder="Кондиціонер, Навігація, Підігрів сидінь"
              helperText="Введіть особливості через кому"
            />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Зображення
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    disabled={uploadingImage}
                    sx={{ mb: 1 }}
                    color="primary"
                  >
                    {uploadingImage ? 'Завантаження...' : 'Вибрати головне фото'}
                    <input
                      type="file"
                      hidden
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileChange}
                    />
                  </Button>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    disabled={uploadingImage}
                    sx={{ mb: 1 }}
                  >
                    {uploadingImage ? 'Завантаження...' : 'Додати інші фото'}
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleMultipleFilesChange}
                    />
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Головне фото:
                  </Typography>
                  {(imagePreview || formData.imageUrl) && (
                    <Box
                      sx={{
                        width: 150,
                        height: 150,
                        border: '2px solid',
                        borderColor: 'primary.main',
                        borderRadius: 1,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#f5f5f5',
                        position: 'relative',
                      }}
                    >
                      <img
                        src={imagePreview || (formData.imageUrl?.startsWith('http') ? formData.imageUrl : `${window.location.protocol}//${window.location.hostname}:3000${formData.imageUrl}`)}
                        alt="Головне фото"
                        crossOrigin="anonymous"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'cover',
                        }}
                        onError={(e: any) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                        }}
                      />
                      <Button
                        size="small"
                        onClick={() => {
                          setFormData({ ...formData, imageUrl: '' });
                          setImagePreview(null);
                          setSelectedFile(null);
                        }}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          minWidth: 24,
                          width: 24,
                          height: 24,
                          backgroundColor: 'error.main',
                          color: 'white',
                          fontSize: '0.75rem',
                          padding: 0,
                          '&:hover': {
                            backgroundColor: 'error.dark',
                          },
                        }}
                      >
                        ×
                      </Button>
                    </Box>
                  )}
                  {!imagePreview && !formData.imageUrl && (
                    <Box
                      sx={{
                        width: 150,
                        height: 150,
                        border: '1px dashed #ddd',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#fafafa',
                        color: 'text.secondary',
                      }}
                    >
                      <Typography variant="caption" align="center">
                        Головне фото
                      </Typography>
                    </Box>
                  )}
                  {formData.imageUrls && formData.imageUrls.length > 0 && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                        Інші фото ({formData.imageUrls.length}):
                      </Typography>
                    </>
                  )}
                  {formData.imageUrls && formData.imageUrls.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxWidth: 300 }}>
                      {formData.imageUrls.map((url, index) => (
                        <Box
                          key={index}
                          sx={{
                            width: 70,
                            height: 70,
                            border: '1px solid #ddd',
                            borderRadius: 1,
                            overflow: 'hidden',
                            position: 'relative',
                            bgcolor: '#f5f5f5',
                          }}
                        >
                          <img
                            src={url.startsWith('http') ? url : `${window.location.protocol}//${window.location.hostname}:3000${url}`}
                            alt={`Image ${index + 1}`}
                            crossOrigin="anonymous"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                            onError={(e: any) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAiIGhlaWdodD0iNzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjcwIiBoZWlnaHQ9IjcwIiBmaWxsPSIjZTBlMGUwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                            }}
                          />
                          <Button
                            size="small"
                            onClick={() => {
                              const newUrls = formData.imageUrls?.filter((_, i) => i !== index) || [];
                              setFormData({ ...formData, imageUrls: newUrls });
                            }}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              minWidth: 20,
                              width: 20,
                              height: 20,
                              backgroundColor: 'error.main',
                              color: 'white',
                              fontSize: '0.75rem',
                              padding: 0,
                              '&:hover': {
                                backgroundColor: 'error.dark',
                              },
                            }}
                          >
                            ×
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Скасувати</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={createCar.isPending || updateCar.isPending}>
            {(createCar.isPending || updateCar.isPending) ? <CircularProgress size={20} /> : editingCar ? 'Зберегти' : 'Створити'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onClose={() => {
        setBookingDialogOpen(false);
        setBookingData({ startDate: null, expectedEndDate: null });
      }} maxWidth="md" fullWidth>
        <DialogTitle>Забронювати автомобіль</DialogTitle>
        <DialogContent>
          {carToBook && (
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="uk">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {carToBook.brand} {carToBook.model} ({carToBook.year})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ціна: {carToBook.pricePerDay} ₴/день • Базовий завдаток: {carToBook.deposit} ₴
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Завдаток збільшується на 15% від ціни за день за кожен додатковий день прокату
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

                    {bookingData.startDate && bookingData.expectedEndDate && (
                      <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Орієнтовна вартість: {(() => {
                            const days = bookingData.expectedEndDate.diff(bookingData.startDate, 'day') + 1;
                            const pricePerDay = Number(carToBook.pricePerDay);
                            const cost = days * pricePerDay;
                            return `${cost.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴ (${days} дн. × ${pricePerDay.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴)`;
                          })()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Залог: {(() => {
                            const days = bookingData.expectedEndDate.diff(bookingData.startDate, 'day') + 1;
                            const baseDeposit = Number(carToBook.deposit);
                            const pricePerDay = Number(carToBook.pricePerDay);
                            // Additional deposit: 15% of daily price per day (starting from day 2)
                            const additionalPerDay = pricePerDay * 0.15;
                            const additionalDeposit = additionalPerDay * Math.max(0, days - 1);
                            const totalDeposit = baseDeposit + additionalDeposit;
                            return `${totalDeposit.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴`;
                          })()}
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                            {(() => {
                              const days = bookingData.expectedEndDate.diff(bookingData.startDate, 'day') + 1;
                              if (days > 1) {
                                const pricePerDay = Number(carToBook.pricePerDay);
                                const additionalPerDay = pricePerDay * 0.15;
                                const additionalDeposit = additionalPerDay * (days - 1);
                                return `(базовий: ${Number(carToBook.deposit).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴ + додатково за ${days - 1} дн.: ${additionalDeposit.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴)`;
                              }
                              return `(базовий завдаток)`;
                            })()}
                          </Typography>
                        </Typography>
                        {!isDateRangeValid(bookingData.startDate, bookingData.expectedEndDate) && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            Вибраний період перетинається з заброньованими датами
                          </Alert>
                        )}
                      </Box>
                    )}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          Підтвердження видалення
        </DialogTitle>
        <DialogContent>
          <Typography>
            Ви впевнені, що хочете видалити цей автомобіль? Цю дію неможливо скасувати.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDeleteDialog}>
            Скасувати
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" disabled={deleteCar.isPending}>
            {deleteCar.isPending ? <CircularProgress size={20} /> : 'Видалити'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CarsPage;

