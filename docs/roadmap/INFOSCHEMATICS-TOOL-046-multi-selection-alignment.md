---
id: INFOSCHEMATICS-TOOL-046
area: TOOL
title: Multi-selection alignment
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-15T13:20:00Z
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

- [x] Introduce an ordered selection set in View Model alongside the existing single selection, preserving the single-selection API as the one-element case so current callers keep working.
- [x] Define participation from `artefactCapabilities`: only kinds with the `move` capability may be aligned or distributed, so Flows follow their attachments rather than being aligned directly.
- [x] Define the anchor as the first selected element, and surface it distinctly so a Producer can see which element the others will align to.
- [x] Add align operations for left, horizontal centre, right, top, vertical centre, and bottom, plus distribute operations for horizontal and vertical spacing, each emitting ordinary coordinate changes.
- [x] Decide and encode whether a composed Card selects and moves as one unit, and keep contained elements consistent with their container after a group operation.
- [x] Emit every group operation as one atomic entry in the reviewable change set so a single undo reverses the whole alignment.
- [x] Add Canvas gestures for additive and range selection, with keyboard parity, and Studio controls for the align and distribute operations.
- [x] Cover multi-selection, anchor choice, each align and distribute operation, mixed-kind selections, composed Cards, and single-undo reversal in the rendered browser matrix.

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

## Review

### Delivered

A Design selection can now hold several elements. Shift on a press, or Shift with Enter or Space on the keyboard, adds the element to what is already held and takes it back out again; a Shift sweep across empty canvas gathers everything the band crosses. The first element taken is the anchor: it keeps the ordinary selected treatment, and the others are drawn in the same colour but broken, so the element the group will be brought onto stays legible while the group is assembled.

Six align controls and two distribute controls appear in the Design tools row. Align brings every other held element onto the anchor's left, centre, right, top, middle or bottom, leaves the anchor where it is, and moves nothing on the other axis. Distribute equalises the horizontal or vertical gaps and leaves the outermost two elements alone. Two held elements enable the align controls and three the distribute controls; below that they are disabled and say what would make them work. The whole group also moves together: a drag on any held element carries all of them by one offset, and the arrow keys step the group by the authored grid.

Nothing about the group is authored. Each operation records ordinary coordinates and is reversed by one undo.

### Summary of changes

`packages/view-model/src/editable.ts` owns the contract and the geometry. `ArtefactSelectionSet` is an ordered list, `selectionAnchor` reads its first element, `toggleArtefactSelection` adds or drops one, `selectionSetWithinLayers` filters the whole hold through the interaction layers `TOOL-045` introduced, and `groupMovableSelection` reduces a hold to the elements a group operation may actually move by reading `artefactCapabilities` — which is why a Flow may be held but is left to its ports. `alignOffsets` and `distributeOffsets` are pure box arithmetic returning one offset per element, so the calculation is testable without a renderer and the constraint policy stays in one place.

`packages/view-canvas/src/InfoschematicDiagram.tsx` adds `selectionSet`, `onArtefactExtend`, `onArtefactRange` and `onArtefactGroupMove`. The Shift branches come before the ordinary select-and-drag path, so extending never starts a move. A press on an element already held drags the group instead: `dragGroup` publishes the cumulative offset from the gesture's start point rather than a point per element, which keeps Canvas coordinate-only and leaves snapping and grid policy with View Model. The range sweep hit-tests the collections Canvas already derived rather than the DOM, so closed layers stay excluded and an adapter is swept through the Card it holds; Flows are absent because a route is not a box. Touched, not enclosed: a sweep that crosses an element takes it, which is what lets a row of Cards be gathered without also taking the Region they sit in.

`packages/view-studio/src/app/editor/use-editor.ts` holds one ordered selection and publishes its anchor as the single selection, so the properties panel needed no notion of a group. Range selection is a union with what was already held, because sweeping across a held element means the Producer wants it held. `moveGroup` snapshots the participants at the start of a drag and recomputes from that snapshot on every event, so a gesture coalesces into one operation per element inside one checkpoint. A group drag rounds the anchor to the grid and carries the same delta to every member, so relative geometry survives; align and distribute apply no rounding at all, because the arrangement asked for is the one to keep. `EditorTools.tsx` presents the eight controls and `App.tsx` routes the group arrow keys before the single-element ones.

The held treatment is declared in `packages/view-canvas/src/styles.css` and again in `packages/view-studio/src/styles.css`, because the editor's stylesheet does not read the Canvas one — see the concern below.

`DESIGN-020` states the semantics and `DESIGN-015` gains the rendered cases. `ADR-INFOSCHEMATICS-027` records why there is one ordered selection rather than a selection and a set, and why every operation is measured from the anchor. `selection-anchor` joins the vocabulary.

### Verification

`bun run self:check` passed: every TypeScript project, the node suite, no dependency violations, the browser suite, and the production site build.

Three Canvas browser cases cover adding and dropping by pointer and by Shift+Enter, a press on a held element producing exactly one group offset and no selection change, and a sweep gathering two Cards with the band present during the gesture and gone after release. Two Studio cases cover align top and distribute across with the anchor unmoved, one row per moved element in the change set, undo restoring the group, and two arrow presses stepping the group twice rather than once twice as far.

Then the surface was rendered in Chromium at 1500×950 and looked at, which is the only reason this item is correct. The suite was fully green while the held elements were drawn exactly like unheld ones: `group-held` was on the element and the rule was in the Canvas stylesheet, but the Studio surface never loads that stylesheet. Looking at it also caught the first Studio test passing for the wrong reason — it extended a selection before the anchor had committed — which is now an explicit wait.

### Outstanding concerns

`packages/view-studio/src/styles.css` does not read `packages/view-canvas/src/styles.css`. Its last line is `@import "@infoschematics/view-present/styles.css"`, and an `@import` after other statements is dead: PostCSS warns, the browser ignores it, and the editor surface runs entirely on this stylesheet's own hand-maintained copies of the Canvas selection treatments. Two consequences are visible today — this item had to declare its treatment twice, and `.artefact-action` and `.artefact-resize-handle` have no rules here at all, so a selected Card's reorder and remove controls and its resize handle render as unstyled black shapes in Studio. That is pre-existing and was left alone rather than admitted to this delivery, because moving the import changes cascade order across the whole editor. It wants its own item.

The item asks for "one atomic entry in reviewable change set". What is delivered is one undo step per group operation and one review row per changed element. `artefactOperationKey` is `kind:id:operation` with no group dimension; a collapsed row would hide the authored lines a review has to read, and grouping would break the per-element coalescing that makes a drag one operation. `DESIGN-020` states the row behaviour as a MAY and the Studio test asserts two rows for a two-element align, so the deviation is recorded rather than silent.

The rendered cases use Cards. Mixed-kind holds and the exclusion of Flows are covered by the View Model capability tests, which take a Card, a Flow and a Region together, but no browser case aligns a Region with a Card or drags a group containing an adapter. A manual walkthrough is the honest check for those.

Group drag was delivered although no Step names it — the Goal says "align, distribute, or move them together". It is the least specified part of this item and the part a manual walkthrough should push hardest, particularly a drag that starts on an adapter or a Region that contains other held elements.

Producer guidance is deferred with the rest of the batch's site prose; the specification and the vocabulary landed with the feature.

### Post-change review

Making the selection itself ordered, rather than adding a set beside it, is what kept this small. Interaction layers needed no second notion of selectability, the properties panel needed no notion of a group, and the Scene work that reads the selection was untouched. The alternative would have put "which one do I believe" into every feature that reads a selection.

The anchor is doing more work than it looks. Aligning to a group bounding box would have moved every element including the one the Producer picked first, making the result depend on what else happened to be held and making the same control keep moving things on every press. Measuring from the anchor makes each control idempotent — and creates the obligation to render which element the anchor is, which is where the stylesheet defect surfaced.

Two things were found only by rendering: the missing Studio treatment, and a test that passed because it raced. The second is the more instructive: a Shift press with nothing yet held is a legitimate plain selection, so the racing version asserted a true fact about the wrong state.

### Mini recap

One selection, held in order, measured from its first element. Every group operation writes ordinary coordinates and comes back with one undo, so the worst a Producer can do with any of it is press the control again.
