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

## Feature matrix

| Capability | Status | Notes |
| --- | --- | --- |
| OIDC auth (Keycloak) | Implemented | Login/callback/logout with JWT validation via JWKS |
| Multi-tenant isolation | Implemented | Tenant-scoped data access in middleware + APIs |
| Role-based access control | Implemented | OWNER/CFO/ANALYST protected actions |
| Financial KPIs + trends | Implemented | REST + GraphQL aggregation endpoints |
| AG Grid dashboard UI | Implemented | Tenant-switchable records and KPI views |
| Report upload | Implemented | MIME allowlist + checksum + archive metadata |
| Report download | Implemented | Tenant-scoped download with local/S3 storage support |
| Storage modes | Implemented | `local` fallback and `s3` mode |
| Rate limiting | Implemented | Redis-backed per-route budgets |
| Containerized stack | Implemented | API, web, Postgres, Redis, Keycloak, NGINX |
| CI quality gates | Implemented | Web/API typecheck, container tests, docker build sanity |
| Security baseline scan | Implemented | OWASP ZAP baseline workflow |

## Repo layout

- `apps/api`: API service (REST + GraphQL)
- `apps/web`: Dashboard UI
- `packages/shared`: Shared types
- `infra/keycloak`: Realm bootstrap with 5 tenant clients
- `nginx`: Reverse proxy config

## Quick start

1. Copy environment variables:

```bash
cp .env.template .env
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

## Sprint execution guide (Completed in 2 sprints)

### Sprint 1

- Established monorepo and service foundations (API, web, shared packages).
- Implemented auth baseline with Keycloak JWT verification and tenant-aware middleware.
- Added Prisma schema, health endpoints, rate limiting, Docker, NGINX, and CI baseline.
- Built initial dashboard shell with React, Material UI, AG Grid, and React Query.

### Sprint 2

- Delivered financial aggregation APIs (REST + GraphQL) with filters and anomaly/source views.
- Implemented report archival flow: upload, list, and secure download.
- Added storage flexibility (`local` and `s3` modes) and hardened upload validation.
- Implemented role-gated operations and tenant switching behavior in UI/API.
- Added CI quality gates and OWASP ZAP baseline scan workflow.
- Added seed/data tooling for demo-scale records and tenant test data.

Current execution status:
- Sprint 1: completed
- Sprint 2: completed
- Phase 2 scope: delivered

## Portfolio proof checklist

- Before/after workflow timing reports (target: 30% reduction).
- Uptime robot screenshots (target: 99.9%).
- Load test and rate-limit evidence.
- Demo video and architecture diagrams.
