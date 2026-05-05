import React from 'react';
import { Alert, Snackbar, Zoom } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { popIn } from '@/constants/animations';

export type SuccessSnackbarProps = {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  /** ms */
  autoHideDuration?: number;
};

/**
 * Успішне повідомлення зверху по центру (Cars, My rentals).
 */
const SuccessSnackbar: React.FC<SuccessSnackbarProps> = ({
  open,
  title,
  message,
  onClose,
  autoHideDuration = 3000,
}) => (
  <Snackbar
    open={open}
    autoHideDuration={autoHideDuration}
    onClose={onClose}
    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    TransitionComponent={Zoom}
  >
    <Alert
      severity="success"
      variant="filled"
      icon={
        <CheckCircle
          sx={{
            animation: `${popIn} 360ms ease-out`,
          }}
        />
      }
      sx={{
        minWidth: 320,
        boxShadow: 6,
        '& .MuiAlert-message': {
          display: 'grid',
          gap: 0.5,
        },
      }}
    >
      <strong>{title}</strong>
      <span>{message}</span>
    </Alert>
  </Snackbar>
);

export default SuccessSnackbar;
