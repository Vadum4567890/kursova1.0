import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { TrendingUp } from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAppTheme } from '../../context/ThemeContext';

interface RevenueChartProps {
  data: Array<{ date: string; Дохід: number }>;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const { theme } = useAppTheme();

  return (
    <Paper
      sx={{
        p: 3,
        height: '100%',
        borderRadius: 2,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Дохід за останні 7 днів
        </Typography>
      </Box>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0'}
            />
            <XAxis
              dataKey="date"
              stroke={theme.palette.mode === 'dark' ? '#b0b0b0' : '#666'}
              tick={{ fill: theme.palette.mode === 'dark' ? '#b0b0b0' : '#666' }}
            />
            <YAxis
              stroke={theme.palette.mode === 'dark' ? '#b0b0b0' : '#666'}
              tick={{ fill: theme.palette.mode === 'dark' ? '#b0b0b0' : '#666' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : 'rgba(255, 255, 255, 0.95)',
                border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #e0e0e0',
                borderRadius: '8px',
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
              }}
              itemStyle={{
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
              }}
              labelStyle={{
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
              }}
            />
            <Area
              type="monotone"
              dataKey="Дохід"
              stroke="#1976d2"
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography color="text.secondary">Немає даних для відображення</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default RevenueChart;

