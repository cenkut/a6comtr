# A6 — QR Dijital Şirket Kartviziti SaaS

Production-oriented multi-tenant SaaS for permanent company QR digital business cards.

**Domain:** [a6.com.tr](https://a6.com.tr)

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript |
| UI | React + Tailwind CSS (mobile-first) |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Passwordless e-mail OTP (FAZ 1+) |
| Runtime | Node.js 20+ / Docker |

## Quick start (local)

### Prerequisites

- Node.js ≥ 20
- Docker (PostgreSQL)

### 1. Install

```bash
cp .env.example .env
npm install
```

### 2. Database

```bash
docker compose up -d db
npm run db:migrate
npm run db:check
```

### 3. Run app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm test` | Vitest unit tests |
| `npm run db:migrate` | Prisma migrate (dev) |
| `npm run db:migrate:deploy` | Prisma migrate (prod) |
| `npm run db:check` | Database connectivity check |
| `npm run db:seed` | **Dev-only** seed |

## Environment

Copy `.env.example` → `.env`. Never commit real secrets.

GitHub Actions secrets for deploy (repo is public):

- `WG_CONFIG`
- `KUBECONFIG`

Local/K8s secret manifests (`secret.yaml`, kubeconfig files, WireGuard configs) are gitignored and **must not** be pushed to GitHub.

## Architecture (high level)

```text
src/
  app/           # Next.js routes (public, dashboard, admin, API)
  components/    # Shared UI
  lib/           # env, db, config, shared utilities
  modules/       # Domain modules (auth, company, qr, analytics, …)
  types/         # Shared types / DTOs
prisma/          # Schema + migrations + seed
tests/           # Unit / integration tests
scripts/         # Ops scripts (db check, …)
```

## Security notes

- Secrets only via environment / secret store — never in source.
- Public and admin DTOs are separated (later phases).
- Multi-tenant isolation is enforced server-side.
- Production seed is disabled.

## Phases

See `plan.md` for the full production roadmap (FAZ 0 → FAZ 12).

## Production

- Operations guide: [`docs/production.md`](docs/production.md)
- K8s examples (no secrets): [`deploy/k8s/`](deploy/k8s/)

Platform admin UI: `/admin` (requires `isPlatformAdmin` or `PLATFORM_ADMIN_EMAILS`).

## License

Proprietary — all rights reserved.
