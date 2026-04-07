import React from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import { DirectionsCar, DriveEta, Security, Speed } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box>
      <Box
        sx={{
          py: { xs: 6, md: 10 },
          background:
            theme.palette.mode === 'dark'
              ? 'radial-gradient(ellipse at top, rgba(25,118,210,0.15), transparent 55%)'
              : 'radial-gradient(ellipse at top, rgba(25,118,210,0.12), transparent 55%)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' },
                  lineHeight: 1.15,
                  mb: 2,
                }}
              >
                Прокат авто без зайвих кроків
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontWeight: 400 }}>
                Орендуйте автомобілі або діліться своїм парком — один акаунт, зрозумілі ролі та
                швидкий старт.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<DriveEta />}
                  onClick={() => navigate('/register?role=renter')}
                >
                  Я орендар
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<DirectionsCar />}
                  onClick={() => navigate('/register?role=owner')}
                >
                  Я орендодавець
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background:
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))'
                      : 'linear-gradient(145deg, #fff, #f5f7fb)',
                }}
              >
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Як це працює
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  1. Оберіть роль при реєстрації — орендар або власник авто.
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  2. Заповніть профіль: контакти та дані для договору.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  3. Увійдіть у кабінет і керуйте бронюваннями або оголошеннями.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h5" fontWeight={700} textAlign="center" gutterBottom>
          Чому ми
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {[
            {
              icon: <Speed color="primary" sx={{ fontSize: 40 }} />,
              title: 'Швидко',
              text: 'Реєстрація за кілька хвилин, зрозумілий кабінет.',
            },
            {
              icon: <Security color="primary" sx={{ fontSize: 40 }} />,
              title: 'Безпечно',
              text: 'Ролі орендар / орендодавець окремо від персоналу компанії.',
            },
            {
              icon: <DirectionsCar color="primary" sx={{ fontSize: 40 }} />,
              title: 'Зручно',
              text: 'Каталог авто, мої прокати та штрафи в одному місці.',
            },
          ].map((item) => (
            <Grid item xs={12} md={4} key={item.title}>
              <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                <Box sx={{ mb: 1 }}>{item.icon}</Box>
                <Typography variant="h6" gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.text}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default LandingPage;
