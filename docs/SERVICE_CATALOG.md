# Service Catalog

Активні мікросервіси платформи Car Rental.

## Активні сервіси

### API Gateway
- Path: `services/api-gateway`
- Port: `3000`
- Database: none
- Role: BFF, проксі, dev-auth, пошук, AI
- Depends on: user-service, car-service, rental-service, reporting-service, media-service
- Dev auth: `ENABLE_DEV_AUTH=true` (default у dev)
- Модульна структура: `auth/`, `routes/`, `proxy/`

### User Service
- Path: `services/user-service`
- Port: `3002`
- Database: `user_service_db`
- Role: користувачі, профілі, документи, рейтинги
- Key routes: `/api/users/*`, `/api/users/clients/*`, `/health`
- Міграції: `src/migrations/` (synchronize=false)

### Car Service
- Path: `services/car-service`
- Port: `3003`
- Database: `car_service_db`
- Role: авто, ціни, доступність, зображення
- Key routes: `/api/cars/*`, `/health`
- Міграції: `src/migrations/` (synchronize=false)

### Rental Service
- Path: `services/rental-service`
- Port: `3004`
- Database: `rental_service_db`
- Role: оренди, повідомлення, відгуки, штрафи
- Key routes: `/api/rentals/*`, `/health`
- WebSocket: підтримується
- Міграції: `src/migrations/` (synchronize=false)

### Media Service
- Path: `services/media-service`
- Port: `3006`
- Database: none
- Role: завантаження файлів
- Storage: Docker volume або локальна директорія

### Reporting Service
- Path: `services/reporting-service`
- Port: `3009`
- Database: `rental_service_db` (READ-ONLY)
- Role: аналітика, звіти, штрафи
- Key routes: `/api/penalties/*`, `/api/reports/*`, `/api/analytics/*`, `/health`
- Export: Excel, PDF

## Залежності між сервісами

```
api-gateway
  ├─> user-service (X-Service-Key)
  ├─> car-service (X-Service-Key)
  ├─> rental-service (X-Service-Key + WebSocket)
  ├─> reporting-service (X-Service-Key)
  └─> media-service (X-Service-Key)

rental-service
  └─> user-service (отримання клієнтів)
  └─> car-service (отримання авто)

reporting-service
  └─> rental_service_db (read-only, прямий доступ)
```

## Бази даних

### user_service_db
**Власник:** user-service  
**Таблиці:** user_accounts, user_profiles, user_documents, user_ratings  
**Міграції:** `services/user-service/src/migrations/`  
**synchronize:** false

### car_service_db
**Власник:** car-service  
**Таблиці:** cars, car_pricing, car_features, car_availability, car_images, car_documents, car_ratings  
**Міграції:** `services/car-service/src/migrations/`  
**synchronize:** false

### rental_service_db
**Власник:** rental-service  
**Читачі:** reporting-service (read-only)  
**Таблиці:** rentals, penalties, rental_messages, car_inquiry_messages, chat_read_cursors, reviews, review_scores  
**Міграції:** `services/rental-service/src/migrations/`  
**synchronize:** false

**Політика спільного доступу:**
- rental-service: повний доступ, власник схеми
- reporting-service: read-only, не виконує міграції
- Майбутнє: read replica або materialized views

## Автентифікація між сервісами

Всі внутрішні виклики використовують:
```
X-Service-Key: <SERVICE_API_KEY>
```

## Deprecated сервіси

### Client Service
- Path: `services/client-service`
- Port: `3007`
- Status: **DEPRECATED** - функціонал перенесено в user-service
- Видалити після міграції даних

### Search Service
- Path: `services/search-service`
- Port: `3005`
- Status: **DEPRECATED** - функціонал перенесено в api-gateway
- Видалити після підтвердження відсутності трафіку

## Frontend

- Path: `frontend`
- Port: `3001`
- Role: React client
- API base: `VITE_API_URL=http://localhost:3000/api`

## Operational Rules

- Backend verification: `npm run verify:backend`
- Full verification: `npm run verify:all`
- Health endpoints: всі сервіси мають `/health`
- Міграції: migration-first підхід, synchronize=false у всіх сервісах
- Docker: всі сервіси та БД у контейнерах (car-rental-postgres)

## Оновлено

2026-05-04
