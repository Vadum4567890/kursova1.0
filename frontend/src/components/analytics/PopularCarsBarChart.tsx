import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { DirectionsCar } from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAppTheme } from '../../context/ThemeContext';

interface PopularCarsBarChartProps {
  data: Array<{ name: string; Кількість: number; Дохід: number }>;
}

const PopularCarsBarChart: React.FC<PopularCarsBarChartProps> = ({ data }) => {
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
        <DirectionsCar sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Популярні автомобілі
        </Typography>
      </Box>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0'}
            />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              stroke={theme.palette.mode === 'dark' ? '#b0b0b0' : '#666'}
              interval={0}
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
            <Legend
              wrapperStyle={{
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
              }}
            />
            <Bar dataKey="Кількість" fill="#1976d2" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Дохід" fill="#2e7d32" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
          <Typography color="text.secondary">Немає даних</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default PopularCarsBarChart;

