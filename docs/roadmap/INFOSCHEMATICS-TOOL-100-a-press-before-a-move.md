---
id: INFOSCHEMATICS-TOOL-100
area: TOOL
title: A press before a move
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 70f9474c35a5419b4edef88147ab78a2658bd592
created_at: 2026-09-19T13:06:00Z
updated_at: 2026-09-19T13:40:00Z
---

# A press before a move

## Goal

Move an artefact by the distance the hand travels. Pressing a wide artefact near its edge and dragging a little should move it a little, not snap its centre under the pointer.

## Context

Found by user-acceptance testing on 2026-09-19, fifth item of the 12:10 recording, verbatim: _"Look, when I click and move on a structure, like, well this one for example, like a region, if I click, immediately I move it."_

The reporter pressed a Region — a wide, thin artefact — to select it, and the Region jumped. The gesture that was meant to select became a move of half the Region's width, because the drag reported the pointer's position as the artefact's new origin and the origin is the box's centre.

The size of the jump is the size of the artefact, which is why a Region shows it plainly and a Card only nudges. `dragThreshold` means a true click does not trigger it at all; the smallest movement past that threshold does.

## Boundary

This is about where a dragged artefact goes for a given pointer movement. It does not change the drag threshold, the axis constraints, selection behaviour, grid rounding or alignment-guide snapping, and it does not touch `dragGroup`, which already carried per-element offsets and was the model for the fix. It does not change keyboard nudging or numeric placement, both of which were already exact.

## Current state

`dragArtefact` in `InfoschematicDiagram.tsx` recorded the press position only to measure the threshold, then reported `onArtefactMove(selection, { x: point.x, y: point.y })` from the pointer alone. The artefact's own origin at the moment of the press was never subtracted, so the first movement past the threshold teleported the origin to the pointer and every subsequent movement tracked correctly from there.

`dragGroup`, immediately above it, does the right thing already: it captures each member's offset from the gesture's start and applies it for the length of the drag. The single-artefact path was the one that did not.

`EDIT-018` required pointer, keyboard and numeric placement to express the same movement of the same artefact, which the teleport violated in spirit without being named — it made the pointer's placement depend on where inside the artefact the press landed.

## Steps

- [x] Capture the offset between the press point and the artefact's origin when the gesture starts.
- [x] Apply that offset for the length of the drag, on each axis the gesture allows.
- [x] Prove it in a browser test that presses a wide Region away from its centre and asserts the reported destination is the press offset carried, not the pointer.
- [x] State the rule in `EDIT-018`, which was the requirement the behaviour contradicted.

## Files touched

- `packages/view-canvas/src/InfoschematicDiagram.tsx` — `dragArtefact`
- `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx`
- `docs/specs/design-editing.md` — `EDIT-018`

## Verify

`bun run self:check`, then open the playground, enter Design, and press a Region near its left edge and drag ten units right: the Region moves ten units and the grab point stays under the pointer.

## Dependencies / blocks

None.

## Documentation impact

### Decision Records

None. Carrying the grab offset is the ordinary behaviour of a direct-manipulation drag; there is no alternative worth recording as a choice.

### Specifications

`EDIT-018` extended in `docs/specs/design-editing.md` to state that a pointer drag translates the artefact by the distance the pointer travelled, carrying the offset at which the press landed, and that placing the origin at the pointer is not acceptable because the resulting jump is the size of the artefact rather than the size of the gesture. Its Verify line gains the wide-artefact case and its Evidence cites the browser test.

### Guides

None. No guide describes drag behaviour at this level.

### Roadmap

None.

## Review

### Delivered

Every Step, within the stated Boundary. Baseline `70f9474c35a5419b4edef88147ab78a2658bd592`.

### Summary of changes

`dragArtefact` resolves `start` — the press position in Canvas coordinates — and derives `grab` as the vector from it to the artefact's origin, falling back to a zero offset where the conversion fails, which is the same fallback the existing `eventPoint` guard already used for the move itself. Each reported destination adds `grab` on whichever axes the gesture allows, so a constrained drag keeps the untouched axis at `origin` exactly as before.

The comment records why the offset exists in terms of the reported symptom — a Region jumping by half its width — rather than in terms of the arithmetic.

### Verification

`bun run self:check` — green, 48 tasks. `packages/view-canvas` 92 unit and 34 browser cases, green.

The browser case adds a Region fixture wide enough that a press near its edge is far from its centre, and a `MoveReportHarness` that records the reported destination instead of applying it, so the assertion measures the gesture's output directly rather than the result of a re-render. Pressing at the Region's left edge and moving by `(40, 10)` must report the origin moved by `(40, 10)`; the old code reports the pointer, so the case fails on it by the width of the offset.

### Outstanding concerns

None.

### Post-change review

The Goal is met. Regression risk is confined to `dragArtefact`: a press whose coordinate conversion fails now takes a zero offset and behaves exactly as the old code did, and a drag that happens to start at the artefact's centre is unchanged because the offset is zero there — which is why every existing drag case in the suite still passes without amendment.

The remaining asymmetry worth noting is that grid rounding and guide snapping apply to the reported destination, so a grab offset that is not a multiple of the grid moves the artefact to the nearest grid position rather than preserving the grab exactly. That is the intended interaction — `EDIT-018` permits the policies to differ — and is the subject of `INFOSCHEMATICS-TOOL-101` rather than this item.

### Mini recap

A single-artefact drag placed the artefact's origin at the pointer, so pressing a Region near its edge moved it by half its width the moment the drag began. The gesture now carries the grab offset for its length, as the group drag beside it already did. Proved in a browser test that reports rather than applies the move, and stated in `EDIT-018`.

## Done

Accepted 2026-09-19 by Kris Brown on the review packet above.

## Discussion

### Why the group drag was already right

`dragGroup` has to keep several artefacts in their relative positions, so an offset per member is unavoidable there — the bug could not exist in that path. The single-artefact path has exactly one element, and treating the pointer as its position is the shortcut that looks equivalent until the element is wider than the error.

### Why the test reports instead of applying

Applying the move and reading geometry back measures the host's re-render as well as the gesture, and the host rounds to the grid. Recording the reported destination isolates what this change actually alters, and keeps the assertion legible as coordinates rather than as a rounded box.
