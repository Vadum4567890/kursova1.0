import React from 'react';
import { Card, CardContent, Grid, Rating, Stack, Typography } from '@mui/material';
import { CarRatingSummary } from '../../interfaces';

interface RatingSummaryCardProps {
  rating: CarRatingSummary | null | undefined;
}

export const RatingSummaryCard: React.FC<RatingSummaryCardProps> = ({ rating }) => {
  if (!rating) {
    return null;
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Stack spacing={0.5}>
              <Typography variant="h4" fontWeight={700}>
                {rating.rating.toFixed(1)}
              </Typography>
              <Rating value={rating.rating} precision={0.1} readOnly />
              <Typography variant="body2" color="text.secondary">
                {rating.reviewsCount} опублікованих відгуків
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={8}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Чистота</Typography>
                <Typography variant="body1" fontWeight={600}>{rating.cleanlinessAvg.toFixed(1)}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Технічний стан</Typography>
                <Typography variant="body1" fontWeight={600}>{rating.technicalConditionAvg.toFixed(1)}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Відповідність опису</Typography>
                <Typography variant="body1" fontWeight={600}>{rating.accuracyOfDescriptionAvg.toFixed(1)}</Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default RatingSummaryCard;
