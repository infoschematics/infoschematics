---
id: INFOSCHEMATICS-SITE-007
area: SITE
title: Docs and examples folders
theme: site-experience
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: b22506148ea6bde1e4fe8a663df681c90f995a35
---

## Goal

Replace the homepage's flat footer link pile and the scattered `/guides/…` and `/reference/…` URLs with a shared top navigation component and two real URL folders: `/docs/` and `/examples/`, each with an index page.

## Context

Today `apps/site/src/App.tsx` lists five links — three hosted examples, the authoring guide, and the vocabulary reference — as an undifferentiated row in the page footer, with no index for either group and no way to move between pages except returning to the homepage. Public routes are equally flat: examples live under `/examples/` while documentation is split across `/guides/authoring/`, `/guides/react-integration/`, and `/reference/vocabulary/` with no shared prefix.

ADR-INFOSCHEMATICS-007 already assigns navigation, page metadata, and layout to the Site application, so this item implements an existing decision rather than requiring a new one.

## Boundary

This item does not touch the three studio example pages' own rendering (`InfoschematicsExample`, `SystemExample`, `BlankInfoschematic` stay full-bleed `view-studio` canvases with no added chrome) and does not add redirects for the dropped flat URLs (`/guides/authoring/`, `/reference/vocabulary/`) — they are replaced, not preserved, per direct user decision. It also does not change deployment, hosting, or the Cloudflare Worker configuration.

## Current state

The homepage footer (`apps/site/src/App.tsx`) lists all five links in one flat, unheaded row. `apps/site/src/routes.ts` defines `documentationRoutes` for the two guide/reference pages only; `apps/site/src/DocumentPage.tsx` duplicates that same set in its own `publishedDocuments` link-rewrite map. There is no shared nav component, no `/docs/` or `/examples/` index, and design and specification documents under `docs/design/` and `docs/specs/` are not published at all.

## Public URL map

Document paths are derived mechanically from source path: `docs/guides/authoring.md` → `/docs/guides/authoring/`; a trailing `/README.md` collapses to the directory itself, so `docs/specs/README.md` → `/docs/specs/`.

| Path | Source |
| --- | --- |
| `/docs/` | new index |
| `/docs/guides/authoring/` | `docs/guides/authoring.md` |
| `/docs/guides/react-integration/` | `docs/guides/react-integration.md` |
| `/docs/reference/vocabulary/` | `docs/reference/vocabulary.md` |
| `/docs/design/architecture/` | `docs/design/architecture.md` |
| `/docs/design/visual-language/` | `docs/design/visual-language.md` |
| `/docs/design/view-present/` | `docs/design/view-present.md` |
| `/docs/design/view-studio/` | `docs/design/view-studio.md` |
| `/docs/specs/` | `docs/specs/README.md` |
| `/docs/specs/domain-model/` | `docs/specs/domain-model.md` |
| `/docs/specs/domain-core/` | `docs/specs/domain-core.md` |
| `/docs/specs/view-model/` | `docs/specs/view-model.md` |
| `/docs/specs/view-canvas/` | `docs/specs/view-canvas.md` |
| `/docs/specs/view-present/` | `docs/specs/view-present.md` |
| `/docs/specs/view-studio/` | `docs/specs/view-studio.md` |
| `/docs/specs/render-svg/` | `docs/specs/render-svg.md` |
| `/examples/` | new index |
| `/examples/infoschematics/`, `/examples/system/`, `/examples/blank/` | unchanged |

Not published, matching ADR-007's maintainer-facing default: `docs/decisions/`, `docs/roadmap/`, and the operational guides `docs/guides/cloudflare.md` and `docs/guides/releasing-packages.md`.

## Steps

- [x] Replace `documentationRoutes` in `apps/site/src/routes.ts` with one published-document table keyed by source path (`sourcePath`, `title`, `summary`, `section`); derive `path` from `sourcePath` with a shared helper. Add `isDocsIndexPath` and `isExamplesIndexPath` alongside the existing `is*Path` helpers.
- [x] Add `apps/site/src/SiteNav.tsx`: brand mark plus `Docs`, `Examples`, `GitHub`, with a `section` prop setting `aria-current="page"`. Move `BrandMark` out of `App.tsx` into this shared component.
- [x] Add `apps/site/src/DocsIndex.tsx` and `apps/site/src/ExamplesIndex.tsx`, grouping the published-document table by section and listing the three hosted examples respectively.
- [x] Extend `apps/site/src/DocumentPage.tsx`'s raw-Markdown imports to the full published set (explicit `?raw` imports, not a glob, so unpublished docs stay out of the bundle); swap its bespoke header nav for `SiteNav`. `rewriteRepositoryLink` and `normaliseRepositoryPath` are reused unchanged — more internal links now resolve on-site instead of falling through to GitHub.
- [x] Update `apps/site/src/App.tsx` to render `SiteNav` and reduce the footer to the wordmark and tagline.
- [x] Wire `/docs/` and `/examples/` (and every document route) into `apps/site/src/main.tsx`'s `resolvePage`, following its existing lazy-import-and-set-title pattern.
- [x] Add nav and index-list styles to `apps/site/src/styles.css`, reusing `.document-shell` and the existing `'DM Mono'` uppercase idiom.
- [x] Rewrite `docs/README.md`'s "Public documentation" section to match the new published set.

## Files touched

- `apps/site/src/routes.ts`, `apps/site/src/SiteNav.tsx`, `apps/site/src/DocsIndex.tsx`, `apps/site/src/ExamplesIndex.tsx`, `apps/site/src/DocumentPage.tsx`, `apps/site/src/App.tsx`, `apps/site/src/main.tsx`, `apps/site/src/styles.css`
- `apps/site/src/App.test.tsx`, `apps/site/src/DocumentPage.test.tsx`
- `docs/README.md`

## Verify

`bun run self:check` (tests, every TypeScript workspace, dependency boundaries, production website build). Manually walk `/`, `/docs/`, `/examples/`, one document page per section, and each of the three examples on a dev server; confirm the nav marks the active section and that a cross-document link inside `/docs/specs/` navigates on-site rather than to GitHub.

## Dependencies / blocks

None. `INFOSCHEMATICS-SITE-008` needed `SiteNav` and the `/docs/` folder to exist before adding a visual guide page under them; this item delivered both, so that declaration has been withdrawn on both sides.

## Documentation impact

### Decision Records

None — implements the navigation and layout ownership ADR-INFOSCHEMATICS-007 already assigns to Site; does not change it. Dropping the two flat URLs rather than redirecting them sits against ADR-007's "stable public routes" wording — worth a future amendment to that record if the practice should be documented, but not required to deliver this item.

### Specifications

None — site routing and layout are not covered by the reusable package specifications under `docs/specs/`.

### Guides

None beyond `docs/README.md`'s published-document list, covered above.

### Roadmap

None beyond this item and `INFOSCHEMATICS-SITE-008`.

## Review

### Delivered

`SiteNav`, `/docs/` and `/examples/` folders with index pages, and a full published-document table covering guides, reference, design, and specs — replacing the flat footer links and the `/guides/…`/`/reference/…` URLs.

### Summary of changes

- `apps/site/src/routes.ts`: replaced the three-entry `documentationRoutes` with a 14-entry published-document table (`sourcePath`, `title`, `summary`, `section`), a `documentPath` helper deriving the public path from the source path (with `/README.md` collapsing to the directory), and `docsIndexPath`/`examplesIndexPath`/`isDocsIndexPath`/`isExamplesIndexPath`. Also added `docs/specs/domain-core.md` to the published set — it exists and is linked from `docs/specs/README.md`, so omitting it (an oversight in the original roadmap table) would have left a broken on-site link.
- `apps/site/src/SiteNav.tsx` (new): brand mark plus Docs/Examples/GitHub, with `aria-current="page"` on the active section. `BrandMark` moved here from `App.tsx`.
- `apps/site/src/DocsIndex.tsx`, `apps/site/src/ExamplesIndex.tsx` (new): grouped document index and hosted-example index.
- `apps/site/src/DocumentPage.tsx`: extended to 14 explicit `?raw` imports; swapped its bespoke header for `SiteNav`; `rewriteRepositoryLink` now resolves any link landing on a published source path to its on-site URL instead of falling through to GitHub.
- `apps/site/src/App.tsx`: adopted `SiteNav`; footer reduced to wordmark and tagline.
- `apps/site/src/main.tsx`: wired `/docs/` and `/examples/` into `resolvePage`.
- `apps/site/src/styles.css`: added `.site-nav` and `.index-list` styles; removed the now-dead `.title-bar`, `.document-header`, `.document-brand`, and `.page-footer__link` rules.
- `docs/README.md`: rewrote the "Public documentation" section to name the full published set.
- `apps/site/src/App.test.tsx`, `apps/site/src/DocumentPage.test.tsx`: updated for the new nav, route shape (`sourcePath` replacing `key`), and added coverage for path derivation, the index helpers, and both index pages.

### Verification

`bun run self:check` passes (412 tests, every TypeScript workspace, dependency boundaries, production website build). Manually confirmed `/`, `/docs/`, `/examples/`, `/docs/guides/authoring/`, `/docs/specs/`, `/docs/specs/domain-core/`, and `/examples/system/` all serve `200` on a dev server. A fresh `bun run self:check` also passed on 2026-09-08 immediately before acceptance.

### Outstanding concerns

None for this item. `INFOSCHEMATICS-SITE-008` (visual guide) was delivered against the `SiteNav` and `/docs/` shape this item landed, and no longer declares a blocker.

### Post-change review

Verified the diff matches the approved plan; the one addition beyond the original scope (`docs/specs/domain-core.md`) closes a link that the plan's own decision to publish "design and specs" already covered in intent, so it isn't new scope. Kris Brown approved closure on 2026-09-08 as part of the SITE-007 through SITE-010 review.

### Mini recap

Added a shared top nav and real `/docs/`/`/examples/` folders with indexes, replacing the homepage's flat footer links and the old `/guides/…`/`/reference/…` URLs; `self:check` passes.

## Done

Accepted 2026-09-08 by Kris Brown on the review packet above.

## Discussion

### Why mirror the repository tree for docs URLs

Discussed directly with the user: mirroring keeps the public path mechanically derivable from the source path, so a new document under `docs/` needs no separate naming decision. The cost is that moving a Markdown file later moves its public URL — accepted as the mirror's natural consequence.

### Why drop rather than redirect the old flat URLs

Discussed directly with the user, who chose to drop `/guides/authoring/` and `/reference/vocabulary/` rather than preserve them as redirects, accepting the resulting broken external links and bookmarks as the cost of a clean URL structure.
