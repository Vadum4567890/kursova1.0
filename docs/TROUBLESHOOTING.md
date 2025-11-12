# 🔧 Вирішення проблем

## Проблема: Зображення не відображаються

### Помилки:
- `ERR_CONNECTION_REFUSED` - Backend сервер не запущений
- `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin` - CORS проблема

### Рішення:

#### 1. Запустити Backend сервер:

```bash
cd backend
npm run dev
```

Сервер повинен запуститися на `http://localhost:3000`

#### 2. Перевірити що зображення завантажені:

```bash
cd backend
ls uploads/images/
```

Повинні бути файли:
- `toyota-corolla.jpg`
- `hyundai-elantra.jpg`
- `kia-rio.jpg`
- `bmw-3-series.jpg`
- `mercedes-c-class.jpg`
- `audi-a4.jpg`
- `bmw-x5.jpg`
- `mercedes-s-class.jpg`
- `porsche-cayenne.jpg`
- `toyota-camry.jpg`

Якщо файлів немає, запустіть:
```bash
npm run download-images
```

#### 3. Перезапустити Frontend (після змін в vite.config.ts):

```bash
cd frontend
npm run dev
```

#### 4. Перевірити CORS налаштування:

В `backend/src/index.ts` має бути:
```typescript
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
```

#### 5. Перевірити статичний сервер:

В `backend/src/index.ts` має бути:
```typescript
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

## Порядок запуску:

1. **Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Frontend (в новому терміналі):**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Перевірити:**
   - Backend: http://localhost:3000
   - Frontend: http://localhost:3001
   - Swagger: http://localhost:3000/api-docs

## Якщо зображення все ще не відображаються:

1. Перевірте консоль браузера (F12) на помилки
2. Перевірте Network tab - чи завантажуються зображення
3. Перевірте що backend сервер запущений
4. Перевірте що файли існують в `backend/uploads/images/`
5. Спробуйте відкрити зображення напряму: `http://localhost:3000/uploads/images/toyota-corolla.jpg`
