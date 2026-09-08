---
id: INFOSCHEMATICS-SITE-012
area: SITE
title: Docs three-column layout
theme: site-experience
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 24bab5b8f95c8cdd195f3b52a536095a860b965f
---

## Goal

Make the documentation section use its space the way mui.com does: an article navigation column on the left, the document in a readable middle column, and an "On this page" contents column on the right for wide viewports.

## Context

Documentation pages rendered repository Markdown in a single 960px column with no in-section navigation — reaching another article meant returning to `/docs/`. The user asked for a left-hand article nav, centred content, and a right-hand contents column on wide formats, in the mui.com style.

## Boundary

No scroll-spy highlighting of the current contents entry (needs client JS; a follow-up). No changes to examples, playground, homepage, or the Markdown sources. No new dependencies — heading anchors come from a small slug renderer, not `marked-gfm-heading-id`.

## Current state

`DocumentPage.tsx` parsed Markdown with `marked` v18 (which emits no heading ids) inside `.document-shell` (960px) with a "Back to documentation" footer. `DocsIndex.tsx` held its own copy of the section titles. `routes.ts` already carried section groupings for every published document.

## Steps

- [x] Export `sectionTitles` and `documentSections` from `routes.ts` for shared use.
- [x] Add `DocsSidebar.tsx`: index and visual-guide links, then the four sections' articles, `aria-current="page"` on the active one.
- [x] Give headings deduplicated GitHub-style slug ids via a per-parse `Marked` instance (`walkTokens` assigns slugs and collects h2/h3 contents; a `renderer.heading` override emits the ids).
- [x] Render the contents as a right-hand `<nav aria-label="On this page">`, omitted when a document has no h2/h3.
- [x] Move `DocumentPage` and `DocsIndex` to a wide `.docs-shell` with a `220px | minmax(0, 1fr) | 200px` grid; article measure capped at 72ch; both side columns sticky; drop the superseded document footer.
- [x] Responsive collapse: contents column hidden below 1280px, sidebar below 960px.
- [x] Extend `DocumentPage.test.tsx`: sidebar lists every article with the current one marked, article headings carry unique anchor ids, and the contents nav links each one.

## Files touched

`apps/site/src/routes.ts`, `apps/site/src/DocsSidebar.tsx` (new), `apps/site/src/DocumentPage.tsx`, `apps/site/src/DocsIndex.tsx`, `apps/site/src/styles.css`, `apps/site/src/DocumentPage.test.tsx`, `docs/roadmap/_ISSUES.md`.

## Verify

`cd apps/site && bunx vitest run && bunx tsc -p tsconfig.json --noEmit` plus the production site build. Full `bun run self:check` is blocked in this checkout by another writer's in-flight `view-studio` edits.

## Dependencies / blocks

None; builds on the shell split `INFOSCHEMATICS-SITE-010` introduced.

## Documentation impact

### Decision Records

None — ADR-INFOSCHEMATICS-007 already assigns site layout and navigation to the Site application.

### Specifications

None.

### Guides

None; canonical Markdown under `docs/` is untouched.

### Roadmap

Ledger high-water `SITE` moves to 12.

## Review

### Delivered

The documentation section is a three-column layout in the wide shell: a sticky left sidebar listing the index, the visual guide, and every article grouped by section with the current one marked; the document centred at a 72ch measure; and a sticky right-hand "On this page" contents column linking every h2/h3 anchor. Headings now carry deduplicated GitHub-style slug ids. The contents column collapses below 1280px and the sidebar below 960px.

### Summary of changes

- `routes.ts` exports the shared `sectionTitles` and ordered `documentSections`; `DocsSidebar.tsx` renders the article navigation from them.
- `DocumentPage.tsx` builds a per-parse `Marked` instance: `walkTokens` rewrites relative links (as before), assigns slug ids, and collects the h2/h3 contents; a `renderer.heading` override emits the ids. The document footer is gone — the sidebar's index link supersedes it.
- `DocsIndex.tsx` adopts the same shell and sidebar; `styles.css` gains the `.docs-columns` grid, sticky sidebar/contents styling, and the two collapse breakpoints, and loses the unused footer rules.

### Verification

All 60 site tests pass (sidebar listing with `aria-current`, unique article anchor ids each linked from the contents nav, plus the pre-existing coverage — the `<h1>` pin updated to `<h1 id="` now that headings carry anchors). Site typecheck and the production build pass. `bun run self:check` cannot run end to end in this checkout while another writer's in-progress `view-studio` edits do not compile.

### Outstanding concerns

- Manual dev-server walk (columns at full width, anchor jumps, 1280px/960px collapses) not performed in this non-interactive session.
- No scroll-spy active-entry highlight; bounded out and left as a possible follow-up.

### Post-change review

Canonical Markdown under `docs/` is untouched; the site still renders it rather than copying it. The existing `href="/docs/"` test pin is satisfied by the sidebar's index link. Below 960px the sidebar is hidden rather than collapsed into a drawer — the site nav's Docs entry still reaches the index, and a drawer would need client state this static page avoids.

### Mini recap

Docs pages became a MUI-style three-column layout: article nav left, 72ch document centre, anchor contents right, collapsing gracefully on narrow viewports.

## Discussion

### Why slugs in walkTokens rather than the heading renderer

Both the renderer and the contents column need the same slug for the same heading. `walkTokens` sees every heading once, in document order, before rendering — assigning the slug there (kept in a `WeakMap`) guarantees the anchor and its contents link cannot drift, and keeps deduplication in one place.
