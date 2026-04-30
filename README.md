# Signature Editor

Cloudflare Worker + Worker Assets + KV image hosting.

Paths:
- `/` redirects to `/editor/`
- `/editor/` opens the editor
- `/icons/...` serves the bundled PNG icon pack
- `/u/<name>` serves uploaded images from KV

Required bindings:
- KV binding: `SIG_ASSETS`
- Assets binding: `ASSETS` from `./public`

Keep your real KV namespace ID in `wrangler.toml` before deploying.
