import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  options?: Array<{ value: string; label: string }>;
}

const defaultOptions = [
  { value: 'all', label: 'Всі' },
  { value: 'active', label: 'Активні' },
  { value: 'completed', label: 'Завершені' },
  { value: 'cancelled', label: 'Скасовані' },
];

export const StatusFilter: React.FC<StatusFilterProps> = ({
  value,
  onChange,
  options = defaultOptions,
}) => {
  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel>Фільтр за статусом</InputLabel>
      <Select value={value} label="Фільтр за статусом" onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

