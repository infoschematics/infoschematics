---
id: INFOSCHEMATICS-SITE-017
area: SITE
title: Guide information architecture
theme: site-experience
horizon: next
status: ready
blocks: [INFOSCHEMATICS-SITE-016]
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T15:51:48Z
updated_at: 2026-09-13T15:51:48Z
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

- [ ] Reorder the User guide as Getting started, Installation, Visual guide, Authoring, Present, Studio, Static rendering, and React integration.
- [ ] Add concise installation guidance for package selection and the first supported setup.
- [ ] Fold useful Capabilities material into the Visual guide and retire the separate Capabilities route with a compatible redirect.
- [ ] Rename the public Design section and URLs to Approach while preserving compatible redirects from existing Design URLs.
- [ ] Remove Reference and Vocabulary from primary documentation navigation while retaining canonical vocabulary content for stable deep links.
- [ ] Revise Getting started and section introductions so practical guide links precede reference terminology.
- [ ] Update routing, sidebar, document, and visual-guide tests for the new hierarchy and compatibility paths.

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

## Discussion

### Progressive disclosure

Canonical vocabulary remains authoritative and linkable, but it should support explanations rather than act as the first public journey. Readers should encounter concrete tasks and visuals before reference terminology.

### Approach naming

Approach describes why the system is shaped this way. The rename applies only to the public documentation category; canonical Design mode terminology remains unchanged wherever it names Studio behaviour.

### Compatibility

Existing inbound links to Capabilities, Design pages, and Vocabulary should resolve to a useful destination even when those pages no longer appear in primary navigation.
