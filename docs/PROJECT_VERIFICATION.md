# Project Verification

## Current Status

The repository is not in a "fully completed and fully verified" state yet.

What is verified now:

- all backend services build successfully
- backend verification can be run from the repo root for the active runtime topology
- test commands for `user-service`, `car-service`, and `rental-service` are now valid
- `rental-service` has working automated middleware and service tests
- gateway behavior is more explicit about development-only auth
- `client-service` compatibility now lives in `user-service`
- `search` compatibility now lives in `api-gateway`
- `user-service` has a dedicated legacy client migration script
- `reporting-service` now supports richer analytics plus Excel/PDF export for financial reports

What is still missing:

- meaningful automated tests for core business flows
- full migration-based DB lifecycle across all services
- final documentation alignment across all existing docs
- frontend verification in this environment, because `vite build` currently fails with `spawn EPERM`

## Verified Commands

From the repository root:

```powershell
npm run verify:backend
```

This command currently checks:

- `services/api-gateway` build
- `services/user-service` build + test
- `services/car-service` build + test
- `services/rental-service` build + test
- `services/reporting-service` build + test
- `services/media-service` build + test

Optional full workspace verification:

```powershell
npm run verify:all
```

This also attempts:

```powershell
npm --prefix frontend run build
```

## Observed Results

### Backend

Verified successfully with:

```powershell
npm run verify:backend
```

### Frontend

The frontend build did not complete in the current environment because Vite/esbuild failed with:

- `spawn EPERM`

This looks environment-related and should be rechecked outside the current restricted execution context.

## Database Verification Notes

Current service databases:

- `user-service` -> `user_service_db`
- `car-service` -> `car_service_db`
- `rental-service` -> `rental_service_db`
- `reporting-service` -> `rental_service_db`
- legacy `client_service_db` → cut over into `user_service_db` via `npm run migrate:clients` when needed

Current DB lifecycle status:

- `database/init/*.sql` exists for initial database creation
- services now expose a clearer path toward migration-based management
- some services still rely on `DB_SYNCHRONIZE` defaults in development until full migrations are added
- legacy client cutover is prepared via `npm run migrate:clients` (repo root)

## Important Runtime Flags

- `ENABLE_DEV_AUTH`: controls temporary auth endpoints in `api-gateway`
- `ALLOW_INSECURE_JWT_DECODE`: allows decode-without-verify fallback in development-only compatibility flows
- `DB_SYNCHRONIZE`: explicit override for TypeORM schema sync behavior
- `DB_LOGGING`: explicit override for TypeORM SQL logging

## Documentation Truth Source

For the audited state of the architecture and the remediation backlog, use:

- `docs/ARCHITECTURE_AUDIT.md`

This file should be treated as the current source of truth for project verification and remaining work.
