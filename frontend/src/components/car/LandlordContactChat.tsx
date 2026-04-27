import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
import { Phone, Person, Chat, Send, Email } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { rentalService } from '../../services/rentalService';
import { useAuth } from '../../context/AuthContext';
import { canonicalUserId } from '../../utils/authUserId';
import { inquiryConversationKey, rentalConversationKey } from '../../utils/chatConversationKeys';
import { useRentalChatSocket } from '../../context/RentalChatSocketContext';

const MESSAGES_KEY = ['rentals', 'messages'] as const;
const INQUIRY_KEY = ['rentals', 'car-inquiry-messages'] as const;

interface LandlordContactChatProps {
  carId: number | string;
  /** Прокат: повідомлення в rental_messages; inquiry: до бронювання (car_inquiry_messages). */
  mode: 'rental' | 'inquiry';
  rentalId?: string;
  /** Приховує великий заголовок — для сторінки чату з власним hero. */
  embedded?: boolean;
  /** Ви власник авто: тред задається UUID орендаря (див. inquiry-threads / ?renterId=). */
  isCarOwner?: boolean;
  /** Для власника — UUID орендаря обраного треду. */
  threadRenterUserId?: string | null;
}

const LandlordContactChat: React.FC<LandlordContactChatProps> = ({
  carId,
  mode,
  rentalId,
  embedded,
  isCarOwner = false,
  threadRenterUserId = null,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { subscribeTopics, unsubscribeTopics } = useRentalChatSocket();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const contactQuery = useQuery({
    queryKey: ['rentals', 'landlord-contact', carId],
    queryFn: () => rentalService.getLandlordContact(carId),
    enabled: !!carId && !!user && !(mode === 'inquiry' && isCarOwner),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  const renterContactQuery = useQuery({
    queryKey: ['rentals', 'inquiry-renter-contact', carId, threadRenterUserId ?? ''],
    queryFn: () => rentalService.getInquiryRenterContact(carId, threadRenterUserId as string),
    enabled:
      !!carId && !!user && mode === 'inquiry' && isCarOwner && !!threadRenterUserId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  type Msg = { id: string; senderUserId: string; body: string; createdAt: string };

  const inquiryEnabled =
    mode === 'inquiry' && (isCarOwner ? !!carId && !!threadRenterUserId : !!carId);

  const messagesQuery = useQuery<Msg[]>({
    queryKey:
      mode === 'rental' && rentalId
        ? [...MESSAGES_KEY, rentalId]
        : isCarOwner && threadRenterUserId
          ? [...INQUIRY_KEY, carId, threadRenterUserId]
          : [...INQUIRY_KEY, carId],
    queryFn: () =>
      mode === 'rental' && rentalId
        ? rentalService.getRentalMessages(rentalId)
        : rentalService.getCarInquiryMessages(
            carId,
            isCarOwner && threadRenterUserId ? threadRenterUserId : undefined
          ),
    enabled: mode === 'inquiry' ? inquiryEnabled : !!rentalId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: false,
  });

  useEffect(() => {
    const topics: string[] = [];
    if (mode === 'rental' && rentalId) {
      topics.push(rentalConversationKey(String(rentalId)));
    }
    if (mode === 'inquiry' && user) {
      const tid = isCarOwner ? threadRenterUserId : canonicalUserId(user.id);
      if (tid) {
        topics.push(inquiryConversationKey(String(carId), tid));
      }
    }
    if (topics.length === 0) return;
    subscribeTopics(topics);
    return () => unsubscribeTopics(topics);
  }, [
    mode,
    rentalId,
    carId,
    threadRenterUserId,
    isCarOwner,
    user?.id,
    subscribeTopics,
    unsubscribeTopics,
  ]);

  const postMutation = useMutation({
    mutationFn: (body: string) =>
      mode === 'rental' && rentalId
        ? rentalService.postRentalMessage(rentalId, body)
        : rentalService.postCarInquiryMessage(
            carId,
            body,
            isCarOwner && threadRenterUserId ? threadRenterUserId : undefined
          ),
    onSuccess: () => {
      if (mode === 'rental' && rentalId) {
        void queryClient.invalidateQueries({ queryKey: [...MESSAGES_KEY, rentalId] });
      } else if (isCarOwner && threadRenterUserId) {
        void queryClient.invalidateQueries({ queryKey: [...INQUIRY_KEY, carId, threadRenterUserId] });
        void queryClient.invalidateQueries({ queryKey: ['rentals', 'car-inquiry-threads', carId] });
        void queryClient.invalidateQueries({
          queryKey: ['rentals', 'inquiry-renter-contact', carId, threadRenterUserId],
        });
      } else {
        void queryClient.invalidateQueries({ queryKey: [...INQUIRY_KEY, carId] });
      }
      if (mode === 'inquiry') {
        void queryClient.invalidateQueries({ queryKey: ['rentals', 'my-inquiry-chats'] });
      }
      void queryClient.invalidateQueries({ queryKey: ['rentals', 'unread-chats'] });
      setDraft('');
    },
  });

  const myUserId = user ? canonicalUserId(user.id) : '';

  const sortedMessages = useMemo(() => {
    const rows = messagesQuery.data ?? [];
    return [...rows].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messagesQuery.data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sortedMessages.length]);

  const lastMarkedInquiryRef = useRef<string | null>(null);
  useEffect(() => {
    lastMarkedInquiryRef.current = null;
  }, [carId, threadRenterUserId, isCarOwner, user?.id]);

  useEffect(() => {
    if (mode !== 'inquiry' || !inquiryEnabled || !user) return;
    const threadId = isCarOwner ? threadRenterUserId : canonicalUserId(user.id);
    if (!threadId) return;
    const sig = `${String(carId)}:${threadId}`;
    if (lastMarkedInquiryRef.current === sig) return;
    lastMarkedInquiryRef.current = sig;
    void rentalService
      .markConversationRead({
        kind: 'inquiry',
        carId,
        threadRenterUserId: threadId,
      })
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ['rentals', 'unread-chats'] });
      })
      .catch(() => {
        /* ignore */
      });
  }, [mode, inquiryEnabled, carId, isCarOwner, threadRenterUserId, user?.id, queryClient]);

  const lastMarkedRentalRef = useRef<string | null>(null);
  useEffect(() => {
    lastMarkedRentalRef.current = null;
  }, [rentalId]);
  useEffect(() => {
    if (mode !== 'rental' || !rentalId || !messagesQuery.isSuccess) return;
    const id = String(rentalId);
    if (lastMarkedRentalRef.current === id) return;
    lastMarkedRentalRef.current = id;
    void rentalService
      .markConversationRead({ kind: 'rental', rentalId })
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ['rentals', 'unread-chats'] });
      })
      .catch(() => {
        /* ignore */
      });
  }, [mode, rentalId, messagesQuery.isSuccess, queryClient]);

  const c = contactQuery.data;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 3,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor:
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.6)
            : theme.palette.background.paper,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
        {!embedded && <Chat color="primary" sx={{ fontSize: 28 }} />}
        <Typography variant={embedded ? 'subtitle1' : 'h6'} component="h2" fontWeight={embedded ? 600 : 700}>
          {embedded ? 'Контакти та повідомлення' : 'Орендодавець і чат'}
        </Typography>
      </Stack>

      {!isCarOwner && contactQuery.isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {!isCarOwner && contactQuery.isError && (
        <Typography color="error" variant="body2">
          Не вдалося завантажити контакти орендодавця. Переконайтеся, що ви увійшли в систему.
        </Typography>
      )}

      {!isCarOwner && contactQuery.isSuccess && c == null && !contactQuery.isError && (
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          Контакти орендодавця недоступні (авто не знайдено в сервісі або застарілий API). Чат за
          запитаннями до авто все одно можна використовувати нижче.
        </Typography>
      )}

      {!isCarOwner && c && (
        <Stack
          spacing={1.25}
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.08 : 0.06),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person fontSize="small" color="primary" />
            <Typography variant="body1" fontWeight={600}>
              {c.fullName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Phone fontSize="small" color="action" />
            {c.phone ? (
              <Typography
                component="a"
                variant="body1"
                href={`tel:${c.phone.replace(/\s/g, '')}`}
                sx={{ color: 'primary.main', fontWeight: 500 }}
              >
                {c.phone}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Телефон не вказано в профілі
              </Typography>
            )}
          </Box>
        </Stack>
      )}

      {mode === 'inquiry' && isCarOwner && threadRenterUserId && (
        <>
          {renterContactQuery.isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={28} />
            </Box>
          )}
          {renterContactQuery.isError && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              Не вдалося завантажити контакти орендаря.
            </Typography>
          )}
          {renterContactQuery.isSuccess && renterContactQuery.data && (
            <Stack
              spacing={1.25}
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.1 : 0.08),
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.25)}`,
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Орендар
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person fontSize="small" color="secondary" />
                <Typography variant="body1" fontWeight={600}>
                  {renterContactQuery.data.fullName}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Phone fontSize="small" color="action" />
                {renterContactQuery.data.phone ? (
                  <Typography
                    component="a"
                    variant="body1"
                    href={`tel:${renterContactQuery.data.phone.replace(/\s/g, '')}`}
                    sx={{ color: 'secondary.main', fontWeight: 500 }}
                  >
                    {renterContactQuery.data.phone}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Телефон не вказано в профілі
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Email fontSize="small" color="action" />
                {renterContactQuery.data.email ? (
                  <Typography
                    component="a"
                    variant="body1"
                    href={`mailto:${renterContactQuery.data.email}`}
                    sx={{ color: 'secondary.main', fontWeight: 500 }}
                  >
                    {renterContactQuery.data.email}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Email не вказано
                  </Typography>
                )}
              </Box>
            </Stack>
          )}
        </>
      )}

      <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block', letterSpacing: 1 }}>
        Повідомлення
      </Typography>

      <Box
        sx={{
          minHeight: 200,
          maxHeight: 380,
          overflow: 'auto',
          mb: 2,
          p: 1.5,
          bgcolor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.15 : 0.06),
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {mode === 'inquiry' && isCarOwner && !threadRenterUserId && (
          <Typography variant="body2" color="text.secondary">
            Оберіть орендаря у випадаючому списку на сторінці, щоб відкрити переписку та відповісти.
          </Typography>
        )}
        {messagesQuery.isFetching && sortedMessages.length === 0 && inquiryEnabled && (
          <Typography variant="body2" color="text.secondary">
            Завантаження…
          </Typography>
        )}
        {messagesQuery.isError && (
          <Typography color="error" variant="body2">
            Не вдалося завантажити повідомлення.
          </Typography>
        )}
        {sortedMessages.map((m) => {
          const mine = m.senderUserId.toLowerCase() === myUserId;
          return (
            <Box
              key={m.id}
              sx={{
                display: 'flex',
                justifyContent: mine ? 'flex-end' : 'flex-start',
                mb: 1,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  px: 1.75,
                  py: 1.25,
                  maxWidth: '85%',
                  borderRadius: 2,
                  bgcolor: mine ? 'primary.main' : 'background.paper',
                  color: mine ? 'primary.contrastText' : 'text.primary',
                  border: mine ? 'none' : `1px solid ${theme.palette.divider}`,
                  boxShadow: mine ? 2 : 0,
                }}
              >
                <Typography variant="body2">{m.body}</Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}
                >
                  {dayjs(m.createdAt).format('DD.MM.YYYY HH:mm')}
                </Typography>
              </Paper>
            </Box>
          );
        })}
        <div ref={bottomRef} />
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'stretch' }}>
        <TextField
          fullWidth
          size="medium"
          placeholder={isCarOwner ? 'Написати орендарю…' : 'Написати орендодавцю…'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (draft.trim() && !postMutation.isPending && inquiryEnabled) {
                postMutation.mutate(draft.trim());
              }
            }
          }}
          disabled={postMutation.isPending || !inquiryEnabled}
          multiline
          maxRows={4}
          InputProps={{
            sx: { borderRadius: 2 },
          }}
        />
        <Button
          variant="contained"
          size="large"
          startIcon={<Send />}
          onClick={() => draft.trim() && inquiryEnabled && postMutation.mutate(draft.trim())}
          disabled={!draft.trim() || postMutation.isPending || !inquiryEnabled}
          sx={{ minWidth: { sm: 160 }, py: 1.25, borderRadius: 2 }}
        >
          Надіслати
        </Button>
      </Stack>
      {postMutation.isError && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          {postMutation.error instanceof Error
            ? postMutation.error.message
            : 'Не вдалося надіслати повідомлення.'}
        </Typography>
      )}
    </Paper>
  );
};

export default LandlordContactChat;
