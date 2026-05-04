import React from 'react';
import { Box, Paper, TextField, Button, Typography, Pagination, CircularProgress, Alert } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { CarSearchParams, Car } from '../../interfaces';
import { CarSearchResults } from './CarSearchResults';

interface CarSearchTabProps {
  params: CarSearchParams;
  onParamsChange: (updates: Partial<CarSearchParams>) => void;
  onSearch: () => void;
  loading: boolean;
  results: Car[];
  totalCount: number;
  page: number;
  totalPages: number;
  onPageChange: (_event: React.ChangeEvent<unknown>, page: number) => void;
}

const CarSearchTab: React.FC<CarSearchTabProps> = ({
  params,
  onParamsChange,
  onSearch,
  loading,
  results,
  totalCount,
  page,
  totalPages,
  onPageChange,
}) => {
  const limit = params.limit ?? 12;
  const shownFrom = totalCount === 0 || results.length === 0 ? 0 : (page - 1) * limit + 1;
  const shownTo =
    totalCount === 0 || results.length === 0 ? 0 : Math.min(totalCount, (page - 1) * limit + results.length);

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Марка"
          value={params.brand || ''}
          onChange={(e) => onParamsChange({ brand: e.target.value || undefined })}
        />
        <TextField
          label="Модель"
          value={params.model || ''}
          onChange={(e) => onParamsChange({ model: e.target.value || undefined })}
        />
        <TextField
          select
          label="Тип"
          value={params.type || ''}
          onChange={(e) => onParamsChange({ type: (e.target.value as CarSearchParams['type']) || undefined })}
          sx={{ minWidth: 120 }}
          SelectProps={{
            native: true,
          }}
        >
          <option value="">Всі</option>
          <option value="economy">Економ</option>
          <option value="business">Бізнес</option>
          <option value="premium">Преміум</option>
        </TextField>
        <TextField
          label="Мін. ціна"
          type="number"
          value={params.minPrice || ''}
          onChange={(e) =>
            onParamsChange({ minPrice: e.target.value ? parseFloat(e.target.value) : undefined })
          }
        />
        <TextField
          label="Макс. ціна"
          type="number"
          value={params.maxPrice || ''}
          onChange={(e) =>
            onParamsChange({ maxPrice: e.target.value ? parseFloat(e.target.value) : undefined })
          }
        />
        <Button
          variant="contained"
          onClick={onSearch}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
        >
          Шукати
        </Button>
      </Box>

      {loading && results.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {!loading && results.length === 0 ? (
        <Alert severity="info">За заданими умовами авто не знайдено.</Alert>
      ) : null}

      {results.length > 0 ? <CarSearchResults cars={results} /> : null}

      {!loading && totalCount > 0 ? (
        <Box
          sx={{
            mt: 3,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Показано {shownFrom}–{shownTo} з {totalCount} авто
          </Typography>
          {totalPages > 1 ? (
            <Pagination
              page={page}
              count={totalPages}
              color="primary"
              onChange={onPageChange}
              showFirstButton
              showLastButton
            />
          ) : null}
        </Box>
      ) : null}
    </Paper>
  );
};

export default CarSearchTab;
