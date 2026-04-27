import React from 'react';
import { Box, Paper, TextField, Button, CircularProgress } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
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
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Пошук орендаря"
          placeholder="Ім'я, телефон або адреса"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
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
