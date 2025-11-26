import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { SearchBar } from '../common';
import { CarFilters } from '../../interfaces';

interface CarFiltersBarProps {
  filters: CarFilters;
  searchTerm: string;
  onFiltersChange: (filters: CarFilters) => void;
  onSearchChange: (value: string) => void;
}

export const CarFiltersBar: React.FC<CarFiltersBarProps> = ({
  filters,
  searchTerm,
  onFiltersChange,
  onSearchChange,
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'nowrap' }}>
      <SearchBar
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Пошук за маркою або моделлю..."
        sx={{ flexGrow: 1, minWidth: 200 }}
      />
      <FormControl sx={{ minWidth: 150, flexShrink: 0 }}>
        <InputLabel>Тип</InputLabel>
        <Select
          value={filters.type || ''}
          label="Тип"
          onChange={(e) => onFiltersChange({ ...filters, type: e.target.value || undefined })}
        >
          <MenuItem value="">Всі</MenuItem>
          <MenuItem value="economy">Економ</MenuItem>
          <MenuItem value="business">Бізнес</MenuItem>
          <MenuItem value="premium">Преміум</MenuItem>
        </Select>
      </FormControl>
      <FormControl sx={{ minWidth: 150, flexShrink: 0 }}>
        <InputLabel>Статус</InputLabel>
        <Select
          value={filters.status || ''}
          label="Статус"
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value || undefined })}
        >
          <MenuItem value="">Всі</MenuItem>
          <MenuItem value="available">Доступні</MenuItem>
          <MenuItem value="rented">В прокаті</MenuItem>
          <MenuItem value="maintenance">На обслуговуванні</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

