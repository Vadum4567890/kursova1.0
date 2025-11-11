# 🔐 Система аутентифікації

Система використовує JWT (JSON Web Tokens) для аутентифікації користувачів.

## 📋 Можливості

- Реєстрація нових користувачів
- Вхід в систему (login)
- JWT токени для захисту API
- Ролі користувачів (admin, manager, employee)
- Middleware для захисту роутів

## 👥 Ролі користувачів

- **admin** - Повний доступ до всіх функцій системи
- **manager** - Доступ до управління прокатом та звітами
- **employee** - Базовий доступ до створення та перегляду угод

## 🚀 API Endpoints

### Реєстрація

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@example.com",
  "password": "admin123",
  "fullName": "Admin User",
  "role": "admin"
}
```

**Відповідь:**
```json
{
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "fullName": "Admin User"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Вхід в систему

```http
POST /api/auth/login
Content-Type: application/json

{
  "usernameOrEmail": "admin",
  "password": "admin123"
}
```

**Відповідь:**
```json
{
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Отримати інформацію про поточного користувача

```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Відповідь:**
```json
{
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin",
    "fullName": "Admin User",
    "isActive": true
  }
}
```

## 🛡️ Захист роутів

### Базовий захист (потрібна аутентифікація)

```typescript
import { authenticate } from '../middleware/auth';

router.post('/api/cars', authenticate, carController.createCar);
```

### Захист з перевіркою ролі

```typescript
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User.entity';

// Тільки для адмінів
router.delete('/api/cars/:id', 
  authenticate, 
  authorize(UserRole.ADMIN), 
  carController.deleteCar
);

// Для адмінів та менеджерів
router.put('/api/cars/:id', 
  authenticate, 
  authorize(UserRole.ADMIN, UserRole.MANAGER), 
  carController.updateCar
);
```

### Комбінований middleware

```typescript
import { requireAuth } from '../middleware/auth';
import { UserRole } from '../models/User.entity';

// Тільки адміни
router.delete('/api/cars/:id', 
  ...requireAuth([UserRole.ADMIN]), 
  carController.deleteCar
);
```

## 📝 Використання токена

Після успішного логіну або реєстрації, збережіть токен і використовуйте його в заголовку `Authorization`:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔑 Тестові облікові записи

Після виконання seed скрипта (`npm run seed`), створюються наступні тестові користувачі:

- **Admin**: 
  - Username: `admin`
  - Password: `admin123`
  
- **Manager**: 
  - Username: `manager`
  - Password: `manager123`
  
- **Employee**: 
  - Username: `employee`
  - Password: `employee123`

## ⚙️ Налаштування

В `.env` файлі можна налаштувати:

```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
```

## 📚 Swagger документація

Повна документація API доступна за адресою:
```
http://localhost:3000/api-docs
```

В Swagger UI можна:
1. Переглянути всі endpoints
2. Протестувати реєстрацію та логін
3. Отримати токен
4. Використати кнопку "Authorize" для додавання токена до всіх запитів

## 🔒 Безпека

- Паролі хешуються за допомогою bcrypt (10 раундів)
- JWT токени мають термін дії (за замовчуванням 24 години)
- Валідація вхідних даних
- Перевірка активності облікового запису
- Захист від SQL ін'єкцій через TypeORM

