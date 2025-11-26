import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  gradient?: string;
  color?: 'primary' | 'error' | 'success' | 'warning' | 'default';
  variant?: 'h4' | 'h5';
  showGradient?: boolean;
}

/**
 * Універсальний компонент для відображення статистичних карток
 * Підтримує різні стилі: з gradient та іконкою, або з кольором
 */
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  gradient,
  color,
  variant = 'h4',
  showGradient = false,
}) => {
  // Визначаємо, чи використовувати gradient стиль
  const useGradient = showGradient || (gradient && icon);

  // Форматуємо значення
  const formattedValue =
    typeof value === 'number' ? value.toLocaleString() : value;

  // Якщо використовується gradient стиль
  if (useGradient) {
    return (
      <Card
        sx={{
          height: '100%',
          background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: 8,
          },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.1)',
            opacity: 0,
            transition: 'opacity 0.3s ease',
          },
          '&:hover::before': {
            opacity: 1,
          },
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontWeight: 500 }}>
                {title}
              </Typography>
              <Typography
                variant={variant}
                component="div"
                sx={{ fontWeight: 700, mb: variant === 'h4' ? 1 : 0 }}
              >
                {formattedValue}
              </Typography>
            </Box>
            {icon && <Box sx={{ opacity: 0.8 }}>{icon}</Box>}
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Стандартний стиль з кольором або без
  const colorProps = color && color !== 'default' ? { color: `${color}.main` as const } : {};

  return (
    <Card>
      <CardContent>
        <Typography color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant={variant} {...colorProps}>
          {formattedValue}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default StatCard;

