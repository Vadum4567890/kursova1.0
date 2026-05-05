import React from 'react';
import { Box, Paper, TextField, Button, Typography, Pagination, CircularProgress, Alert } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { RentalSearchParams, Rental } from '../../interfaces';
import { RentalSearchResults } from './RentalSearchResults';
import { usePagedSlice } from '@/hooks/usePagedSlice';

const PAGE_SIZE = 12;

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
  const { page, setPage, resetToFirstPage, totalPages, pagedItems, shownFrom, shownTo } = usePagedSlice(
    results,
    PAGE_SIZE
  );

  const handleSearchClick = () => {
    resetToFirstPage();
    onSearch();
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Ім'я орендаря або марка авто"
          placeholder="Введіть ім'я або марку"
          value={params.searchQuery || ''}
          onChange={(e) => onParamsChange({ searchQuery: e.target.value || undefined })}
          sx={{ minWidth: 250 }}
        />
        <TextField
          select
          label="Статус"
          value={params.status || ''}
          onChange={(e) => onParamsChange({ status: (e.target.value as RentalSearchParams['status']) || undefined })}
          sx={{ minWidth: 150 }}
          SelectProps={{
            native: true,
          }}
        >
          <option value="">Всі</option>
          <option value="pending">Очікує</option>
          <option value="active">Активний</option>
          <option value="completed">Завершений</option>
          <option value="cancelled">Скасований</option>
        </TextField>
        <Button
          variant="contained"
          onClick={handleSearchClick}
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
        <Alert severity="info">За заданими умовами прокатів не знайдено.</Alert>
      ) : null}

      {!loading && results.length > 0 ? (
        <>
          <RentalSearchResults rentals={pagedItems} />
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
              Показано {shownFrom}–{shownTo} з {results.length}
            </Typography>
            {totalPages > 1 ? (
              <Pagination
                page={page}
                count={totalPages}
                color="primary"
                onChange={(_, p) => setPage(p)}
                showFirstButton
                showLastButton
              />
            ) : null}
          </Box>
        </>
      ) : null}
    </Paper>
  );
};

export default RentalSearchTab;
