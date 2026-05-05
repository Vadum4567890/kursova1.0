import { keyframes } from '@mui/system';

/** Спільна анімація для іконки успіху в snackbar (Cars / My rentals тощо). */
export const popIn = keyframes`
  0% {
    transform: scale(0.85);
    opacity: 0;
  }
  60% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
  }
`;
