---
id: INFOSCHEMATICS-SITE-020
area: SITE
title: Mobile guide navigation
theme: site
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-14T01:15:29Z
updated_at: 2026-09-14T01:15:29Z
---

# Mobile guide navigation

## Goal

Keep the documentation journey and active-page outline available on narrow screens where the desktop sidebar cannot remain visible.

## Context

The desktop documentation sidebar expands the active page into its second- and third-level headings. Below 960 pixels the sidebar is hidden completely, leaving readers without either the guide map or the page outline.

## Boundary

This item adds a compact Site-owned navigation disclosure using the same route and outline data as the desktop sidebar. It does not add search, duplicate the route catalogue, alter canonical document URLs, or introduce a client-side navigation framework.

## Steps

- [ ] Render one accessible mobile documentation disclosure on every guide and Components page.
- [ ] Reuse the desktop navigation entries and active-page outline rather than maintaining a second route list.
- [ ] Make the current page and its headings understandable inside the disclosure.
- [ ] Verify keyboard structure, narrow-screen containment, and desktop sidebar preservation.

## Files touched

- `apps/site/src/DocsSidebar.tsx`
- `apps/site/src/DocumentPage.test.tsx`
- `apps/site/src/VisualGuide.test.tsx`
- `apps/site/src/styles.css`

## Verify

Run focused Site tests and `bun run self:check`. Inspect a Markdown guide and Components at desktop and 390-pixel widths, confirming that exactly one appropriate documentation navigation is visible without horizontal overflow.

## Dependencies / blocks

None. The existing route catalogue and page-outline projection are stable inputs.

## Documentation impact

No content or canonical repository documentation changes are required.
