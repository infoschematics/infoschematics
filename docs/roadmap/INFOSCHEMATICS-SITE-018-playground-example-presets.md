---
id: INFOSCHEMATICS-SITE-018
area: SITE
title: Playground example presets
theme: site-experience
horizon: next
status: awaiting-review
blocks: [INFOSCHEMATICS-SITE-019]
blocked_by: []
baseline_ref: 021f4863a5f603d264d48863bff6c5cf2818edb3
---

# Playground example presets

## Goal

Make the Playground the single public place to explore curated Infoschematic examples, with a small useful preset set and no competing Examples journey.

## Context

The Site currently exposes both Examples and Playground. They overlap, the Infoschematics preset uses an obsolete package-architecture diagram, and A system, explained differs from the clearer overview on the homepage. Source to sink and Blank remain useful.

## Boundary

This item does not redesign Studio, change example package ownership, remove reusable authored definitions needed outside the Site, or turn the Playground's YAML textarea into the future Studio source panel.

## Current state

Top-level navigation includes Examples and Playground. Three dedicated example routes duplicate Playground presets, while Playground offers Source to sink, Infoschematics, A system, explained, and Blank. The two self-explanatory examples do not match the accepted homepage model.

## Steps

- [x] Reduce Playground presets to Source to sink, An Infoschematic explained using the homepage definition, and Blank.
- [x] Remove the obsolete Infoschematics package-architecture and old system presets from Site imports and selection UI.
- [x] Remove Examples from primary navigation and retire the Examples index and dedicated rendering pages.
- [x] Redirect legacy `/examples/` and `/examples/*` URLs to the corresponding Playground preset or its default.
- [x] Update guide links and Site tests so examples are described consistently as Playground presets.
- [x] Remove now-unused Site dependencies only when no other Site-owned import requires them.

## Files touched

- `apps/site/src/Playground.tsx`
- `apps/site/src/App.tsx`
- `apps/site/src/routes.ts`
- retired Site example page components and tests
- `apps/site/content/getting-started.md`
- `apps/site/content/authoring.md`
- `apps/site/content/react-integration.md`
- `apps/site/package.json` only for unused Site dependencies
- focused Site navigation, routing, and Playground tests

## Verify

Run focused Site navigation, routing, Playground, and document tests, `bun run --cwd apps/site build`, and `bun run self:check`. Inspect the built Site; confirm only Docs and Playground remain as task destinations, all three presets render, An Infoschematic explained matches the homepage model, and every legacy example URL lands on an appropriate Playground preset.

## Dependencies / blocks

The homepage Infoschematic definition, Source to sink seed, and Blank definition already exist. This work establishes the curated preset and routing baseline required by `INFOSCHEMATICS-SITE-019`.

## Documentation impact

### Decision Records

No decision record is expected because the Site remains an outlet and reusable authored examples remain independently owned.

### Specifications

No behaviour-level product specification changes are required.

### Guides

Replace hosted-example links with Playground preset links and describe the Playground as the public example browser.

### Roadmap

Unblock the Studio-backed Playground after the curated preset contract lands. Record removal of independently published example packages separately if it remains desirable beyond Site cleanup.

## Review

### Delivered

From baseline `021f4863a5f603d264d48863bff6c5cf2818edb3`, commit `9922258a` made Playground the sole public example journey with three curated presets and retired the duplicate Examples pages. The final review extends compatibility so any unknown retired `/examples/*` path reaches the default Source to sink preset rather than a dead route.

### Summary of changes

- Kept Source to sink, An Infoschematic explained from the homepage definition, and Blank as the complete preset set.
- Removed obsolete Site preset imports, Examples navigation, index, and dedicated example pages.
- Canonicalised known saved example URLs to their matching preset and unknown retired example URLs to Source to sink.
- Removed Site dependencies made unused by the consolidation.

### Verification

Focused Site navigation, routing, Playground, document, and homepage tests pass. `bun run --cwd apps/site build` and `bun run self:check` pass. Chromium inspection at desktop and a 390 by 844 device-metric override confirmed the explained preset renders the homepage model and the editor and preview stack without horizontal overflow.

### Outstanding concerns

The YAML pane remains the deliberately bespoke early editor until the reusable Studio source-panel dependency for `INFOSCHEMATICS-SITE-019` lands; that work is outside this item's boundary.

### Post-change review

The implementation leaves independently authored examples reusable, removes only duplicate Site journeys, and preserves saved links through thin Playground aliases. The curated preset contract is stable and ready for acceptance review.

### Mini recap

Examples are now Playground presets rather than a competing public section. The next Playground change can build on exactly three complete authored documents.

## Discussion

### Curated set

Source to sink demonstrates a concrete system, An Infoschematic explained teaches the product model already used on the homepage, and Blank provides a clean starting point. A second self-referential architecture diagram and the old four-stage system add duplication rather than coverage.

### Compatibility routes

Retiring the Examples navigation does not justify breaking saved links. Legacy routes should become thin redirects into the Playground, not hidden duplicate pages.
