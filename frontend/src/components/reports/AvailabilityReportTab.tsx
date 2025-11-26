import React from 'react';
import { formatDate } from '../../utils/dateHelpers';
import { Box, Paper, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Description } from '@mui/icons-material';
import { StatusChip } from '../common';

interface AvailabilityReportTabProps {
  onGenerate: () => void;
  loading: boolean;
  report: any;
}

const AvailabilityReportTab: React.FC<AvailabilityReportTabProps> = ({ onGenerate, loading, report }) => {
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Button
          variant="contained"
          onClick={onGenerate}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Description />}
        >
          Згенерувати звіт
        </Button>
      </Paper>

      {report && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Автомобіль</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Дата доступності</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(report?.cars || []).map((car: any) => (
                <TableRow key={car.id}>
                  <TableCell>
                    {car.brand} {car.model}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={car.status} />
                  </TableCell>
                  <TableCell>
                    {car.nextAvailableDate
                      ? formatDate(car.nextAvailableDate)
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AvailabilityReportTab;

