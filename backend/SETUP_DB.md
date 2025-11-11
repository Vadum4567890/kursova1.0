# Налаштування бази даних

## Крок 1: Створення бази даних

Відкрийте pgAdmin або psql і виконайте:

```sql
CREATE DATABASE car_rental_db;
```

Або через командний рядок:

```bash
psql -U postgres
CREATE DATABASE car_rental_db;
\q
```

## Крок 2: Перевірка підключення

Файл `.env` вже налаштований з:
- Host: localhost
- Port: 5432
- Username: postgres
- Password: 1234
- Database: car_rental_db

## Крок 3: Запуск сервера

```bash
cd backend
npm run dev
```

Сервер автоматично створить таблиці при першому запуску (synchronize: true в development режимі).

## Крок 4: Перевірка Swagger

Після запуску сервера відкрийте:
- http://localhost:3000/api-docs

## Якщо виникають проблеми:

1. **Помилка підключення до БД:**
   - Перевірте, чи запущений PostgreSQL
   - Перевірте пароль в `.env`
   - Перевірте, чи існує база даних

2. **Таблиці не створюються:**
   - Перевірте права доступу користувача postgres
   - Перевірте логи сервера

