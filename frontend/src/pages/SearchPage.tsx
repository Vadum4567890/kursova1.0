import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { searchService, CarSearchParams, RentalSearchParams } from '../services/searchService';
import { Car } from '../services/carService';
import { Client } from '../services/clientService';
import { Rental } from '../services/rentalService';

const SearchPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Car search
  const [carResults, setCarResults] = useState<Car[]>([]);
  const [carParams, setCarParams] = useState<CarSearchParams>({});

  // Client search
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [clientQuery, setClientQuery] = useState('');

  // Rental search
  const [rentalResults, setRentalResults] = useState<Rental[]>([]);
  const [rentalParams, setRentalParams] = useState<RentalSearchParams>({});

  const searchCars = async () => {
    try {
      setLoading(true);
      setError('');
      const results = await searchService.searchCars(carParams);
      setCarResults(results);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка пошуку');
    } finally {
      setLoading(false);
    }
  };

  const searchClients = async () => {
    if (!clientQuery.trim()) return;
    try {
      setLoading(true);
      setError('');
      const results = await searchService.searchClients(clientQuery);
      setClientResults(results);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка пошуку');
    } finally {
      setLoading(false);
    }
  };

  const searchRentals = async () => {
    try {
      setLoading(true);
      setError('');
      const results = await searchService.searchRentals(rentalParams);
      setRentalResults(results);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка пошуку');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Пошук
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Розширений пошук по автомобілям, клієнтам та прокатам
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Автомобілі" />
          <Tab label="Клієнти" />
          <Tab label="Прокати" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              label="Марка"
              value={carParams.brand || ''}
              onChange={(e) => setCarParams({ ...carParams, brand: e.target.value || undefined })}
            />
            <TextField
              label="Модель"
              value={carParams.model || ''}
              onChange={(e) => setCarParams({ ...carParams, model: e.target.value || undefined })}
            />
            <TextField
              select
              label="Тип"
              value={carParams.type || ''}
              onChange={(e) => setCarParams({ ...carParams, type: e.target.value as any || undefined })}
              sx={{ minWidth: 120 }}
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Всі</option>
              <option value="economy">Економ</option>
              <option value="business">Бізнес</option>
              <option value="premium">Преміум</option>
            </TextField>
            <TextField
              label="Мін. ціна"
              type="number"
              value={carParams.minPrice || ''}
              onChange={(e) => setCarParams({ ...carParams, minPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            <TextField
              label="Макс. ціна"
              type="number"
              value={carParams.maxPrice || ''}
              onChange={(e) => setCarParams({ ...carParams, maxPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            <Button
              variant="contained"
              onClick={searchCars}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
            >
              Шукати
            </Button>
          </Box>

          {carResults && carResults.length > 0 && (
            <Grid container spacing={2}>
              {carResults.map((car) => (
                <Grid item xs={12} sm={6} md={4} key={car.id}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="150"
                      image={car.imageUrl ? (car.imageUrl.startsWith('http') ? car.imageUrl : car.imageUrl) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='}
                      alt={`${car.brand} ${car.model}`}
                      sx={{ backgroundColor: '#f0f0f0' }}
                      onError={(e: any) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                      }}
                    />
                    <CardContent>
                      <Typography variant="h6">{car.brand} {car.model}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {car.year} • {car.type}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {car.pricePerDay} ₴/день
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              label="Пошук клієнта"
              placeholder="Ім'я, телефон або адреса"
              value={clientQuery}
              onChange={(e) => setClientQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchClients()}
            />
            <Button
              variant="contained"
              onClick={searchClients}
              disabled={loading || !clientQuery.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
            >
              Шукати
            </Button>
          </Box>

          {clientResults && clientResults.length > 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>ПІБ</TableCell>
                    <TableCell>Телефон</TableCell>
                    <TableCell>Адреса</TableCell>
                    <TableCell>Дата реєстрації</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clientResults.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.id}</TableCell>
                      <TableCell>{client.fullName}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>{client.address}</TableCell>
                      <TableCell>
                        {new Date(client.registrationDate).toLocaleDateString('uk-UA')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              label="ID клієнта"
              type="number"
              value={rentalParams.clientId || ''}
              onChange={(e) => setRentalParams({ ...rentalParams, clientId: e.target.value ? parseInt(e.target.value) : undefined })}
            />
            <TextField
              label="ID автомобіля"
              type="number"
              value={rentalParams.carId || ''}
              onChange={(e) => setRentalParams({ ...rentalParams, carId: e.target.value ? parseInt(e.target.value) : undefined })}
            />
            <TextField
              select
              label="Статус"
              value={rentalParams.status || ''}
              onChange={(e) => setRentalParams({ ...rentalParams, status: e.target.value as any || undefined })}
              sx={{ minWidth: 150 }}
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Всі</option>
              <option value="active">Активний</option>
              <option value="completed">Завершений</option>
              <option value="cancelled">Скасований</option>
            </TextField>
            <Button
              variant="contained"
              onClick={searchRentals}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
            >
              Шукати
            </Button>
          </Box>

          {rentalResults && rentalResults.length > 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Клієнт</TableCell>
                    <TableCell>Автомобіль</TableCell>
                    <TableCell>Дата початку</TableCell>
                    <TableCell>Дата кінця</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Вартість</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rentalResults.map((rental) => (
                    <TableRow key={rental.id}>
                      <TableCell>{rental.id}</TableCell>
                      <TableCell>{rental.client?.fullName || 'Невідомо'}</TableCell>
                      <TableCell>
                        {rental.car ? `${rental.car.brand} ${rental.car.model}` : 'Невідомо'}
                      </TableCell>
                      <TableCell>
                        {new Date(rental.startDate).toLocaleDateString('uk-UA')}
                      </TableCell>
                      <TableCell>
                        {new Date(rental.expectedEndDate).toLocaleDateString('uk-UA')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rental.status === 'active' ? 'Активний' : rental.status}
                          color={rental.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{rental.totalCost} ₴</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default SearchPage;

