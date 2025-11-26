import React from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Chip,
  Box,
  Button,
} from '@mui/material';
import { Edit, Lock } from '@mui/icons-material';
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
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  onEditProfile,
  onChangePassword,
}) => {
  return (
    <Card>
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
            📍 {user.address}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          @{user?.username}
        </Typography>
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

