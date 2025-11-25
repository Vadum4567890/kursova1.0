# DTOs (Data Transfer Objects)

Ця папка містить Data Transfer Objects для відокремлення бізнес-логіки від представлення даних.

## Структура

```
dto/
├── requests/          # Request DTOs (вхідні дані)
├── responses/         # Response DTOs (вихідні дані)
├── mappers/           # Mappers для конвертації Entity <-> DTO
└── index.ts          # Центральний експорт
```

## Принципи

1. **Request DTOs** - використовуються для валідації та обробки вхідних даних
2. **Response DTOs** - використовуються для форматування вихідних даних (без паролів, з обчисленими полями)
3. **Mappers** - конвертують між Entity та DTO, забезпечуючи розділення шарів

## Приклади використання

### Car DTOs

```typescript
import { CreateCarDto, CarResponseDto, CarMapper } from '../dto';

// В контролері
const createCarDto: CreateCarDto = req.body;
const carEntity = CarMapper.fromCreateDto(createCarDto);
const car = await carService.createCar(carEntity);

// Повертаємо DTO замість Entity
const response: CarResponseDto = CarMapper.toResponseDto(car);
res.json(response);
```

### Rental DTOs

```typescript
import { CreateRentalDto, RentalResponseDto, RentalMapper } from '../dto';

// Створення rental
const createRentalDto: CreateRentalDto = {
  clientId: 1,
  carId: 2,
  startDate: new Date(),
  expectedEndDate: new Date('2024-12-31')
};

const rental = await rentalService.createRental(
  createRentalDto.clientId,
  createRentalDto.carId,
  new Date(createRentalDto.startDate),
  new Date(createRentalDto.expectedEndDate)
);

// Повертаємо DTO з повними зв'язками
const response: RentalResponseDto = RentalMapper.toResponseDto(rental);
res.json(response);
```

### User DTOs

```typescript
import { RegisterUserDto, UserResponseDto, UserMapper } from '../dto';

// Реєстрація користувача
const registerDto: RegisterUserDto = req.body;
const userEntity = UserMapper.fromRegisterDto(registerDto);
const user = await authService.register(userEntity);

// Повертаємо без пароля
const response: UserResponseDto = UserMapper.toResponseDto(user);
res.json({ user: response, token });
```

## Переваги DTOs

1. **Безпека** - не повертаємо паролі та інші чутливі дані
2. **Гнучкість** - можна додавати обчислені поля без зміни Entity
3. **Валідація** - чіткі типи для вхідних даних
4. **Розділення шарів** - контролери не залежать від Entity
5. **Версіонування API** - легко змінювати структуру без зміни Entity

## Наступні кроки

1. Оновити контролери для використання DTOs
2. Додати валідацію DTOs (class-validator)
3. Створити документацію API з прикладами DTOs

