# Політика доступу до баз даних

Документ описує власність, доступ та еволюцію схем БД у мікросервісній архітектурі.

## Принципи

1. **Одна БД — один власник**: кожна БД належить одному сервісу, який виконує всі міграції.
2. **Read-only доступ**: інші сервіси можуть читати, але не писати (окрім власника).
3. **Явна політика**: всі винятки документуються з причиною та датою.
4. **Migration-first**: схема еволюціонує через міграції, не через `synchronize`.

---

## Активні БД

### user_service_db
- **Власник**: user-service
- **Таблиці**: user_accounts, user_profiles, user_documents, user_ratings
- **Читачі**: api-gateway (через user-service), rental-service (через user-service)
- **Міграції**: `services/user-service/src/migrations/`
- **Статус**: ✅ migration-first, synchronize=false

### car_service_db
- **Власник**: car-service
- **Таблиці**: cars, car_pricing, car_features, car_availability, car_images, car_documents, car_ratings
- **Читачі**: api-gateway (через car-service), rental-service (через car-service)
- **Міграції**: `services/car-service/src/migrations/`
- **Статус**: ✅ migration-first, synchronize=false

### rental_service_db
- **Власник**: rental-service
- **Таблиці**: rentals, penalties, rental_messages, car_inquiry_messages, chat_read_cursors, reviews, review_scores
- **Читачі**: reporting-service (read-only, прямий доступ)
- **Міграції**: `services/rental-service/src/migrations/`
- **Статус**: ✅ migration-first, synchronize=false

---

## Спільний доступ: reporting-service → rental_service_db

### Поточна ситуація
- reporting-service читає `rental_service_db` напряму (не через API rental-service)
- Це дозволяє швидкі аналітичні запити без додаткових RPC

### Політика
1. **Read-only**: reporting-service виконує тільки SELECT запити
2. **Без міграцій**: reporting-service НЕ запускає міграції на rental_service_db
3. **Явні views** (майбутнє): якщо запити стають складними, створити materialized views у rental_service_db
4. **Моніторинг**: rental-service повинен знати про читачів (документувати в коді)

### Реалізація
```typescript
// reporting-service/src/database/data-source.ts
// Читає rental_service_db, але НЕ запускає міграції
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.RENTAL_DB_HOST,
  port: parseInt(process.env.RENTAL_DB_PORT || '5432'),
  database: process.env.RENTAL_DB_NAME,
  username: process.env.RENTAL_DB_USER,
  password: process.env.RENTAL_DB_PASSWORD,
  entities: ['src/entities/**/*.ts'],
  migrations: [], // ← ВАЖЛИВО: без міграцій
  migrationsRun: false,
  synchronize: false,
});
```

---

## Deprecated БД

### client_service_db
- **Статус**: DEPRECATED
- **План**: міграція даних у user_service_db, потім видалення
- **Дата видалення**: після підтвердження міграції (Фаза B)

### search_service_db
- **Статус**: DEPRECATED
- **План**: функціонал перенесено в api-gateway, видалити після перевірки трафіку
- **Дата видалення**: після Фази E

---

## Міграції: процес

### Для власника БД (напр. rental-service)
```bash
# Генерувати міграцію
npm run migration:generate -- -n AddNewField

# Запустити міграції
npm run migration:run

# Откатити останню
npm run migration:revert
```

### Для читача БД (напр. reporting-service)
- **НЕ запускати** міграції
- Читати сутності як read-only
- Якщо потрібна нова таблиця — попросити у власника

---

## Контроль доступу

### На рівні БД (PostgreSQL)
```sql
-- reporting-service має read-only доступ
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reporting_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO reporting_user;
```

### На рівні коду
- reporting-service: тільки SELECT запити, без INSERT/UPDATE/DELETE
- Перевіряти в code review

---

## Оновлено
- 2026-05-04: Фаза B, політика спільної БД
