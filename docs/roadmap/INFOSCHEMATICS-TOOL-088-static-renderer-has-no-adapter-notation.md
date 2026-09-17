---
id: INFOSCHEMATICS-TOOL-088
area: TOOL
title: The static renderer has no Adapter Card notation
theme: rendering
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-17T10:55:00Z
updated_at: 2026-09-17T10:55:00Z
---

# The static renderer has no Adapter Card notation

## Goal

Draw an [Adapter Card](../reference/vocabulary.md#adapter-card) in `packages/render-svg` the way the interactive Canvas draws it, so a still rendering of a document that composes one shows a clasp rather than one Card sitting on top of another.

## Context

Found by hand while authoring `examples/is-showcase/` for `INFOSCHEMATICS-TOOL-087`, which is the first authored document in the repository to carry `adapts:` or `wraps:` at all.

`packages/render-svg/src/index.ts` contains no occurrence of `adapt`, `socket` or `clasp`: an Adapter Card is emitted as an ordinary Card at the box `adapterBoundsFor` computes, which deliberately overlaps the Card it holds. `packages/view-model/src/assembly.ts:8` puts the clasp's top at `held.y + held.height * (1 - adapterReach)` with `adapterFloor = 40` below, so the adapter's own rectangle covers the lower part of the held Card and its fill hides whatever is under it.

The interactive Canvas does not have the problem because it does not draw a rectangle. `packages/view-canvas/src/InfoschematicDiagram.tsx:2364-2400` traces the clasp as a single notched outline through `roundedOutline` — out along the adapter, up and around the held Card, and back — so nothing the adapter paints passes under the Card it holds. That treatment is the reference; the static renderer simply never got it.

The visible cost shows up on the held Card's label. A non-compact Card centres its label at very nearly the y the clasp's top sits on, so the label is drawn under the adapter's fill and lost. No per-Card override, and no transparent adapter fill, is authorable — growing the held Card does not help either, because the label's centre and the clasp's top move together. `examples/is-showcase/infoschematic.yaml` sets `diagram.appearance.card.compact: true` for exactly this reason, which means the document is quietly working around the defect rather than showing the notation the contract offers.

## Boundary

`packages/render-svg` treatment, and whatever it needs from `packages/view-model` to resolve the notched outline once for both renderers rather than twice. Visual treatment parity is a root check, so the shape both renderers draw has to be the same shape. This does not change `adapterBoundsFor`, the composition semantics, or which Card a Flow attaches to.

## Steps

1. [ ] Move or share whatever computes Canvas's notched outline so both renderers resolve one geometry — the Canvas path is in a component today.
2. [ ] Emit the clasp in `render-svg` as that outline, not as a Card rectangle.
3. [ ] Extend `scripts/visual-treatment-parity.test.ts` to hold both renderers to the clasp, as it does for a Point's label.
4. [ ] Render a document with a held non-compact Card and read its label, then drop `card.compact` from the showcase if it is only there for this.

## Files touched

- `packages/render-svg/src/index.ts` — the Adapter Card case that does not exist
- `packages/view-model/src/assembly.ts` — where a shared clasp outline would live
- `packages/view-canvas/src/InfoschematicDiagram.tsx` — the reference treatment, consuming the shared geometry
- `scripts/visual-treatment-parity.test.ts` — parity for the clasp
- `examples/is-showcase/infoschematic.yaml`, `examples/is-showcase/README.md` — if the `compact` workaround can be dropped

## Verify

`bun run self:examples:render examples/is-showcase/infoschematic.yaml --png` with `card.compact` removed, and read the held Card's label; `bun run self:scripts:test` for parity; both renderers side by side.

## Dependencies / blocks

None. Independent of `INFOSCHEMATICS-TOOL-089`.

## Documentation impact

### Specifications

`docs/specs/composition.md` owns the composition rules and `docs/specs/static-rendering.md` the static renderer's obligations; one of them has to say that an Adapter Card is drawn as a clasp in both renderers, because today nothing requires the static renderer to draw the notation at all.

### Decision Records

Unlikely. This is treatment parity with an existing, settled Canvas treatment.

### Guides

`apps/site/content/authoring.md` describes composing an Adapter Card; it may be worth saying that a held Card's detail is drawn above the clasp.

## Discussion

The showcase was authored to make capabilities visible, and the first thing it made visible was a capability one renderer does not implement — which is the argument for `AUTHOR-017` rather than against it.
