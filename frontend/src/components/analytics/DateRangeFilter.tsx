import React from 'react';
import { Box, TextField, Button } from '@mui/material';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  loading?: boolean;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onReset,
  hasActiveFilters,
  loading = false,
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <TextField
        label="Дата початку"
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        size="small"
      />
      <TextField
        label="Дата кінця"
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        size="small"
      />
      <Button variant="contained" onClick={onApply} disabled={loading}>
        Застосувати фільтр
      </Button>
      {hasActiveFilters && (
        <Button variant="outlined" onClick={onReset} disabled={loading}>
          Скинути
        </Button>
      )}
    </Box>
  );
};

export default DateRangeFilter;

