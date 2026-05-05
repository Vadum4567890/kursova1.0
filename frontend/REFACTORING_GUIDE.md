# Frontend Refactoring Guide

Документ описує рефакторинг фронту для зменшення дублювання та покращення maintainability.

## Цілі

- Спільні hooks для пошуку та пагінації
- Уніфікована обробка помилок API
- Менше дублювання коду
- Передбачувані патерни для нових features

## Спільні Hooks

### usePagedResult

Для управління пагінованими результатами пошуку.

```typescript
import { usePagedResult } from '@/hooks';

function SearchComponent() {
  const {
    data,
    loading,
    error,
    pagination,
    setResults,
    goToPage,
    reset,
  } = usePagedResult<Car>({ initialLimit: 12 });

  const handleSearch = async (params) => {
    try {
      const results = await api.searchCars(params);
      setResults(results.cars, {
        total: results.total,
        page: results.page,
        limit: results.limit,
        totalPages: results.totalPages,
      });
    } catch (err) {
      // error автоматично встановлюється
    }
  };

  return (
    <>
      {loading && <Spinner />}
      {error && <Alert severity="error">{error}</Alert>}
      {data.map(car => <CarCard key={car.id} car={car} />)}
      <Pagination
        page={pagination.page}
        count={pagination.totalPages}
        onChange={(_, page) => goToPage(page)}
      />
    </>
  );
}
```

### useApiError

Для нормалізації помилок з різних API.

```typescript
import { useApiError } from '@/hooks';

function MyComponent() {
  const { extractError, getErrorMessage, isNetworkError } = useApiError();

  const handleRequest = async () => {
    try {
      await api.doSomething();
    } catch (error) {
      if (isNetworkError(error)) {
        showNotification('Network error');
      } else {
        const msg = getErrorMessage(error);
        showNotification(msg);
      }
    }
  };
}
```

## Міграція існуючого коду

### Поточний патерн пошуку (`useSearch` + `useSearchOperations`)

```typescript
const searchOps = useSearchOperations(); // всередині вже використовує useApiError для текстів помилок
const search = useSearch();

const handleSearchCars = () => {
  searchOps.searchCars({ ...search.carParams, page: 1 }, search.setLoading, search.setError);
};
```

### Новий патерн

```typescript
const { data, loading, error, pagination, setResults } = usePagedResult<Car>();
const { getErrorMessage } = useApiError();

const handleSearch = async (params) => {
  try {
    const results = await searchService.searchCars(params);
    setResults(results.cars, {
      total: results.total,
      page: results.page,
      limit: results.limit,
      totalPages: results.totalPages,
    });
  } catch (err) {
    // error автоматично встановлюється в usePagedResult
  }
};
```

## Статус міграції

- ✅ usePagedResult створений
- ✅ useApiError створений і підключений у `useSearchOperations`
- ✅ Клієнтська пагінація вкладок «Клієнти» / «Прокати» винесена в `usePagedSlice` (спільний slice + сторінка)
- 🔄 Інші екрани з пагінацією — поступово на спільні хуки

## Best Practices

1. **Використовуй usePagedResult** для всіх пагінованих списків
2. **Використовуй useApiError** для обробки помилок API
3. **Не дублюй** логіку пошуку та пагінації
4. **Типізуй** результати: `usePagedResult<Car>()`
5. **Обробляй** loading та error стани

## Оновлено
- 2026-05-05: `usePagedSlice` + чистка barrel (`search/`, `DataTable`, `WelcomeSection`); раніше — `useApiError` у `useSearchOperations`, видалено `FinancialReportDebug`
- 2026-05-04: Фаза D, frontend refactoring guide
