# API Gateway / BFF

Єдиний HTTP-вхід для фронтенду (`VITE_API_URL`, зазвичай `http://localhost:3000/api`). Монолітний Node/TypeORM backend **не використовується**; доменні дані розподілені по мікросервісах.

## Порти та змінні оточення

| Змінна | За замовчуванням | Опис |
|--------|------------------|------|
| `PORT` | `3000` | Порт gateway |
| `CORS_ORIGIN` | `http://localhost:3001` | Origin фронтенду (Vite) |
| `JWT_SECRET` | (dev fallback у коді) | Підпис dev JWT для `/api/auth/*` |
| `USER_SERVICE_URL` | `http://localhost:3002` | user-service |
| `CAR_SERVICE_URL` | `http://localhost:3003` | car-service |
| `RENTAL_SERVICE_URL` | `http://localhost:3004` | rental-service |
| `REPORTING_SERVICE_URL` | `http://localhost:3009` | reporting-service (штрафи, звіти, аналітика) |
| `SEARCH_SERVICE_URL` | `http://localhost:3005` | search-service (агрегований пошук) |
| `MEDIA_SERVICE_URL` | `http://localhost:3006` | media-service (завантаження зображень) |
| `CLIENT_SERVICE_URL` | `http://localhost:3007` | client-service (клієнти пункту прокату) |

У Docker імена хостів збігаються з назвами сервісів у `docker-compose.yml`.

## Маршрути

- **`/api/auth/*`** — локальний dev-логін/реєстрація та JWT (сумісність зі старим фронтом).
- **`/api/users/*`** → user-service.
- **`/api/cars/*`** → car-service.
- **`/api/rentals/*`** → rental-service; окремо **`/api/rentals/my`** проксується як **`/api/rentals/me`** у rental-service.
- **`/api/analytics/*`**, **`/api/reports/*`**, **`/api/penalties/*`** → reporting-service (БД `rental_service_db`).
- **`/api/search/*`** → search-service (викликає car / rental / client за потреби).
- **`/api/upload/*`** → media-service (локальне сховище файлів; у Docker — volume).
- **`/api/clients/*`** → client-service (БД `client_service_db`).

## Запуск

```bash
cd services/api-gateway
npm install
npm run dev
```

`npm run dev` лише проксує на microservices (`localhost:3002`…`3009`); відповідні сервіси мають бути запущені (наприклад `docker compose up -d` з кореня репозиторію).

Повна збірка через Docker: з кореня репозиторію `docker compose up --build` (див. кореневий `docker-compose.yml`).
