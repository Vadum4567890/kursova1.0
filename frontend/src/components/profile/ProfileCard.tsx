import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Rating,
  Typography,
} from '@mui/material';
import { Edit, Lock } from '@mui/icons-material';
import { UserRatingSummary } from '../../interfaces';
import { getRoleLabel, getRoleColor } from '../../utils/labels';

interface User {
  username?: string;
  fullName?: string;
  email?: string;
  address?: string;
  role?: string;
}

interface ProfileCardProps {
  user?: User | null;
  onEditProfile: () => void;
  onChangePassword: () => void;
  rating?: UserRatingSummary | null;
  stats?: Array<{ label: string; value: string | number }>;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  onEditProfile,
  onChangePassword,
  rating,
  stats = [],
}) => {
  return (
    <Card sx={{ borderRadius: 4 }}>
      <CardContent sx={{ textAlign: 'center', pt: 4 }}>
        <Avatar
          sx={{
            width: 120,
            height: 120,
            mx: 'auto',
            mb: 2,
            bgcolor: 'primary.main',
            fontSize: '3rem',
          }}
        >
          {user?.username?.charAt(0).toUpperCase()}
        </Avatar>

        <Typography variant="h5" gutterBottom>
          {user?.fullName || user?.username}
        </Typography>

        <Chip
          label={getRoleLabel(user?.role || '')}
          color={getRoleColor(user?.role || '')}
          sx={{ mb: 2 }}
        />

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {user?.email}
        </Typography>

        {user?.address && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {user.address}
          </Typography>
        )}

        <Typography variant="body2" color="text.secondary">
          @{user?.username}
        </Typography>

        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 3,
            textAlign: 'left',
            bgcolor: 'action.hover',
          }}
        >
          <Typography variant="overline" color="text.secondary">
            Рейтинг профілю
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="h4" fontWeight={800}>
              {rating?.rating ? rating.rating.toFixed(1) : '0.0'}
            </Typography>
            <Rating value={rating?.rating || 0} precision={0.1} readOnly size="small" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {rating?.reviewsCount || 0} опублікованих відгуків
          </Typography>
        </Box>

        {stats.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Grid container spacing={1.5}>
              {stats.slice(0, 4).map((item) => (
                <Grid item xs={6} key={item.label}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      bgcolor: 'background.default',
                      textAlign: 'left',
                      height: '100%',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {item.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button variant="outlined" startIcon={<Edit />} onClick={onEditProfile}>
            Редагувати профіль
          </Button>
          <Button variant="outlined" startIcon={<Lock />} onClick={onChangePassword}>
            Змінити пароль
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
