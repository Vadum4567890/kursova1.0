# Інструкція з запуску сервера

## Швидкий запуск:

```bash
cd backend
npm run dev
```

## Перевірка:

1. **Swagger UI:** http://localhost:3000/api-docs
2. **Health Check:** http://localhost:3000/health
3. **API Base:** http://localhost:3000/

## Якщо сервер не запускається:

1. Перевірте, чи запущений PostgreSQL
2. Перевірте файл `.env` - чи правильний пароль (1234)
3. Перевірте, чи створена база даних `car_rental_db`
4. Перевірте логи в консолі - там будуть помилки, якщо щось не так

## Створення бази даних (якщо ще не створена):

Відкрийте pgAdmin або psql і виконайте:
```sql
CREATE DATABASE car_rental_db;
```

## Налаштування .env:

Файл `.env` має містити:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=1234
DB_DATABASE=car_rental_db
PORT=3000
NODE_ENV=development
```

