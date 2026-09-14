---
id: INFOSCHEMATICS-SITE-020
area: SITE
title: Mobile guide navigation
theme: site-experience
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 8d13f6c1baa642dba6461b9274e5bf11eee76615
created_at: 2026-09-14T01:15:29Z
updated_at: 2026-09-14T01:21:35Z
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

- [x] Render one accessible mobile documentation disclosure on every guide and Components page.
- [x] Reuse the desktop navigation entries and active-page outline rather than maintaining a second route list.
- [x] Make the current page and its headings understandable inside the disclosure.
- [x] Verify keyboard structure, narrow-screen containment, and desktop sidebar preservation.

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

## Review

### Delivered

Commit `8d2768d1` adds a narrow-screen guide disclosure to every documentation and Components page while retaining the existing desktop sidebar.

### Summary of changes

`DocsSidebar` now renders desktop and mobile presentations from one `DocumentationLinks` projection. The mobile disclosure names the active page and expands to the same guide sections and active-page outline. Site styling switches presentations at the existing 960-pixel breakpoint.

### Verification

Focused DocumentPage, Components, and Playground tests passed as part of 46 focused Site tests. `bun run self:check` passed 570 tests, browser tests, all workspace typechecks, dependency boundaries, schema and token checks, and the production Site build. Chromium inspection at 1440 and 390 pixels confirmed the correct navigation presentation, a visible Components outline after disclosure, zero horizontal overflow, and no console errors.

### Outstanding concerns

None. The mobile navigation is deliberately a disclosure rather than a permanently open sidebar so it does not push every article below the complete guide map.

### Post-change review

Desktop and mobile navigation share route order, current-page state, and outline entries, avoiding a second navigation source. Distinct accessible navigation labels and heading IDs prevent duplicate associations while both responsive presentations remain in the document.

### Mini recap

Narrow-screen readers can now reach the guide map and the current page's headings; desktop behaviour is unchanged.

## Done

Accepted 2026-09-14 under the project owner's explicit outcome authority to finish the website batch, on the review packet above.

## Discussion

### One source of navigation truth

Desktop and mobile presentations must consume the same entry and outline projection so route order, current-page state, and headings cannot drift.
