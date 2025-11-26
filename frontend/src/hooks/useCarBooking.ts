import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { useCreateBooking } from './queries/useRentals';
import { isDateRangeValid } from '../utils/dateHelpers';

interface BookedPeriod {
  startDate: string;
  endDate: string;
}

interface UseCarBookingOptions {
  carId?: number;
  bookedDates?: BookedPeriod[];
  onSuccess?: () => void;
}

/**
 * Hook for managing car booking logic
 */
export function useCarBooking(options: UseCarBookingOptions = {}) {
  const { carId, bookedDates = [], onSuccess } = options;
  const navigate = useNavigate();
  const createBooking = useCreateBooking();
  
  const [error, setError] = useState('');
  const [bookingData, setBookingData] = useState({
    startDate: null as Dayjs | null,
    expectedEndDate: null as Dayjs | null,
  });

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const resetBookingData = useCallback(() => {
    setBookingData({ startDate: null, expectedEndDate: null });
  }, []);

  const setDefaultDates = useCallback(() => {
    const tomorrow = dayjs().add(1, 'day');
    const in4Days = tomorrow.add(3, 'day');
    setBookingData({
      startDate: tomorrow,
      expectedEndDate: in4Days,
    });
  }, []);

  const updateStartDate = useCallback((newValue: Dayjs | null) => {
    if (newValue && bookingData.expectedEndDate && newValue.isAfter(bookingData.expectedEndDate)) {
      setBookingData({
        startDate: newValue,
        expectedEndDate: newValue.add(1, 'day'),
      });
    } else {
      setBookingData({ ...bookingData, startDate: newValue });
    }
  }, [bookingData]);

  const updateEndDate = useCallback((newValue: Dayjs | null) => {
    setBookingData({ ...bookingData, expectedEndDate: newValue });
  }, [bookingData]);

  const validateBooking = useCallback((): string | null => {
    if (!bookingData.startDate || !bookingData.expectedEndDate) {
      return 'Будь ласка, виберіть дати';
    }

    if (!isDateRangeValid(bookingData.startDate, bookingData.expectedEndDate, bookedDates)) {
      return 'Вибраний період перетинається з заброньованими датами';
    }

    if (bookingData.startDate.isBefore(dayjs(), 'day')) {
      return 'Дата початку не може бути в минулому';
    }

    return null;
  }, [bookingData, bookedDates]);

  const submitBooking = useCallback(async () => {
    const validationError = validateBooking();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!carId || !bookingData.startDate || !bookingData.expectedEndDate) {
      setError('Помилка: не вказано ID автомобіля або дати');
      return;
    }

    try {
      setError('');
      const startDateStr = bookingData.startDate.format('YYYY-MM-DD');
      const expectedEndDateStr = bookingData.expectedEndDate.format('YYYY-MM-DD');

      await createBooking.mutateAsync({
        carId,
        startDate: startDateStr,
        expectedEndDate: expectedEndDateStr,
      });

      resetBookingData();
      onSuccess?.();
      navigate('/my-rentals');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка бронювання');
      throw err;
    }
  }, [carId, bookingData, validateBooking, createBooking, resetBookingData, onSuccess, navigate]);

  const isDateRangeValidForBooking = useCallback(() => {
    if (!bookingData.startDate || !bookingData.expectedEndDate) return false;
    return isDateRangeValid(bookingData.startDate, bookingData.expectedEndDate, bookedDates);
  }, [bookingData, bookedDates]);

  return {
    bookingData,
    error,
    setError,
    clearError,
    resetBookingData,
    setDefaultDates,
    updateStartDate,
    updateEndDate,
    submitBooking,
    isDateRangeValidForBooking,
    isPending: createBooking.isPending,
  };
}

