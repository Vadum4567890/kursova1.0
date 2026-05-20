import React, { useMemo } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Assignment, ExpandMore, Gavel, ReportProblem } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Client, Rental, RentalResolution } from '../interfaces';
import { PageAsyncSection, PageContainer, PageHeader, StatusChip } from '../components/common';
import { useRentals } from '../hooks/queries/useRentals';
import { useCustomers } from '../hooks/queries/useCustomers';
import { formatDate } from '../utils/dateHelpers';
import { getRenterDisplayName } from '../utils/rentalDisplay';
import {
  getLifecycleLabel,
  getResolutionActionLabel,
  getResolutionTypeLabel,
  isProblemRental,
} from '../utils/rentalLifecycle';

const formatDateTime = (value?: string | null) =>
  formatDate(value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const getLastResolution = (rental: Rental): RentalResolution | undefined => {
  return [...(rental.resolutions || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
};

const DisputesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: rentals = [], isLoading, error } = useRentals();
  const { data: customers = [] } = useCustomers();

  const clientNamesByUserId = useMemo(
    () => new Map(customers.map((customer: Client) => [String(customer.id), customer.fullName])),
    [customers]
  );

  const problemRentals = useMemo(
    () =>
      rentals
        .filter(isProblemRental)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [rentals]
  );

  return (
    <PageContainer>
      <PageHeader
        title="Спори та ручні рішення"
        subtitle="Прокати, де потрібна увага адміністратора: неявка, часткові підтвердження або спірне повернення."
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ReportProblem color="warning" />
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {problemRentals.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                відкритих кейсів
              </Typography>
            </Box>
          </Stack>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Gavel color="primary" />
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {problemRentals.filter((rental) => rental.lifecycleState?.includes('disputed')).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                активних спорів
              </Typography>
            </Box>
          </Stack>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Assignment color="success" />
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {problemRentals.filter((rental) => rental.lifecycleState === 'return_due').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                очікують повернення
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>

      <Alert severity="info" sx={{ mb: 3 }}>
        Ця сторінка показує лише прокати, де потрібна ручна перевірка. Фінальне рішення записується в історію:
        хто натиснув, який статус був до/після, штраф, повернення депозиту і причина.
      </Alert>

      <PageAsyncSection error={error?.message} loading={isLoading}>
        {problemRentals.length === 0 ? (
          <Alert severity="success">Проблемних прокатів немає. Усі активні процеси виглядають нормально.</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Клієнт</TableCell>
                  <TableCell>Автомобіль</TableCell>
                  <TableCell>Період</TableCell>
                  <TableCell>Фінанси</TableCell>
                  <TableCell>Стан</TableCell>
                  <TableCell>Останнє рішення</TableCell>
                  <TableCell align="right">Дії</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {problemRentals.map((rental: Rental) => {
                  const lastResolution = getLastResolution(rental);
                  const refund = Math.max(0, rental.depositAmount - rental.penaltyAmount);

                  return (
                    <TableRow key={rental.id} hover>
                      <TableCell sx={{ maxWidth: 190, wordBreak: 'break-word' }}>{rental.id}</TableCell>
                      <TableCell>{getRenterDisplayName(rental, clientNamesByUserId)}</TableCell>
                      <TableCell>
                        {rental.car
                          ? `${rental.car.brand} ${rental.car.model}`
                          : rental.carId
                            ? `Автомобіль #${rental.carId}`
                            : 'Невідомо'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(rental.startDate)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          до {formatDate(rental.expectedEndDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {rental.totalCost.toLocaleString()} ₴
                        </Typography>
                        <Typography variant="caption" display="block" color="warning.main">
                          Залог: {rental.depositAmount.toLocaleString()} ₴
                        </Typography>
                        <Typography variant="caption" display="block" color={rental.penaltyAmount > 0 ? 'error' : 'text.secondary'}>
                          Штраф: {rental.penaltyAmount.toLocaleString()} ₴
                        </Typography>
                        <Typography variant="caption" display="block" color="success.main">
                          До повернення: {refund.toLocaleString()} ₴
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={rental.status} />
                        <Chip
                          label={getLifecycleLabel(rental) || rental.lifecycleState}
                          size="small"
                          color={rental.lifecycleState?.includes('disputed') ? 'warning' : 'default'}
                          sx={{ mt: 1, display: 'flex', width: 'fit-content' }}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 260 }}>
                        {lastResolution ? (
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              {getResolutionTypeLabel(lastResolution.resolutionType)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {formatDateTime(lastResolution.createdAt)} · {lastResolution.actorRole}
                            </Typography>
                            {lastResolution.note && (
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                {lastResolution.note}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Ручних рішень ще не було
                          </Typography>
                        )}
                        {(rental.resolutions?.length || 0) > 0 && (
                          <Accordion sx={{ mt: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Typography variant="caption">Історія рішень ({rental.resolutions?.length})</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Stack spacing={1}>
                                {[...(rental.resolutions || [])]
                                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                  .map((resolution) => (
                                    <Box key={resolution.id} sx={{ borderLeft: 2, borderColor: 'divider', pl: 1.5 }}>
                                      <Typography variant="body2" fontWeight={700}>
                                        {getResolutionActionLabel(resolution.action)} · {getResolutionTypeLabel(resolution.resolutionType)}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        {resolution.previousStatus} → {resolution.nextStatus}
                                        {resolution.nextLifecycleState ? ` / ${getLifecycleLabel({ lifecycleState: resolution.nextLifecycleState })}` : ''}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Штраф: {resolution.penaltyAmount.toLocaleString()} ₴ · Повернення депозиту:{' '}
                                        {resolution.depositRefundAmount.toLocaleString()} ₴
                                      </Typography>
                                      {resolution.note && <Typography variant="caption">{resolution.note}</Typography>}
                                    </Box>
                                  ))}
                              </Stack>
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Button variant="outlined" size="small" onClick={() => navigate('/rentals')}>
                          Відкрити прокати
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </PageAsyncSection>
    </PageContainer>
  );
};

export default DisputesPage;
