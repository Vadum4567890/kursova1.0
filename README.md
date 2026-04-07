# Car Rental Platform

Microservices-based course project for car rental operations, booking flows, and financial reporting.

## Active Architecture

Primary runtime topology:

- `api-gateway` on `3000`
- `user-service` on `3002`
- `car-service` on `3003`
- `rental-service` on `3004`
- `media-service` on `3006`
- `reporting-service` on `3009`
- `frontend` on `3001`

Deprecated but still present in the repo:

- `client-service`
- `search-service`

Those two services are no longer required in the main request path:

- client compatibility is handled by `user-service`
- aggregated search compatibility is handled by `api-gateway`

## Responsibilities

- `api-gateway`: single frontend entry point, proxy/BFF, compatibility search routes, dev auth fallback
- `user-service`: users, renter/client profile data, documents, ratings
- `car-service`: cars, pricing, images metadata, availability
- `rental-service`: bookings, rentals, lifecycle transitions
- `reporting-service`: penalties, analytics, revenue calculations, reports
- `media-service`: uploads and file serving

## Quick Start

Recommended:

```bash
docker compose up --build
```

Then run the frontend separately:

```bash
cd frontend
npm install
npm run dev
```

Frontend API base:

```env
VITE_API_URL=http://localhost:3000/api
```

## Verification

Active runtime verification:

```powershell
npm run verify:backend
```

Legacy service verification:

```powershell
npm run verify:legacy
```

Full workspace verification:

```powershell
npm run verify:all
```

Note: in the current restricted environment the frontend build may fail with `spawn EPERM`.

## Client Data Migration

To migrate legacy `client_service_db` rows into `user_service_db`:

```powershell
npm --prefix services/user-service run migrate:clients
```

Optional source overrides:

- `CLIENT_DB_HOST`
- `CLIENT_DB_PORT`
- `CLIENT_DB_USERNAME`
- `CLIENT_DB_PASSWORD`
- `CLIENT_DB_DATABASE`

The script is idempotent by phone/email and upgrades matching users to renter-compatible records.

## Reporting Exports

`reporting-service` now supports:

- richer financial report payloads with transaction rows and timeline data
- Excel export: `GET /api/reports/financial/export?format=xlsx`
- PDF export: `GET /api/reports/financial/export?format=pdf`

The frontend reports page exposes both export actions once a financial report has been generated.

## Databases

- `user-service` -> `user_service_db`
- `car-service` -> `car_service_db`
- `rental-service` -> `rental_service_db`
- `reporting-service` -> `rental_service_db`
- `client-service` -> `client_service_db` `(legacy)`

Database bootstrap scripts live in `database/init`.

## Documentation

Start with:

- `docs/ARCHITECTURE_AUDIT.md`
- `docs/SERVICE_CATALOG.md`
- `docs/PROJECT_VERIFICATION.md`
- `docs/MICROSERVICES_MIGRATION_PLAN.md`

## Next Cleanup Steps

1. Run the client migration on real environment data and validate renter records in `user-service`.
2. Remove `client-service` and `search-service` from the repo entirely after data cutover.
3. Expand `reporting-service` with branded templates and more detailed BI metrics.
4. Replace temporary gateway auth with service-owned auth only.
