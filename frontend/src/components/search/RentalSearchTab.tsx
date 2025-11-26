import React from 'react';
import { Box, Paper, TextField, Button } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { RentalSearchParams, Rental } from '../../interfaces';
import { RentalSearchResults } from './RentalSearchResults';

interface RentalSearchTabProps {
  params: RentalSearchParams;
  onParamsChange: (updates: Partial<RentalSearchParams>) => void;
  onSearch: () => void;
  loading: boolean;
  results: Rental[];
}

const RentalSearchTab: React.FC<RentalSearchTabProps> = ({
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
          label="ID клієнта"
          type="number"
          value={params.clientId || ''}
          onChange={(e) =>
            onParamsChange({ clientId: e.target.value ? parseInt(e.target.value) : undefined })
          }
        />
        <TextField
          label="ID автомобіля"
          type="number"
          value={params.carId || ''}
          onChange={(e) =>
            onParamsChange({ carId: e.target.value ? parseInt(e.target.value) : undefined })
          }
        />
        <TextField
          select
          label="Статус"
          value={params.status || ''}
          onChange={(e) => onParamsChange({ status: (e.target.value as any) || undefined })}
          sx={{ minWidth: 150 }}
          SelectProps={{
            native: true,
          }}
        >
          <option value="">Всі</option>
          <option value="active">Активний</option>
          <option value="completed">Завершений</option>
          <option value="cancelled">Скасований</option>
        </TextField>
        <Button
          variant="contained"
          onClick={onSearch}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
        >
          Шукати
        </Button>
      </Box>

      {results && results.length > 0 && <RentalSearchResults rentals={results} />}
    </Paper>
  );
};

export default RentalSearchTab;

