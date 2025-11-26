import React from 'react';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Chip,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  DirectionsCar,
  People,
  Assignment,
  Dashboard,
  Analytics,
  AdminPanelSettings,
  Logout,
  Search as SearchIcon,
  Description,
  Gavel,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';

const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_COLLAPSED = 72;

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onToggle }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    { label: 'Головна', path: isStaff ? '/dashboard' : '/', icon: Dashboard, show: true },
    { label: 'Автомобілі', path: '/cars', icon: DirectionsCar, show: true },
    { label: 'Клієнти', path: '/clients', icon: People, show: isAuthenticated && isStaff },
    { label: 'Прокати', path: '/rentals', icon: Assignment, show: isAuthenticated && isStaff },
    { label: 'Мої прокати', path: '/my-rentals', icon: Assignment, show: isAuthenticated && isUser },
    { label: 'Штрафи', path: '/penalties', icon: Gavel, show: isAuthenticated && isStaff },
    { label: 'Мої штрафи', path: '/my-penalties', icon: Gavel, show: isAuthenticated && isUser },
    { label: 'Звіти', path: '/reports', icon: Description, show: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager') },
    { label: 'Аналітика', path: '/analytics', icon: Analytics, show: isAuthenticated && (user?.role === 'admin' || user?.role === 'manager') },
    { label: 'Пошук', path: '/search', icon: SearchIcon, show: isAuthenticated && isStaff },
    { label: 'Адмін панель', path: '/admin', icon: AdminPanelSettings, show: isAuthenticated && user?.role === 'admin' },
  ];

  const filteredMenuItems = menuItems.filter(item => item.show);

  const MenuItemContent = ({ item }: { item: typeof menuItems[0] }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    
    const content = (
      <ListItemButton
        onClick={() => navigate(item.path)}
        sx={{
          minHeight: 48,
          justifyContent: open ? 'initial' : 'center',
          px: 2.5,
          py: 1.5,
          borderRadius: 2,
          mx: 1,
          mb: 0.5,
          backgroundColor: isActive 
            ? theme.palette.mode === 'dark' 
              ? 'rgba(144, 202, 249, 0.16)' 
              : 'rgba(25, 118, 210, 0.12)'
            : 'transparent',
          color: isActive 
            ? theme.palette.mode === 'dark' 
              ? '#90caf9' 
              : '#1976d2'
            : 'inherit',
          '&:hover': {
            backgroundColor: isActive
              ? theme.palette.mode === 'dark'
                ? 'rgba(144, 202, 249, 0.24)'
                : 'rgba(25, 118, 210, 0.2)'
              : theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.04)',
          },
          transition: 'all 0.2s ease',
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: open ? 3 : 'auto',
            justifyContent: 'center',
            color: 'inherit',
          }}
        >
          <Icon />
        </ListItemIcon>
        {open && (
          <ListItemText 
            primary={item.label} 
            primaryTypographyProps={{
              fontWeight: isActive ? 600 : 400,
              fontSize: '0.9375rem',
            }}
          />
        )}
      </ListItemButton>
    );

    if (!open) {
      return (
        <Tooltip title={item.label} placement="right" arrow>
          {content}
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? open : true}
      onClose={isMobile ? onToggle : undefined}
      sx={{
        width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          p: 2,
          minHeight: 64,
          cursor: 'pointer',
        }}
        onClick={!isMobile ? onToggle : undefined}
      >
        {open && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <DirectionsCar sx={{ fontSize: 28, color: 'primary.main' }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
              }}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/');
              }}
            >
              Car Rental
            </Typography>
          </Box>
        )}
        {!open && (
          <DirectionsCar 
            sx={{ 
              fontSize: 28, 
              color: 'primary.main',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.1)',
              },
            }} 
          />
        )}
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ px: 1, py: 2, flex: 1, overflow: 'auto' }}>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <MenuItemContent item={item} />
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Toggle Button at Bottom */}
      {!isMobile && (
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
          <IconButton
            onClick={onToggle}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
            size="small"
          >
            {open ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
        </Box>
      )}

      {/* User Section */}
      {isAuthenticated ? (
        <Box sx={{ p: 2 }}>
          {/* Theme Toggle */}
          <Tooltip title={open ? '' : 'Перемкнути тему'} placement="right" arrow>
            <Box
              component="button"
              onClick={toggleTheme}
              sx={{
                mb: 2,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: open ? 'flex-start' : 'center',
                px: open ? 2 : 1,
                py: 1.5,
                borderRadius: 2,
                border: 'none',
                backgroundColor: 'transparent',
                color: 'text.secondary',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              {open && (
                <Typography sx={{ ml: 2, fontSize: '0.9375rem' }}>
                  {mode === 'dark' ? 'Світла тема' : 'Темна тема'}
                </Typography>
              )}
            </Box>
          </Tooltip>

          {/* User Profile */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: open ? 'flex-start' : 'center',
              gap: open ? 2 : 0,
              p: 1.5,
              borderRadius: 2,
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.02)',
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'secondary.main',
                fontSize: '1rem',
                cursor: 'pointer',
                mx: open ? 0 : 'auto',
              }}
              onClick={() => navigate('/profile')}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            {open && (
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.fullName || user?.username}
                </Typography>
                <Chip
                  label={getRoleLabel(user?.role || '')}
                  color={getRoleColor(user?.role || '')}
                  size="small"
                  sx={{
                    mt: 0.5,
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}
                />
              </Box>
            )}
          </Box>

          {/* Logout Button */}
          <Tooltip title={open ? '' : 'Вийти'} placement="right" arrow>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                mt: 1,
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                py: 1.5,
                borderRadius: 2,
                color: 'error.main',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(211, 47, 47, 0.16)'
                    : 'rgba(211, 47, 47, 0.08)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  color: 'inherit',
                }}
              >
                <Logout />
              </ListItemIcon>
              {open && (
                <ListItemText 
                  primary="Вийти"
                  primaryTypographyProps={{
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </Box>
      ) : (
        <Box sx={{ p: 2 }}>
          {/* Theme Toggle for unauthenticated */}
          <Tooltip title={open ? '' : 'Перемкнути тему'} placement="right" arrow>
            <Box
              component="button"
              onClick={toggleTheme}
              sx={{
                mb: 2,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: open ? 'flex-start' : 'center',
                px: open ? 2 : 1,
                py: 1.5,
                borderRadius: 2,
                border: 'none',
                backgroundColor: 'transparent',
                color: 'text.secondary',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              {open && (
                <Typography sx={{ ml: 2, fontSize: '0.9375rem' }}>
                  {mode === 'dark' ? 'Світла тема' : 'Темна тема'}
                </Typography>
              )}
            </Box>
          </Tooltip>

          {/* Login/Register Buttons */}
          {open && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <ListItemButton
                onClick={() => navigate('/login')}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                  Увійти
                </Typography>
              </ListItemButton>
              <ListItemButton
                onClick={() => navigate('/register')}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <Typography sx={{ fontWeight: 500, fontSize: '0.9375rem' }}>
                  Реєстрація
                </Typography>
              </ListItemButton>
            </Box>
          )}
        </Box>
      )}
    </Drawer>
  );
};

export default Sidebar;

