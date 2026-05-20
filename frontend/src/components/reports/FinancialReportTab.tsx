import React from 'react';
import {
  Box,
  Paper,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Stack,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Description, Download } from '@mui/icons-material';
import dayjs from 'dayjs';
import { StatCard } from '../common';
import { reportDateFieldOnGradientSx } from './reportDateFieldSx';

function formatReportPeriodDate(iso?: string): string {
  if (!iso) return '—';
  const d = dayjs(iso);
  return d.isValid() ? d.format('DD.MM.YYYY') : String(iso);
}

const RENTAL_STATUS_UA: Record<string, string> = {
  completed: 'Завершено',
  pending: 'В очікуванні',
  active: 'Активний',
  cancelled: 'Скасовано',
};

function formatRenterCell(transaction: {
  renterDisplayName?: string | null;
  rentalId: string | number;
}): string {
  const n = transaction.renterDisplayName?.trim();
  if (n) return n;
  const id = String(transaction.rentalId);
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

interface FinancialReportTabProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onGenerate: () => void;
  onDownloadExcel: () => void;
  onDownloadPdf: () => void;
  loading: boolean;
  report: any;
}

const FinancialReportTab: React.FC<FinancialReportTabProps> = ({
  dateRange,
  onStartDateChange,
  onEndDateChange,
  onGenerate,
  onDownloadExcel,
  onDownloadPdf,
  loading,
  report,
}) => {
  const startDate = dateRange.startDate || undefined;
  const endDate = dateRange.endDate || undefined;
  const lightActionButtonSx = {
    minWidth: 120,
    color: '#0f172a',
    borderColor: 'rgba(255,255,255,0.92)',
    bgcolor: 'rgba(255,255,255,0.92)',
    fontWeight: 700,
    '&:hover': {
      borderColor: '#ffffff',
      bgcolor: '#ffffff',
    },
    '&.Mui-disabled': {
      color: 'rgba(15,23,42,0.45)',
      borderColor: 'rgba(255,255,255,0.32)',
      bgcolor: 'rgba(255,255,255,0.28)',
    },
  } as const;

  return (
    <Box>
      <Paper
        sx={{
          p: 3,
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          background:
            'linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(30,64,175,0.95) 50%, rgba(8,145,178,0.9) 100%)',
          color: 'common.white',
          borderRadius: 3,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(2,6,23,0.82) 0%, rgba(15,23,42,0.62) 28%, rgba(15,23,42,0.28) 56%, rgba(15,23,42,0.04) 78%, rgba(15,23,42,0) 100%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Typography
          variant="overline"
          sx={{
            position: 'relative',
            zIndex: 1,
            opacity: 0.92,
            letterSpacing: 0.8,
            textShadow: '0 2px 10px rgba(2,6,23,0.45)',
          }}
        >
          Car Rental Platform
        </Typography>
        <Typography
          variant="h5"
          sx={{
            position: 'relative',
            zIndex: 1,
            fontWeight: 800,
            mb: 1,
            maxWidth: 720,
            textShadow: '0 3px 18px rgba(2,6,23,0.55)',
          }}
        >
          Branded Financial Reporting
        </Typography>
        <Typography
          variant="body2"
          sx={{
            position: 'relative',
            zIndex: 1,
            color: 'rgba(255,255,255,0.96)',
            mb: 3,
            maxWidth: 680,
            textShadow: '0 2px 12px rgba(2,6,23,0.45)',
          }}
        >
          Формуй фінансовий звіт, переглядай ключові показники і одразу експортуй документ у Excel
          або PDF
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2, position: 'relative', zIndex: 1 }}>
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
          <Button
            variant="contained"
            onClick={onGenerate}
            disabled={loading || !startDate || !endDate}
            startIcon={loading ? <CircularProgress size={20} /> : <Description />}
            sx={{
              minWidth: 190,
              bgcolor: '#f8fafc',
              color: '#0f172a',
              fontWeight: 700,
              '&:hover': { bgcolor: '#ffffff' },
            }}
          >
            Згенерувати звіт
          </Button>
          <Button
            variant="outlined"
            onClick={onDownloadExcel}
            disabled={!report || loading}
            startIcon={<Download />}
            sx={lightActionButtonSx}
          >
            Excel
          </Button>
          <Button
            variant="outlined"
            onClick={onDownloadPdf}
            disabled={!report || loading}
            startIcon={<Download />}
            sx={lightActionButtonSx}
          >
            PDF
          </Button>
        </Stack>
      </Paper>

      {report && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Загальний дохід"
                value={`${(report?.totalRevenue ?? 0).toLocaleString()} грн`}
                color="primary"
                variant="h5"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Визнаний дохід"
                value={`${(report?.recognizedRevenue ?? 0).toLocaleString()} грн`}
                color="success"
                variant="h5"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Дохід системи (5%)"
                value={`${(report?.systemRevenue ?? 0).toLocaleString()} грн`}
                color="primary"
                variant="h5"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Дохід орендодавців"
                value={`${(report?.landlordRevenue ?? report?.netRevenue ?? 0).toLocaleString()} грн`}
                color="success"
                variant="h5"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Прогнозований дохід"
                value={`${(report?.projectedRevenue ?? 0).toLocaleString()} грн`}
                variant="h5"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Спірний / ризиковий"
                value={`${(report?.disputedRevenue ?? 0).toLocaleString()} грн`}
                color="warning"
                variant="h5"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard
                title="Зобов'язання по депозитах"
                value={`${(report?.depositLiability ?? 0).toLocaleString()} грн`}
                color="warning"
                variant="h5"
              />
            </Grid>
          </Grid>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Штрафи за період (усі прокати): {(report?.totalPenalties ?? 0).toLocaleString()} грн
            {' · '}
            Повернуто депозитів: {(report?.refundedDeposits ?? 0).toLocaleString()} грн
          </Typography>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Статуси прокатів
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {(report?.statusBreakdown ?? []).map((item: any) => (
                    <Chip
                      key={item.status}
                      label={`${RENTAL_STATUS_UA[item.status] ?? item.status}: ${item.count} / ${item.revenue.toLocaleString()} грн`}
                      color={
                        item.status === 'completed'
                          ? 'success'
                          : item.status === 'active'
                            ? 'warning'
                            : item.status === 'pending'
                              ? 'info'
                              : 'default'
                      }
                    />
                  ))}
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Короткий підсумок
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Середній завершений чек: {(report?.averageCompletedTicket ?? 0).toLocaleString()} грн
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Середній штраф на завершений прокат:{' '}
                  {(report?.averagePenaltyPerCompletedRental ?? 0).toLocaleString()} грн
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Період: {formatReportPeriodDate(report?.period?.startDate)} —{' '}
                  {formatReportPeriodDate(report?.period?.endDate)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Останні транзакції
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Орендар</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell align="right">Оренда (базова)</TableCell>
                    <TableCell align="right">Визнано</TableCell>
                    <TableCell align="right">Прогноз</TableCell>
                    <TableCell align="right">Спірно</TableCell>
                    <TableCell align="right">Комісія системи</TableCell>
                    <TableCell align="right">Орендодавцю</TableCell>
                    <TableCell align="right">Штраф</TableCell>
                    <TableCell align="right">Повернути депозит</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(report?.transactions ?? []).slice(0, 8).map((transaction: any) => (
                    <TableRow key={transaction.rentalId}>
                      <TableCell>{formatRenterCell(transaction)}</TableCell>
                      <TableCell>{RENTAL_STATUS_UA[transaction.status] ?? transaction.status}</TableCell>
                      <TableCell align="right">{transaction.totalCost.toLocaleString()} грн</TableCell>
                      <TableCell align="right">{(transaction.recognizedRevenue ?? 0).toLocaleString()} грн</TableCell>
                      <TableCell align="right">{(transaction.projectedRevenue ?? 0).toLocaleString()} грн</TableCell>
                      <TableCell align="right">{(transaction.disputedRevenue ?? 0).toLocaleString()} грн</TableCell>
                      <TableCell align="right">
                        {(transaction.systemCommission ?? 0).toLocaleString()} грн
                      </TableCell>
                      <TableCell align="right">
                        {(transaction.landlordEarnings ?? transaction.recognizedRevenue ?? 0).toLocaleString()} грн
                      </TableCell>
                      <TableCell align="right">{transaction.penaltyAmount.toLocaleString()} грн</TableCell>
                      <TableCell align="right">{transaction.depositToReturn.toLocaleString()} грн</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default FinancialReportTab;
