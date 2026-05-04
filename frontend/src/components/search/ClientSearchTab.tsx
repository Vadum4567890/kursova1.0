import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, TextField, Button, CircularProgress, Alert, Typography, Pagination } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { Client } from '../../interfaces';
import { ClientSearchResults } from './ClientSearchResults';

const PAGE_SIZE = 12;

interface ClientSearchTabProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  loading: boolean;
  results: Client[];
}

const ClientSearchTab: React.FC<ClientSearchTabProps> = ({
  query,
  onQueryChange,
  onSearch,
  loading,
  results,
}) => {
  const [page, setPage] = useState(1);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
    setPage((p) => Math.min(p, maxPage));
  }, [results.length]);

  const handleSearchClick = () => {
    setPage(1);
    onSearch();
  };

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));

  const pagedResults = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return results.slice(start, start + PAGE_SIZE);
  }, [results, page]);

  const shownFrom = results.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const shownTo = results.length === 0 ? 0 : Math.min(results.length, page * PAGE_SIZE);

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Пошук клієнта"
          placeholder="Ім'я, телефон, адреса або email (орендар / орендодавець)"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSearchClick();
          }}
        />
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
        <Alert severity="info">
          Клієнтів не знайдено. Спробуйте інший запит або переконайтесь, що в системі є користувачі з ролями орендар /
          орендодавець.
        </Alert>
      ) : null}

      {!loading && results.length > 0 ? (
        <>
          <ClientSearchResults clients={pagedResults} />
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

export default ClientSearchTab;
