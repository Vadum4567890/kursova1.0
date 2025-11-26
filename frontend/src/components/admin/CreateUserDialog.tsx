import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  CircularProgress,
  Box,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { CreateUserData } from '../../interfaces';

interface CreateUserDialogProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (formData: CreateUserData) => void;
}

const initialFormData: CreateUserData = {
  username: '',
  email: '',
  password: '',
  fullName: '',
  address: '',
  phone: '',
  role: 'employee',
};

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  open,
  loading,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateUserData>(initialFormData);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) {
      setFormData(initialFormData);
      setShowPassword(false);
    }
  }, [open]);

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const handleChange = (field: keyof CreateUserData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Додати нового користувача</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Логін *"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Пароль *"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            fullWidth
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="ПІБ"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            fullWidth
          />
          <TextField
            label="Адреса"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
          <TextField
            label="Телефон"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            fullWidth
            placeholder="+380501234567"
          />
          <FormControl fullWidth>
            <InputLabel>Роль *</InputLabel>
            <Select
              value={formData.role}
              label="Роль *"
              onChange={(e) => handleChange('role', e.target.value as any)}
            >
              <MenuItem value="admin">Адмін</MenuItem>
              <MenuItem value="manager">Менеджер</MenuItem>
              <MenuItem value="employee">Співробітник</MenuItem>
              <MenuItem value="user">Клієнт</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Скасувати
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Створити'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

