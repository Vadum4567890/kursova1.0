import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { DirectionsCar } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

const LandingHeader: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
            : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ gap: 2, py: 1 }}>
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            textDecoration: 'none',
            color: 'inherit',
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          <DirectionsCar sx={{ fontSize: 32 }} />
          <Typography variant="h6" component="span" fontWeight={700} noWrap>
            Car Rental
          </Typography>
        </Box>
        {!isSm && (
          <Button color="inherit" component={RouterLink} to="/register">
            Реєстрація
          </Button>
        )}
        <Button
          variant="contained"
          color="secondary"
          onClick={() => navigate('/login')}
          sx={{
            fontWeight: 600,
            boxShadow: 'none',
            ...(isSm ? { minWidth: 0, px: 1.5 } : {}),
          }}
        >
          Вхід
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default LandingHeader;
