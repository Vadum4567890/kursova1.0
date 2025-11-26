import React from 'react';
import { Box, Paper, TextField, Button } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { Client } from '../../interfaces';
import { ClientSearchResults } from './ClientSearchResults';

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
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Пошук клієнта"
          placeholder="Ім'я, телефон або адреса"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button
          variant="contained"
          onClick={onSearch}
          disabled={loading || !query.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
        >
          Шукати
        </Button>
      </Box>

      {results && results.length > 0 && <ClientSearchResults clients={results} />}
    </Paper>
  );
};

export default ClientSearchTab;

