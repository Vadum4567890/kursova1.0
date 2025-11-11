# Створення бази даних

## Помилка: database "car_rental_db" does not exist

База даних ще не створена. Виберіть один з варіантів:

## Варіант 1: Через pgAdmin

1. Відкрийте pgAdmin
2. Підключіться до PostgreSQL сервера
3. Клікніть правою кнопкою на "Databases"
4. Виберіть "Create" → "Database..."
5. Введіть назву: `car_rental_db`
6. Натисніть "Save"

## Варіант 2: Через SQL команду в pgAdmin

1. Відкрийте pgAdmin
2. Підключіться до PostgreSQL сервера
3. Відкрийте Query Tool (правка → Query Tool)
4. Виконайте:
```sql
CREATE DATABASE car_rental_db;
```

## Варіант 3: Через командний рядок (якщо psql в PATH)

```bash
psql -U postgres -c "CREATE DATABASE car_rental_db;"
```

Або:

```bash
psql -U postgres
CREATE DATABASE car_rental_db;
\q
```

## Перевірка створення

Після створення перевірте:

```sql
SELECT datname FROM pg_database WHERE datname = 'car_rental_db';
```

Якщо повертає рядок з `car_rental_db` - база створена успішно!

## Після створення

Перезапустіть сервер:
```bash
npm run dev
```

Сервер автоматично створить таблиці при першому підключенні (synchronize: true в development режимі).

