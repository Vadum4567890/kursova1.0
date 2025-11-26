import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  useTheme,
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(usernameOrEmail, password);
      // Redirect based on user role
      const userData = authService.getUser();
      if (userData?.role === 'user') {
        navigate('/');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка входу. Перевірте дані.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Вхід в систему
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Увійдіть для доступу до системи прокату автомобілів
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Логін або Email"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            margin="normal"
            required
            autoFocus
            autoComplete="username"
          />
          <TextField
            fullWidth
            label="Пароль"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {loading ? 'Вхід...' : 'Увійти'}
          </Button>
        </form>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2">
            Немає акаунту?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/register')}
              sx={{ cursor: 'pointer' }}
            >
              Зареєструватися
            </Link>
          </Typography>
        </Box>

        <Box sx={{ 
          mt: 3, 
          p: 2, 
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.100',
          borderRadius: 1,
          border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
        }}>
          <Typography variant="caption" display="block" gutterBottom sx={{ color: 'text.primary', fontWeight: 600 }}>
            Тестові облікові записи:
          </Typography>
          <Typography variant="caption" display="block" sx={{ color: 'text.primary' }}>
            Admin: <strong style={{ color: theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2' }}>admin</strong> / <strong style={{ color: theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2' }}>admin123</strong>
          </Typography>
          <Typography variant="caption" display="block" sx={{ color: 'text.primary' }}>
            Manager: <strong style={{ color: theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2' }}>manager</strong> / <strong style={{ color: theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2' }}>manager123</strong>
          </Typography>
          <Typography variant="caption" display="block" sx={{ color: 'text.primary' }}>
            Employee: <strong style={{ color: theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2' }}>employee</strong> / <strong style={{ color: theme.palette.mode === 'dark' ? '#90caf9' : '#1976d2' }}>employee123</strong>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;

