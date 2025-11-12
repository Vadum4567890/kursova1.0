import React, { useEffect, useState } from 'react';
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
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/uk';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { carService, Car } from '../services/carService';
import { rentalService } from '../services/rentalService';
import { useAuth } from '../context/AuthContext';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const CarDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingData, setBookingData] = useState({
    startDate: null as Dayjs | null,
    expectedEndDate: null as Dayjs | null,
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookedDates, setBookedDates] = useState<Array<{ startDate: string; endDate: string }>>([]);
  const [loadingBookedDates, setLoadingBookedDates] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<string>('1-2');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isUser = user?.role === 'user';

  // Get all images: main image (imageUrl) first, then additional images (imageUrls)
  const getAllImages = (): string[] => {
    if (!car) return [];
    
    const images: string[] = [];
    
    // Add main image first if it exists
    if (car.imageUrl) {
      images.push(car.imageUrl);
    }
    
    // Handle imageUrls - can be array or JSON string
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
    
    // Add additional images, but avoid duplicates with main image
    imageUrlsArray.forEach(url => {
      if (url && !images.includes(url)) {
        images.push(url);
      }
    });
    
    return images;
  };

  const images = getAllImages();
  const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';

  // Auto-scroll images every 7 seconds
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 7000); // 7 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  const handlePreviousImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const getImageUrl = (url: string): string => {
    if (url.startsWith('http')) return url;
    return `${window.location.protocol}//${window.location.hostname}:3000${url}`;
  };

  useEffect(() => {
    if (id) {
      loadCar();
    }
  }, [id]);

  const loadCar = async () => {
    try {
      setLoading(true);
      const data = await carService.getCarById(Number(id));
      // Ensure imageUrls is properly parsed
      if (data.imageUrls !== undefined && data.imageUrls !== null) {
        if (typeof data.imageUrls === 'string') {
          try {
            (data as any).imageUrls = JSON.parse(data.imageUrls);
          } catch {
            // If parsing fails, treat as single URL
            (data as any).imageUrls = [data.imageUrls];
          }
        }
        // If it's already an array, keep it as is
      } else {
        // If imageUrls is null or undefined, set to empty array
        (data as any).imageUrls = [];
      }
      setCar(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка завантаження автомобіля');
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = async () => {
    if (!car) return;
    
    if (car.status === 'maintenance') {
      setError('Цей автомобіль на обслуговуванні і недоступний для бронювання');
      return;
    }
    
    setBookingDialogOpen(true);
    setLoadingBookedDates(true);
    setError('');
    
    const today = dayjs();
    const in3Days = today.add(3, 'day');
    setBookingData({
      startDate: today,
      expectedEndDate: in3Days,
    });
    
    try {
      const dates = await carService.getBookedDates(car.id);
      setBookedDates(dates);
    } catch (err: any) {
      console.error('Failed to load booked dates:', err);
      setBookedDates([]);
    } finally {
      setLoadingBookedDates(false);
    }
  };

  const isDateBooked = (date: Dayjs): boolean => {
    return bookedDates.some(period => {
      const start = dayjs(period.startDate);
      const end = dayjs(period.endDate);
      return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day');
    });
  };

  const isDateRangeValid = (start: Dayjs | null, end: Dayjs | null): boolean => {
    if (!start || !end || start.isAfter(end)) return false;
    
    return !bookedDates.some(period => {
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
      setBookingSubmitting(true);
      setError('');
      await rentalService.createBooking(
        car.id,
        bookingData.startDate.toISOString(),
        bookingData.expectedEndDate.toISOString()
      );
      setBookingDialogOpen(false);
      setBookingData({ startDate: null, expectedEndDate: null });
      setBookedDates([]);
      navigate('/my-rentals');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка бронювання');
    } finally {
      setBookingSubmitting(false);
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

  const getBodyTypeLabel = (bodyType?: string) => {
    if (!bodyType) return null;
    const labels: { [key: string]: string } = {
      'sedan': 'Седан',
      'hatchback': 'Хетчбек',
      'suv': 'Позашляховик',
      'coupe': 'Купе',
      'wagon': 'Універсал',
      'convertible': 'Кабріолет',
    };
    return labels[bodyType.toLowerCase()] || bodyType;
  };

  const getDriveTypeLabel = (driveType?: string) => {
    if (!driveType) return null;
    const labels: { [key: string]: string } = {
      'front-wheel': 'Передній привід',
      'rear-wheel': 'Задній привід',
      'all-wheel': 'Повний привід',
    };
    return labels[driveType.toLowerCase()] || driveType;
  };

  const getTransmissionLabel = (transmission?: string) => {
    if (!transmission) return null;
    const labels: { [key: string]: string } = {
      'manual': 'Механіка',
      'automatic': 'Автомат',
      'cvt': 'Вариатор',
    };
    return labels[transmission.toLowerCase()] || transmission;
  };

  const getFuelTypeLabel = (fuelType?: string) => {
    if (!fuelType) return null;
    const labels: { [key: string]: string } = {
      'gasoline': 'Бензин',
      'diesel': 'Дизель',
      'hybrid': 'Гібрид',
      'electric': 'Електричний',
    };
    return labels[fuelType.toLowerCase()] || fuelType;
  };

  // Calculate price based on duration
  const calculatePrice = (days: number): number => {
    if (!car) return 0;
    return days * Number(car.pricePerDay);
  };

  // Calculate deposit based on duration
  const calculateDeposit = (days: number): number => {
    if (!car) return 0;
    const baseDeposit = Number(car.deposit);
    const pricePerDay = Number(car.pricePerDay);
    // Additional deposit: 15% of daily price per day (starting from day 2)
    const additionalPerDay = pricePerDay * 0.15;
    const additionalDeposit = additionalPerDay * Math.max(0, days - 1);
    return baseDeposit + additionalDeposit;
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

  if (error && !car) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
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
  const totalPrice = calculatePrice(days);
  const totalDeposit = calculateDeposit(days);

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
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: 500,
                overflow: 'hidden',
                backgroundColor: '#f0f0f0',
              }}
            >
              {images.length > 0 ? (
                <>
                  <Box
                    component="img"
                    src={getImageUrl(images[currentImageIndex])}
                    alt={`${car.brand} ${car.model} - Image ${currentImageIndex + 1}`}
                    crossOrigin="anonymous"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'opacity 0.5s ease-in-out',
                    }}
                    onError={(e: any) => {
                      e.target.src = defaultImage;
                    }}
                  />
                  
                  {/* Navigation Buttons */}
                  {images.length > 1 && (
                    <>
                      <Button
                        onClick={handlePreviousImage}
                        sx={{
                          position: 'absolute',
                          left: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          minWidth: 40,
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          },
                          zIndex: 2,
                        }}
                      >
                        <ChevronLeft />
                      </Button>
                      <Button
                        onClick={handleNextImage}
                        sx={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          minWidth: 40,
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          },
                          zIndex: 2,
                        }}
                      >
                        <ChevronRight />
                      </Button>
                      
                      {/* Image Indicators */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 10,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          gap: 1,
                          zIndex: 2,
                        }}
                      >
                        {images.map((_, index) => (
                          <Box
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            sx={{
                              width: currentImageIndex === index ? 24 : 8,
                              height: 8,
                              borderRadius: 1,
                              backgroundColor: currentImageIndex === index ? 'primary.main' : 'rgba(255, 255, 255, 0.5)',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                            }}
                          />
                        ))}
                      </Box>
                      
                      {/* Image Counter */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: 2,
                          fontSize: '0.875rem',
                          zIndex: 2,
                        }}
                      >
                        {currentImageIndex + 1} / {images.length}
                      </Box>
                    </>
                  )}
                </>
              ) : (
                <Box
                  component="img"
                  src={defaultImage}
                  alt="No image"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              )}
            </Box>
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
                    Орієнтовна вартість: <strong>{totalPrice.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴</strong> ({days} дн.)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Залог: <strong>{totalDeposit.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴</strong>
                    {days > 1 && (() => {
                      const baseDeposit = Number(car.deposit);
                      const additionalDeposit = totalDeposit - baseDeposit;
                      return (
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                          (базовий: {baseDeposit.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴ + додатково за {days - 1} дн.: {additionalDeposit.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴)
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
                          {bookedDates.map((period, idx) => (
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
                            const pricePerDay = Number(car.pricePerDay);
                            const cost = days * pricePerDay;
                            return `${cost.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴ (${days} дн. × ${pricePerDay.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴)`;
                          })()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Залог: {(() => {
                            const days = bookingData.expectedEndDate.diff(bookingData.startDate, 'day') + 1;
                            const baseDeposit = Number(car.deposit);
                            const pricePerDay = Number(car.pricePerDay);
                            const additionalPerDay = pricePerDay * 0.15;
                            const additionalDeposit = additionalPerDay * Math.max(0, days - 1);
                            const totalDeposit = baseDeposit + additionalDeposit;
                            return `${totalDeposit.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴`;
                          })()}
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                            {(() => {
                              const days = bookingData.expectedEndDate.diff(bookingData.startDate, 'day') + 1;
                              if (days > 1) {
                                const pricePerDay = Number(car.pricePerDay);
                                const additionalPerDay = pricePerDay * 0.15;
                                const additionalDeposit = additionalPerDay * (days - 1);
                                return `(базовий: ${Number(car.deposit).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴ + додатково за ${days - 1} дн.: ${additionalDeposit.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴)`;
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
            setBookedDates([]);
            setBookingData({ startDate: null, expectedEndDate: null });
          }}>
            Скасувати
          </Button>
          <Button
            onClick={handleBookingSubmit}
            variant="contained"
            disabled={bookingSubmitting || !bookingData.startDate || !bookingData.expectedEndDate || !isDateRangeValid(bookingData.startDate, bookingData.expectedEndDate)}
          >
            {bookingSubmitting ? <CircularProgress size={20} /> : 'Забронювати'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CarDetailsPage;

