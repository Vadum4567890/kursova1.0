import { SxProps, Theme } from '@mui/material/styles';

export const commonStyles = {
  pageContainer: {
    mt: 4,
    mb: 4,
  } as SxProps<Theme>,

  pageTitle: {
    mb: 3,
  } as SxProps<Theme>,

  card: {
    borderRadius: 2,
    boxShadow: 2,
    p: 3,
  } as SxProps<Theme>,

  buttonPrimary: {
    textTransform: 'none',
    borderRadius: 2,
    fontWeight: 600,
    px: 3,
  } as SxProps<Theme>,

  tableContainer: {
    mt: 2,
  } as SxProps<Theme>,

  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  } as SxProps<Theme>,

  errorAlert: {
    mb: 2,
  } as SxProps<Theme>,

  emptyState: {
    textAlign: 'center',
    py: 4,
    color: 'text.secondary',
  } as SxProps<Theme>,
};

