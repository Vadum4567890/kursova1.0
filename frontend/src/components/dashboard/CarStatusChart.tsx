import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { DirectionsCar } from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAppTheme } from '../../context/ThemeContext';

interface CarStatusData {
  name: string;
  value: number;
  color: string;
}

interface CarStatusChartProps {
  data: CarStatusData[];
}

const CarStatusChart: React.FC<CarStatusChartProps> = ({ data }) => {
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
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            mr: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DirectionsCar sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
          Статуси автомобілів
        </Typography>
      </Box>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              dataKey="value"
              label={({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text
                    x={x}
                    y={y}
                    fill={theme.palette.mode === 'dark' ? '#ffffff' : '#000000'}
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    style={{ fontSize: '14px', fontWeight: 500 }}
                  >
                    {`${name}: ${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
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
              formatter={(value: any, name: any) => {
                const entry = data.find((d) => d.name === name);
                return [value, entry?.name || name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography color="text.secondary">Немає даних</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default CarStatusChart;

