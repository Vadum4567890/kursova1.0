import React from 'react';
import { Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { Review } from '../../interfaces';
import { formatDate } from '../../utils/dateHelpers';

interface ReviewListProps {
  reviews: Review[];
  emptyText?: string;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  emptyText = 'Поки що немає опублікованих відгуків',
}) => {
  if (reviews.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {reviews.map((review) => (
        <Card key={review.id} variant="outlined">
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <Typography variant="subtitle2">
                  Бронювання #{review.bookingId.slice(0, 8)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {review.publishedAt ? formatDate(review.publishedAt) : formatDate(review.submittedAt)}
                </Typography>
              </Stack>

              {review.comment && (
                <Typography variant="body2">{review.comment}</Typography>
              )}

              <Stack direction="row" flexWrap="wrap" gap={1}>
                {Object.entries(review.scores).map(([key, value]) => (
                  <Chip key={key} size="small" label={`${key.split('_').join(' ')}: ${value}/5`} />
                ))}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

export default ReviewList;
