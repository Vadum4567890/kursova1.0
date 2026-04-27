import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Typography, Box, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { ArrowBack, Chat } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { LandlordContactChat } from '../components/car';
import { useCar } from '../hooks/queries/useCars';
import { useMyRentals } from '../hooks/queries/useRentals';
import { canonicalUserId } from '../utils/authUserId';
import { PageContainer, LoadingSpinner, ErrorAlert } from '../components/common';
import { rentalService } from '../services/rentalService';

const CarChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRenterId, setSelectedRenterId] = useState<string | null>(null);
  const { user } = useAuth();
  const carId: number | string | undefined = id
    ? id.includes('-')
      ? id
      : Number(id) || undefined
    : undefined;

  const { data: car, isLoading, error } = useCar(carId);
  const { data: myRentals = [], isLoading: loadingMyRentals } = useMyRentals();

  const hasBookedThisCar = useMemo(() => {
    if (!car) return false;
    return myRentals.some(
      (r) => String(r.carId) === String(car.id) && r.status !== 'cancelled'
    );
  }, [car, myRentals]);

  const isCarOwner = useMemo(() => {
    if (!car || !user) return false;
    const oid = car.ownerId != null ? String(car.ownerId).toLowerCase() : '';
    if (!oid) return false;
    return canonicalUserId(user.id) === oid;
  }, [car, user]);

  const canUseChat = hasBookedThisCar || isCarOwner;

  const { data: inquiryThreads = [], isLoading: loadingInquiryThreads } = useQuery({
    queryKey: ['rentals', 'car-inquiry-threads', car?.id],
    queryFn: () => rentalService.getCarInquiryThreads(car!.id),
    enabled: !!car && isCarOwner,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const handleThreadChange = useCallback(
    (renterId: string) => {
      setSelectedRenterId(renterId);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('renter', renterId);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (!isCarOwner || !inquiryThreads.length) {
      setSelectedRenterId(null);
      return;
    }
    const fromUrl = searchParams.get('renter');
    setSelectedRenterId((prev) => {
      if (fromUrl && inquiryThreads.some((t) => t.threadRenterUserId === fromUrl)) {
        return fromUrl;
      }
      if (prev && inquiryThreads.some((t) => t.threadRenterUserId === prev)) {
        return prev;
      }
      if (inquiryThreads.length === 1) {
        return inquiryThreads[0].threadRenterUserId;
      }
      return null;
    });
  }, [isCarOwner, inquiryThreads, searchParams]);

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (error && !car) {
    return (
      <PageContainer>
        <ErrorAlert message={(error as Error).message || 'Помилка'} />
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/cars')} sx={{ mt: 2 }}>
          До каталогу
        </Button>
      </PageContainer>
    );
  }

  if (!car || !user) {
    return (
      <PageContainer>
        <Typography>Увійдіть, щоб відкрити чат.</Typography>
        <Button onClick={() => navigate('/login')}>Увійти</Button>
      </PageContainer>
    );
  }

  if (loadingMyRentals && !isCarOwner) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (isCarOwner && loadingInquiryThreads) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (!canUseChat) {
    return (
      <PageContainer maxWidth="md">
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/cars/${car.id}`)} sx={{ mb: 2 }}>
          До картки авто
        </Button>
        <Typography variant="h6" gutterBottom>
          Чат недоступний
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Щоб писати власнику цього авто, спочатку оформіть бронювання. Орендодавець відкриває чат зі
          сторінки свого авто або з розділу «Чати».
        </Typography>
        <Button variant="contained" onClick={() => navigate(`/cars/${car.id}`)}>
          Перейти до бронювання
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="md" sx={{ mt: { xs: 2, md: 3 } }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(`/cars/${car.id}`)}
        sx={{ mb: 2 }}
        color="inherit"
      >
        До картки авто
      </Button>

      <Box
        sx={(theme) => ({
          mb: 3,
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3,
          background:
            theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.primary.dark}22 0%, transparent 60%)`
              : `linear-gradient(135deg, ${theme.palette.primary.light}33 0%, transparent 55%)`,
          border: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
          <Chat sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" component="h1" fontWeight={700}>
              {car.brand} {car.model}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isCarOwner && !hasBookedThisCar
                ? 'Переписка з орендарями щодо цього авто.'
                : 'Переписка з орендодавцем. Повідомлення оновлюються автоматично; при поверненні на вкладку список оновлюється одразу.'}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {isCarOwner && inquiryThreads.length > 1 && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="inquiry-thread-label">Діалог з орендарем</InputLabel>
          <Select
            labelId="inquiry-thread-label"
            label="Діалог з орендарем"
            value={selectedRenterId ?? ''}
            onChange={(e) => handleThreadChange(String(e.target.value))}
          >
            {inquiryThreads.map((t) => (
              <MenuItem key={t.threadRenterUserId} value={t.threadRenterUserId}>
                {t.preview.length > 90 ? `${t.preview.slice(0, 90)}…` : t.preview || t.threadRenterUserId}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {isCarOwner && !loadingInquiryThreads && inquiryThreads.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          Поки немає повідомлень від орендарів щодо цього авто. Коли орендар напише з картки авто
          після бронювання, діалог з’явиться тут.
        </Typography>
      ) : (
        <LandlordContactChat
          carId={car.id}
          mode="inquiry"
          embedded
          isCarOwner={isCarOwner}
          threadRenterUserId={isCarOwner ? selectedRenterId : null}
        />
      )}
    </PageContainer>
  );
};

export default CarChatPage;
