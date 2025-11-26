import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

interface RoleUpdateDialogProps {
  open: boolean;
  currentRole: string;
  onClose: () => void;
  onSave: (role: string) => void;
}

export const RoleUpdateDialog: React.FC<RoleUpdateDialogProps> = ({
  open,
  currentRole,
  onClose,
  onSave,
}) => {
  const [role, setRole] = React.useState(currentRole);

  React.useEffect(() => {
    setRole(currentRole);
  }, [currentRole, open]);

  const handleSave = () => {
    onSave(role);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Змінити роль користувача</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Роль</InputLabel>
          <Select value={role} label="Роль" onChange={(e) => setRole(e.target.value)}>
            <MenuItem value="admin">Адмін</MenuItem>
            <MenuItem value="manager">Менеджер</MenuItem>
            <MenuItem value="employee">Співробітник</MenuItem>
            <MenuItem value="user">Клієнт</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Скасувати</Button>
        <Button onClick={handleSave} variant="contained">
          Зберегти
        </Button>
      </DialogActions>
    </Dialog>
  );
};

