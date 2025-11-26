import { useState, useCallback } from 'react';
import dayjs from 'dayjs';

/**
 * Hook for managing reports state and date filters
 */
export function useReports() {
  // Set default dates: start of current year to today
  const defaultStartDate = dayjs().startOf('year').format('YYYY-MM-DD');
  const defaultEndDate = dayjs().format('YYYY-MM-DD');

  const [dateRange, setDateRange] = useState({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
  });

  const startDate = dateRange.startDate || undefined;
  const endDate = dateRange.endDate || undefined;

  // State to track if reports should be loaded
  const [shouldLoadFinancial, setShouldLoadFinancial] = useState(false);
  const [shouldLoadOccupancy, setShouldLoadOccupancy] = useState(false);
  const [shouldLoadAvailability, setShouldLoadAvailability] = useState(false);
  const [shouldLoadCarReport, setShouldLoadCarReport] = useState(false);

  const updateStartDate = useCallback((value: string) => {
    setDateRange((prev) => ({ ...prev, startDate: value }));
  }, []);

  const updateEndDate = useCallback((value: string) => {
    setDateRange((prev) => ({ ...prev, endDate: value }));
  }, []);

  const enableFinancial = useCallback(() => {
    setShouldLoadFinancial(true);
  }, []);

  const enableOccupancy = useCallback(() => {
    setShouldLoadOccupancy(true);
  }, []);

  const enableAvailability = useCallback(() => {
    setShouldLoadAvailability(true);
  }, []);

  const enableCarReport = useCallback(() => {
    setShouldLoadCarReport(true);
  }, []);

  return {
    dateRange,
    startDate,
    endDate,
    updateStartDate,
    updateEndDate,
    shouldLoadFinancial,
    shouldLoadOccupancy,
    shouldLoadAvailability,
    shouldLoadCarReport,
    enableFinancial,
    enableOccupancy,
    enableAvailability,
    enableCarReport,
  };
}

