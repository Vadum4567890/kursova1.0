import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { penaltyService, Penalty } from '../../services/penaltyService';

const MyPenaltiesPage: React.FC = () => {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPenalties();
  }, []);

  const loadPenalties = async () => {
    try {
      setLoading(true);
      const data = await penaltyService.getAllPenalties();
      setPenalties(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка завантаження штрафів');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Мої штрафи
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Прокат</TableCell>
                <TableCell>Сума</TableCell>
                <TableCell>Причина</TableCell>
                <TableCell>Дата</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {penalties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>
                      У вас немає штрафів
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                penalties.map((penalty) => (
                  <TableRow key={penalty.id} hover>
                    <TableCell>{penalty.id}</TableCell>
                    <TableCell>
                      Прокат #{penalty.rental?.id || 'Невідомо'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="error" fontWeight={600}>
                        {penalty.amount.toLocaleString()} ₴
                      </Typography>
                    </TableCell>
                    <TableCell>{penalty.reason}</TableCell>
                    <TableCell>
                      {new Date(penalty.date).toLocaleDateString('uk-UA')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default MyPenaltiesPage;

