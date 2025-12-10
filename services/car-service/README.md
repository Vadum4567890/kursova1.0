# 🚗 Car Service

Мікросервіс для управління автомобілями в системі прокату.

## 📋 Функціональність

- ✅ CRUD операції з автомобілями
- ✅ Управління фото (галерея, головне фото)
- ✅ Ціноутворення (погодинна, денна, тижнева, місячна)
- ✅ Календар доступності
- ✅ Документи на авто
- ✅ Особливості та зручності
- ✅ Пошук з фільтрами
- ✅ Geo-location search
- ✅ Kafka events

## 🚀 Швидкий старт

### Локальна розробка

```bash
# Встановити залежності
npm install

# Створити .env файл (скопіювати з .env.example)
cp .env.example .env

# Запустити в development режимі
npm run dev
```

### Docker

```bash
# Збілка та запуск
docker-compose up -d car-service

# Перевірка логів
docker logs -f car-rental-car-service
```

## 📡 API Endpoints

### Автомобілі

- `GET /api/cars` - список автомобілів (з фільтрами)
- `GET /api/cars/search` - пошук з фільтрами
- `GET /api/cars/:id` - деталі автомобіля
- `POST /api/cars` - створити автомобіль (owner)
- `PUT /api/cars/:id` - оновити автомобіль (owner)
- `DELETE /api/cars/:id` - видалити автомобіль (owner)
- `GET /api/cars/owner/:ownerId` - автомобілі орендодавця

### Фото

- `GET /api/cars/:id/images` - список фото
- `POST /api/cars/:id/images` - додати фото
- `PUT /api/cars/:id/images/:imageId/primary` - встановити головне фото

### Ціноутворення

- `POST /api/cars/:id/pricing` - створити/оновити ціни
- `PUT /api/cars/:id/pricing` - оновити ціни

## 🔧 Конфігурація

### Environment Variables

```env
PORT=3003
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=1234
DB_DATABASE=car_rental_db
KAFKA_BROKERS=localhost:9092
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_INDEX=cars
```

## 📊 Database Schema

Див. `docs/CAR_SERVICE_TPR.md` для детальної схеми бази даних.

## 🔗 Інтеграції

- **PostgreSQL** - основна база даних
- **Kafka** - event streaming
- **Elasticsearch** - пошук (в розробці)
- **Keycloak** - аутентифікація (в розробці)

## 📝 Kafka Events

### Publishes
- `car.created` - при створенні автомобіля
- `car.updated` - при оновленні
- `car.deleted` - при видаленні
- `car.image.added` - при додаванні фото
- `car.pricing.updated` - при зміні цін

### Consumes
- `rental.created` - для оновлення доступності
- `rental.completed` - для оновлення доступності
- `rental.cancelled` - для оновлення доступності

## 🧪 Тестування

```bash
# Unit тести
npm test

# З покриттям
npm run test:coverage
```

## 📚 Документація

- [TPR Document](../../docs/CAR_SERVICE_TPR.md) - детальні вимоги
- [Phase 2 Plan](../../docs/PHASE_2.md) - план розробки

## 🔍 Health Check

```bash
curl http://localhost:3003/health
```

## 📈 Моніторинг

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`

