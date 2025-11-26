import React from 'react';
import { Card, CardContent, Box, Typography, Button } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';

interface ActionCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  onClick: () => void;
  buttonLabel: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  subtitle,
  icon,
  gradient,
  onClick,
  buttonLabel,
}) => {
  return (
    <Card
      sx={{
        background: gradient,
        color: 'white',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: 8,
        },
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {subtitle}
            </Typography>
          </Box>
          <Box sx={{ opacity: 0.8 }}>{icon}</Box>
        </Box>
        <Button
          variant="contained"
          fullWidth
          size="large"
          endIcon={<ArrowForward />}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
};

