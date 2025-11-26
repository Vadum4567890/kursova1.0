import React from 'react';
import { Alert, AlertProps } from '@mui/material';

interface ErrorAlertProps extends Omit<AlertProps, 'severity'> {
  message: string;
  onClose?: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose, ...props }) => {
  if (!message) return null;

  return (
    <Alert severity="error" onClose={onClose} sx={{ mb: 2 }} {...props}>
      {message}
    </Alert>
  );
};

export default ErrorAlert;

