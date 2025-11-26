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
} from '@mui/material';
import { Visibility, VisibilityOff, PersonAdd } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MIN_PASSWORD_LENGTH, PASSWORD_VALIDATION_MESSAGE } from '../../constants/validation';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(PASSWORD_VALIDATION_MESSAGE);
      return;
    }

    setLoading(true);

    try {
      await register({
        username,
        email,
        password,
        fullName: fullName || undefined,
        address: address || undefined,
      });
      // Redirect based on user role (new users are USER role by default)
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка реєстрації. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <PersonAdd sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Реєстрація
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Створіть новий обліковий запис для доступу до системи
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
            label="Ім'я користувача"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            required
            autoFocus
            autoComplete="username"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            autoComplete="email"
          />
          <TextField
            fullWidth
            label="Повне ім'я (необов'язково)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            margin="normal"
            autoComplete="name"
          />
          <TextField
            fullWidth
            label="Адреса (необов'язково)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            margin="normal"
            autoComplete="street-address"
            placeholder="Місце проживання"
          />
          <TextField
            fullWidth
            label="Пароль"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            autoComplete="new-password"
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
            helperText={`Мінімум ${MIN_PASSWORD_LENGTH} символів`}
          />
          <TextField
            fullWidth
            label="Підтвердження пароля"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            required
            autoComplete="new-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
            {loading ? 'Реєстрація...' : 'Зареєструватися'}
          </Button>
        </form>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2">
            Вже є акаунт?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/login')}
              sx={{ cursor: 'pointer' }}
            >
              Увійти
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;

