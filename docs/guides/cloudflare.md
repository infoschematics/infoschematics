# Cloudflare hosting

This is the one guide for every Cloudflare aspect of this repository. The split rule: [`apps/site/wrangler.jsonc`](../../apps/site/wrangler.jsonc) owns everything it can express — the Worker name (`infoschematics-website`), the served assets directory, single-page-application not-found handling, both custom-domain routes, and observability. This guide records only the dashboard-owned settings, as the exact values an operator enters, so the dashboard can be reconstructed from the repository alone. A dashboard change and its edit to this guide travel together.

The Worker lives in the **Kit** Cloudflare account (`08c2b231fcf136f225cdb985fd3ac196`), which also manages DNS for the `infoschematics.info` zone.

## workers.dev

The `workers.dev` subdomain does **not** serve: both the workers.dev route and preview URLs are disabled for `infoschematics-website` (Worker → Settings → Domains & Routes). The custom domains below are the only public endpoints.

## Custom domains and redirects

Two custom domains are attached to the Worker, created by the `routes` declarations in `wrangler.jsonc` (`custom_domain: true`); Cloudflare manages their DNS records automatically:

- `infoschematics.info`
- `www.infoschematics.info`

There are no redirect rules: `www.infoschematics.info` serves the Worker directly rather than redirecting to the apex. If a `www` → apex 301 is ever added (zone → Rules → Redirect Rules), record the exact rule here.

## Deployment — no Workers Builds

Workers Builds is **not connected**: the Worker has no repository connection under Settings → Build, so a push to `main` does not build or deploy anything. Every deployment is operator-run from the repository root:

```bash
bun run ki:site:deploy
```

This builds the site and runs `wrangler deploy` from `apps/site`, uploading `dist/` as the Worker's assets. If Workers Builds is ever connected, record the build command, deploy command, root directory, and branch here in the same change.
