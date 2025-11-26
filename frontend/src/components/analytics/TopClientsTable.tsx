import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { People } from '@mui/icons-material';
import { useAppTheme } from '../../context/ThemeContext';
import { TopClient } from '../../interfaces';

interface TopClientsTableProps {
  clients: TopClient[];
}

const TopClientsTable: React.FC<TopClientsTableProps> = ({ clients }) => {
  const { theme } = useAppTheme();

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <People sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Топ клієнти
        </Typography>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor:
                  theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.100',
              }}
            >
              <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Клієнт</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Всього отримано
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Вартість
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Штрафи
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Залог
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Повернути
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Чистий дохід
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    Немає даних
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((item: TopClient, index: number) => (
                <TableRow
                  key={item.client.id}
                  hover
                  sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {index + 1}. {item.client.fullName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.rentalCount} прокат
                        {item.rentalCount > 1 ? 'ів' : item.rentalCount === 1 ? '' : 'ів'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {item.totalReceived.toLocaleString()} ₴
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{item.totalCost.toLocaleString()} ₴</Typography>
                  </TableCell>
                  <TableCell align="right">
                    {item.totalPenalties > 0 ? (
                      <Chip
                        label={`${item.totalPenalties.toLocaleString()} ₴`}
                        color="error"
                        size="small"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        0 ₴
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${item.totalDeposits.toLocaleString()} ₴`}
                      sx={{
                        backgroundColor: '#ff9800',
                        color: 'white',
                        '& .MuiChip-label': {
                          color: 'white',
                        },
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {item.totalToReturn > 0 ? (
                      <Chip
                        label={`${item.totalToReturn.toLocaleString()} ₴`}
                        sx={{
                          backgroundColor: '#0288d1',
                          color: 'white',
                          '& .MuiChip-label': {
                            color: 'white',
                          },
                        }}
                        size="small"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        0 ₴
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${item.netRevenue.toLocaleString()} ₴`}
                      color={item.netRevenue >= 0 ? 'success' : 'error'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      Чистий прибуток
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TopClientsTable;

