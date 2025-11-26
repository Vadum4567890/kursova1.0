import React from 'react';
import { Box, Paper, Grid, Button, CircularProgress } from '@mui/material';
import { Description } from '@mui/icons-material';
import { StatCard } from '../common';

interface OccupancyReportTabProps {
  onGenerate: () => void;
  loading: boolean;
  report: any;
}

const OccupancyReportTab: React.FC<OccupancyReportTabProps> = ({ onGenerate, loading, report }) => {
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
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Загальна зайнятість"
              value={`${(report?.occupancyRate ?? 0).toFixed(1)}%`}
              variant="h5"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Доступні"
              value={report?.availableCars ?? 0}
              color="success"
              variant="h5"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              title="В прокаті"
              value={report?.rentedCars ?? 0}
              color="warning"
              variant="h5"
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default OccupancyReportTab;

