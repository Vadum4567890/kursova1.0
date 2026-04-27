# План переходу на мікросервісну архітектуру

## Поточний стан

Система працює **повністю на мікросервісах**. Окремого монолітного `backend` з TypeORM і спільною `car_rental_db` у цьому репозиторії **немає**; роль API Gateway/BFF виконує **`services/api-gateway`** (порт **3000**).

### Що є зараз

- **API Gateway** (`services/api-gateway`, порт **3000**):
  - Не підключається до монолітної БД.
  - Проксіює: `/api/users/*` → user-service, `/api/cars/*` → car-service, `/api/rentals/*` → rental-service.
  - Проксіює звіти та штрафи: `/api/penalties`, `/api/reports`, `/api/analytics` → **reporting-service** (`REPORTING_SERVICE_URL`, порт **3009**).
  - Локально реалізує лише **dev `/api/auth/*`** (JWT для сумісності з фронтом) та заглушки для `/api/clients`, `/api/search`, `/api/upload` (без доменних таблиць моноліту).

- **User Service** (`services/user-service`, порт **3002**): БД `user_service_db`, користувачі з UUID, профіль, внутрішні API.

- **Car Service** (`services/car-service`, порт **3003**): БД `car_service_db`, авто з UUID, `make`/`category`/pricing тощо.

- **Rental Service** (`services/rental-service`, порт **3004**): БД `rental_service_db`, прокати та бронювання (`POST /api/rentals/book`, `GET /api/rentals/me`).

- **Reporting Service** (`services/reporting-service`, порт **3009**): БД **`rental_service_db`** (ті самі оренди/штрафи, без монолітних таблиць).

- **Інфраструктура**: `docker-compose.yml` у корені — **PostgreSQL**, **api-gateway**, **user-service**, **car-service**, **rental-service**, **reporting-service**.

---

## Відмінності моделей (моноліт vs мікросервіси)

| Аспект        | Моноліт (backend)     | User Service       | Car Service            |
|---------------|------------------------|--------------------|-------------------------|
| User          | users (id, JWT ролі)  | user_accounts (UUID, Keycloak) | —                       |
| Car           | cars (id number, brand, type) | —          | cars (id UUID, make, category, ownerId) |
| БД            | car_rental_db         | car_rental_db      | car_service_db          |

Монолітні моделі в gateway збережені лише для зворотної сумісності (наприклад, клієнти), але **cars/users/rentals** тепер обслуговуються тільки мікросервісами.

---

## Варіанти подальшого руху

### Варіант A: Додати Rental Service (наступний мікросервіс)

- Винести прокати, штрафи та пов’язану логіку в окремий сервіс.
- Rental Service спілкується з Car Service (чи авто доступне, оновлення статусу) та User Service (хто орендар/власник) через HTTP або події (Kafka).
- Моноліт поступово стає API Gateway або тільки адмін-функції (звіти, аналітика).

### Варіант B: Підключити моноліт до мікросервісів (Strangler Fig)

- Залишити фронт як є (один API).
- У моноліті:
  - Додати **CarServiceProxy** (реалізує `ICarService`): при викликах йде в car-service (HTTP), дані мапляться з UUID/ make/category у формат моноліту (id, brand, model, type) для сумісності з існуючими екранами.
  - Аналогічно **UserServiceProxy** для профілю/користувачів з user-service (наприклад, для екранів «профіль» або «власник авто»).
- Увімкнути проксі через feature flag або конфіг (наприклад, `USE_CAR_MICROSERVICE=true`), щоб можна було перемикатися назад на локальний CarService.
- Крок за кроком переносити доменні операції в мікросервіси і зменшувати дублювання в моноліті.

### Варіант C: Фронт напряму до мікросервісів

- Налаштувати API base URL або Kong так, щоб:
  - `/api/cars/*` йшло на car-service,
  - `/api/users/*` (профіль, документи) — на user-service,
  - решта (rentals, clients, reports) — на моноліт.
- Потрібно узгодити формат даних (наприклад, фронт очікує `id: number` для авто, а car-service повертає UUID) — або змінити фронт під нову модель, або додати BFF/Gateway, який мапить відповіді.

---

## Рекомендований порядок кроків (продовження)

1. **Зафіксувати поточний стан** (цей документ) — виконано.
2. **Вирішити стратегію**: A (Rental Service), B (проксі в моноліті), або C (фронт на мікросервіси). Для мінімальних змін у фронті найбезпечніший варіант **B**.
3. **Якщо B**:
   - Реалізувати в моноліті `CarServiceProxy` (HTTP-клієнт до car-service), маппінг UUID ↔ внутрішній формат (або тимчасово лишати два типи id).
   - У `serviceRegistry` зареєструвати проксі замість локального CarService при `USE_CAR_MICROSERVICE=true`.
   - Потім аналогічно проксі для User Service для обраних ендпоінтів.
4. **Якщо A**:
   - Створити `services/rental-service`, перенести Rental, Penalty, логіку з RentalService.
   - Підключити до car-service (доступність авто) та user-service (користувачі), БД для rental-service або спільна схема.
5. **Синхронізація даних**: поки моноліт і car-service мають різні таблиці `cars`, потрібна або подвійна запис (моноліт + car-service), або один source of truth. При повному переході на car-service — міграція даних з монолітної `cars` у car_service_db і вимкнення запису в моноліт.

---

## Швидка перевірка user-service та car-service

- **User Service**  
  - Запуск: `cd services/user-service && npm install && npm run dev` (порт 3002).  
  - Перевірка: `GET http://localhost:3002/health`, `GET http://localhost:3002/api-docs` (Swagger).  
  - База: та сама postgres, окрема таблиця `user_accounts`; переконатися, що міграції/синхронізація TypeORM виконані.

- **Car Service**  
  - Запуск: `cd services/car-service && npm install && npm run dev` (порт 3003).  
  - Перевірка: `GET http://localhost:3003/health`, `GET http://localhost:3003/api/cars`.  
  - База: `car_service_db` (окрема БД у postgres).  
  - Для створення авто потрібен валідний `ownerId` (UUID) з user-service; якщо user-service не запущений або порожній — create car може падати з "Invalid owner".

---

## Rental Service (варіант A) — реалізовано

Додано мікросервіс **rental-service** (`services/rental-service`, порт **3004**):

- **Модель:** прокати з UUID, `carId` (UUID), `renterUserId` (UUID), дати, суми, статус (active/completed/cancelled); таблиця `penalties`.
- **БД:** `rental_service_db` (окрема).
- **Клієнти:** викликає Car Service (авто, ціни, `PATCH /api/cars/:id/status`) та User Service (перевірка орендаря).
- **API:** CRUD-подібні ендпоінти для прокатів, завершення, скасування, зайняті дати по авто.
- **Kafka:** події `rental.created`, `rental.completed`, `rental.cancelled`.
- **Car Service:** додано статус `RENTED` та ендпоінт `PATCH /api/cars/:id/status` (для викликів з rental-service по `X-Service-Key`).

Фронт і моноліт поки що **не** переключені на rental-service — він готовий до інтеграції (наприклад, через API Gateway або проксі в моноліті).

---

## Крок 2: Проксі до Car Service (варіант B — Strangler Fig)

У моноліті додано інтеграцію з **car-service** через проксі:

- **CarServiceClient** (`backend/src/clients/CarServiceClient.ts`) — HTTP-клієнт до car-service (fetch). Змінні оточення: `CAR_SERVICE_URL` (за замовчуванням `http://localhost:3003`), `SERVICE_API_KEY`.
- **CarServiceProxy** (`backend/src/services/CarServiceProxy.ts`) — реалізує `ICarService`: операції читання (`getAllCars`, `getAvailableCars`, `getCarById`, `getCarsByType`) виконуються через car-service з маппінгом (make→brand, category→type, pricing.dailyRate→pricePerDay). При помилці або таймауті — fallback на локальний CarService. Записи (create/update/delete) та `getCarsByOwnerId` залишаються на локальному сервісі.
- **Увімкнення:** у `.env` моноліту встановити `USE_CAR_MICROSERVICE=true`. Тоді реєстр сервісів віддає проксі замість лише локального CarService.
- **ID:** каталог з car-service повертає авто з `id` типу UUID (string). Моноліт приймає в `GET /api/cars/:id` як числовий id, так і UUID; фронт підтримує `car.id: number | string`.

**Як перевірити:** запустити car-service (порт 3003), у моноліті встановити `USE_CAR_MICROSERVICE=true` та `CAR_SERVICE_URL=http://localhost:3003`, перезапустити моноліт. Каталог авто (`GET /api/cars`) має віддавати авто з car-service (якщо там є дані). «Мої авто» та створення авто продовжують працювати через локальну БД.

---

## Крок 3: Інтеграція з User Service (варіант B — Strangler Fig)

У моноліті додано **читання** даних з user-service за UUID (для відображення власника авто тощо):

- **UserServiceClient** (`backend/src/clients/UserServiceClient.ts`) — HTTP-клієнт до user-service: `getUserById(uuid)`, `getUserProfile(uuid)`. Змінні: `USER_SERVICE_URL` (за замовчуванням `http://localhost:3002`), `SERVICE_API_KEY`.
- **User-service:** додано middleware `internalOrAuth`: для `GET /api/users/:id` та `GET /api/users/:id/profile` дозволено або Bearer (Keycloak), або валідний `X-Service-Key` (внутрішні виклики від моноліту та car-service).
- **Маршрут у моноліті:** `GET /api/users/by-uuid/:uuid` (authenticate) — повертає користувача та профіль з user-service. Працює лише при `USE_USER_MICROSERVICE=true`; інакше 404.

**Увімкнення:** у `.env` моноліту встановити `USE_USER_MICROSERVICE=true`, `USER_SERVICE_URL=http://localhost:3002`. У user-service має бути той самий `SERVICE_API_KEY` для X-Service-Key.

---

## Step 4: Integration with Rental Service (Strangler Fig)

The monolith can **read** booked dates from rental-service when the car comes from car-service (UUID):

- **RentalServiceClient** (`backend/src/clients/RentalServiceClient.ts`) — HTTP client to rental-service: `getBookedDates(carId: string)` calling `GET /api/rentals/car/:carId/booked-dates`. Env: `RENTAL_SERVICE_URL` (default `http://localhost:3004`), `SERVICE_API_KEY`.
- **getBookedDates behaviour:** For numeric car id, the existing monolith rental service is used. For UUID car id (car from car-service), when `USE_RENTAL_MICROSERVICE=true` the monolith calls rental-service and returns the same shape `[{ startDate, endDate }]`; otherwise it returns `[]`.

**Enable:** In monolith `.env` set `USE_RENTAL_MICROSERVICE=true`, `RENTAL_SERVICE_URL=http://localhost:3004`. Run rental-service on port 3004. Then `GET /api/cars/:id/booked-dates` with a UUID `id` returns booked dates from rental-service so the booking calendar works for cars served by car-service.

**Next:** Optional — proxy more rental operations (e.g. list rentals by renter, create booking) to rental-service with request/response mapping.

---

## Step 5: Microservices-only mode (current)

Репозиторій використовує **`services/api-gateway`** як BFF: доменні `/api/cars`, `/api/users`, `/api/rentals` проксуються; `/api/penalties`, `/api/reports`, `/api/analytics` — у **reporting-service** (`REPORTING_SERVICE_URL`). Монолітний backend з `car_rental_db` у складі проєкту відсутній.

### Змінні оточення gateway

```env
PORT=3000
CAR_SERVICE_URL=http://localhost:3003
USER_SERVICE_URL=http://localhost:3002
RENTAL_SERVICE_URL=http://localhost:3004
REPORTING_SERVICE_URL=http://localhost:3009
```

### Порядок запуску

1. **user-service** (3002), **car-service** (3003), **rental-service** (3004), **reporting-service** (3009).
2. **api-gateway** (3000).
3. Фронтенд: `VITE_API_URL=http://localhost:3000/api`.

Деталі маршрутів: [`services/api-gateway/README_API.md`](../services/api-gateway/README_API.md).

### Подальші кроки (опційно)

- Перенести `/api/auth` на user-service / Keycloak.
- Реалізувати clients / search / upload окремими сервісами або storage замість заглушок у gateway.
