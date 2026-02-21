# FinIntel Dashboard

Portfolio-grade full-stack financial intelligence platform for SMEs.

## What is implemented now (Phase 1 baseline)

- Monorepo structure (`apps/api`, `apps/web`, `packages/shared`) with Turborepo task graph.
- Backend core:
  - Express + GraphQL endpoints.
  - Prisma schema for tenants, users, financial data, report archives.
  - Keycloak JWT verification middleware (tenant-aware claims).
  - Redis-backed rate limiting using `rate-limiter-flexible` with endpoint budgets.
  - Security headers with Helmet + CSP defaults.
  - S3 upload service wiring for report archival.
  - Health endpoint checking API/Postgres/Redis.
- Frontend shell:
  - React 18 + TypeScript + Material UI.
  - AG Grid table + Recharts trend visualization.
  - React Query data layer.
  - PWA manifest + service worker registration.
- DevOps baseline:
  - Dockerfiles for API and web.
  - Docker Compose orchestration for API, web, PostgreSQL, Redis, Keycloak, NGINX.
  - NGINX reverse proxy config.
  - GitHub Actions CI skeleton.

## Phase 2 progress (implemented)

- Aggregation APIs:
  - REST: `GET /api/v1/financial/metrics`, `GET /api/v1/financial/metrics/sources`, `GET /api/v1/financial/metrics/anomalies`
  - GraphQL: `metrics(filters)`, `sourceBreakdown(filters)`, `anomalies(filters)`
  - Filter support: `months`, `source`, `from`, `to`
- Rate limiting:
  - Endpoint-specific budgets and duration with tenant + IP + method/path isolation
- Secure archival:
  - Upload MIME allowlist, filename sanitization, SHA-256 checksum metadata, S3 SSE (`AES256`)
- Testing and security:
  - Added aggregation unit tests (`apps/api/tests/metrics.test.ts`)
  - Added OWASP ZAP baseline workflow (`.github/workflows/zap-baseline.yml`)
- Seed tooling:
  - `pnpm --filter @finintel/api seed:10k` generates 10,000 financial records

## Repo layout

- `apps/api`: API service (REST + GraphQL)
- `apps/web`: Dashboard UI
- `packages/shared`: Shared types
- `infra/keycloak`: Realm bootstrap with 5 tenant clients
- `nginx`: Reverse proxy config

## Quick start

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
pnpm install
```

3. Generate Prisma client:

```bash
pnpm --filter @finintel/api prisma:generate
```

4. Run locally with Docker Compose:

```bash
pnpm docker:up
```

5. Verify health:

- `GET http://localhost/health`
- `GET http://localhost/api/v1/financial/metrics` (with bearer token + tenant)

## Sprint execution guide (8 weeks)

### Sprint 1 (Weeks 1-2)

- Finalize Keycloak role mapping and token claim templates (`tenant_id`, `role`).
- Add Prisma migrations and seed scripts.
- Add production-grade logger and request tracing.

### Sprint 2 (Weeks 3-4)

- Build full financial aggregation APIs and report upload flow.
- Add ZAP baseline scan in CI.
- Increase unit/integration coverage toward 80%.

Current execution status:
- Aggregation + anomaly APIs: implemented
- S3 archival hardening + MIME checks: implemented
- 10k seed generator: implemented (`pnpm --filter @finintel/api seed:10k`)
- ZAP baseline CI: implemented (`.github/workflows/zap-baseline.yml`)
- Coverage gate for Phase 2 analytics/security units: implemented (`pnpm --filter @finintel/api test:coverage`)

### Sprint 3 (Weeks 5-6)

- Implement multi-tenant dashboard variants and advanced AG Grid UX.
- Add optimistic workflows and drag-drop filtering.
- Add Cypress critical-path E2E and Lighthouse automation.

### Sprint 4 (Weeks 7-8)

- Add ELK stack and dashboards.
- Configure blue-green deployment pipeline to AWS.
- Run Artillery load tests and collect benchmark evidence.

## Portfolio proof checklist

- Before/after workflow timing reports (target: 30% reduction).
- Uptime robot screenshots (target: 99.9%).
- Load test and rate-limit evidence.
- Demo video and architecture diagrams.
