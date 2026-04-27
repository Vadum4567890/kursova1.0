import React, { useState } from 'react';
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
    searchOps.searchCars(search.carParams, search.setLoading, search.setError);
  };

  const handleSearchCustomers = () => {
    searchOps.searchClients(search.clientQuery, search.setLoading, search.setError);
  };

  const handleSearchRentals = () => {
    searchOps.searchRentals(search.rentalParams, search.setLoading, search.setError);
  };

  return (
    <PageContainer>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Пошук
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Розширений пошук по автомобілях, орендарях та прокатах
        </Typography>
      </Box>

      {search.error && <ErrorAlert message={search.error} onClose={search.clearError} />}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)}>
          <Tab label="Автомобілі" />
          <Tab label="Орендарі" />
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
