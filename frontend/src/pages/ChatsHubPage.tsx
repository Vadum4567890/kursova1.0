import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import { Chat, DirectionsCar, Forum, Storefront } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { useMyRentals } from '../hooks/queries/useRentals';
import { PageContainer, LoadingSpinner, ErrorAlert, UnreadCountBadge } from '../components/common';
import { Rental } from '../interfaces';
import { rentalService } from '../services/rentalService';
import { canonicalUserId } from '../utils/authUserId';
import { inquiryConversationKey, rentalConversationKey } from '../utils/chatConversationKeys';
import { useUnreadChatsSummary } from '../hooks/queries/useUnreadChats';

type ChatRow = {
  carId: string | number;
  title: string;
  subtitle: string;
};

type OwnerInquiryRow = {
  carId: string;
  carTitle: string;
  threadRenterUserId: string;
  lastMessageAt: string;
  preview: string;
};

function rentalStatusLabel(status: Rental['status']): string {
  switch (status) {
    case 'pending':
      return 'Очікує підтвердження';
    case 'active':
      return 'Активний прокат';
    case 'completed':
      return 'Завершено';
    default:
      return status;
  }
}

const ChatsHubPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { data: rentals = [], isLoading: loadingRentals } = useMyRentals();
  const { data: unreadSummary } = useUnreadChatsSummary();

  const unreadByKey = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of unreadSummary?.items ?? []) {
      if (row.unread > 0) m.set(row.key, row.unread);
    }
    return m;
  }, [unreadSummary?.items]);

  const isOwner = user?.role === 'owner' || user?.role === 'both';
  const sessionKey = token ? token.slice(-32) : 'none';

  const ownerInquiryQueryKey = user ? canonicalUserId(String(user.id)) : 'none';

  const {
    data: ownerInquiryChats = [],
    isLoading: loadingOwnerInquiry,
    isError: ownerInquiryError,
    error: ownerInquiryErr,
  } = useQuery({
    queryKey: ['rentals', 'my-inquiry-chats', ownerInquiryQueryKey, sessionKey],
    queryFn: () => rentalService.getMyInquiryChatsAsOwner(),
    enabled: !!user && !!token && isOwner,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const rentalsByCarId = useMemo(() => {
    const m = new Map<string, Rental[]>();
    rentals
      .filter((r) => r.status !== 'cancelled')
      .forEach((r) => {
        const id = String(r.carId);
        if (!m.has(id)) m.set(id, []);
        m.get(id)!.push(r);
      });
    return m;
  }, [rentals]);

  const renterRows = useMemo(() => {
    const map = new Map<string, ChatRow>();

    rentals
      .filter((r) => r.status !== 'cancelled')
      .forEach((r) => {
        const id = String(r.carId);
        const brand = r.car?.brand ?? '';
        const model = r.car?.model ?? '';
        const title = [brand, model].filter(Boolean).join(' ').trim() || `Авто ${id.slice(0, 8)}…`;
        map.set(id, {
          carId: r.carId,
          title,
          subtitle: rentalStatusLabel(r.status),
        });
      });

    return [...map.values()].sort((a, b) => a.title.localeCompare(b.title, 'uk'));
  }, [rentals]);

  const loading = loadingRentals || (isOwner && loadingOwnerInquiry);

  const unreadForOwnerInquiry = (row: OwnerInquiryRow) =>
    unreadByKey.get(inquiryConversationKey(String(row.carId), row.threadRenterUserId)) ?? 0;

  const unreadForRenterCar = (carId: string | number) => {
    const uid = user ? canonicalUserId(String(user.id)) : '';
    if (!uid) return 0;
    const cid = String(carId);
    let n = unreadByKey.get(inquiryConversationKey(cid, uid)) ?? 0;
    const list = rentalsByCarId.get(cid) ?? [];
    for (const r of list) {
      n += unreadByKey.get(rentalConversationKey(String(r.id))) ?? 0;
    }
    return n;
  };

  const hasOwnerChats = isOwner && ownerInquiryChats.length > 0;
  const hasRenterChats = renterRows.length > 0;
  const isEmpty = !hasOwnerChats && !hasRenterChats;

  if (loading) {
    return (
      <PageContainer maxWidth="md">
        <LoadingSpinner />
      </PageContainer>
    );
  }

  const ownerInquiryErrorMessage =
    ownerInquiryError && ownerInquiryErr instanceof Error ? ownerInquiryErr.message : 'Не вдалося завантажити діалоги';

  const renderOwnerCard = (row: OwnerInquiryRow) => {
    const u = unreadForOwnerInquiry(row);
    return (
    <Card
      key={`${row.carId}-${row.threadRenterUserId}`}
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.5),
          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.12)}`,
        },
      }}
    >
      <CardActionArea
        onClick={() =>
          navigate(`/cars/${row.carId}/chat?renter=${encodeURIComponent(row.threadRenterUserId)}`)
        }
        sx={{ alignItems: 'stretch' }}
      >
        <CardContent sx={{ py: 2.5, px: 2.5 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.secondary.main, 0.15),
                  color: 'secondary.main',
                  flexShrink: 0,
                }}
              >
                <Storefront />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                  {row.carTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {dayjs(row.lastMessageAt).format('DD.MM.YYYY HH:mm')}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap title={row.preview}>
                  {row.preview.length > 120 ? `${row.preview.slice(0, 120)}…` : row.preview}
                </Typography>
              </Box>
            </Stack>
            <Stack alignItems="flex-end" spacing={1} flexShrink={0}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <UnreadCountBadge count={u} />
                <Chip size="small" label="Моє авто" color="secondary" variant="outlined" />
              </Stack>
              <Typography variant="caption" color="primary" fontWeight={600}>
                Відкрити →
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
  };

  const renderRenterCard = (row: ChatRow) => {
    const u = unreadForRenterCar(row.carId);
    return (
    <Card
      key={String(row.carId)}
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.5),
          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.12)}`,
        },
      }}
    >
      <CardActionArea onClick={() => navigate(`/cars/${row.carId}/chat`)} sx={{ alignItems: 'stretch' }}>
        <CardContent sx={{ py: 2.5, px: 2.5 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: 'primary.main',
                  flexShrink: 0,
                }}
              >
                <Chat />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                  {row.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {row.subtitle}
                </Typography>
              </Box>
            </Stack>
            <Stack alignItems="flex-end" spacing={1} flexShrink={0}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <UnreadCountBadge count={u} />
                <Chip size="small" label="Чат" color="primary" variant="outlined" />
              </Stack>
              <Typography variant="caption" color="primary" fontWeight={600}>
                Відкрити →
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
  };

  return (
    <PageContainer maxWidth="md">
      <Stack spacing={3}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }} flexWrap="wrap">
            <Forum sx={{ fontSize: 36, color: 'primary.main' }} />
            <Typography variant="h4" component="h1" fontWeight={700}>
              Чати
            </Typography>
          </Stack>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 620 }}>
            Діалоги з орендодавцями за вашими бронюваннями та переписка з орендарями щодо ваших авто.
          </Typography>
        </Box>

        {isOwner && ownerInquiryError && (
          <ErrorAlert message={ownerInquiryErrorMessage} sx={{ mb: 0 }} />
        )}

        {isEmpty ? (
          <Card
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              border: `1px dashed ${theme.palette.divider}`,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.06 : 0.04),
            }}
          >
            <Chat sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Поки немає діалогів
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {isOwner
                ? 'Коли орендар напише вам з картки авто після бронювання, діалог з’явиться тут. Також тут з’являться чати за вашими власними бронюваннями в каталозі.'
                : 'Після бронювання авто тут з’явиться чат з орендодавцем.'}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
              <Button variant="contained" startIcon={<DirectionsCar />} onClick={() => navigate('/cars')}>
                Перейти до каталогу
              </Button>
              {isOwner && (
                <Button variant="outlined" startIcon={<Storefront />} onClick={() => navigate('/my-cars')}>
                  Мої авто
                </Button>
              )}
            </Stack>
          </Card>
        ) : (
          <Stack spacing={3}>
            {hasOwnerChats && (
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                  Орендарі щодо ваших авто
                </Typography>
                <Stack spacing={1.5}>{ownerInquiryChats.map(renderOwnerCard)}</Stack>
              </Box>
            )}
            {hasRenterChats && (
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                  Ваші бронювання
                </Typography>
                <Stack spacing={1.5}>{renterRows.map(renderRenterCard)}</Stack>
              </Box>
            )}
          </Stack>
        )}
      </Stack>
    </PageContainer>
  );
};

export default ChatsHubPage;
