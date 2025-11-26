import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { DirectionsCar } from '@mui/icons-material';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAppTheme } from '../../context/ThemeContext';

interface PopularCarsData {
  name: string;
  Прокатів: number;
  Дохід: number;
}

interface PopularCarsChartProps {
  data: PopularCarsData[];
}

const PopularCarsChart: React.FC<PopularCarsChartProps> = ({ data }) => {
  const { theme } = useAppTheme();

  if (data.length === 0) {
    return null;
  }

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0,0,0,0.4)'
            : '0 8px 32px rgba(0,0,0,0.08)',
        border: (theme) =>
          theme.palette.mode === 'dark'
            ? '1px solid rgba(255,255,255,0.05)'
            : '1px solid rgba(0,0,0,0.05)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 12px 40px rgba(0,0,0,0.5)'
              : '0 12px 40px rgba(0,0,0,0.12)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            mr: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DirectionsCar sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
          Популярні автомобілі
        </Typography>
      </Box>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0'}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            stroke={theme.palette.mode === 'dark' ? '#b0b0b0' : '#666'}
            interval={0}
            tick={{ fill: theme.palette.mode === 'dark' ? '#b0b0b0' : '#666', fontSize: 12 }}
            label={{
              value: 'Автомобіль',
              position: 'insideBottom',
              offset: -5,
              style: { fill: theme.palette.mode === 'dark' ? '#b0b0b0' : '#666' },
            }}
          />
          <YAxis
            yAxisId="left"
            stroke={theme.palette.mode === 'dark' ? '#b0b0b0' : '#666'}
            tick={{ fill: theme.palette.mode === 'dark' ? '#b0b0b0' : '#666' }}
            label={{
              value: 'Кількість прокатів',
              angle: -90,
              position: 'insideLeft',
              style: { fill: theme.palette.mode === 'dark' ? '#b0b0b0' : '#666' },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke={theme.palette.mode === 'dark' ? '#10b981' : '#059669'}
            tick={{ fill: theme.palette.mode === 'dark' ? '#10b981' : '#059669' }}
            label={{
              value: 'Дохід (₴)',
              angle: 90,
              position: 'insideRight',
              style: { fill: theme.palette.mode === 'dark' ? '#10b981' : '#059669' },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
              border:
                theme.palette.mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.2)'
                  : '1px solid #e0e0e0',
              borderRadius: '12px',
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 8px 24px rgba(0,0,0,0.5)'
                  : '0 8px 24px rgba(0,0,0,0.15)',
              padding: '12px 16px',
            }}
            itemStyle={{
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
              fontSize: '0.875rem',
            }}
            labelStyle={{
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
              fontWeight: 600,
              marginBottom: '8px',
            }}
            formatter={(value: any, name: string) => {
              if (name === 'Дохід') {
                return [`${value.toLocaleString('uk-UA')} ₴`, name];
              }
              return [value, name];
            }}
          />
          <Legend
            wrapperStyle={{
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
              paddingTop: '20px',
            }}
            iconType="circle"
          />
          <Bar
            yAxisId="left"
            dataKey="Прокатів"
            fill="url(#barGradient)"
            radius={[8, 8, 0, 0]}
            name="Прокатів"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="Дохід"
            stroke="url(#lineGradient)"
            strokeWidth={3}
            dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#ffffff' }}
            activeDot={{ r: 7, strokeWidth: 2 }}
            name="Дохід"
          />
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#667eea" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#764ba2" stopOpacity={0.9} />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
              <stop offset="100%" stopColor="#059669" stopOpacity={1} />
            </linearGradient>
          </defs>
        </ComposedChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default PopularCarsChart;

