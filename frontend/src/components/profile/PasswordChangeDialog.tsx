import React from 'react';
import {
  TextField,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { FormDialog } from '../common';
import { PasswordFormData } from '../../interfaces';

interface PasswordVisibilityState {
  current: boolean;
  new: boolean;
  confirm: boolean;
}

interface PasswordChangeDialogProps {
  open: boolean;
  formData: PasswordFormData;
  showPasswords: PasswordVisibilityState;
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onUpdateFormData: (updates: Partial<PasswordFormData>) => void;
  onTogglePassword: (field: keyof PasswordVisibilityState) => void;
}

const PasswordChangeDialog: React.FC<PasswordChangeDialogProps> = ({
  open,
  formData,
  showPasswords,
  loading,
  onClose,
  onSubmit,
  onUpdateFormData,
  onTogglePassword,
}) => {
  return (
    <FormDialog
      open={open}
      title="Змінити пароль"
      onClose={onClose}
      onSubmit={onSubmit}
      loading={loading}
      submitLabel="Змінити"
      maxWidth="sm"
    >
      <TextField
        label="Поточний пароль"
        type={showPasswords.current ? 'text' : 'password'}
        value={formData.currentPassword}
        onChange={(e) => onUpdateFormData({ currentPassword: e.target.value })}
        fullWidth
        required
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => onTogglePassword('current')}>
                {showPasswords.current ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <TextField
        label="Новий пароль"
        type={showPasswords.new ? 'text' : 'password'}
        value={formData.newPassword}
        onChange={(e) => onUpdateFormData({ newPassword: e.target.value })}
        fullWidth
        required
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => onTogglePassword('new')}>
                {showPasswords.new ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <TextField
        label="Підтвердити новий пароль"
        type={showPasswords.confirm ? 'text' : 'password'}
        value={formData.confirmPassword}
        onChange={(e) => onUpdateFormData({ confirmPassword: e.target.value })}
        fullWidth
        required
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => onTogglePassword('confirm')}>
                {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </FormDialog>
  );
};

export default PasswordChangeDialog;

