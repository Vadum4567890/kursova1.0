import React from 'react';
import { Alert, AlertProps } from '@mui/material';

interface ErrorAlertProps extends Omit<AlertProps, 'severity'> {
  message: unknown;
  onClose?: () => void;
}

function normalizeErrorMessage(message: unknown): string {
  if (typeof message === 'string') {
    return message;
  }
  if (message && typeof message === 'object') {
    const maybeMessage = 'message' in message ? (message as { message?: unknown }).message : null;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage;
    }
  }
  return 'Сталася помилка. Спробуйте ще раз.';
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose, ...props }) => {
  const normalizedMessage = normalizeErrorMessage(message);
  if (!normalizedMessage) return null;

  return (
    <Alert severity="error" onClose={onClose} sx={{ mb: 2 }} {...props}>
      {normalizedMessage}
    </Alert>
  );
};

export default ErrorAlert;

