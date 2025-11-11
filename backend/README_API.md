# API Documentation

## Swagger UI

Після запуску сервера, Swagger документація буде доступна за адресою:

**http://localhost:3000/api-docs**

## Швидкий старт

1. Встановіть залежності:
```bash
cd backend
npm install
```

2. Створіть файл `.env` (скопіюйте з `.env.example`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=car_rental_db
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3001
```

3. Запустіть сервер:
```bash
npm run dev
```

4. Відкрийте браузер:
- Swagger UI: http://localhost:3000/api-docs
- Health check: http://localhost:3000/health
- API Base: http://localhost:3000/

## Endpoints

### Cars
- `GET /api/cars` - Get all cars
- `GET /api/cars/available` - Get available cars
- `GET /api/cars/:id` - Get car by ID
- `GET /api/cars/type/:type` - Get cars by type
- `POST /api/cars` - Create new car
- `PUT /api/cars/:id` - Update car
- `PATCH /api/cars/:id/status` - Update car status
- `DELETE /api/cars/:id` - Delete car

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get client by ID
- `GET /api/clients/phone/:phone` - Get client by phone
- `POST /api/clients` - Create new client
- `POST /api/clients/register` - Register or get existing client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Rentals
- `GET /api/rentals` - Get all rentals
- `GET /api/rentals/active` - Get active rentals
- `GET /api/rentals/:id` - Get rental by ID
- `GET /api/rentals/client/:clientId` - Get rentals by client
- `GET /api/rentals/car/:carId` - Get rentals by car
- `POST /api/rentals` - Create new rental
- `POST /api/rentals/:id/complete` - Complete rental
- `POST /api/rentals/:id/cancel` - Cancel rental
- `POST /api/rentals/:id/penalty` - Add penalty to rental

### Penalties
- `GET /api/penalties` - Get all penalties
- `GET /api/penalties/:id` - Get penalty by ID
- `GET /api/penalties/rental/:rentalId` - Get penalties by rental
- `GET /api/penalties/rental/:rentalId/total` - Get total penalty amount
- `POST /api/penalties` - Create new penalty
- `DELETE /api/penalties/:id` - Delete penalty

### Reports
- `GET /api/reports/financial` - Generate financial report
- `GET /api/reports/occupancy` - Generate occupancy report
- `GET /api/reports/availability` - Generate availability report

## Тестування через Swagger

1. Відкрийте http://localhost:3000/api-docs
2. Розгорніть потрібний endpoint
3. Натисніть "Try it out"
4. Заповніть параметри (якщо потрібно)
5. Натисніть "Execute"
6. Перегляньте відповідь

## Приклади запитів

### Створити автомобіль
```json
POST /api/cars
{
  "brand": "Toyota",
  "model": "Camry",
  "year": 2023,
  "type": "business",
  "pricePerDay": 50,
  "deposit": 500,
  "description": "Comfortable sedan"
}
```

### Створити клієнта
```json
POST /api/clients
{
  "fullName": "Іван Іванов",
  "address": "вул. Хрещатик, 1",
  "phone": "+380501234567"
}
```

### Створити угоду прокату
```json
POST /api/rentals
{
  "clientId": 1,
  "carId": 1,
  "startDate": "2024-01-15T10:00:00Z",
  "expectedEndDate": "2024-01-20T10:00:00Z"
}
```

