# Rental Service

Мікросервіс для управління прокатами (бронювання, завершення, скасування).

## Залежності

- **Car Service** — перевірка авто, ціноутворення, оновлення статусу (rented/active).
- **User Service** — перевірка орендаря (renter) перед створенням прокату.

## Локальний запуск

```bash
cd services/rental-service
cp .env.example .env
npm install
npm run dev
```

Сервіс слухає порт **3004**.

## База даних

Окрема БД: `rental_service_db`. Таблиці: `rentals`, `penalties`. TypeORM `synchronize: true` у development створить схему при старті.

## API

- `GET /api/rentals` — усі прокати
- `GET /api/rentals/active` — активні прокати
- `GET /api/rentals/:id` — прокат за ID
- `GET /api/rentals/car/:carId` — прокати по авто
- `GET /api/rentals/car/:carId/booked-dates` — зайняті дати для авто
- `GET /api/rentals/renter/:renterId` — прокати по орендарю
- `POST /api/rentals` — створити прокат (body: carId, renterUserId, startDate, expectedEndDate)
- `POST /api/rentals/:id/complete` — завершити (body: optional actualEndDate)
- `POST /api/rentals/:id/cancel` — скасувати (body: optional cancellationDate)

## Kafka

Події: `rental.created`, `rental.completed`, `rental.cancelled`.

## Docker

```bash
docker-compose up -d rental-service
```
