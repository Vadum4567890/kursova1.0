# 👤 User Service

Мікросервіс для управління користувачами, профілями, документами та рейтингами.

## 🏗️ Архітектура

```
user-service/
├── src/
│   ├── config/          # Конфігурація
│   ├── database/         # TypeORM setup
│   ├── entities/         # TypeORM entities
│   ├── repositories/     # Data access layer
│   ├── services/         # Business logic
│   ├── controllers/      # HTTP handlers
│   ├── dto/              # Data Transfer Objects
│   ├── middleware/       # Express middleware
│   ├── kafka/            # Kafka producer/consumer
│   ├── utils/            # Utilities
│   └── index.ts          # Entry point
├── tests/                # Tests
├── .env.example          # Environment variables example
├── package.json
├── tsconfig.json
└── Dockerfile
```

## 🚀 Швидкий старт

### 1. Встановлення залежностей

```bash
cd services/user-service
npm install
```

### 2. Налаштування .env

Створіть `.env` файл:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=1234
DB_DATABASE=car_rental_db

# Auth (JWT issued by user-service)
JWT_SECRET=dev-user-service-secret
JWT_EXPIRES_IN=24h

# Kafka
KAFKA_BROKER=localhost:9092

# Redis (для кешування)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Запуск

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 📡 API Endpoints

### User Management

- `GET /api/users/me` - Отримати поточного користувача
- `PUT /api/users/me` - Оновити профіль
- `GET /api/users/:id` - Отримати користувача за ID
- `GET /api/users/:id/profile` - Отримати профіль користувача

### Documents

- `POST /api/users/documents` - Додати документ
- `GET /api/users/documents` - Список документів користувача
- `GET /api/users/documents/:id` - Отримати документ
- `DELETE /api/users/documents/:id` - Видалити документ

### Verification

- `POST /api/users/verify-diia` - Верифікація через Дія API
- `POST /api/users/verify-document/:id` - Верифікація документа (admin)

### Ratings

- `GET /api/users/:id/rating` - Отримати рейтинг користувача
- `GET /api/users/:id/reviews` - Список відгуків про користувача

## 🔄 Kafka Events

### Published Events

- `user.created` - при створенні нового користувача
- `user.verified` - при верифікації користувача
- `user.updated` - при оновленні профілю

### Consumed Events

- `review.created` - для оновлення рейтингу користувача

## 🗄️ Database

Використовує PostgreSQL з таблицями:
- `users`
- `user_profiles`
- `user_documents`
- `user_ratings`

## 🔐 Security

- JWT токени, які видає user-service (Google login → user-service JWT)
- Валідація вхідних даних
- Rate limiting через Kong Gateway

## 🧪 Testing

```bash
npm test
npm run test:watch
npm run test:coverage
```

