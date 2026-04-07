# Service Catalog

## API Gateway

- Path: `services/api-gateway`
- Port: `3000`
- Role: single frontend entry point and BFF/proxy
- Depends on: `user-service`, `car-service`, `rental-service`, `reporting-service`, `media-service`
- Important note: development-only auth compatibility still exists behind `ENABLE_DEV_AUTH`
- Compatibility note: owns aggregated `/api/search/*` routes and rewrites `/api/clients/*` to `user-service`

## User Service

- Path: `services/user-service`
- Port: `3002`
- Database: `user_service_db`
- Role: users, renter/client profiles, documents, ratings
- Key routes: `/api/users/*`, `/api-docs`, `/health`
- Compatibility note: now absorbs legacy client CRUD under `/api/users/clients/*`
- Operations note: legacy `client_service_db` data can be migrated with `npm --prefix services/user-service run migrate:clients`

## Car Service

- Path: `services/car-service`
- Port: `3003`
- Database: `car_service_db`
- Role: cars, pricing, images, availability, owner-linked car data
- Key routes: `/api/cars/*`, `/health`

## Rental Service

- Path: `services/rental-service`
- Port: `3004`
- Database: `rental_service_db`
- Role: rentals, booking flows, penalties inside rental domain
- Key routes: `/api/rentals/*`, `/health`

## Search Service

- Path: `services/search-service`
- Port: `3005`
- Database: none
- Role: deprecated transitional aggregator
- Status: no longer required in the primary request path; equivalent search compatibility now lives in `api-gateway`

## Media Service

- Path: `services/media-service`
- Port: `3006`
- Database: none
- Role: image upload and file serving
- Storage: local upload directory or Docker volume

## Client Service

- Path: `services/client-service`
- Port: `3007`
- Database: `client_service_db`
- Role: deprecated compatibility service
- Status: legacy client CRUD has been absorbed by `user-service`; keep only until DB/data migration is completed

## Reporting Service

- Path: `services/reporting-service`
- Port: `3009`
- Database: `rental_service_db`
- Role: penalties, reports, analytics
- Key routes: `/api/penalties/*`, `/api/reports/*`, `/api/analytics/*`, `/health`
- Export note: financial reports support `Excel` and `PDF` export via `/api/reports/financial/export`

## Frontend

- Path: `frontend`
- Port: `3001`
- Role: React client application
- API base: `VITE_API_URL=http://localhost:3000/api`

## Shared Operational Rules

- Backend verification: `npm run verify:backend`
- Full workspace verification: `npm run verify:all`
- Health endpoints should be available for every backend service before frontend testing
- Database schema changes should move toward `migration:*` scripts instead of relying only on `synchronize`
- `ALLOW_INSECURE_JWT_DECODE` should stay enabled only for local compatibility flows and disabled outside development
- Target simplified topology: `api-gateway`, `user-service`, `car-service`, `rental-service`, `reporting-service`, `media-service`
