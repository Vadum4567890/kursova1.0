import React from 'react';
import { Box, Typography, Link, useTheme } from '@mui/material';

const LandingFooter: React.FC = () => {
  const theme = useTheme();
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor:
          theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)',
      }}
    >
      <Typography variant="body2" color="text.secondary" align="center">
        © {year} Car Rental.{' '}
        <Link href="#" color="inherit" underline="hover" sx={{ cursor: 'default' }}>
          Умови використання
        </Link>
      </Typography>
    </Box>
  );
};

export default LandingFooter;
