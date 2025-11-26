# Unit Tests

Цей каталог містить unit тести для backend сервісів та patterns.

## Структура

```
__tests__/
├── setup.ts                    # Налаштування перед запуском тестів
├── services/
│   ├── RentalService.test.ts   # Тести для RentalService (з edge cases)
│   ├── CarService.test.ts      # Тести для CarService
│   └── AuthService.test.ts    # Тести для AuthService
└── patterns/
    ├── PricingStrategy.test.ts # Тести для всіх pricing стратегій
    └── RentalBuilder.test.ts   # Тести для RentalBuilder pattern
```

## Запуск тестів

### Запустити всі тести
```bash
npm test
```

### Запустити тести з покриттям
```bash
npm test -- --coverage
```

### Запустити конкретний тест файл
```bash
npm test -- RentalService.test.ts
```

### Запустити тести в watch mode
```bash
npm test -- --watch
```

### Запустити тести з детальним виводом
```bash
npm test -- --verbose
```

## Покриття тестами

Тести покривають наступні core features та edge cases:

### RentalService
- ✅ Створення прокату (з валідацією дат)
- ✅ Завершення прокату (on-time, early, late)
- ✅ Скасування прокату (до початку, після початку)
- ✅ Edge cases:
  - Прокат в той самий день як початок
  - Перевірка накладання дат
  - Автомобіль на обслуговуванні
  - Інші активні прокати для того ж автомобіля

### PricingStrategy
- ✅ BasePricingStrategy (простий розрахунок)
- ✅ YearBasedPricingStrategy (множники за віком авто)
- ✅ DurationBasedPricingStrategy (знижки за тривалість)
- ✅ CombinedPricingStrategy (комбінована стратегія)
- ✅ PricingContext (контекст для зміни стратегій)

### RentalBuilder
- ✅ Fluent interface (ланцюжок методів)
- ✅ Розрахунок депозиту (базовий + додатковий)
- ✅ Валідація обов'язкових полів
- ✅ Значення за замовчуванням
- ✅ Reset для повторного використання

### CarService
- ✅ Отримання всіх автомобілів (з пагінацією та фільтрами)
- ✅ CRUD операції
- ✅ Парсинг imageUrls з JSON
- ✅ Фільтрація за типом, статусом, брендом

### AuthService
- ✅ Реєстрація користувача
- ✅ Логін (username або email)
- ✅ Валідація токенів
- ✅ Edge cases:
  - Дублікати username/email
  - Неправильний пароль
  - Неактивний акаунт
  - Невалідний токен

## Технології

- **Jest** - тестовий фреймворк
- **ts-jest** - TypeScript підтримка для Jest
- **Mocking** - використання jest.fn() для мокування залежностей

## Написання нових тестів

При написанні нових тестів дотримуйтесь наступних принципів:

1. **Один тест = одна перевірка** - кожен тест має перевіряти одну конкретну функціональність
2. **Edge cases** - завжди тестуйте граничні випадки
3. **Mocking** - мокуйте всі зовнішні залежності (репозиторії, сервіси)
4. **Очищення** - використовуйте `beforeEach` та `afterEach` для очищення моків
5. **Назви тестів** - використовуйте описові назви, які пояснюють що тестується

### Приклад структури тесту:

```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let mockRepository: jest.Mocked<IRepository>;

  beforeEach(() => {
    // Setup mocks
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something successfully', async () => {
      // Arrange
      // Act
      // Assert
    });

    it('should throw error when something is wrong', async () => {
      // Test error case
    });
  });
});
```

## Покриття коду

Після запуску тестів з `--coverage`, звіт буде доступний в:
- `coverage/lcov-report/index.html` - HTML звіт
- `coverage/lcov.info` - LCOV формат для інтеграції з CI/CD

## CI/CD Integration

Тести можна інтегрувати в CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test -- --coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

