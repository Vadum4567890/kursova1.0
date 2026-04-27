import React from 'react';
import {
  Alert,
  Card,
  CardContent,
  Chip,
  Grid,
  Rating,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { Review } from '../../interfaces';
import { formatDate } from '../../utils/dateHelpers';

const SCORE_LABELS: Record<string, string> = {
  communication: 'Комунікація',
  honesty: 'Чесність',
  response_speed: 'Швидкість відповіді',
  cleanliness: 'Чистота',
  technical_condition: 'Технічний стан',
  accuracy_of_description: 'Відповідність опису',
  returned_on_time: 'Повернення вчасно',
  damage_free_return: 'Без пошкоджень',
  behavior: 'Поведінка',
};

export interface ProfileReviewItem {
  review: Review;
  carTitle: string;
  authorName: string;
  sectionLabel: string;
}

interface ReviewSectionProps {
  title: string;
  subtitle: string;
  reviews: ProfileReviewItem[];
  loading?: boolean;
  emptyText: string;
}

function averageScore(scores: Record<string, number>): number {
  const values = Object.values(scores);
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({
  title,
  subtitle,
  reviews,
  loading,
  emptyText,
}) => {
  return (
    <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Stack>

          {loading && (
            <Stack spacing={2}>
              <Skeleton variant="rounded" height={140} />
              <Skeleton variant="rounded" height={140} />
            </Stack>
          )}

          {!loading && reviews.length === 0 && (
            <Alert severity="info">{emptyText}</Alert>
          )}

          {!loading && reviews.length > 0 && (
            <Stack spacing={2}>
              {reviews.map(({ review, carTitle, authorName, sectionLabel }) => (
                <Card
                  key={review.id}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    bgcolor: 'background.default',
                  }}
                >
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={1}
                      >
                        <Stack spacing={0.25}>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {carTitle}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {sectionLabel}: {authorName}
                          </Typography>
                        </Stack>
                        <Stack alignItems={{ xs: 'flex-start', sm: 'flex-end' }} spacing={0.5}>
                          <Rating value={averageScore(review.scores)} precision={0.1} readOnly size="small" />
                          <Typography variant="caption" color="text.secondary">
                            {review.publishedAt ? formatDate(review.publishedAt) : formatDate(review.submittedAt)}
                          </Typography>
                        </Stack>
                      </Stack>

                      {review.comment && (
                        <Typography variant="body2">{review.comment}</Typography>
                      )}

                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {Object.entries(review.scores).map(([key, value]) => (
                          <Chip
                            key={`${review.id}-${key}`}
                            size="small"
                            label={`${SCORE_LABELS[key] || key}: ${value}/5`}
                          />
                        ))}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

interface ProfileReviewsPanelProps {
  renterReviews: ProfileReviewItem[];
  ownerReviews: ProfileReviewItem[];
  loading?: boolean;
  roleMode: 'renter' | 'owner';
}

const ProfileReviewsPanel: React.FC<ProfileReviewsPanelProps> = ({
  renterReviews,
  ownerReviews,
  loading,
  roleMode,
}) => {
  return (
    <Grid container spacing={3}>
      {roleMode === 'renter' && (
        <Grid item xs={12}>
          <ReviewSection
            title="Відгуки про мене як орендаря"
            subtitle="Оцінки від орендодавців після завершених прокатів"
            reviews={renterReviews}
            loading={loading}
            emptyText="Поки що немає опублікованих відгуків від орендодавців."
          />
        </Grid>
      )}
      {roleMode === 'owner' && (
        <Grid item xs={12}>
          <ReviewSection
            title="Відгуки про мене як орендодавця"
            subtitle="Тут видно, як орендарі оцінюють авто та ваш сервіс"
            reviews={ownerReviews}
            loading={loading}
            emptyText="Поки що немає опублікованих відгуків від орендарів."
          />
        </Grid>
      )}
    </Grid>
  );
};

export default ProfileReviewsPanel;
