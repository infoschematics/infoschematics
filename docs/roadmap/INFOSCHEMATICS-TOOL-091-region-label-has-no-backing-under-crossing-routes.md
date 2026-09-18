---
id: INFOSCHEMATICS-TOOL-091
area: TOOL
title: A Region label has no backing under a crossing route
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-18T03:50:00Z
updated_at: 2026-09-18T03:50:00Z
---

# A Region label has no backing under a crossing route

## Goal

Draw every Region label over an opaque backing in its Region's resolved surface colour, in both renderers, so a Flow route that legitimately shares the label's band cannot leave stroke between the glyph strokes.

## Context

Found by the feature run-through on 2026-09-18: `ROUTE-019` is `divergent` in `docs/specs/routing-and-placement.md:211` and is the only divergence in the specifications with no roadmap record. `COMPOSE-002`, `COMPOSE-003` and `COMPOSE-004` are each owned by `INFOSCHEMATICS-TOOL-084`, `-085` and `-086`; this one was left unowned.

The requirement is already written and already decided: a route MAY occupy the band, the band MUST NOT be reserved by refusing the route, and the backing MUST be derived from the same resolved label geometry both renderers consume — legibility MUST NOT be pursued by moving the label, because `ROUTE-018` fixes that geometry to shared deterministic metrics.

Neither renderer emits a backing. The static renderer writes the label as a bare `text` at `packages/render-svg/src/index.ts:783`, inside the Region loop that begins at `:736`; both Flow loops come later, at `:878` and `:938`, so a crossing route is painted over the glyphs. Canvas writes the same bare `text` at `packages/view-canvas/src/InfoschematicDiagram.tsx:2221`.

One thing the shaping has to solve: `RegionLabelGeometry` (`packages/view-model/src/region-geometry.ts:7-16`) carries `x`, `y`, `textAnchor`, `dominantBaseline` and `length`, and `length` is non-null only for a notched label. A backing needs a band both renderers agree on, so either `regionGeometry` (`:149`) gains a resolved backing rectangle or the pinned extent becomes unconditional — deriving a width in each renderer would break exactly the parity `ROUTE-018` exists to hold.

`ROUTE-019`'s `_Verify:_` names `examples/is-infoschematics/infoschematic.yaml` as a document where two routes cross the "View and renderer packages" band. Rendered at 1600 px on 2026-09-18, both crossing routes pass to the left of the glyphs and the label reads cleanly, so that document no longer demonstrates the defect even though the code gap is real. Whatever case this item adds has to place a route through the glyphs deliberately rather than rely on that example.

## Boundary

This does not move a Region label, change `ROUTE-018`'s metrics, reserve the band by refusing or rerouting a Flow, or introduce a per-renderer measurement. It does not extend a backing to Card, Point, Fabric or Graphic labels.

## Steps

1. [ ] Decide where the backing band is resolved, and resolve it once in View Model so both renderers consume the same rectangle.
2. [ ] Emit it in both renderers immediately beneath the label glyphs, in the Region's resolved surface colour, so the static renderer's Region-before-Flow paint order stops mattering.
3. [ ] Add an authored case that routes a Flow through a Region label's glyphs, and assert the backing's geometry in `scripts/visual-treatment-parity.test.ts` rather than only in one renderer.
4. [ ] Render it and read the label, in both outlets, under a blueprint and a paper surface — a passing geometry comparison is not evidence the glyphs survived.
5. [ ] Move `ROUTE-019` to `conforming` and repoint its `_Verify:_` at the new case rather than at a document that no longer crosses the glyphs.

## Files touched

- `packages/view-model/src/region-geometry.ts` — the resolved backing band
- `packages/render-svg/src/index.ts` — the Region label emission at `:783`
- `packages/view-canvas/src/InfoschematicDiagram.tsx` — the Region label element at `:2221`
- `packages/view-model/src/region-geometry.test.ts`, `scripts/visual-treatment-parity.test.ts`
- `docs/specs/routing-and-placement.md` — `ROUTE-019`'s conformance and evidence
