# PrimeFlight Signature Editor Worker

This repo deploys the full signature hosting/editor Worker to Cloudflare from GitHub.

## Files

- `worker.js` — the complete Cloudflare Worker app
- `wrangler.toml` — Cloudflare Worker config
- `.github/workflows/deploy.yml` — GitHub Actions deploy workflow

## Required Cloudflare setup

Create a KV namespace in Cloudflare named:

```text
SIG_ASSETS
```

Copy its namespace ID into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SIG_ASSETS"
id = "YOUR_KV_NAMESPACE_ID"
```

The binding name must stay exactly `SIG_ASSETS`.

## Required GitHub secrets

In GitHub repo settings:

```text
Settings → Secrets and variables → Actions → New repository secret
```

Create these two secrets:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

The API token needs permission to edit Workers and KV for your account.

## Deploy

Push to `main`, or run the workflow manually from GitHub Actions.

After deploy, open:

```text
https://signature.caleb-owen2019.workers.dev/editor/
```

Uploaded images are hosted at:

```text
https://signature.caleb-owen2019.workers.dev/u/image-name
```
