import React from 'react';
import { Alert, AlertProps } from '@mui/material';

interface SuccessAlertProps extends Omit<AlertProps, 'severity'> {
  message: string;
  onClose?: () => void;
}

const SuccessAlert: React.FC<SuccessAlertProps> = ({ message, onClose, ...props }) => {
  if (!message) return null;

  return (
    <Alert severity="success" onClose={onClose} sx={{ mb: 2 }} {...props}>
      {message}
    </Alert>
  );
};

export default SuccessAlert;

