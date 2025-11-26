import { useState, useCallback } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useErrorHandler } from './useErrorHandler';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface BookingPeriod {
  startDate: string;
  endDate: string;
}

interface UseBookingOptions {
  bookedDates?: BookingPeriod[];
  onCreateBooking: (data: { carId: number; startDate: string; expectedEndDate: string }) => Promise<void>;
  onSuccess?: () => void;
}

export function useBooking(options: UseBookingOptions) {
  const { bookedDates = [], onCreateBooking, onSuccess } = options;
  const { error, handleError, clearError } = useErrorHandler();
  
  const [open, setOpen] = useState(false);
  const [carId, setCarId] = useState<number | null>(null);
  const [bookingData, setBookingData] = useState({
    startDate: null as Dayjs | null,
    expectedEndDate: null as Dayjs | null,
  });

  const openBooking = useCallback((id: number) => {
    setCarId(id);
    setOpen(true);
    clearError();
    
    // Set default dates (tomorrow and 3 days from tomorrow)
    const tomorrow = dayjs().add(1, 'day');
    const in4Days = tomorrow.add(3, 'day');
    setBookingData({
      startDate: tomorrow,
      expectedEndDate: in4Days,
    });
  }, [clearError]);

  const closeBooking = useCallback(() => {
    setOpen(false);
    setCarId(null);
    setBookingData({ startDate: null, expectedEndDate: null });
    clearError();
  }, [clearError]);

  const isDateBooked = useCallback((date: Dayjs): boolean => {
    return bookedDates.some((period) => {
      const start = dayjs(period.startDate);
      const end = dayjs(period.endDate);
      return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day');
    });
  }, [bookedDates]);

  const isDateRangeValid = useCallback((start: Dayjs | null, end: Dayjs | null): boolean => {
    if (!start || !end || start.isAfter(end)) return false;
    
    return !bookedDates.some((period) => {
      const bookedStart = dayjs(period.startDate);
      const bookedEnd = dayjs(period.endDate);
      // Check if ranges overlap
      return (start.isSameOrBefore(bookedEnd, 'day') && end.isSameOrAfter(bookedStart, 'day'));
    });
  }, [bookedDates]);

  const submitBooking = useCallback(async () => {
    if (!carId || !bookingData.startDate || !bookingData.expectedEndDate) {
      handleError(new Error('Будь ласка, виберіть дати'), 'Будь ласка, виберіть дати');
      return;
    }

    if (!isDateRangeValid(bookingData.startDate, bookingData.expectedEndDate)) {
      handleError(new Error('Вибраний період перетинається з заброньованими датами'), 'Вибраний період перетинається з заброньованими датами');
      return;
    }

    if (bookingData.startDate.isBefore(dayjs(), 'day')) {
      handleError(new Error('Дата початку не може бути в минулому'), 'Дата початку не може бути в минулому');
      return;
    }

    try {
      clearError();
      const startDateStr = bookingData.startDate.format('YYYY-MM-DD');
      const expectedEndDateStr = bookingData.expectedEndDate.format('YYYY-MM-DD');
      
      await onCreateBooking({
        carId,
        startDate: startDateStr,
        expectedEndDate: expectedEndDateStr,
      });
      
      closeBooking();
      onSuccess?.();
    } catch (err: any) {
      handleError(err, 'Помилка бронювання');
    }
  }, [carId, bookingData, isDateRangeValid, onCreateBooking, onSuccess, closeBooking, handleError, clearError]);

  const updateBookingData = useCallback((updates: Partial<typeof bookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    open,
    carId,
    bookingData,
    error,
    openBooking,
    closeBooking,
    submitBooking,
    updateBookingData,
    isDateBooked,
    isDateRangeValid,
  };
}

