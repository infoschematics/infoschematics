---
id: INFOSCHEMATICS-SITE-003
area: SITE
title: Dotted grid treatment
theme: site-experience
horizon: next
status: draft
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Add a dotted background treatment as a third selectable grid option, alongside the existing `major` and `major-plus-minor` line grids, for a graph-paper-style canvas surface.

## Context

The domain already models a coarse-vs-fine grid choice: `GridTreatment = 'none' | 'major' | 'major-plus-minor'` (`packages/domain-model/src/appearance.ts`), rendered as SVG patterns in both `packages/view-canvas/src/InfoschematicDiagram.tsx` and `packages/render-svg/src/index.ts`, each drawing line strokes at `gridSize`/`gridMajorSize` spacing. A dots variant — a mark at each grid intersection instead of a stroked line — is the natural third option and was requested directly (dotted "fabric"-style background) after reviewing the current grid-only rendering.

## Boundary

This item does not change the default treatment, remove `major` or `major-plus-minor`, or add new authored spacing controls beyond the existing `gridSize`/`gridMajorSize` tokens. It does not touch the Studio editor's own snap-to-grid overlay (`use-editor.ts`), which is independent of the authored `grid` appearance.

## Current state

`GridTreatment` supports `none`, `major`, and `major-plus-minor`; there is no dotted/point pattern. `docs/guides/authoring.md` and `docs/specs/render-svg.md` document only the line-grid treatments.

## Steps

- [ ] Add a `dots` member to `GridTreatment` (`packages/domain-model/src/appearance.ts`) and carry it through the View Model resolver (`packages/view-model/src/appearance.ts`).
- [ ] Render a dot pattern (a mark at each grid intersection, sized from the existing `gridSize` token) in `packages/render-svg/src/index.ts`.
- [ ] Mirror the same pattern in `packages/view-canvas/src/InfoschematicDiagram.tsx` for canvas/editor parity with the static renderer.
- [ ] Extend `InfoschematicDiagram.treatments.test.tsx`, `packages/render-svg/src/index.test.ts`, and `scripts/visual-treatment-parity.test.ts` to cover the new value.

## Files touched

- `packages/domain-model/src/appearance.ts`
- `packages/view-model/src/appearance.ts`
- `packages/render-svg/src/index.ts`
- `packages/view-canvas/src/InfoschematicDiagram.tsx`
- Their respective test files.

## Verify

`bun run test`, `bun run ki:verify:typecheck`, and `scripts/visual-treatment-parity.test.ts` pass with the new `dots` treatment covered end to end.

## Dependencies / blocks

None. Independent of `TOOL-014` and `TOOL-015`.

## Documentation impact

### Decision Records

None — an additive enum value following the existing grid-treatment pattern, not a new architectural decision.

### Specifications

Update `docs/specs/render-svg.md` to record the new treatment, in the `SVG-0NN` style used for `SVG-009`/`SVG-010`.

### Guides

Update `docs/guides/authoring.md`'s grid example/reference to list `dots` alongside `major` and `major-plus-minor`.

### Roadmap

None beyond this item.

## Discussion

### Contract shape

A `dots` (or similarly named) member added to `GridTreatment` keeps the same contract-first shape SITE-002 established for grid treatments: the domain declares the option, both renderers implement it as an SVG pattern fill, and parity between the canvas and static renderers is verified the same way the existing treatments are.
