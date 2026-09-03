# Cloudflare hosting

This is the one guide for every Cloudflare aspect of this repository. The split rule: [`apps/site/wrangler.jsonc`](../../apps/site/wrangler.jsonc) owns everything it can express — the Worker name (`infoschematics-website`), the served assets directory, single-page-application not-found handling, both custom-domain routes, and observability. This guide records only the dashboard-owned settings, as the exact values an operator enters, so the dashboard can be reconstructed from the repository alone. A dashboard change and its edit to this guide travel together.

The Worker lives in the **Kit** Cloudflare account (`08c2b231fcf136f225cdb985fd3ac196`), which also manages DNS for the `infoschematics.info` zone.

## workers.dev

The `workers.dev` subdomain does **not** serve: both the workers.dev route and preview URLs are disabled for `infoschematics-website` (Worker → Settings → Domains & Routes). The custom domains below are the only public endpoints.

## Custom domains and redirects

Two custom domains are attached to the Worker, created by the `routes` declarations in `wrangler.jsonc` (`custom_domain: true`); Cloudflare manages their DNS records automatically:

- `infoschematics.info`
- `www.infoschematics.info`

A zone-level redirect rule (`infoschematics.info` → Rules → Redirect Rules → **`www → apex`**) sends `www.infoschematics.info` to the apex:

- Filter: `(http.host eq "www.infoschematics.info")`
- Action: redirect to a **dynamic** target URL `concat("https://infoschematics.info", http.request.uri.path)`, type **301**, preserve query string

The target URL must be the dynamic expression, not static text — a static `https://infoschematics.info${http.request.uri.path}` redirects every visitor to that literal broken URL.

## Deployment — Workers Builds

Workers Builds is connected under Settings → Build → Git repository `infoschematics/infoschematics`, branch `main`, so a push to `main` triggers Cloudflare to build and deploy automatically:

- Build command: `bun run build`
- Deploy command: `bun run ki:site:deploy`
- Root directory: `/`

`bun run build` (the root package-lifecycle script, not `ki:site:build`) is required: it runs `packages:build` before the site build, producing the `dist/` output the workspace packages (`@infoschematics/view-studio` and siblings) need to resolve. `dist/` is gitignored everywhere, so a fresh Workers Builds clone has none of it — a site-only build command fails to resolve those packages during the Vite build.

A manual deploy from the repository root remains available when needed:

```bash
bun run ki:site:deploy
```
