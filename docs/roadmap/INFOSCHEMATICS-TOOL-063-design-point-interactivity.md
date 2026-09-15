---
id: INFOSCHEMATICS-TOOL-063
area: TOOL
title: Point interactivity in Design
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-15T12:10:00Z
updated_at: 2026-09-15T12:10:00Z
---

# Point interactivity in Design

## Goal

Give a Point the Design interaction `DESIGN-014` already promises it, so a Producer can select, move, and edit one on the Diagram rather than only through authored source.

## Context

Found while delivering Design interaction layers (`INFOSCHEMATICS-TOOL-045`, delivered). That item put one interaction layer behind every artefact kind Design can reach, and found there were five, not six: `ArtefactKind` in `packages/view-model/src/editable.ts` has `region`, `fabric`, `card`, `flow` and `graphic`, and Canvas hit-tests exactly those. A Point is rendered — `packages/render-svg/` draws one — but no Canvas surface offers it a selection, a handle, or a keyboard target, so there was nothing for a sixth layer to filter and none was built.

`DESIGN-014` states the six-kind contract including Point, and `docs/reference/vocabulary.md` carries `point` as a canonical term with authored geometry. The gap is therefore a stated behaviour that is not delivered rather than a term without a plan, and `DESIGN-018` records it as a known exception pointing here.

## Boundary

This item adds a Point's Design interaction and the interaction layer that filters it. It does not change how a Point is authored, how it is rendered in Present, or the Point capability row already declared in the matrix: no box resize, because a Point has no box.

## Current state

- `packages/view-model/src/editable.ts` declares `ArtefactKind` and the capability matrix. `artefactCapabilities` covers five kinds, and `artefactKinds` is derived beside it for the layer controls.
- `packages/view-canvas/src/InfoschematicDiagram.tsx` renders and hit-tests the five, each gated through `interactive(kind)` and marked `layer-inert` when its layer is closed.
- `packages/view-studio/src/app/editor/EditorTools.tsx` presents one control per entry in `artefactKinds`, so a sixth kind acquires its control by being added there rather than by editing the control surface.
- `packages/view-studio/src/app/editor/ArtefactControls.tsx` drives Properties from the selected kind and would need a Point case.

## Steps

- [ ] Decide whether a Point is a distinct `ArtefactKind` or an addressable part of the Flow that owns it, and record the reasoning — this is the one open question, and it decides the whole shape of the work.
- [ ] Extend the capability matrix and geometry roles for the chosen answer, keeping the `point` role distinct from `box` and `route`.
- [ ] Give Canvas a pointer and keyboard target for a Point, with the same selected and hovered treatments the other kinds use.
- [ ] Add its Properties controls and its reviewable change entries.
- [ ] Add its interaction layer, which follows from `artefactKinds` once the kind exists.
- [ ] Extend the browser matrix that `DESIGN-015` requires, and clear the known exception on `DESIGN-018`.

## Files touched

- `packages/view-model/src/editable.ts` and its capability tests
- `packages/view-canvas/src/InfoschematicDiagram.tsx` and its browser suite
- `packages/view-studio/src/app/editor/` for Properties and change recording
- `docs/specs/design-session.md`

## Verify

Run `bun run self:check`. The browser matrix must select, move, and edit a Point, and must show that closing the Point layer leaves it drawn and unreachable. Render a document with Points and look at it, because a Point is small enough that a handle can be correct and still be unusable.

## Dependencies / blocks

None. `DESIGN-018` records the exception this item removes.

## Documentation impact

### Decision Records

One is likely, for the first step: whether a Point is its own kind or part of a Flow is a durable contract choice that the capability matrix and every host reads.

### Specifications

Amend `DESIGN-014` if the answer changes the six-kind wording, extend the `DESIGN-015` matrix, and clear the exception on `DESIGN-018`.

### Guides

Producer guidance gains a Point section once there is something to do with one.

### Roadmap

None.
