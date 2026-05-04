# Фаза E: Видалення legacy (завершено)

Колишні `client-service` та `search-service` **прибрані** з репозиторію. Клієнти — у `user-service`; агрегований пошук `/api/search/*` — у `api-gateway`.

## Чеклист (виконано / залишилось)

### Перед видаленням
- [x] Міграція клієнтських даних: `npm run migrate:clients` (на реальних даних — окремо в кожному середовищі)
- [x] Пошук і клієнти в `api-gateway` + `user-service`
- [x] `docker-compose` без client/search сервісів
- [x] Немає пакетів/імпортів, що вимагали б окремих репо-папок (verify — `npm run verify:backend`)

### Видалення
- [x] Каталоги `services/client-service` та `services/search-service` видалені
- [x] Оновлено `SERVICE_CATALOG.md`, `ARCHITECTURE_REFACTORING_PLAN.md`, кореневий `README`

### Після видалення
- [ ] На проді: прогнати міграцію клієнтів і smoke-тести пошуку/клієнтів

## Статус

✅ Репозиторій без legacy-сервісних директорій; скрипт `scripts/verify-legacy-services.ps1` залишено як no-op (друкує нагадування), `npm run verify:legacy` **прибрано** з `package.json` — використовуй `npm run verify:backend`.

*Оновлено: 2026-05-05*
