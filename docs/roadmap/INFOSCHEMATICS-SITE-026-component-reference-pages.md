---
id: INFOSCHEMATICS-SITE-026
area: SITE
title: Component reference pages
theme: site-experience
horizon: next
status: draft
blocks: []
blocked_by: [INFOSCHEMATICS-SITE-024, INFOSCHEMATICS-SITE-025]
baseline_ref: null
created_at: 2026-09-14T07:05:25Z
updated_at: 2026-09-14T07:05:25Z
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

- [ ] Add stable child routes for Canvas, Regions, Fabrics, Cards, Flows, Points, and Graphics beneath the Components hub.
- [ ] Give each page concise explanatory content, supported variants, focused controls, short source, and detailed property reference using the shared demo frame.
- [ ] Add supported Canvas view-box and Region label controls, and use Rendered versus Design display where ports or editing detail materially aid understanding.
- [ ] Keep the Components hub concise and collect unsupported notation under a clearly marked Future destination.
- [ ] Update nested desktop and mobile navigation, active outlines, Site links, and route tests for the new child pages.
- [ ] Inspect every page at desktop and 390-pixel widths and run the full repository gate.

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

## Discussion

### Page sequence

Use Components, Canvas, Regions, Fabrics, Cards, Flows, Points, and Graphics. The ordering follows background, midground, and foreground layers and matches the anatomy legend.

### Grid vocabulary

The future public controls should separate Pattern—Squares or Dots—from Intervals—Major or Major plus minor. Current scalar treatments remain unchanged until Domain Model, Canvas, static SVG, and Studio agree a compatibility migration.

### Point vocabulary

Future Point roles may include invisible Anchor, Junction, Start, End, and Reference or off-page continuation. Current pages should explain connectable Points without implying these roles already exist.

### Visual themes

`appearance.surface` currently selects neutral or blueprint. Shared visual tokens are renderer decisions, while canonical `Theme` means thematic explanatory Scenes. The site must not present those as a portable authored visual-theme system.
