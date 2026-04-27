# Architecture Audit

## Summary

This repository is already organized around a microservices-first backend:

- `services/api-gateway`
- `services/user-service`
- `services/car-service`
- `services/rental-service`
- `services/reporting-service`
- `services/client-service`
- `services/search-service`
- `services/media-service`
- `frontend`

The current codebase is functional enough to build and test the backend, but it is still in a transition state. The main risks are inconsistent documentation, incomplete DB migration discipline, and a couple of service boundaries that are thinner than their runtime cost justifies.

## Recommended Simplified Topology

The healthiest target shape for this repo is:

- `api-gateway`
- `user-service`
- `car-service`
- `rental-service`
- `reporting-service`
- `media-service`

Rationale:

- `client-service` is thin CRUD and overlaps with renter/client identity data that already belongs near `user-service`
- `search-service` is a lightweight aggregation layer without its own index or search engine, so it fits better inside the BFF/gateway
- `reporting-service` remains a good standalone bounded context because reporting, analytics, exports, and financial calculations will keep growing independently

## Current Verified State

### Builds

- `api-gateway`: `npm run build` passes
- `user-service`: `npm run build` passes
- `car-service`: `npm run build` passes
- `rental-service`: `npm run build` passes
- `reporting-service`: `npm run build` passes
- `client-service`: `npm run build` passes
- `media-service`: `npm run build` passes
- `search-service`: `npm run build` passes
- `frontend`: TypeScript starts, but `vite build` failed in the current environment with `spawn EPERM`

### Tests

- `api-gateway`, `user-service`, `car-service`, `rental-service`, `reporting-service`, `client-service`, `media-service`, and `search-service` now have passing automated checks in `npm run verify:backend`
- `user-service` also covers absorbed client-compatibility controller behavior
- `api-gateway` now covers compatibility search behavior without requiring `search-service` in the active request path

### Databases

- `user-service` uses `user_service_db`
- `car-service` uses `car_service_db`
- `rental-service` uses `rental_service_db`
- `reporting-service` also uses `rental_service_db`
- `client-service` uses `client_service_db`
- DB bootstrap SQL exists under `database/init`

## Findings

### P0: Verification is not trustworthy yet

- There is no reliable cross-service test baseline.
- Some services expose `test` scripts without real tests.
- `rental-service` declares `jest` in scripts but does not have the dependency in `devDependencies`.

### P0: Documentation does not match the repo state

- `docs/PROJECT_VERIFICATION.md` claims implementation is complete, but the repo still has missing tests, transitional auth, and migration gaps.
- `database/schemas/README.md` describes a target platform schema broader than the implemented services.
- Some docs still describe a monolith transition path that no longer reflects the main execution path.

### P1: Database lifecycle is under-specified

- Several services rely on `TypeORM synchronize` in development.
- `rental-service`, `reporting-service`, and `client-service` do not yet define a real migration workflow.
- `reporting-service` shares `rental_service_db`, which needs an explicit ownership and schema policy.

### P1: Gateway still contains temporary auth and compatibility logic

- `services/api-gateway/src/index.ts` contains in-memory dev auth users and JWT issuance.
- Gateway also owns compatibility rewrites and should be documented as a BFF with clearly defined temporary behavior.

### P1: Service foundation patterns are inconsistent

- Logging style varies by service.
- Config parsing is ad hoc and not validated on startup.
- Error payloads are not standardized across services.
- HTTP client behavior for service-to-service calls is not consistently documented or wrapped.

### P2: Thin services need stronger contracts

- `search-service` is a lightweight aggregator with in-process filtering and weak response normalization.
- `media-service` works as local file storage but lacks explicit operational policy and validation guidance.
- `client-service` is simpler than other services and does not yet share common service conventions.

### P2: Two services are now better treated as migration leftovers

- `client-service` should be phased out after its data is migrated into `user-service`.
- `search-service` should be phased out after deployment/runtime config stops pointing traffic at it.

## Target Architecture Rules

The implementation should converge on these rules:

1. Each business entity has one source-of-truth service.
2. Each service owns its schema evolution through migrations, not `synchronize`.
3. Gateway acts as BFF/proxy only, with temporary compatibility logic clearly isolated.
4. Service-to-service communication uses explicit clients, timeouts, consistent auth, and stable error mapping.
5. All documentation must describe the current running system, not planned-only behavior.

## Execution Backlog

### Phase 1: Stabilize verification and repo truth

- Add a root-level developer workflow for building and checking all services.
- Fix `rental-service` test tooling.
- Make empty-test behavior explicit where tests do not yet exist.
- Replace misleading documentation with audited status documents.

### Phase 2: Fix database ownership and migrations

- Document database ownership by service.
- Introduce missing migration setup for `rental-service`, `reporting-service`, and `client-service`.
- Define policy for `reporting-service` read/write access to `rental_service_db`.
- Align `database/init` scripts with actual service expectations.

### Phase 3: Standardize service foundations

- Introduce shared startup conventions: env validation, logging, error format, graceful shutdown.
- Normalize health/readiness behavior across services.
- Standardize internal HTTP client wrappers and auth headers.
- Reduce temporary logic in gateway or fence it behind explicit development-only configuration.
- Complete the merge of `client-service` into `user-service` and remove `search-service` from the primary topology.

### Phase 4: Add test coverage by service priority

- `api-gateway`: proxy and BFF behavior smoke tests
- `rental-service`: booking logic and upstream client integration tests
- `car-service`: DTO validation and repository/service tests
- `user-service`: auth/profile/use-case tests
- `reporting-service`, `client-service`, `search-service`, `media-service`: smoke and contract tests

### Phase 5: Publish complete operational documentation

- Architecture overview
- Service catalog
- Database ownership and migration guide
- Local development and Docker runbook
- API contracts and compatibility notes
- Troubleshooting and verification checklist

## Definition of Done

The backend is considered stabilized when:

- all services build successfully
- test scripts are valid and intentional
- migrations are the primary schema management mechanism
- service ownership and DB ownership are documented
- gateway temporary behavior is clearly documented or removed
- operational docs match the actual repo
