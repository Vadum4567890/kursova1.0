import type { SxProps, Theme } from '@mui/material/styles';

const inputDark = {
  color: '#0f172a',
  WebkitTextFillColor: '#0f172a',
};

/**
 * TextField type="date" у блоці з темним градієнтом і `color: white` на батьку:
 * без цього значення дати «зливаються» з білим фоном поля.
 */
export const reportDateFieldOnGradientSx: SxProps<Theme> = {
  bgcolor: 'common.white',
  borderRadius: 2,
  minWidth: { xs: '100%', sm: 180 },
  '& .MuiOutlinedInput-root': {
    color: '#0f172a',
  },
  '& .MuiOutlinedInput-input': inputDark,
  '& input': inputDark,
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.95)',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#e0f2fe',
  },
  '& .MuiInputLabel-root.MuiInputLabel-shrink': {
    color: 'rgba(255, 255, 255, 0.95)',
    textShadow: '0 1px 4px rgba(15,23,42,0.85)',
  },
};

/** Звичайний світлий контекст: лише гарантовано темний текст у полі дати. */
export const reportDateFieldPlainSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-input': inputDark,
  '& input': inputDark,
};
