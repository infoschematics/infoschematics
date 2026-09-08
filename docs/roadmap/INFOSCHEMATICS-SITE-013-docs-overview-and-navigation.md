---
id: INFOSCHEMATICS-SITE-013
area: SITE
title: Docs overview and navigation
theme: site-experience
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: f553cd55daf3124f0d042b5e34538212aa91cb38
---

## Goal

Open the documentation section with an authored Overview in a "Getting started" area, fold the visual guide into the docs section, and give the sidebar MUI-style section grouping with dividing lines.

## Context

After `INFOSCHEMATICS-SITE-012` the docs index still listed every article — now redundant beside the sidebar — the visual guide sat outside the docs section as its own top-nav entry, and the sidebar sections ran together without visual separation. The user pointed at mui.com's "Getting started → Overview" pattern as the model.

## Boundary

No changes to examples, playground, or homepage. The overview is canonical Markdown under `docs/` per ADR-INFOSCHEMATICS-007 — the site renders it, never copies it. Maintainer-facing documents stay off the public site.

## Current state

`DocsIndex.tsx` rendered a link listing at `/docs/`; the sidebar's Guides section held the two guides; `SiteNav` carried a separate Visual guide entry; `VisualGuide.tsx` used the wide shell without the sidebar.

## Steps

- [x] Author `docs/overview.md` — the PDR-INFOSCHEMATICS-004 definition, what an Infoschematic is, the pieces, and where to start — and list it in `docs/README.md`'s public-documentation section.
- [x] Rename the `guides` section to `getting-started`, add the overview as its first entry, and map `docs/overview.md` to the `/docs/` path so the overview is the documentation landing page.
- [x] Delete `DocsIndex.tsx` and its `main.tsx` branch; `getDocumentationRoute` now resolves `/docs/` itself.
- [x] Fold the visual guide into the docs section: sidebar entry directly under Overview, `DocsSidebar` and docs shell on the page (full-width main, no contents column), top-nav entry removed.
- [x] Divide sidebar sections with rule lines.
- [x] Update tests: `/docs/` resolves the overview route; DocsIndex listing test replaced; sidebar coverage picks the overview up via `documentationRoutes`.

## Files touched

`docs/overview.md` (new), `docs/README.md`, `apps/site/src/routes.ts`, `apps/site/src/DocsSidebar.tsx`, `apps/site/src/DocumentPage.tsx`, `apps/site/src/VisualGuide.tsx`, `apps/site/src/SiteNav.tsx`, `apps/site/src/main.tsx`, `apps/site/src/App.test.tsx`, `apps/site/src/styles.css`, `apps/site/src/DocsIndex.tsx` (deleted), `docs/roadmap/_ISSUES.md`.

## Verify

`cd apps/site && bunx vitest run && bunx tsc -p tsconfig.json --noEmit` plus the production site build. Full `bun run self:check` remains blocked in this checkout by another writer's in-flight `view-studio` edits.

## Dependencies / blocks

Builds on `INFOSCHEMATICS-SITE-012` (awaiting-review; its delivery is on `main`).

## Documentation impact

### Decision Records

None — the overview quotes PDR-INFOSCHEMATICS-004 rather than restating it.

### Specifications

None.

### Guides

`docs/overview.md` added as canonical consumer documentation; `docs/README.md` public list updated.

### Roadmap

Ledger high-water `SITE` moves to 13.

## Review

### Delivered

`/docs/` now renders an authored Overview — the canonical product definition, what an Infoschematic is, the pieces, and where to start — as the first entry of a "Getting started" sidebar section that also holds the visual guide (directly under Overview) and both guides. Sidebar sections are separated by rule lines. The visual guide page carries the docs sidebar and lost its separate top-nav entry; the redundant docs index listing is gone.

### Summary of changes

- `docs/overview.md` authored; grounded in PDR-INFOSCHEMATICS-004; linked from `docs/README.md`.
- `routes.ts`: `guides` → `getting-started`, overview entry first, `documentPath` maps `docs/overview.md` to `/docs/`.
- `DocsSidebar.tsx`: section-only structure with the visual guide spliced under Overview; divider CSS in `styles.css` plus a `.docs-columns--full` variant for pages whose main column should use the full width.
- `VisualGuide.tsx` joins the docs shell with the sidebar; `SiteNav` drops the Visual guide entry and the `visual-guide` section value; `DocsIndex.tsx` and its `main.tsx` branch removed.

### Verification

All 62 site tests pass (the `/docs/` path now resolves the overview route with and without a trailing slash; the DocsIndex listing test was replaced accordingly; the overview flows through the existing per-route rendering, sidebar, and anchor coverage automatically). Site typecheck and production build pass. `bun run self:check` still cannot run end to end while another writer's in-progress `view-studio` edits do not compile.

### Outstanding concerns

- Manual dev-server walk not performed in this non-interactive session.
- `isDocsIndexPath` remains exported (still tested) though `main.tsx` no longer uses it.

### Post-change review

The overview lives under `docs/` and is rendered, not copied, preserving ADR-INFOSCHEMATICS-007. Removing the top-nav Visual guide entry leaves Docs / Examples / Playground / GitHub; the guide remains one click away inside Getting started.

### Mini recap

Docs now open on an authored Overview under Getting started, with the visual guide folded into the section and MUI-style dividers in the sidebar.

## Discussion

### Why the overview replaces the index rather than sitting beside it

With the sidebar listing every article on every docs page, a landing page that repeats that list adds nothing. MUI's pattern — land on Overview — gives the space to orientation instead, and the sidebar stays the single navigation surface.
