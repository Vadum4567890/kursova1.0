import React, { useState, useLayoutEffect } from 'react';
import { Typography, Box, Paper, Tabs, Tab } from '@mui/material';
import { useSearch, useSearchOperations } from '../hooks';
import {
  CarSearchTab,
  ClientSearchTab,
  RentalSearchTab,
} from '../components/search';
import { ErrorAlert, PageContainer } from '../components/common';

const SearchPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const search = useSearch();
  const searchOps = useSearchOperations();

  const handleSearchCars = () => {
    const merged = { ...search.carParams, page: 1 };
    search.updateCarParams({ page: 1 });
    searchOps.searchCars(merged, search.setLoading, search.setError);
  };

  const handleCarPageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    const merged = { ...search.carParams, page };
    search.updateCarParams({ page });
    searchOps.searchCars(merged, search.setLoading, search.setError);
  };

  const handleSearchCustomers = () => {
    searchOps.searchClients(search.clientQuery, search.setLoading, search.setError);
  };

  const handleSearchRentals = () => {
    searchOps.searchRentals(search.rentalParams, search.setLoading, search.setError);
  };

  /** При відкритті вкладки «Клієнти» одразу завантажуємо повний список (порожній запит = усі записи). */
  useLayoutEffect(() => {
    if (tabValue !== 1) return;
    searchOps.searchClients(search.clientQuery, search.setLoading, search.setError);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- лише перемикання вкладки; пошук за кнопкою окремо
  }, [tabValue]);

  return (
    <PageContainer>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Пошук
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Розширений пошук по автомобілях, клієнтах і прокатах
        </Typography>
      </Box>

      {search.error && <ErrorAlert message={search.error} onClose={search.clearError} />}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)}>
          <Tab label="Автомобілі" />
          <Tab label="Клієнти" />
          <Tab label="Прокати" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <CarSearchTab
          params={search.carParams}
          onParamsChange={search.updateCarParams}
          onSearch={handleSearchCars}
          loading={search.loading}
          results={searchOps.carResults}
          totalCount={searchOps.carPagination.total}
          page={searchOps.carPagination.page}
          totalPages={searchOps.carPagination.totalPages}
          onPageChange={handleCarPageChange}
        />
      )}

      {tabValue === 1 && (
        <ClientSearchTab
          query={search.clientQuery}
          onQueryChange={search.setClientQuery}
          onSearch={handleSearchCustomers}
          loading={search.loading}
          results={searchOps.clientResults}
        />
      )}

      {tabValue === 2 && (
        <RentalSearchTab
          params={search.rentalParams}
          onParamsChange={search.updateRentalParams}
          onSearch={handleSearchRentals}
          loading={search.loading}
          results={searchOps.rentalResults}
        />
      )}
    </PageContainer>
  );
};

export default SearchPage;
