---
id: INFOSCHEMATICS-SITE-026
area: SITE
title: Component reference pages
theme: site-experience
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: d92553d3b5d84052b54e87453b0a0a29d9dff065
created_at: 2026-09-14T07:05:25Z
updated_at: 2026-09-14T08:11:59Z
---

# Component reference pages

## Goal

Give Canvas, Regions, Fabrics, Cards, Flows, Points, and Graphics focused reference pages with useful examples, honest controls, and room for their capabilities to grow.

## Context

The current Components page places every specimen and property reference in one long document. The approved direction gives each component a stable route and MUI-style examples, keeps the landing page concise, and moves unsupported notation into a clearly marked Future area.

## Boundary

This item documents and demonstrates only current package behavior. It does not add square or dot grid density combinations, semantic Point roles, decision or stacked Cards, custom frame colour or width, named Fabric renderers, endpoint cardinality, or an authored visual-theme contract.

## Current state

Every component specimen and property reference is rendered in one long page. Routes, sidebar hierarchy, and reusable compact demo frame do not yet exist; those foundations are owned by `INFOSCHEMATICS-SITE-024` and `INFOSCHEMATICS-SITE-025`.

## Steps

- [x] Add stable child routes for Canvas, Regions, Fabrics, Cards, Flows, Points, and Graphics beneath the Components hub.
- [x] Give each page concise explanatory content, supported variants, focused controls, short source, and detailed property reference using the shared demo frame.
- [x] Add supported Canvas view-box and Region label controls, and use Rendered versus Design display where ports or editing detail materially aid understanding.
- [x] Keep the Components hub concise and collect unsupported notation under a clearly marked Future destination.
- [x] Update nested desktop and mobile navigation, active outlines, Site links, and route tests for the new child pages.
- [x] Inspect every page at desktop and 390-pixel widths and run the full repository gate.

## Files touched

- `apps/site/src/routes.ts`
- `apps/site/src/DocsSidebar.tsx`
- `apps/site/src/VisualGuide.tsx` or successor Components modules
- `apps/site/src/visual-guide/`
- Site-owned documentation links, tests, and `apps/site/src/styles.css`

## Verify

Run focused component-route, sidebar, curriculum, specimen, demo-frame, and interaction tests plus Site type checking and build; then run `bun run self:check`. Inspect every component page at desktop and 390-pixel widths without console errors, broken links, or horizontal overflow.

## Dependencies / blocks

`INFOSCHEMATICS-SITE-024` must establish the Components hierarchy and `INFOSCHEMATICS-SITE-025` must provide the reusable compact demo frame before this item becomes Ready.

## Delegation

After both dependencies land, bounded lower-cost workers may build disjoint component-page groups against the locked route and demo-frame contracts. The primary agent retains shared navigation, integration, visual consistency, full verification, lifecycle evidence, and commits.

## Documentation impact

### Decision Records

No decision record is needed while pages describe only existing behavior and keep future contracts explicitly unresolved.

### Specifications

No product conformance changes. Unsupported values remain absent from live controls.

### Guides

Replace the monolithic Components page with focused component reference pages and a Future destination.

### Roadmap

Capture square and dot grid density, semantic Point roles, richer Card or Flow notation, and authored visual themes as package work outside this Site item when their contracts are selected.

## Review

### Delivered

Components now has a concise catalogue and stable pages for Canvas, Regions, Fabrics, Cards, Flows, Points, Graphics, and Future notation. Each current component page combines focused guidance, a bounded live example, honest model-backed controls, compact source, and a collapsible property reference.

### Summary changes

Added component routing and nested navigation; Canvas view-box width and height controls; Region label and opacity controls; Card, Fabric, and Point port controls; a synchronized Standard and Adapter Card comparison; clear current grid labels; and an explicit Future page for unsupported notation.

### Verification

Result `fab582b6e656e976babcd373e2fa10af42e08798`: 92 focused Site tests, Site TypeScript checking, production Site build, and all 13 browser tests passed. Components, Canvas, Regions, Cards, Points, and Future pages were inspected at desktop width; Components, Canvas, and Cards were also inspected at 390 pixels with no horizontal overflow.

The repository-wide gate was run before the implementation commit. It is currently blocked by concurrent non-Site work in renderer parity, vocabulary citations, and an inline-SVG expectation; the scoped Site checks and clean detached-worktree build are green.

### Outstanding concerns

Future grid combinations, semantic Point roles, decision and stacked Cards, named Fabric presets, endpoint cardinality, and authored visual themes remain deliberately non-interactive until their portable package contracts exist. The Studio-backed Playground remains separately blocked by reusable Studio source-panel work.

### Post-change review

The labelled whole-diagram example remains in Overview, while Components now gets directly to the catalogue. The examples stay bounded on wide screens, stack cleanly on mobile, and expose only properties the current model and renderers support.

### Mini recap

Baseline `d92553d3b5d84052b54e87453b0a0a29d9dff065`; result `fab582b6e656e976babcd373e2fa10af42e08798`. The implementation stayed inside Site-owned routes, content, examples, controls, tests, and styling.

## Done

Accepted 2026-09-14 by Kris Brown under `INFOSCHEMATICS-BATCH-012` closure authority on the review packet above.

## Discussion

### Page sequence

Use Components, Canvas, Regions, Fabrics, Cards, Flows, Points, and Graphics. The ordering follows background, midground, and foreground layers and matches the anatomy legend.

### Grid vocabulary

The future public controls should separate Pattern—Squares or Dots—from Intervals—Major or Major plus minor. Current scalar treatments remain unchanged until Domain Model, Canvas, static SVG, and Studio agree a compatibility migration.

### Point vocabulary

Future Point roles may include invisible Anchor, Junction, Start, End, and Reference or off-page continuation. Current pages should explain connectable Points without implying these roles already exist.

### Visual themes

`appearance.surface` currently selects neutral or blueprint. Shared visual tokens are renderer decisions, while canonical `Theme` means thematic explanatory Scenes. The site must not present those as a portable authored visual-theme system.
