---
id: INFOSCHEMATICS-SITE-020
area: SITE
title: Mobile guide navigation
theme: site-experience
horizon: now
status: in-progress
blocks: []
blocked_by: []
baseline_ref: 8d13f6c1baa642dba6461b9274e5bf11eee76615
created_at: 2026-09-14T01:15:29Z
updated_at: 2026-09-14T01:16:34Z
---

# Mobile guide navigation

## Goal

Keep the documentation journey and active-page outline available on narrow screens where the desktop sidebar cannot remain visible.

## Context

The desktop documentation sidebar expands the active page into its second- and third-level headings. Below 960 pixels the sidebar is hidden completely, leaving readers without either the guide map or the page outline.

## Boundary

This item adds a compact Site-owned navigation disclosure using the same route and outline data as the desktop sidebar. It does not add search, duplicate the route catalogue, alter canonical document URLs, or introduce a client-side navigation framework.

## Current state

The shared sidebar is visible above 960 pixels and hidden below that breakpoint. Document pages do not provide an alternative narrow-screen guide map or active-page outline.

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

### Decision Records

No decision change is required.

### Specifications

No product behaviour changes.

### Guides

No public content changes are required; this item changes how existing guide structure is reached on a narrow screen.

### Roadmap

This record supplies the bounded Site delivery and review evidence.

## Discussion

### One source of navigation truth

Desktop and mobile presentations must consume the same entry and outline projection so route order, current-page state, and headings cannot drift.
