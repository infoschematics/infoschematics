---
id: INFOSCHEMATICS-SITE-016
area: SITE
title: Homepage guide pathways
theme: site-experience
horizon: next
status: draft
blocks: []
blocked_by: [INFOSCHEMATICS-SITE-017, INFOSCHEMATICS-TOOL-038]
baseline_ref: null
created_at: 2026-09-13T15:51:48Z
updated_at: 2026-09-13T15:51:48Z
---

# Homepage guide pathways

## Goal

Help a first-time visitor move directly from the homepage promise and its visual model into the most relevant user-guide path.

## Context

The homepage explains Infoschematics well, but its hero offers no explicit next action and the five labelled artefacts in the overview are inert. The authored overview already gives those artefacts stable identities, so the Site can map them to guide destinations once generated SVG can be mounted inline and inspected safely.

## Boundary

This item does not redefine the homepage diagram, add navigation callbacks to authored Infoschematic data, make every SVG descendant interactive, or duplicate guide content on the homepage.

## Current state

The hero ends with descriptive text before a data-URI SVG image. Neither the lede nor the overview artefacts link into the guide, and image embedding prevents the Site from observing the authored artefact metadata already present in static SVG output.

## Steps

- [ ] Add a clear “Getting started” call to action beneath the homepage lede.
- [ ] Replace the inert homepage image with the supported Site-owned inline SVG host from `INFOSCHEMATICS-TOOL-038`.
- [ ] Map `STR-01`, `PRS-02`, `INFO-03`, `OUT-04`, and `OUT-05` to stable guide destinations owned by `INFOSCHEMATICS-SITE-017`.
- [ ] Provide focusable, named keyboard equivalents for every pointer-activated artefact pathway.
- [ ] Preserve the existing visual treatment and verify the pathways across desktop and narrow layouts.

## Files touched

- `apps/site/src/App.tsx`
- `apps/site/src/App.test.tsx`
- Site-owned homepage inline-SVG component and focused tests
- `apps/site/src/styles.css`

## Verify

Run focused homepage and inline-SVG component tests, `bun run --cwd apps/site build`, and `bun run self:check`. Inspect the built homepage at desktop and 390-pixel widths; confirm the CTA and all five artefact pathways reach their intended guide sections by pointer and keyboard without changing the authored Infoschematic definition.

## Dependencies / blocks

`INFOSCHEMATICS-SITE-017` must establish stable guide destinations. `INFOSCHEMATICS-TOOL-038` must establish the safe inline-SVG host pattern and artefact-event boundary. `INFOSCHEMATICS-SITE-015` is related visual tuning but is not a build-order dependency.

## Documentation impact

### Decision Records

No decision record is expected because interaction remains Site-owned and follows the existing serialisable-data boundary.

### Specifications

No reusable behaviour-level specification changes are expected; the SVG integration contract belongs to `INFOSCHEMATICS-TOOL-038`.

### Guides

Use only stable destinations established by the guide information architecture; do not add duplicate homepage-only explanations.

### Roadmap

Keep future homepage storytelling changes separate from the reusable inline-SVG integration work.

## Discussion

### Destination map

Structure should lead to the visual guide, Presentation to the authoring or presentation explanation selected during implementation, Infoschematic to Getting started, Rendered to Static rendering, and Presented to Present. Link text and adjacent controls must make those destinations understandable without relying on the diagram alone.

### Interaction ownership

The Site maps authored identities to routes. The definition remains inert serialisable data, and the renderer remains unaware of navigation.
