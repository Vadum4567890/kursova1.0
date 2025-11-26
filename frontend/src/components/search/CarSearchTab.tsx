import React from 'react';
import { Box, Paper, TextField, Button } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { CarSearchParams, Car } from '../../interfaces';
import { CarSearchResults } from './CarSearchResults';

interface CarSearchTabProps {
  params: CarSearchParams;
  onParamsChange: (updates: Partial<CarSearchParams>) => void;
  onSearch: () => void;
  loading: boolean;
  results: Car[];
}

const CarSearchTab: React.FC<CarSearchTabProps> = ({
  params,
  onParamsChange,
  onSearch,
  loading,
  results,
}) => {
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
          onChange={(e) => onParamsChange({ type: (e.target.value as any) || undefined })}
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

      {results && results.length > 0 && <CarSearchResults cars={results} />}
    </Paper>
  );
};

export default CarSearchTab;

