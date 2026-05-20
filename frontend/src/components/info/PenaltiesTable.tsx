import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Box,
  Typography,
  Chip,
  InputAdornment,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';

interface PenaltyItem {
  violation: string;
  description: string;
  amount: string;
  category: 'документи' | 'кузов' | 'шини' | 'серйозне' | 'інше';
}

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  '& .MuiTableCell-head': {
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.06)',
    fontWeight: 600,
    color: theme.palette.text.primary,
    borderBottom: `2px solid ${theme.palette.divider}`,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.02)',
  },
  '&:last-child td': {
    borderBottom: 0,
  },
}));

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'документи':
      return 'info';
    case 'кузов':
      return 'warning';
    case 'шини':
      return 'secondary';
    case 'серйозне':
      return 'error';
    default:
      return 'default';
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'документи':
      return 'Документи';
    case 'кузов':
      return 'Кузов';
    case 'шини':
      return 'Шини';
    case 'серйозне':
      return 'Серйозне';
    default:
      return 'Інше';
  }
};

interface PenaltiesTableProps {
  penalties: PenaltyItem[];
  title?: string;
}

export const PenaltiesTable: React.FC<PenaltiesTableProps> = ({
  penalties,
  title = 'Таблиця штрафів та компенсацій',
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPenalties = penalties.filter(
    (penalty) =>
      penalty.violation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      penalty.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      {title && (
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          {title}
        </Typography>
      )}

      <TextField
        fullWidth
        placeholder="Пошук штрафів..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
        size="small"
      />

      <StyledTableContainer>
        <Table>
          <StyledTableHead>
            <TableRow>
              <TableCell width="25%">Порушення</TableCell>
              <TableCell width="40%">Опис</TableCell>
              <TableCell width="20%">Розмір штрафу</TableCell>
              <TableCell width="15%">Категорія</TableCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {filteredPenalties.length > 0 ? (
              filteredPenalties.map((penalty, index) => (
                <StyledTableRow key={index}>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {penalty.violation}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                    {penalty.description}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'error.main' }}>
                    {penalty.amount}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getCategoryLabel(penalty.category)}
                      size="small"
                      color={getCategoryColor(penalty.category) as any}
                      variant="outlined"
                    />
                  </TableCell>
                </StyledTableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    Штрафи не знайдені
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>

      <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
        Всього штрафів: {filteredPenalties.length} з {penalties.length}
      </Typography>
    </Box>
  );
};
