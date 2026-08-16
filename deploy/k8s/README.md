# Kubernetes deploy notes

This directory intentionally contains **non-secret** manifests only.

## Do not commit

- `secret.yaml` / `secrets.yaml`
- kubeconfig files
- WireGuard configs

Use GitHub Actions secrets:

- `KUBECONFIG`
- `WG_CONFIG`

## Suggested resources

1. `Namespace` `a6`
2. `Deployment` for the Next.js app (image from CI)
3. `Service` + `Ingress` for `a6.com.tr` / `www.a6.com.tr`
4. `Secret` created out-of-band:

```bash
kubectl -n a6 create secret generic a6-app \
  --from-literal=DATABASE_URL='...' \
  --from-literal=SESSION_SECRET='...' \
  --from-literal=SMTP_PASS='...'
```

5. Managed PostgreSQL or in-cluster Postgres with PVC + backups
