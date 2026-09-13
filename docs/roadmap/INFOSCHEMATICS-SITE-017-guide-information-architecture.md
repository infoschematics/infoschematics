---
id: INFOSCHEMATICS-SITE-017
area: SITE
title: Guide information architecture
theme: site-experience
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: d843d88d50c4ddcb0f09172042051dc97368a00b
---

# Guide information architecture

## Goal

Give readers a progressive user guide that starts with adoption and visual understanding before leading into authoring, product modes, rendering, and integration.

## Context

The current sidebar leads from Getting started into Capabilities, publishes Reference and Design as equal top-level journeys, and introduces canonical terminology links before a new reader has practical context. The requested public journey is Getting started, Installation, Visual guide, Authoring, Present, Studio, Static rendering, and React integration; the rationale-oriented Design section should be called Approach.

## Boundary

This item does not rename the canonical Studio Design mode, move canonical repository documentation out of `docs/`, remove stable vocabulary anchors, rewrite the underlying architectural decisions, or redesign the entire documentation renderer.

## Current state

Site routes expose User guide, Reference, and Design sections. The visual guide is inserted manually between Getting started and Capabilities, installation has no dedicated page, Capabilities overlaps the visual guide, and vocabulary is prominent in both the sidebar and early guide prose.

## Steps

- [x] Reorder the User guide as Getting started, Installation, Visual guide, Authoring, Present, Studio, Static rendering, and React integration.
- [x] Add concise installation guidance for package selection and the first supported setup.
- [x] Fold useful Capabilities material into the Visual guide and retire the separate Capabilities route with a compatible redirect.
- [x] Rename the public Design section and URLs to Approach while preserving compatible redirects from existing Design URLs.
- [x] Remove Reference and Vocabulary from primary documentation navigation while retaining canonical vocabulary content for stable deep links.
- [x] Revise Getting started and section introductions so practical guide links precede reference terminology.
- [x] Update routing, sidebar, document, and visual-guide tests for the new hierarchy and compatibility paths.

## Files touched

- `apps/site/src/routes.ts`
- `apps/site/src/DocsSidebar.tsx`
- `apps/site/src/DocsPage.tsx`
- `apps/site/src/VisualGuide.tsx`
- `apps/site/content/getting-started.md`
- `apps/site/content/installation.md`
- `apps/site/content/capabilities.md`
- focused Site route, sidebar, document, and visual-guide tests

## Verify

Run focused Site documentation, route, sidebar, and visual-guide tests, `bun run --cwd apps/site build`, and `bun run self:check`. Inspect the built guide at desktop and 390-pixel widths; confirm the primary navigation order, Approach naming, hidden Reference category, working legacy redirects, and absence of a separate Capabilities destination.

## Dependencies / blocks

The work uses existing Site-owned content and routing and has no build-order dependency. It establishes stable destinations required by `INFOSCHEMATICS-SITE-016`.

## Documentation impact

### Decision Records

No new decision record is expected because canonical repository documents and ownership boundaries remain unchanged; this is the public Site's information architecture.

### Specifications

No behaviour-level product specification changes are required.

### Guides

Add Installation, consolidate Capabilities into the Visual guide, and revise the public guide sequence and cross-links.

### Roadmap

Unblock homepage guide pathways after stable public routes land. Leave repository-wide guide-index conformance to `INFOSCHEMATICS-TOOL-040`.

## Review

### Delivered

From baseline `d843d88d50c4ddcb0f09172042051dc97368a00b`, commit `021f4863` established the requested progressive public guide, retained stable reference deep links outside primary navigation, and renamed the public Design journey to Approach with compatibility aliases. The current review also adds an explicit assertion for the complete sidebar order.

### Summary of changes

- Published Getting started, Installation, Visual guide, Authoring, Present, Studio, Static rendering, and React integration in reading order.
- Consolidated Capabilities into the Visual guide and kept the retired path useful.
- Renamed public Design routes and navigation to Approach while preserving old inbound paths.
- Removed Reference and Vocabulary from the primary journey without removing canonical content.

### Verification

Focused Site route, document, visual-guide, and sidebar tests pass, including exact guide-order and legacy-path coverage. `bun run --cwd apps/site build` and `bun run self:check` pass. Chromium inspection at desktop and a 390 by 844 device-metric override confirmed the guide and visual guide remain readable, correctly stacked, and free of horizontal overflow.

### Outstanding concerns

None. Compatibility is implemented as client-side canonicalisation inside the static application rather than server-issued HTTP redirects, which matches the existing Site deployment model.

### Post-change review

The public journey now leads with adoption and practical use while canonical repository documents remain the source of truth. Stable destinations required by `INFOSCHEMATICS-SITE-016` are available, and the item is ready for acceptance review.

### Mini recap

The Site now offers one progressive user guide and a rationale-oriented Approach section. No additional documentation migration is required for this item.

## Discussion

### Progressive disclosure

Canonical vocabulary remains authoritative and linkable, but it should support explanations rather than act as the first public journey. Readers should encounter concrete tasks and visuals before reference terminology.

### Approach naming

Approach describes why the system is shaped this way. The rename applies only to the public documentation category; canonical Design mode terminology remains unchanged wherever it names Studio behaviour.

### Compatibility

Existing inbound links to Capabilities, Design pages, and Vocabulary should resolve to a useful destination even when those pages no longer appear in primary navigation.
