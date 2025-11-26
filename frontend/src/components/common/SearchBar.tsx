import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { Search } from '@mui/icons-material';

interface SearchBarProps extends Omit<TextFieldProps, 'InputProps' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Пошук...',
  ...props 
}) => {
  return (
    <TextField
      fullWidth
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputProps={{
        startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
      }}
      {...props}
    />
  );
};

export default SearchBar;

