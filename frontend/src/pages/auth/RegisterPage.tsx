import React, { useMemo, useRef, useState } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  Card,
  CardActionArea,
  CardContent,
  useTheme,
} from '@mui/material';
import { Visibility, VisibilityOff, PersonAdd, DirectionsCar, DriveEta } from '@mui/icons-material';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_VALIDATION_MESSAGE,
  normalizePhoneInput,
  validateAddress,
  validateFullName,
  validatePhone,
} from '../../constants/validation';

type RoleChoice = 'renter' | 'owner';

const steps = ['Тип акаунту', 'Дані для входу', 'Профіль'];

const RegisterPage: React.FC = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const roleFromQuery = searchParams.get('role');

  const initialRole = useMemo((): RoleChoice | null => {
    if (roleFromQuery === 'owner' || roleFromQuery === 'renter') return roleFromQuery;
    return null;
  }, [roleFromQuery]);

  const [activeStep, setActiveStep] = useState(() => (initialRole ? 1 : 0));
  const [role, setRole] = useState<RoleChoice | null>(initialRole);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [profileErrors, setProfileErrors] = useState({
    fullName: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const submitLock = useRef(false);

  const handleNextFromRole = () => {
    if (!role) {
      setError('Оберіть тип акаунту');
      return;
    }
    setError('');
    setActiveStep(1);
  };

  const handleNextFromCredentials = () => {
    setError('');
    if (password !== confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(PASSWORD_VALIDATION_MESSAGE);
      return;
    }
    setActiveStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    if (submitLock.current) return;
    setError('');
    const nextProfileErrors = {
      fullName: validateFullName(fullName),
      phone: validatePhone(phone),
      address: validateAddress(address),
    };
    setProfileErrors(nextProfileErrors);
    if (Object.values(nextProfileErrors).some(Boolean)) {
      setError('Перевірте контактні дані перед завершенням реєстрації');
      return;
    }

    const normalizedFullName = fullName.trim().replace(/\s+/g, ' ');
    const normalizedPhone = normalizePhoneInput(phone);
    const normalizedAddress = address.trim().replace(/\s+/g, ' ');
    submitLock.current = true;
    setLoading(true);

    try {
      await register({
        username,
        email,
        password,
        role,
        fullName: normalizedFullName,
        address: normalizedAddress,
        phone: normalizedPhone,
      });
      navigate(role === 'owner' ? '/my-cars' : '/home');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; error?: string } } };
      const apiMsg = ax.response?.data?.message ?? ax.response?.data?.error;
      setError(apiMsg || 'Помилка реєстрації. Спробуйте ще раз.');
      submitLock.current = false;
    } finally {
      setLoading(false);
    }
  };

  const stepperIndex = activeStep;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <PersonAdd sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Реєстрація
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Орендар або орендодавець — крок за кроком
          </Typography>
        </Box>

        <Stepper activeStep={stepperIndex} sx={{ mb: 3, display: { xs: 'none', sm: 'flex' } }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom align="center">
              Хто ви?
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 2 }}>
              <Card
                variant="outlined"
                sx={{
                  flex: 1,
                  borderColor: role === 'renter' ? 'primary.main' : 'divider',
                  borderWidth: role === 'renter' ? 2 : 1,
                }}
              >
                <CardActionArea onClick={() => { setRole('renter'); setError(''); }}>
                  <CardContent>
                    <DriveEta color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">Орендар</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Шукаю авто для поїздок і бронювань
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
              <Card
                variant="outlined"
                sx={{
                  flex: 1,
                  borderColor: role === 'owner' ? 'primary.main' : 'divider',
                  borderWidth: role === 'owner' ? 2 : 1,
                }}
              >
                <CardActionArea onClick={() => { setRole('owner'); setError(''); }}>
                  <CardContent>
                    <DirectionsCar color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">Орендодавець</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Хочу здавати в оренду свої автомобілі
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              onClick={handleNextFromRole}
            >
              Далі
            </Button>
          </Box>
        )}

        {role != null && activeStep === 1 && (
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleNextFromCredentials(); }}>
            <TextField
              fullWidth
              label="Ім'я користувача"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
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
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
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
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
              {!initialRole && (
                <Button onClick={() => { setActiveStep(0); setError(''); }} fullWidth variant="outlined">
                  Назад
                </Button>
              )}
              <Button type="submit" fullWidth variant="contained" size="large">
                Далі
              </Button>
            </Box>
          </Box>
        )}

        {role != null && activeStep === 2 && (
          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Контактні дані допоможуть оформити прокат. Поля можна змінити пізніше в профілі.
            </Typography>
            <TextField
              fullWidth
              label="Повне ім'я"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (profileErrors.fullName) {
                  setProfileErrors((prev) => ({ ...prev, fullName: validateFullName(e.target.value) }));
                }
              }}
              onBlur={() => setProfileErrors((prev) => ({ ...prev, fullName: validateFullName(fullName) }))}
              margin="normal"
              required
              autoComplete="name"
              error={Boolean(profileErrors.fullName)}
              helperText={profileErrors.fullName || 'Наприклад: Іван Петренко'}
            />
            <TextField
              fullWidth
              label="Телефон"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (profileErrors.phone) {
                  setProfileErrors((prev) => ({ ...prev, phone: validatePhone(e.target.value) }));
                }
              }}
              onBlur={() => {
                const normalized = normalizePhoneInput(phone);
                setPhone(normalized);
                setProfileErrors((prev) => ({ ...prev, phone: validatePhone(normalized) }));
              }}
              margin="normal"
              required
              autoComplete="tel"
              placeholder="+380..."
              error={Boolean(profileErrors.phone)}
              helperText={profileErrors.phone || 'Формат: +380671234567 або 0671234567'}
            />
            <TextField
              fullWidth
              label="Адреса"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (profileErrors.address) {
                  setProfileErrors((prev) => ({ ...prev, address: validateAddress(e.target.value) }));
                }
              }}
              onBlur={() => setProfileErrors((prev) => ({ ...prev, address: validateAddress(address) }))}
              margin="normal"
              required
              autoComplete="street-address"
              error={Boolean(profileErrors.address)}
              helperText={profileErrors.address || 'Місто, вулиця, будинок/квартира'}
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
              <Button
                type="button"
                onClick={() => { setActiveStep(1); setError(''); }}
                fullWidth
                variant="outlined"
                disabled={loading}
              >
                Назад
              </Button>
              <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}>
                {loading ? 'Реєстрація...' : 'Завершити реєстрацію'}
              </Button>
            </Box>
          </Box>
        )}

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2">
            Вже є акаунт?{' '}
            <Link component={RouterLink} to="/login" variant="body2">
              Увійти
            </Link>
          </Typography>
        </Box>

        <Box sx={{ 
          mt: 2, 
          p: 2, 
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.100',
          borderRadius: 1,
        }}>
          <Typography variant="caption" color="text.secondary">
            Натискаючи «Завершити реєстрацію», ви погоджуєтесь з обробкою персональних даних у межах сервісу.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;
