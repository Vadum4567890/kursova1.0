import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Rating,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Review, ReviewableBooking } from '../../interfaces';

type ReviewRole = ReviewableBooking['role'];

interface ReviewDialogProps {
  open: boolean;
  booking: ReviewableBooking | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    bookingId: string;
    comment?: string;
    scores: Record<string, number>;
  }) => Promise<void> | void;
}

const CATEGORY_LABELS: Record<
  ReviewRole,
  Array<{ key: string; label: string; helper: string }>
> = {
  renter: [
    {
      key: 'communication',
      label: 'Комунікація власника',
      helper: 'Наскільки легко було домовитися',
    },
    {
      key: 'honesty',
      label: 'Чесність власника',
      helper: 'Чи все відповідало домовленості',
    },
    {
      key: 'response_speed',
      label: 'Швидкість відповіді',
      helper: 'Як швидко власник реагував',
    },
    {
      key: 'cleanliness',
      label: 'Чистота авто',
      helper: 'Стан салону та кузова',
    },
    {
      key: 'technical_condition',
      label: 'Технічний стан',
      helper: 'Надійність і справність авто',
    },
    {
      key: 'accuracy_of_description',
      label: 'Відповідність опису',
      helper: 'Чи збігся опис із реальністю',
    },
  ],
  owner: [
    {
      key: 'returned_on_time',
      label: 'Повернення вчасно',
      helper: 'Чи повернув орендар авто вчасно',
    },
    {
      key: 'damage_free_return',
      label: 'Повернення без пошкоджень',
      helper: 'Стан авто після оренди',
    },
    {
      key: 'behavior',
      label: 'Загальна поведінка',
      helper: 'Комунікація та відповідальність орендаря',
    },
  ],
};

function createDefaultScores(role: ReviewRole): Record<string, number> {
  return CATEGORY_LABELS[role].reduce<Record<string, number>>((acc, item) => {
    acc[item.key] = 5;
    return acc;
  }, {});
}

function normalizeScores(role: ReviewRole, review?: Review | null): Record<string, number> {
  const defaults = createDefaultScores(role);
  if (!review) {
    return defaults;
  }

  return Object.keys(defaults).reduce<Record<string, number>>((acc, key) => {
    acc[key] = Number(review.scores?.[key] ?? defaults[key]);
    return acc;
  }, {});
}

export const ReviewDialog: React.FC<ReviewDialogProps> = ({
  open,
  booking,
  loading = false,
  onClose,
  onSubmit,
}) => {
  const [comment, setComment] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});

  const categories = useMemo(
    () => (booking ? CATEGORY_LABELS[booking.role] : []),
    [booking]
  );

  const isEditMode = Boolean(booking?.myReviewSubmitted && booking?.myReview);

  useEffect(() => {
    if (!open || !booking) {
      return;
    }

    setComment(booking.myReview?.comment ?? '');
    setScores(normalizeScores(booking.role, booking.myReview));
  }, [open, booking]);

  const handleSubmit = async () => {
    if (!booking) {
      return;
    }

    await onSubmit({
      bookingId: booking.bookingId,
      comment: comment.trim() || undefined,
      scores,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: 600,
          overflowX: 'hidden',
          mx: 2,
        },
      }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        {booking?.role === 'renter'
          ? 'Відгук про авто та власника'
          : 'Відгук про орендаря'}
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          overflowX: 'hidden',
          px: { xs: 2, sm: 3 },
          py: 2.5,
        }}
      >
        <Stack
          spacing={2.5}
          sx={{
            width: '100%',
            minWidth: 0,
            overflowX: 'hidden',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Відгук стане публічним лише після того, як обидві сторони залишать свої
            reviews.
          </Typography>

          {isEditMode && (
            <Typography variant="body2" color="primary.main" fontWeight={600}>
              Ви вже надіслали відгук. Його можна відредагувати, поки друга сторона ще не
              відповіла.
            </Typography>
          )}

          {categories.map((item, index) => (
            <Box
              key={item.key}
              sx={{
                width: '100%',
                minWidth: 0,
              }}
            >
              {index > 0 && <Divider sx={{ mb: 2 }} />}

              <Stack spacing={1} sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2">{item.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.helper}
                </Typography>
                <Rating
                  value={scores[item.key] ?? 5}
                  onChange={(_event, value) =>
                    setScores((prev) => ({ ...prev, [item.key]: value ?? 5 }))
                  }
                />
              </Stack>
            </Box>
          ))}

          <TextField
            label="Коментар"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            multiline
            minRows={4}
            fullWidth
            placeholder="Поділіться коротким враженням про оренду"
            sx={{
              minWidth: 0,
              '& .MuiInputBase-root': {
                width: '100%',
                boxSizing: 'border-box',
              },
            }}
          />
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          overflowX: 'hidden',
          flexWrap: 'wrap',
          rowGap: 1,
        }}
      >
        <Button onClick={onClose} disabled={loading}>
          Скасувати
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !booking}>
          {isEditMode ? 'Оновити відгук' : 'Надіслати відгук'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewDialog;
