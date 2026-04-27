import React from 'react';
import { Box } from '@mui/material';

interface UnreadCountBadgeProps {
  count: number;
}

/** Білий текст на червоному круглому (або капсулі для довгих чисел) фоні. */
const UnreadCountBadge: React.FC<UnreadCountBadgeProps> = ({ count }) => {
  if (count <= 0) return null;
  const label = count > 99 ? '99+' : String(count);
  return (
    <Box
      component="span"
      sx={{
        minWidth: 22,
        height: 22,
        px: label.length > 1 ? 0.65 : 0,
        borderRadius: 999,
        bgcolor: 'error.main',
        color: 'common.white',
        fontSize: '0.75rem',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {label}
    </Box>
  );
};

export default UnreadCountBadge;
