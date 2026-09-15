---
id: INFOSCHEMATICS-TOOL-046
area: TOOL
title: Multi-selection alignment
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-15T05:10:00Z
---

# Multi-selection alignment

## Goal

Let Producers select several diagram elements and align, distribute, or move them together so repeated layout coordinates do not need to be maintained one element at a time.

## Context

Matrix-like geographies currently retain explicit repeated coordinates in YAML and JSON. That keeps the authored model complete and portable, but [Design](../reference/vocabulary.md#design) offers no multi-selection operation for efficiently maintaining those coordinates.

## Boundary

This item does not add persistent alignment constraints, derived Region extents, automatic layout, or implicit relationships between otherwise independent elements.

## Current state

Design selection is single-valued. `ArtefactSelection` in `packages/view-model/src/editable.ts` is a discriminated union of exactly one artefact — `region`, `fabric`, `card`, `graphic` with box geometry, and `flow` with route geometry — and the runtime carries one `selection` field. Every typed operation (`moveArtefactOperation`, `resizeArtefactOperation`, `reorderArtefactOperation`, `removeArtefactOperation`) takes a single target.

`artefactCapabilities` already records per-kind Design capability, including that Flows cannot move or resize directly, so the capability table is the natural gate for which kinds may participate in a group operation. There is no selection set, no anchor concept, and no alignment or distribution operation anywhere in View Model, Canvas, or Studio.

## Steps

- [ ] Introduce an ordered selection set in View Model alongside the existing single selection, preserving the single-selection API as the one-element case so current callers keep working.
- [ ] Define participation from `artefactCapabilities`: only kinds with the `move` capability may be aligned or distributed, so Flows follow their attachments rather than being aligned directly.
- [ ] Define the anchor as the first selected element, and surface it distinctly so a Producer can see which element the others will align to.
- [ ] Add align operations for left, horizontal centre, right, top, vertical centre, and bottom, plus distribute operations for horizontal and vertical spacing, each emitting ordinary coordinate changes.
- [ ] Decide and encode whether a composed Card selects and moves as one unit, and keep contained elements consistent with their container after a group operation.
- [ ] Emit every group operation as one atomic entry in the reviewable change set so a single undo reverses the whole alignment.
- [ ] Add Canvas gestures for additive and range selection, with keyboard parity, and Studio controls for the align and distribute operations.
- [ ] Cover multi-selection, anchor choice, each align and distribute operation, mixed-kind selections, composed Cards, and single-undo reversal in the rendered browser matrix.

## Files touched

- `packages/view-model/src/editable.ts` and its runtime for the selection set and group operations
- `packages/view-canvas/src/InfoschematicDiagram.tsx` for additive selection gestures and anchor affordance
- `packages/view-studio/src/app/` for align and distribute controls
- `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx` and `packages/view-studio/src/app/App.browser.test.tsx`
- `docs/specs/design-session.md` and `docs/specs/design-editing.md`
- affected Producer guides under `docs/guides/`

## Verify

Run focused View Model, Canvas, and Studio suites, `bun run test:browser`, and `bun run self:check`. In a browser fixture, select several elements, apply each align and distribute operation, confirm the anchor stays fixed, confirm one undo reverses the whole group change, and confirm the reopened canonical document contains ordinary explicit coordinates with no alignment metadata.

## Dependencies / blocks

No hard dependency. Coordinate with Design interaction layers (`INFOSCHEMATICS-TOOL-045`, delivered), which changes which kinds are selectable: layer filtering must constrain what a multi-selection can contain rather than the two features maintaining separate notions of selectability. Extend the `DESIGN-015` matrix in [the Design session specification](../specs/design-session.md) rather than adding a parallel harness.

## Documentation impact

### Decision Records

Record a decision if the selection set changes the accepted single-selection runtime contract or introduces an anchor concept that other features must honour.

### Specifications

Specify selection-set semantics, capability-gated participation, anchor behaviour, each align and distribute operation, atomic change-set composition, and the guarantee that no alignment state is persisted.

### Guides

Explain multi-selection gestures, anchor choice, and that alignment produces ordinary coordinates a later editor can change freely.

### Roadmap

Selectability filtering stays with Design interaction layers (`INFOSCHEMATICS-TOOL-045`, delivered); this item owns the selection set and the group geometry operations.

## Discussion

### Selection semantics

Shaping must decide which visual element kinds can participate together, how a primary element anchors alignment, and whether composed Cards move as one selectable unit.

### Authored result

Every operation should materialise ordinary canonical coordinates in one reviewable, undoable change. Reopening the same model must not require an alignment engine to reproduce its geometry.
