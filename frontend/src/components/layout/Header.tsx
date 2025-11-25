import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  DirectionsCar,
  People,
  Assignment,
  Dashboard,
  Analytics,
  AdminPanelSettings,
  Logout,
  Person,
  Search as SearchIcon,
  Description,
  Gavel,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Адмін';
      case 'manager':
        return 'Менеджер';
      case 'employee':
        return 'Співробітник';
      case 'user':
        return 'Користувач';
      default:
        return 'Користувач';
    }
  };

  const isStaff = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'employee';
  const isUser = user?.role === 'user';

  const menuItems = [
    { label: 'Головна', path: '/', icon: <Dashboard />, show: true },
    { label: 'Автомобілі', path: '/cars', icon: <DirectionsCar />, show: true },
    { label: 'Клієнти', path: '/clients', icon: <People />, show: isAuthenticated && isStaff },
    { label: 'Прокати', path: '/rentals', icon: <Assignment />, show: isAuthenticated && isStaff },
    { label: 'Мої прокати', path: '/my-rentals', icon: <Assignment />, show: isAuthenticated && isUser },
    { label: 'Штрафи', path: '/penalties', icon: <Gavel />, show: isAuthenticated && isStaff },
    { label: 'Мої штрафи', path: '/my-penalties', icon: <Gavel />, show: isAuthenticated && isUser },
    { label: 'Звіти', path: '/reports', icon: <Description />, show: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager') },
    { label: 'Аналітика', path: '/analytics', icon: <Analytics />, show: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager') },
    { label: 'Пошук', path: '/search', icon: <SearchIcon />, show: isAuthenticated && isStaff },
    { label: 'Адмін панель', path: '/admin', icon: <AdminPanelSettings />, show: isAuthenticated && user?.role === 'admin' },
  ];

  const filteredMenuItems = menuItems.filter(item => item.show);

  const NavigationMenu = () => (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
      {filteredMenuItems
        .filter(item => item.path !== '/' || !isAuthenticated) // Hide home for authenticated users
        .map((item) => (
        <Button
          key={item.path}
          color="inherit"
          startIcon={item.icon}
          onClick={() => {
            navigate(item.path);
            setMobileMenuOpen(false);
          }}
          size="small"
          sx={{
            backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
            borderRadius: 2,
            px: 1.5,
            py: 0.75,
            fontSize: '0.875rem',
            fontWeight: location.pathname === item.path ? 600 : 400,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
            },
            transition: 'all 0.2s',
          }}
        >
          {item.label}
        </Button>
      ))}
    </Box>
  );

  return (
    <AppBar position="sticky" elevation={2} sx={{ 
      backgroundColor: '#1976d2',
      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
    }}>
      <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
        <DirectionsCar sx={{ mr: 2, fontSize: 28 }} />
        <Typography
          variant="h6"
          component="div"
          sx={{ 
            flexGrow: 0, 
            mr: { xs: 2, md: 4 }, 
            cursor: 'pointer', 
            fontWeight: 700,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
          onClick={() => navigate('/')}
        >
          Car Rental
        </Typography>

        {isAuthenticated && !isMobile && (
          <Box sx={{ display: 'flex', gap: 0.5, ml: 2, flexWrap: 'wrap' }}>
            <NavigationMenu />
          </Box>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {isAuthenticated ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 1 }}>
              <Chip
                label={getRoleLabel(user?.role || '')}
                color={getRoleColor(user?.role || '')}
                size="small"
                sx={{ 
                  fontWeight: 600,
                  height: 28,
                  '& .MuiChip-label': {
                    px: 1.5,
                    fontSize: '0.75rem'
                  }
                }}
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  display: { xs: 'none', md: 'block' },
                  fontWeight: 500,
                  maxWidth: 150,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {user?.fullName || user?.username}
              </Typography>
            </Box>
            <IconButton 
              onClick={handleMenuOpen} 
              sx={{ 
                p: 0.5,
                border: '2px solid rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                }
              }}
            >
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main', fontSize: '1rem' }}>
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                <ListItemIcon>
                  <Person fontSize="small" />
                </ListItemIcon>
                Мій профіль
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Вийти
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Увійти
            </Button>
            <Button
              color="inherit"
              variant="outlined"
              sx={{ borderColor: 'white', color: 'white' }}
              onClick={() => navigate('/register')}
            >
              Реєстрація
            </Button>
          </Box>
        )}

        {isAuthenticated && isMobile && (
          <IconButton
            color="inherit"
            onClick={() => setMobileMenuOpen(true)}
            sx={{ ml: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <Box sx={{ width: 250, pt: 2 }}>
          <List>
            {filteredMenuItems.map((item) => (
              <ListItem
                key={item.path}
                button
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Вийти" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Header;

