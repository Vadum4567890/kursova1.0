# План переходу на мікросервісну архітектуру

## Поточний стан

Система зараз працює **повністю на мікросервісах**, а backend виконує роль API Gateway/BFF.

### Що є зараз

- **Gateway (backend)** — додаток на порту 3000.
  - Не використовує монолітні таблиці `cars/rentals/penalties` для нових операцій.
  - Проксіює запити до мікросервісів:
    - `/api/cars/*` → car-service
    - `/api/users/*` → user-service
    - `/api/rentals/*` → rental-service (через BFF-роути `/my`, `/book` або прямий proxy)
    - `/api/penalties`, `/api/reports`, `/api/analytics` → reporting-service.
  - Залишає в собі лише допоміжні речі (`/api/auth`, `/api/clients`, `/api/search`, `/api/upload`).

- **User Service** (`services/user-service`, порт **3002**):
  - Окремий сервіс: користувачі з UUID, профіль, документи, рейтинг, Keycloak + Google Auth.
  - Таблиця `user_accounts`, ролі: renter / owner / both / admin.
  - Ендпоінти: `GET/PUT /api/users/me`, `GET /api/users/:id`, profile, documents, verify-diia.
  - Swagger, health, Kafka (заготовка), Redis (в docker-compose).
  - **Не інтегрований з монолітом** — моноліт має свою таблицю `users` і свій JWT.

- **Car Service** (`services/car-service`, порт **3003**):
  - Окремий сервіс: авто з **UUID**, `ownerId` (UUID), make/model/year, category (economy/comfort/premium/suv/luxury), ціноутворення, фото, availability, документи.
  - Окрема БД: `car_service_db` (у docker-compose).
  - Викликає **User Service** (UserServiceClient) для перевірки власника та профілю.
  - Kafka events: `car.created` тощо.
  - Ендпоінти: CRUD авто, search, images, pricing, owner.
  - **Не інтегрований з монолітом** — моноліт має свою таблицю `cars` (id number, інша схема).

- **Інфраструктура**:
  - `docker-compose.yml` — postgres, user-service, car-service, Kafka, Redis, Elasticsearch, Keycloak.
  - `kong/kong.yml` — маршрутизація на user-service та car-service (шляхи `/api/users`, `/api/cars`).

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

When **USE_MICROSERVICES=true**, the backend acts as an **API Gateway**: it does not implement cars, users, or rentals itself. All requests to `/api/cars`, `/api/users`, and `/api/rentals` are served by the corresponding microservices (via proxy or BFF routes).

### What the gateway does

- **Proxy** (no monolith logic for these):
  - `GET/POST/PUT/PATCH/DELETE /api/cars/*` → **car-service** (CAR_SERVICE_URL, default `http://localhost:3003`)
  - `GET/POST/PUT/DELETE /api/users/*` → **user-service** (USER_SERVICE_URL, default `http://localhost:3002`)
  - `GET/POST /api/rentals/*` → **rental-service** (RENTAL_SERVICE_URL, default `http://localhost:3004`)

- **Still implemented in the gateway** (single codebase, can be split into services later):
  - `/api/auth` — login, register, me (uses gateway DB `users` table)
  - `/api/clients` — client CRUD (gateway DB)
  - `/api/penalties` — penalty CRUD (gateway DB)
  - `/api/reports` — reports (gateway DB; may need refactor to aggregate from microservices)
  - `/api/analytics` — analytics (gateway DB; same note)
  - `/api/search` — search (gateway DB)
  - `/api/upload` — file uploads

### Env (backend/gateway)

```env
USE_MICROSERVICES=true
CAR_SERVICE_URL=http://localhost:3003
USER_SERVICE_URL=http://localhost:3002
RENTAL_SERVICE_URL=http://localhost:3004
```

### Run order

1. Start **user-service** (3002), **car-service** (3003), **rental-service** (3004).
2. Start **gateway** (backend with `USE_MICROSERVICES=true`) on 3000.
3. Point frontend to `http://localhost:3000/api`.

### Frontend

With microservices-only mode, responses for cars, users, and rentals come **directly from the microservices** (after proxy). That means:

- **Cars:** IDs are UUIDs; fields may use service names (e.g. `make`/`category`). The frontend already supports `car.id` as `number | string`.
- **Users:** IDs are UUIDs; API shape is user-service’s (e.g. `/api/users/me`, Keycloak tokens if you switch auth later). Admin user list and other user screens may need to be adapted to UUID and new DTOs.
- **Rentals:** IDs are UUIDs; `carId` and `renterUserId` are UUIDs. Rental list/detail may need to be updated to the rental-service response shape.

To **fully** remove the monolith you can later:

- Move auth to **user-service**/Keycloak and have the gateway only validate tokens and proxy.
- Move **clients**, **penalties**, **reports**, **analytics**, **search**, **upload** into dedicated microservices and have the gateway only proxy to them.
