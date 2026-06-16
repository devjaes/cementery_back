# Cementerios - API

> Backend for cemetery management system: niche lifecycle, ownership and inheritance, payments, burial procedures.

## Problem

Cemeteries are not a CRUD domain. A single burial plot (niche) carries decades of state - sales, inheritance, exhumations, re-sales - and a single mistake can mean exhuming the wrong remains or selling a plot that was already inherited. The operator needed a system that **encoded the rules** rather than relying on a clerk's memory: who owns what, what state each niche is in, what must be true before a burial can be registered, and a full audit trail behind every transition.

## Approach

Domain-driven module split - niches, blocks, owners, burials (`inhumaciones`), exhumations, payments, and reports are independent NestJS modules with their own entities and services. The niche entity carries an explicit state machine (`Disponible → Reservado → Vendido`, plus `Deshabilitado` and `Bloqueado` for administrative locks), and reversal paths exist for exhumation flows. Burial registration is gated by a validation chain (requisitos de inhumación) covering payment, documentation, and owner verification. Payments emit PDF receipts via `pdfmake` and store them in S3 alongside other domain documents. Blocks auto-generate their grid of niches at creation, and mausoleums are modeled as a family-unit ownership distinct from the per-niche regular block sale.

## Stack

| Layer | Tech |
|---|---|
| Framework | NestJS 11 |
| Language | TypeScript 5 |
| ORM | TypeORM 0.3 |
| Database | PostgreSQL 16 |
| File storage | AWS S3 (`@aws-sdk/client-s3`, `multer-s3`) |
| Auth | JWT (`@nestjs/jwt` + `passport-jwt`), role guards |
| PDF | `pdfmake` |
| API docs | Swagger (`@nestjs/swagger`) |
| Infra | Docker / docker-compose |
| Node | 20.14.0 (see `.nvmrc`) |

## Highlights

- **Niche state machine** with explicit transitions: `Disponible → Reservado → Vendido`, plus `Deshabilitado` and `Bloqueado` for administrative states; exhumation flows reverse sale state.
- **Multi-owner ownership and inheritance** via the `propietarios-nichos` module - a niche can carry multiple co-owners and succession.
- **Payment + PDF receipt pipeline**: receipts generated server-side with `pdfmake` and persisted to S3.
- **Validation chain** (`requisitos-inhumacion`) gating burial registration - health clearance, payment status, and owner verification must pass before an `inhumacion` is accepted.
- **Auto-generated block grids**: creating a block materializes its niches in the configured rows/columns layout.
- **Mausoleums as family units**, distinct domain workflow from per-niche regular blocks (see `src/nicho/MAUSOLEO_WORKFLOW.md`).
- **Reports module** for operational reporting across niches, payments, and burials.
- **Seed runner** (`yarn seed`) to bootstrap reference data for a fresh environment.

## Local setup

Requires Node 20.14.0 (use `nvm use`) and Docker.

```bash
# 1. Install dependencies (project uses yarn)
yarn install

# 2. Configure environment
cp .env.example .env
# Edit .env: DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, JWT_SECRET, AWS_* keys

# 3. Start PostgreSQL
docker compose up -d

# 4. (Optional) Seed reference data
yarn seed

# 5. Run the API in watch mode
yarn dev
```

The API listens on `http://localhost:3000`. Swagger UI is mounted by the NestJS Swagger module (see `src/main.ts` for the exact path).

### Tests

```bash
yarn test          # unit
yarn test:e2e      # end-to-end
yarn test:cov      # coverage
```

### Restoring a database backup

See the original setup notes - `docker cp` a `.sql` dump into the `cementery-db-dev` container and `psql` it into the configured database.

## Module map

| Module | Responsibility |
|---|---|
| `cementerio` | Cemetery root entity |
| `bloques` / `huecos-nichos` | Blocks and the auto-generated niche grid |
| `nicho` | Niche entity, state machine, sales flow (`sales.service.ts`), mausoleum workflow |
| `propietarios-nichos` | Multi-owner ownership and inheritance |
| `personas` | People (owners, deceased, beneficiaries) |
| `inhumaciones` | Burial registration, gated by `requisitos-inhumacion` |
| `exhumacion` | Exhumation flow and state reversal |
| `requisitos-inhumacion` | Validation chain for burial preconditions |
| `payment` | Payments and PDF receipt pipeline |
| `mejoras` | Improvements / works on a niche |
| `reports` | Operational reporting |
| `auth` / `user` | JWT auth, roles, user accounts |
| `shared` / `common` | Cross-cutting utilities |

See also `FRONTEND_INTEGRATION.md` for the API contract used by the Next.js frontend.

## Status & limitations

- Built for a specific Ecuadorian municipal cemetery (single-tenant). No public demo.
- Some domain documentation lives in Spanish alongside the modules it documents (e.g. `MAUSOLEO_WORKFLOW.md`).
- Domain flows continue to iterate based on operator feedback; treat module docs as the source of truth for current behavior.

## Team & my role

- **My role:** Tech Lead - technical direction, ceremonies, backlog and scope, integration gatekeeper (every PR merged through me). I worked on the backend alongside teammates.
- **Team:** cross-functional - frontend, backend, and student interns (~6 people total).
- **Frontend repo:** [devjaes/cementery_web](https://github.com/devjaes/cementery_web) (Next.js 15 + React 19).
