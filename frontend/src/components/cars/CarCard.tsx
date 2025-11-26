import React from 'react';
import { Card, CardMedia, CardContent, Typography, Box, Button } from '@mui/material';
import { Edit, Delete, BookOnline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Car } from '../../interfaces';
import { getTypeLabel } from '../../utils/labels';
import { StatusChip } from '../common';

interface CarCardProps {
  car: Car;
  isUser: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  onEdit: (car: Car) => void;
  onDelete: (id: number) => void;
  onBook: (car: Car) => void;
}

const DEFAULT_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';

const getImageUrl = (imageUrl?: string): string => {
  if (!imageUrl) return DEFAULT_IMAGE;
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${window.location.protocol}//${window.location.hostname}:3000${imageUrl}`;
};

export const CarCard: React.FC<CarCardProps> = ({
  car,
  isUser,
  isStaff,
  isAdmin,
  onEdit,
  onDelete,
  onBook,
}) => {
  const navigate = useNavigate();

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DEFAULT_IMAGE;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/cars/${car.id}`);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)'
              : '0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          zIndex: 1,
        },
        '&:hover::before': {
          opacity: 1,
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 100%)',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
          },
          '&:hover::after': {
            opacity: 1,
          },
        }}
      >
        <CardMedia
          component="img"
          height="220"
          image={getImageUrl(car.imageUrl)}
          alt={`${car.brand} ${car.model}`}
          crossOrigin="anonymous"
          sx={{
            objectFit: 'cover',
            backgroundColor: (theme) => (theme.palette.mode === 'dark' ? '#2a2a2a' : '#f0f0f0'),
            cursor: 'pointer',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
          onClick={() => navigate(`/cars/${car.id}`)}
          onError={handleImageError}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={handleCardClick}>
        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          sx={{
            fontWeight: 700,
            fontSize: '1.1rem',
            mb: 0.5,
          }}
        >
          {car.brand} {car.model}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          gutterBottom
          sx={{
            fontSize: '0.875rem',
            mb: 1.5,
          }}
        >
          {car.year} рік • {getTypeLabel(car.type)}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <StatusChip status={car.status} />
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 0.5,
            mb: 1,
          }}
        >
          <Typography
            variant="h5"
            color="primary"
            sx={{
              fontWeight: 700,
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #90caf9 0%, #42a5f5 100%)'
                  : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {car.pricePerDay}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ₴/день
          </Typography>
        </Box>
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
              onBook(car);
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
                onEdit(car);
              }}
            >
              Редагувати
            </Button>
            {isAdmin && (
              <Button
                size="small"
                color="error"
                startIcon={<Delete />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(car.id);
                }}
              >
                Видалити
              </Button>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

