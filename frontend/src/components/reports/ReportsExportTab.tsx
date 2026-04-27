import React from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Download, GridView, PictureAsPdf, TableChart } from '@mui/icons-material';
import { reportDateFieldOnGradientSx } from './reportDateFieldSx';

interface ReportsExportTabProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onDownloadFinancial: (format: 'xlsx' | 'pdf') => Promise<void>;
  onDownloadOccupancy: (format: 'xlsx' | 'pdf') => Promise<void>;
  onDownloadCars: (format: 'xlsx' | 'pdf') => Promise<void>;
}

interface ExportCardProps {
  title: string;
  subtitle: string;
  note: string;
  accent: string;
  onExcel: () => void;
  onPdf: () => void;
}

const ExportCard: React.FC<ExportCardProps> = ({ title, subtitle, note, accent, onExcel, onPdf }) => (
  <Paper
    sx={{
      p: 3,
      borderRadius: 3,
      height: '100%',
      border: `1px solid ${accent}`,
      background: `linear-gradient(180deg, ${accent}12 0%, rgba(255,255,255,1) 55%)`,
    }}
  >
    <Chip
      size="small"
      label="Ready for demo"
      sx={{
        mb: 2,
        bgcolor: accent,
        color: '#fff',
        fontWeight: 700,
      }}
    />
    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      {subtitle}
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2.5 }}>
      {note}
    </Typography>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <Button variant="contained" startIcon={<TableChart />} onClick={onExcel} sx={{ flex: 1 }}>
        Excel
      </Button>
      <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={onPdf} sx={{ flex: 1 }}>
        PDF
      </Button>
    </Stack>
  </Paper>
);

const ReportsExportTab: React.FC<ReportsExportTabProps> = ({
  dateRange,
  onStartDateChange,
  onEndDateChange,
  onDownloadFinancial,
  onDownloadOccupancy,
  onDownloadCars,
}) => {
  const hasDateRange = Boolean(dateRange.startDate && dateRange.endDate);

  return (
    <Box>
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background:
            'linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(22,78,99,0.94) 52%, rgba(14,116,144,0.88) 100%)',
          color: 'common.white',
        }}
      >
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={3}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', lg: 'center' }}
        >
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.85 }}>
              Reporting center
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Експорт звітів для захисту та демо
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 700 }}>
              Експортуй фінансові, fleet- та occupancy-звіти в Excel або PDF з branded оформленням,
              таблицями, підписами та footer для презентації.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', lg: 'auto' } }}>
            <TextField
              label="Дата початку"
              type="date"
              value={dateRange.startDate}
              onChange={(event) => onStartDateChange(event.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={reportDateFieldOnGradientSx}
            />
            <TextField
              label="Дата кінця"
              type="date"
              value={dateRange.endDate}
              onChange={(event) => onEndDateChange(event.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={reportDateFieldOnGradientSx}
            />
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <ExportCard
            title="Фінансовий звіт"
            subtitle="Дохід, штрафи, депозити, транзакції та підсумки за вибраний період."
            note="Підходить для керівництва, фінансового аналізу та показу на захисті."
            accent="#1d4ed8"
            onExcel={() => void onDownloadFinancial('xlsx')}
            onPdf={() => void onDownloadFinancial('pdf')}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ExportCard
            title="Occupancy report"
            subtitle="Поточна завантаженість автопарку, доступність машин та розподіл по сегментах."
            note="Добре показує операційний стан прокату в одну мить."
            accent="#0f766e"
            onExcel={() => void onDownloadOccupancy('xlsx')}
            onPdf={() => void onDownloadOccupancy('pdf')}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ExportCard
            title="Car performance report"
            subtitle="Ефективність кожного авто: дохід, штрафи, чистий прибуток і rental activity."
            note="Оптимально для демонстрації прибутковості парку та порівняння авто."
            accent="#9333ea"
            onExcel={() => void onDownloadCars('xlsx')}
            onPdf={() => void onDownloadCars('pdf')}
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
          <GridView color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              Що входить в branded export
            </Typography>
            <Typography variant="body2" color="text.secondary">
              PDF містить структуровані таблиці, блоки підписів та footer для демо. Excel містить
              окремі аркуші зі summary і деталізацією.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Download />}
            disabled={!hasDateRange}
            onClick={() => void onDownloadCars('pdf')}
          >
            Швидко завантажити car PDF
          </Button>
        </Stack>
        <Divider sx={{ my: 2.5 }} />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} useFlexGap flexWrap="wrap">
          <Chip label="Financial summary" />
          <Chip label="Transactions table" />
          <Chip label="Occupancy snapshot" />
          <Chip label="Car profitability" />
          <Chip label="Signature lines" />
          <Chip label="Footer for defense/demo" />
        </Stack>
      </Paper>
    </Box>
  );
};

export default ReportsExportTab;
