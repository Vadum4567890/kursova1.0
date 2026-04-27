import React from 'react';
import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Rating,
  Stack,
  Typography,
} from '@mui/material';
import { UserRatingSummary } from '../../interfaces';

interface MetricCard {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ReactNode;
}

interface BreakdownItem {
  label: string;
  value: number;
}

interface ProfileOverviewPanelProps {
  rating: UserRatingSummary | null | undefined;
  metrics: MetricCard[];
  roleMode: 'renter' | 'owner';
}

function buildBreakdown(rating: UserRatingSummary | null | undefined): BreakdownItem[] {
  if (!rating) {
    return [];
  }

  return [
    { label: 'Комунікація', value: Number(rating.ownerCommunicationAvg || 0) },
    { label: 'Чесність', value: Number(rating.ownerHonestyAvg || 0) },
    { label: 'Швидкість відповіді', value: Number(rating.ownerResponseSpeedAvg || 0) },
    { label: 'Повернення вчасно', value: Number(rating.renterReturnedOnTimeAvg || 0) },
    { label: 'Без пошкоджень', value: Number(rating.renterDamageFreeReturnAvg || 0) },
    { label: 'Поведінка', value: Number(rating.renterBehaviorAvg || 0) },
  ].filter((item) => item.value > 0);
}

const ProfileOverviewPanel: React.FC<ProfileOverviewPanelProps> = ({
  rating,
  metrics,
  roleMode,
}) => {
  const breakdown = buildBreakdown(rating);
  const roleRows =
    roleMode === 'owner'
      ? [
          {
            label: 'Як орендодавець',
            value: rating?.asOwnerRating ? `${Number(rating.asOwnerRating).toFixed(1)} (${rating.asOwnerCount})` : 'Немає',
          },
          {
            label: 'Завершені здачі',
            value: String(rating?.completedRentalsCount || 0),
          },
        ]
      : [
          {
            label: 'Як орендар',
            value: rating?.asRenterRating ? `${Number(rating.asRenterRating).toFixed(1)} (${rating.asRenterCount})` : 'Немає',
          },
          {
            label: 'Завершені поїздки',
            value: String(rating?.completedRentalsCount || 0),
          },
        ];

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(4, minmax(0, 1fr))',
          },
        }}
      >
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            variant="outlined"
            sx={{
              height: '100%',
              borderRadius: 3,
              background: 'linear-gradient(180deg, rgba(25,118,210,0.08) 0%, rgba(25,118,210,0.02) 100%)',
            }}
          >
            <CardContent>
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                  }}
                >
                  {metric.icon}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {metric.label}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {metric.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {metric.hint}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={2.5}>
            <Typography variant="h6" fontWeight={700}>
              Деталі рейтингу
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, minmax(0, 1fr))',
                  xl: 'repeat(3, minmax(0, 1fr))',
                },
                alignItems: 'start',
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    Середня оцінка
                  </Typography>
                  <Typography variant="h4" fontWeight={800}>
                    {rating?.rating ? Number(rating.rating).toFixed(1) : '0.0'}
                  </Typography>
                  <Rating value={Number(rating?.rating || 0)} precision={0.1} readOnly />
                  <Typography variant="body2" color="text.secondary">
                    {rating?.reviewsCount || 0} опублікованих відгуків
                  </Typography>
                </Stack>
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2">Статистика за роллю</Typography>
                  {roleRows.map((row) => (
                    <Stack key={row.label} direction="row" justifyContent="space-between" spacing={2}>
                      <Typography variant="body2" color="text.secondary">
                        {row.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ flexShrink: 0 }}>
                        {row.value}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>

              <Box
                sx={{
                  minWidth: 0,
                  gridColumn: {
                    xs: 'auto',
                    md: '1 / -1',
                    xl: 'auto',
                  },
                }}
              >
                <Stack spacing={1.25}>
                  <Typography variant="subtitle2">Категорії рейтингу</Typography>
                  {breakdown.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Категорії з’являться після перших опублікованих відгуків.
                    </Typography>
                  )}
                  {breakdown.slice(0, 4).map((item, index) => (
                    <Box key={`${item.label}-${index}`}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }} spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          {item.label}
                        </Typography>
                        <Typography variant="caption" fontWeight={700} sx={{ flexShrink: 0 }}>
                          {item.value.toFixed(1)}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(item.value / 5) * 100}
                        sx={{ height: 6, borderRadius: 999 }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default ProfileOverviewPanel;
