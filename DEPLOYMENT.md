# Інструкції з розгортання проекту

## Передумови

Перед початком роботи переконайтеся, що у вас встановлено:

- **Node.js** версії 18 або вище
- **PostgreSQL** версії 14 або вище
- **npm** або **yarn**
- **Git**

## Крок 1: Клонування репозиторію

```bash
git clone https://github.com/yourusername/kursova1.0.git
cd kursova1.0
```

## Крок 2: Встановлення залежностей

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd ../frontend
npm install
```

## Крок 3: Налаштування бази даних

### Встановлення PostgreSQL

Якщо PostgreSQL не встановлено:

**Windows:**
- Завантажте з [офіційного сайту](https://www.postgresql.org/download/windows/)
- Або використовуйте Chocolatey: `choco install postgresql`

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Створення бази даних

```bash
# Підключіться до PostgreSQL
psql -U postgres

# Створіть базу даних
CREATE DATABASE car_rental_db;

# Створіть користувача (опціонально)
CREATE USER car_rental_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE car_rental_db TO car_rental_user;

# Вийдіть
\q
```

## Крок 4: Налаштування змінних оточення

### Backend

Створіть файл `backend/.env` на основі `backend/.env.example`:

```bash
cd backend
cp .env.example .env
```

Відредагуйте `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=car_rental_db
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3001
```

### Frontend

Створіть файл `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

## Крок 5: Запуск міграцій

```bash
cd backend
npm run migration:run
```

Якщо міграції ще не створені, TypeORM автоматично створить таблиці в режимі development (synchronize: true).

## Крок 6: Запуск проекту

### Запуск Backend

Відкрийте термінал 1:

```bash
cd backend
npm run dev
```

Backend буде доступний на `http://localhost:3000`

### Запуск Frontend

Відкрийте термінал 2:

```bash
cd frontend
npm run dev
```

Frontend буде доступний на `http://localhost:3001`

## Перевірка роботи

1. Відкрийте браузер і перейдіть на `http://localhost:3001`
2. Перевірте API: `http://localhost:3000/health`
3. Перевірте базовий роут: `http://localhost:3000/`

## Розробка

### Створення нової міграції

```bash
cd backend
npm run migration:generate -- -n MigrationName
```

### Відкат міграції

```bash
cd backend
npm run migration:revert
```

### Збірка для production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## Вирішення проблем

### Помилка підключення до БД

1. Перевірте, чи запущений PostgreSQL:
   ```bash
   # Windows
   Get-Service postgresql*
   
   # Linux/macOS
   sudo systemctl status postgresql
   ```

2. Перевірте налаштування в `.env`

3. Перевірте права доступу користувача БД

### Помилка портів

Якщо порти 3000 або 3001 зайняті:

1. Змініть порт в `backend/.env` (PORT=3002)
2. Або змініть порт в `frontend/vite.config.ts`

### Помилки залежностей

```bash
# Видаліть node_modules та package-lock.json
rm -rf node_modules package-lock.json

# Перевстановіть залежності
npm install
```

## Docker (опціонально)

Якщо ви хочете використовувати Docker:

```bash
docker-compose up -d
```

Це запустить PostgreSQL в контейнері.

## Підтримка

Якщо виникли проблеми, перевірте:
- Логи в консолі
- Файл `.env` на правильність налаштувань
- Версії Node.js та PostgreSQL

---

**Успішного розгортання! 🚀**

