import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  fullHeight?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message, 
  size = 40,
  fullHeight = false 
}) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        py: 4,
        ...(fullHeight && { minHeight: '50vh' })
      }}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;

