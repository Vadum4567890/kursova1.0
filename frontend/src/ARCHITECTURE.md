# Frontend Architecture - Clean Architecture

## State Management

Проект використовує **TanStack Query (React Query) + Zustand** для досягнення clean architecture.

### Структура

```
frontend/src/
├── hooks/
│   └── queries/          # React Query hooks для всіх API викликів
│       ├── useCars.ts
│       ├── useRentals.ts
│       ├── useClients.ts
│       ├── usePenalties.ts
│       ├── useAnalytics.ts
│       ├── useReports.ts
│       ├── useSearch.ts
│       ├── useAuth.ts
│       └── index.ts
├── stores/               # Zustand stores для UI state
│   ├── uiStore.ts        # Діалоги, форми, фільтри
│   └── index.ts
├── utils/                # Бізнес-логіка та утиліти
│   ├── calculations.ts   # Підрахунки (ціни, депозити, дати)
│   ├── labels.ts         # Функції перекладу лейблів
│   └── index.ts
├── services/             # API сервіси (залишаються для типів)
└── lib/
    └── queryClient.ts    # Налаштування QueryClient
```

## TanStack Query (React Query)

Використовується для:
- ✅ Всіх API викликів
- ✅ Кешування даних
- ✅ Автоматична синхронізація
- ✅ Оптимістичні оновлення
- ✅ Retry логіка

### Приклад використання:

```typescript
// Замість:
const [cars, setCars] = useState<Car[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadCars = async () => {
    setLoading(true);
    try {
      const data = await carService.getAllCars();
      setCars(data);
    } finally {
      setLoading(false);
    }
  };
  loadCars();
}, []);

// Використовуємо:
const { data: cars, isLoading, error } = useCars();
```

### Mutations:

```typescript
// Замість:
const handleCreate = async () => {
  setSubmitting(true);
  try {
    await carService.createCar(formData);
    await loadCars(); // Manual refetch
  } finally {
    setSubmitting(false);
  }
};

// Використовуємо:
const createCar = useCreateCar();

const handleCreate = async () => {
  await createCar.mutateAsync(formData);
  // Автоматичний refetch всіх пов'язаних queries
};
```

## Zustand

Використовується для:
- ✅ UI state (діалоги, форми, фільтри)
- ✅ Локальний стан компонентів
- ✅ Стан, який не потребує серверної синхронізації

### Приклад використання:

```typescript
// Замість:
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [carToDelete, setCarToDelete] = useState<number | null>(null);

// Використовуємо:
const { deleteDialogOpen, deleteDialogItemId, openDeleteDialog, closeDeleteDialog } = useUIStore();

// Відкрити діалог:
openDeleteDialog(carId, 'car');

// Закрити діалог:
closeDeleteDialog();
```

## Бізнес-логіка (utils/calculations.ts)

Всі підрахунки винесені в окремі функції:

```typescript
import { calculateRentalPrice, calculateDeposit, formatCurrency } from '../utils';

// Замість:
const price = days * car.pricePerDay;
const deposit = car.deposit + (car.pricePerDay * 0.15 * (days - 1));

// Використовуємо:
const { price, deposit } = calculateTotalCost(days, car.pricePerDay, car.deposit);
const formattedPrice = formatCurrency(price);
```

## Міграція компонентів

### Крок 1: Замінити useState + useEffect на React Query hooks

```typescript
// Було:
const [cars, setCars] = useState<Car[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadCars();
}, []);

// Стало:
const { data: carsResponse, isLoading: loading, error } = useCars();
const cars = carsResponse?.data || [];
```

### Крок 2: Замінити прямі виклики сервісів на mutations

```typescript
// Було:
const handleSubmit = async () => {
  await carService.createCar(formData);
  await loadCars();
};

// Стало:
const createCar = useCreateCar();

const handleSubmit = async () => {
  await createCar.mutateAsync(formData);
  // Автоматичний refetch
};
```

### Крок 3: Винести підрахунки в utils

```typescript
// Було:
const price = days * car.pricePerDay;
const deposit = car.deposit + additionalDeposit;

// Стало:
import { calculateTotalCost } from '../utils';
const { price, deposit } = calculateTotalCost(days, car.pricePerDay, car.deposit);
```

### Крок 4: Використовувати Zustand для UI state

```typescript
// Було:
const [dialogOpen, setDialogOpen] = useState(false);

// Стало:
const { carFormOpen, setCarFormOpen } = useUIStore();
```

## Переваги цієї архітектури

1. **Separation of Concerns**: API логіка окремо від UI логіки
2. **Reusability**: Hooks можна використовувати в будь-якому компоненті
3. **Automatic Caching**: React Query автоматично кешує дані
4. **Optimistic Updates**: Можливість оновлювати UI до підтвердження від сервера
5. **Type Safety**: Повна типізація через TypeScript
6. **Testability**: Легко тестувати окремі функції та hooks
7. **Performance**: Мінімальні re-renders завдяки селекторам Zustand

## Наступні кроки

1. Мігрувати всі компоненти на нові hooks
2. Видалити старий код (useState + useEffect для API викликів)
3. Додати error boundaries для кращої обробки помилок
4. Додати loading states та skeletons

