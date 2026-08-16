# A6 Production Guide

Domain targets:

- `a6.com.tr`
- `www.a6.com.tr`

## Secrets policy

**Never commit:**

- `.env` / production env files
- `secret.yaml` / `secrets.yaml`
- `KUBECONFIG` / kubeconfig files
- `WG_CONFIG` / WireGuard configs

GitHub Actions secrets (repo is public):

- `KUBECONFIG`
- `WG_CONFIG`

Inject secrets at deploy time from the cluster secret store / CI secrets — not from the git tree.

## Required environment variables

See `.env.example` for the full list. Production minimum:

| Variable | Notes |
| --- | --- |
| `NODE_ENV` | `production` |
| `APP_URL` | `https://a6.com.tr` |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | `openssl rand -base64 48` |
| `COOKIE_SECURE` | `true` |
| `MAIL_PROVIDER` | `smtp` |
| `SMTP_*` | Real SMTP credentials |
| `PLATFORM_ADMIN_EMAILS` | Comma-separated platform admins |

## Database

```bash
npx prisma migrate deploy
```

Do **not** run `db:seed` in production.

## Health

- `GET /api/health` — liveness/readiness (DB check)

## Docker

```bash
docker build -t a6comtr:latest .
docker run --env-file .env.production -p 3000:3000 a6comtr:latest
```

## Backup strategy

1. Daily automated PostgreSQL logical dump (`pg_dump`) to object storage.
2. Retain 7 daily + 4 weekly snapshots.
3. Test restore quarterly on a staging database.
4. Encrypt dumps at rest; restrict access to platform operators.

## HTTPS / DNS

1. Point `a6.com.tr` and `www.a6.com.tr` A/AAAA (or CNAME) to the ingress.
2. Terminate TLS at the ingress / load balancer (cert-manager or managed cert).
3. Redirect HTTP → HTTPS; prefer HSTS (already set in middleware for production).

## Smoke checklist (FAZ 12)

Run the real workflow in `plan.md` §29 FAZ 12 before declaring production PASS.

Critical: after changing company profile fields, the **existing** QR (`/q/{publicCode}`) must still redirect and show updated data.
