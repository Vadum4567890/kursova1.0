import React, { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  Assignment,
  Gavel,
} from '@mui/icons-material';
import {
  Box,
  Container,
  Grid,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import {
  ErrorAlert,
  FormDialog,
  SuccessAlert,
} from '../components/common';
import {
  PasswordChangeDialog,
  PenaltiesTable,
  ProfileCard,
  ProfileOverviewPanel,
  ProfileReviewsPanel,
  RentalsTable,
} from '../components/profile';
import {
  usePasswordVisibility,
  useProfileDialogs,
  useSuccessMessage,
  useUserData,
} from '../hooks';
import { usePasswordChange } from '../hooks/usePasswordChange';
import { useProfileUpdate } from '../hooks/useProfileUpdate';
import { useUserRating } from '../hooks/queries/useUsers';
import { useUserReviews } from '../hooks/queries/useReviews';
import { carService } from '../services/carService';
import { rentalService } from '../services/rentalService';
import { userService } from '../services/userService';
import { canonicalUserId } from '../utils/authUserId';
import { Review, UserRatingSummary } from '../interfaces';

function getDisplayName(user: { fullName?: string; username?: string; email?: string } | null | undefined): string {
  return user?.fullName || user?.username || user?.email || 'Невідомий користувач';
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildFallbackRatingSummary(args: {
  apiRating: UserRatingSummary | null | undefined;
  roleMode: 'renter' | 'owner';
  renterReviews: Review[];
  ownerReviews: Review[];
  completedCount: number;
  userId: string | undefined;
}): UserRatingSummary | null {
  const { apiRating, roleMode, renterReviews, ownerReviews, completedCount, userId } = args;
  const relevantReviews = roleMode === 'owner' ? ownerReviews : renterReviews;

  if (relevantReviews.length === 0) {
    return apiRating ?? null;
  }

  const reviewScores = relevantReviews.map((review) => average(Object.values(review.scores)));
  const base: UserRatingSummary = {
    userId: apiRating?.userId || userId || '',
    rating: average(reviewScores),
    reviewsCount: relevantReviews.length,
    asRenterRating: roleMode === 'renter' ? average(reviewScores) : Number(apiRating?.asRenterRating || 0),
    asRenterCount: roleMode === 'renter' ? relevantReviews.length : Number(apiRating?.asRenterCount || 0),
    asOwnerRating: roleMode === 'owner' ? average(reviewScores) : Number(apiRating?.asOwnerRating || 0),
    asOwnerCount: roleMode === 'owner' ? relevantReviews.length : Number(apiRating?.asOwnerCount || 0),
    ownerCommunicationAvg: 0,
    ownerHonestyAvg: 0,
    ownerResponseSpeedAvg: 0,
    renterReturnedOnTimeAvg: 0,
    renterDamageFreeReturnAvg: 0,
    renterBehaviorAvg: 0,
    completedRentalsCount: completedCount,
    updatedAt: apiRating?.updatedAt,
  };

  if (roleMode === 'owner') {
    base.ownerCommunicationAvg = average(ownerReviews.map((review) => Number(review.scores.communication || 0)).filter(Boolean));
    base.ownerHonestyAvg = average(ownerReviews.map((review) => Number(review.scores.honesty || 0)).filter(Boolean));
    base.ownerResponseSpeedAvg = average(ownerReviews.map((review) => Number(review.scores.response_speed || 0)).filter(Boolean));
  } else {
    base.renterReturnedOnTimeAvg = average(renterReviews.map((review) => Number(review.scores.returned_on_time || 0)).filter(Boolean));
    base.renterDamageFreeReturnAvg = average(renterReviews.map((review) => Number(review.scores.damage_free_return || 0)).filter(Boolean));
    base.renterBehaviorAvg = average(renterReviews.map((review) => Number(review.scores.behavior || 0)).filter(Boolean));
  }

  if (apiRating && Number(apiRating.reviewsCount || 0) > 0) {
    return {
      ...base,
      ...apiRating,
      completedRentalsCount: completedCount,
    };
  }

  return base;
}

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const canonicalProfileUserId = user?.id ? canonicalUserId(user.id) : undefined;
  const roleMode: 'renter' | 'owner' = user?.role === 'owner' ? 'owner' : 'renter';
  const isOwnerProfile = roleMode === 'owner';

  const { rentals, penalties, loading: loadingData } = useUserData(user?.role);
  const { showPasswords, togglePassword, resetPasswords } = usePasswordVisibility();
  const { success, showSuccess, clearSuccess } = useSuccessMessage();
  const { profileDialog, passwordDialog, openProfileDialog } = useProfileDialogs(user);
  const [tabValue, setTabValue] = useState(0);

  const profileUpdate = useProfileUpdate({
    onSuccess: showSuccess,
    refreshUser,
  });

  const passwordChange = usePasswordChange({
    onSuccess: showSuccess,
  });

  const { data: ratingSummary } = useUserRating(canonicalProfileUserId);
  const { data: renterReviews = [], isLoading: renterReviewsLoading } = useUserReviews(canonicalProfileUserId, 'renter');
  const { data: ownerReviews = [], isLoading: ownerReviewsLoading } = useUserReviews(canonicalProfileUserId, 'owner');

  const { data: myCarsData, isLoading: myCarsLoading } = useQuery({
    queryKey: ['cars', 'profile-owned', canonicalProfileUserId ?? 'anon'],
    queryFn: () => carService.getMyCars(),
    enabled: Boolean(canonicalProfileUserId && isOwnerProfile),
  });

  const ownerRentalQueries = useQueries({
    queries: (myCarsData?.data ?? []).map((car) => ({
      queryKey: ['rentals', 'profile-owned-car', String(car.id)],
      queryFn: () => rentalService.getRentalsByCarId(car.id),
      enabled: isOwnerProfile,
    })),
  });

  const allProfileReviews: Review[] = [...renterReviews, ...ownerReviews];
  const uniqueReviewCarIds = [...new Set(allProfileReviews.map((review) => String(review.carId)).filter(Boolean))];
  const uniqueReviewAuthorIds = [
    ...new Set(
      allProfileReviews
        .map((review) => String(review.reviewerUserId))
        .filter((reviewerId) => reviewerId && reviewerId !== canonicalProfileUserId)
    ),
  ];

  const reviewCarQueries = useQueries({
    queries: uniqueReviewCarIds.map((carId) => ({
      queryKey: ['cars', 'profile-review-context', carId],
      queryFn: () => carService.getCarById(carId),
      enabled: !!carId,
    })),
  });

  const reviewAuthorQueries = useQueries({
    queries: uniqueReviewAuthorIds.map((authorId) => ({
      queryKey: ['users', 'profile-review-author', authorId],
      queryFn: () => userService.getUserById(authorId),
      enabled: !!authorId,
    })),
  });

  const reviewCarMap = new Map(
    uniqueReviewCarIds
      .map((carId, index) => [carId, reviewCarQueries[index]?.data] as const)
      .filter((entry) => Boolean(entry[1]))
  );

  const reviewAuthorMap = new Map(
    uniqueReviewAuthorIds
      .map((authorId, index) => [authorId, reviewAuthorQueries[index]?.data] as const)
      .filter((entry) => Boolean(entry[1]))
  );

  const renterReviewItems = renterReviews.map((review) => {
    const car = reviewCarMap.get(String(review.carId));
    const author = reviewAuthorMap.get(String(review.reviewerUserId));
    return {
      review,
      carTitle: car ? `${car.brand} ${car.model}` : `Авто #${String(review.carId).slice(0, 8)}`,
      authorName: getDisplayName(author),
      sectionLabel: 'Орендодавець',
    };
  });

  const ownerReviewItems = ownerReviews.map((review) => {
    const car = reviewCarMap.get(String(review.carId));
    const author = reviewAuthorMap.get(String(review.reviewerUserId));
    return {
      review,
      carTitle: car ? `${car.brand} ${car.model}` : `Авто #${String(review.carId).slice(0, 8)}`,
      authorName: getDisplayName(author),
      sectionLabel: 'Орендар',
    };
  });

  const ownerRentals = ownerRentalQueries.flatMap((query) => query.data ?? []);
  const ownerCompletedTrips = ownerRentals.filter((rental) => rental.status === 'completed').length;
  const ownerActiveTrips = ownerRentals.filter((rental) => rental.status === 'pending' || rental.status === 'active').length;
  const renterCompletedTrips = rentals.filter((rental) => rental.status === 'completed').length;
  const activeTrips = rentals.filter((rental) => rental.status === 'pending' || rental.status === 'active').length;
  const listedCarsCount = myCarsData?.count ?? 0;
  const displayRatingSummary = buildFallbackRatingSummary({
    apiRating: ratingSummary,
    roleMode,
    renterReviews,
    ownerReviews,
    completedCount: roleMode === 'owner' ? ownerCompletedTrips : renterCompletedTrips,
    userId: canonicalProfileUserId,
  });

  const metrics =
    roleMode === 'owner'
      ? [
          {
            label: 'Авто в лістингу',
            value: listedCarsCount,
            hint: 'Скільки авто доступно у вашому профілі',
            icon: <Assignment fontSize="small" />,
          },
          {
            label: 'Здано в оренду',
            value: ownerCompletedTrips,
            hint: 'Завершені оренди ваших авто',
            icon: <Assignment fontSize="small" />,
          },
          {
            label: 'Активні заявки',
            value: ownerActiveTrips,
            hint: 'Pending або active оренди ваших авто',
            icon: <Assignment fontSize="small" />,
          },
          {
            label: 'Опубліковано відгуків',
            value: ownerReviews.length,
            hint: `${ownerCompletedTrips} здач в оренду`,
            icon: <Assignment fontSize="small" />,
          },
        ]
      : [
          {
            label: 'Заброньовано',
            value: rentals.length,
            hint: 'Усі ваші бронювання',
            icon: <Assignment fontSize="small" />,
          },
          {
            label: 'Завершені поїздки',
            value: renterCompletedTrips,
            hint: 'Прокати, що вже завершились',
            icon: <Assignment fontSize="small" />,
          },
          {
            label: 'Активні бронювання',
            value: activeTrips,
            hint: 'Pending або active бронювання',
            icon: <Assignment fontSize="small" />,
          },
          {
            label: 'Опубліковано відгуків',
            value: renterReviews.length,
            hint: `${activeTrips} активних / pending`,
            icon: <Assignment fontSize="small" />,
          },
        ];

  const compactStats = [
    ...(roleMode === 'owner'
      ? [
          { label: 'Лістинг авто', value: listedCarsCount },
          { label: 'Здано', value: ownerCompletedTrips },
          { label: 'Відгуки', value: ownerReviews.length },
        ]
      : [
          { label: 'Поїздки', value: renterCompletedTrips },
          { label: 'Активні', value: activeTrips },
          { label: 'Відгуки', value: renterReviews.length },
        ]),
  ];

  const profileReviewsLoading =
    renterReviewsLoading ||
    ownerReviewsLoading ||
    reviewCarQueries.some((query) => query.isLoading) ||
    reviewAuthorQueries.some((query) => query.isLoading);

  const displayError = profileUpdate.error || passwordChange.error;

  const handleUpdateProfile = async () => {
    try {
      await profileUpdate.update(profileDialog.formData);
      profileDialog.handleSuccess();
    } catch {
      // handled in hook
    }
  };

  const handleChangePassword = async () => {
    try {
      await passwordChange.change(passwordDialog.formData);
      passwordDialog.handleSuccess();
    } catch {
      // handled in hook
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" fontWeight={800} gutterBottom>
          Мій профіль
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Репутація, статистика поїздок, відгуки та керування особистими даними в одному місці.
        </Typography>
      </Box>

      <ErrorAlert
        message={displayError || ''}
        onClose={() => {
          profileUpdate.clearError();
          passwordChange.clearError();
        }}
      />
      <SuccessAlert message={success || ''} onClose={clearSuccess} />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <ProfileCard
            user={user || undefined}
            rating={displayRatingSummary}
            stats={compactStats}
            onEditProfile={openProfileDialog}
            onChangePassword={() => {
              passwordDialog.openDialog();
              resetPasswords();
            }}
          />
        </Grid>

        <Grid item xs={12} lg={8}>
          <ProfileOverviewPanel rating={displayRatingSummary} metrics={metrics} roleMode={roleMode} />
        </Grid>

        <Grid item xs={12}>
          <ProfileReviewsPanel
            renterReviews={renterReviewItems}
            ownerReviews={ownerReviewItems}
            loading={profileReviewsLoading}
            roleMode={roleMode}
          />
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
            <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)}>
              <Tab label="Прокати" icon={<Assignment />} iconPosition="start" />
              <Tab label="Штрафи" icon={<Gavel />} iconPosition="start" />
            </Tabs>

            {tabValue === 0 && (
              <Box sx={{ p: 3 }}>
                <RentalsTable rentals={rentals} loading={loadingData || myCarsLoading} />
              </Box>
            )}

            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                <PenaltiesTable penalties={penalties} loading={loadingData} />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <FormDialog
        open={profileDialog.open}
        title="Редагувати профіль"
        onClose={profileDialog.closeDialog}
        onSubmit={handleUpdateProfile}
        loading={profileUpdate.isPending}
        submitLabel="Зберегти"
        maxWidth="sm"
      >
        <TextField
          label="Email"
          type="email"
          value={profileDialog.formData.email}
          onChange={(event) => profileDialog.updateFormData({ email: event.target.value })}
          fullWidth
          required
        />
        <TextField
          label="ПІБ"
          value={profileDialog.formData.fullName}
          onChange={(event) => profileDialog.updateFormData({ fullName: event.target.value })}
          fullWidth
        />
        <TextField
          label="Адреса"
          value={profileDialog.formData.address}
          onChange={(event) => profileDialog.updateFormData({ address: event.target.value })}
          fullWidth
          placeholder="Місце проживання"
          multiline
          rows={2}
        />
        <TextField
          label="Телефон"
          value={profileDialog.formData.phone}
          onChange={(event) => profileDialog.updateFormData({ phone: event.target.value })}
          fullWidth
          placeholder="+380501234567"
        />
      </FormDialog>

      <PasswordChangeDialog
        open={passwordDialog.open}
        formData={passwordDialog.formData}
        showPasswords={showPasswords}
        loading={passwordChange.isPending}
        onClose={() => {
          passwordDialog.closeDialog();
          resetPasswords();
        }}
        onSubmit={handleChangePassword}
        onUpdateFormData={passwordDialog.updateFormData}
        onTogglePassword={togglePassword}
      />
    </Container>
  );
};

export default ProfilePage;
