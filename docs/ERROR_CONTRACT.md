# Error Contract

Уніфікований формат помилок для всіх мікросервісів.

## Формат відповіді

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

## Коди помилок

### Client errors (4xx)

| Код | HTTP | Опис |
|-----|------|------|
| `VALIDATION_ERROR` | 400 | Помилка валідації вхідних даних |
| `BAD_REQUEST` | 400 | Невірний запит |
| `UNAUTHORIZED` | 401 | Не авторизований |
| `FORBIDDEN` | 403 | Доступ заборонений |
| `NOT_FOUND` | 404 | Ресурс не знайдений |
| `CONFLICT` | 409 | Конфлікт (напр. дублікат) |

### Server errors (5xx)

| Код | HTTP | Опис |
|-----|------|------|
| `INTERNAL_ERROR` | 500 | Внутрішня помилка сервера |
| `SERVICE_UNAVAILABLE` | 503 | Сервіс недоступний |
| `UPSTREAM_ERROR` | 502 | Помилка upstream сервісу |

## Приклади

### Validation error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": {
      "field": "email",
      "reason": "required"
    }
  }
}
```

### Not found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

### Upstream error
```json
{
  "success": false,
  "error": {
    "code": "UPSTREAM_ERROR",
    "message": "Car search failed",
    "details": "Connection timeout"
  }
}
```

## Використання в коді

### TypeScript
```typescript
import { AppError, ErrorCode } from '../shared/error';

// Throw error
throw new AppError(
  ErrorCode.NOT_FOUND,
  'User not found',
  { userId: '123' }
);

// In middleware
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.getStatus()).json(err.toResponse());
  }
  // Handle unknown errors
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
});
```

## Міграція існуючого коду

### Старий формат
```json
{
  "success": false,
  "error": { "message": "User not found" }
}
```

### Новий формат
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

## Статус міграції

- ✅ api-gateway
- ✅ search routes
- 🔄 user-service
- 🔄 car-service
- 🔄 rental-service
- 🔄 reporting-service
- 🔄 media-service

## Оновлено
- 2026-05-04: Фаза C, error contract
