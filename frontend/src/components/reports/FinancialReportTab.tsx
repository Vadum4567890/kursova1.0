import React from 'react';
import { Box, Paper, Grid, Button, TextField, CircularProgress } from '@mui/material';
import { Description } from '@mui/icons-material';
import { StatCard } from '../common';
import FinancialReportDebug from './FinancialReportDebug';

interface FinancialReportTabProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onGenerate: () => void;
  loading: boolean;
  report: any;
}

const FinancialReportTab: React.FC<FinancialReportTabProps> = ({
  dateRange,
  onStartDateChange,
  onEndDateChange,
  onGenerate,
  loading,
  report,
}) => {
  const startDate = dateRange.startDate || undefined;
  const endDate = dateRange.endDate || undefined;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Дата початку"
            type="date"
            value={dateRange.startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Дата кінця"
            type="date"
            value={dateRange.endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="contained"
            onClick={onGenerate}
            disabled={loading || !startDate || !endDate}
            startIcon={loading ? <CircularProgress size={20} /> : <Description />}
          >
            Згенерувати звіт
          </Button>
        </Box>
      </Paper>

      {report && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Загальний дохід"
                value={`${(report?.totalRevenue ?? 0).toLocaleString()} ₴`}
                color="primary"
                variant="h5"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Штрафи"
                value={`${(report?.totalPenalties ?? 0).toLocaleString()} ₴`}
                color="error"
                variant="h5"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Депозити"
                value={`${(report?.totalDeposits ?? 0).toLocaleString()} ₴`}
                variant="h5"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Чистий дохід"
                value={`${(report?.netRevenue ?? 0).toLocaleString()} ₴`}
                color="success"
                variant="h5"
              />
            </Grid>
          </Grid>

          {report?.debug && <FinancialReportDebug report={report} />}
        </>
      )}
    </Box>
  );
};

export default FinancialReportTab;

