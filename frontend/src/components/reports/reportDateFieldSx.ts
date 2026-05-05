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
    bgcolor: 'rgba(255,255,255,0.98)',
    '& fieldset': {
      borderColor: 'rgba(15, 23, 42, 0.18)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(15, 23, 42, 0.38)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#1d4ed8',
      borderWidth: 2,
    },
  },
  '& .MuiOutlinedInput-input': inputDark,
  '& input': inputDark,
  '& .MuiInputLabel-root': {
    color: 'rgba(15, 23, 42, 0.72)',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#1d4ed8',
  },
  '& .MuiInputLabel-root.MuiInputLabel-shrink': {
    color: 'rgba(15, 23, 42, 0.82)',
    textShadow: 'none',
  },
  '& .MuiSvgIcon-root': {
    color: '#0f172a',
  },
};

/** Звичайний світлий контекст: лише гарантовано темний текст у полі дати. */
export const reportDateFieldPlainSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-input': inputDark,
  '& input': inputDark,
};
