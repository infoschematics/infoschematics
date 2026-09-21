---
id: INFOSCHEMATICS-TOOL-108
area: TOOL
title: A drag that costs more the wider the Card is
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 2bb93074089bda6dbbca0c3d6707ad99c7e68074
created_at: 2026-09-21T18:15:00Z
updated_at: 2026-09-21T18:15:00Z
---

# A drag that costs more the wider the Card is

## Goal

Dragging a node in Design mode follows the pointer smoothly, whatever is on the diagram.

## Context

Reported on 2026-09-21 as node dragging shaking in the Studio playground, one of four defects raised together. The others are `INFOSCHEMATICS-TOOL-109`, `-110` and `-111`.

This one is the cost of a frame rather than what the frame draws. Nothing in the port calculation depends on where a box is — only on how long a side is and how many ports it offers — and a Design render asks the same two questions of every side of every box on every pointer move.

## Boundary

The port calculation only: what a side's ports come to, and which counts a side has room for. It does not change where ports sit, how many a side offers, how a drag is tracked, or what a drag writes.

## Current state

`portCountsForSide` walked the counts from one upwards, calling `subdivide` each time until it refused. `subdivide` then asked whether each snapped offset appeared elsewhere in the list through `indexOf`, which is the whole list per offset, so a wide Fabric side cost more the wider it was — about a millisecond an answer. A Design-mode render asked `portsForBox` about 150 times and `portCountsForSide` about 640 times.

Measured: one simulated Design frame on a 1200×400 box took 249.4ms.

## Steps

- [x] Remember both answers against the numbers they depend on.
- [x] Hand a remembered answer back as it is rather than copying it, and freeze it so no caller can alter one.
- [x] Drop the store whole once it grows past a size no real diagram reaches, so a resize drag cannot grow it without bound.
- [x] Replace the duplicate check with a comparison against the previous element.
- [x] Cover the identity of a remembered answer, its frozen-ness, and that remembering changes no answer.

## Files touched

- `packages/view-model/src/ports.ts` — `subdivide`, `portCountsForSide`, `portOffsetsForSide`, the store and its limit
- `packages/view-model/src/ports.test.ts` — answering the same side twice

## Verify

`bun run self:check`, then drag a Card around a diagram carrying a wide Fabric in Design mode: the Card keeps up with the pointer. The three added cases assert that asking twice returns the same array, that it is frozen, and that a side's offsets are unchanged by being remembered.

## Dependencies / blocks

None.

## Documentation impact

### Decision Records

None.

### Specifications

None. Nothing about what a side offers changed, only what it costs to ask.

### Guides

None.

### Roadmap

`docs/roadmap/_ISSUES.md` reserves `TOOL` through `112`.

## Review

### Delivered

Every Step, within the stated Boundary. Baseline `2bb93074089bda6dbbca0c3d6707ad99c7e68074`, delivered in `f4781910`.

### Summary of changes

Two module-level stores, keyed by the arguments each answer depends on, cleared whole past 1024 entries. Answers are frozen and returned rather than copied, which is safe because every caller reads them through `map`, `filter`, `find` or `at`. The duplicate check compares the offset immediately before it: the spread rises with the index and rounding keeps that order, so a repeat can only be of its predecessor.

Measured after: the same frame takes 4.2ms.

### Verification

`bun run self:check` — green, 48 tasks.

### Outstanding concerns

The store is cleared whole rather than evicted by age. A diagram that genuinely holds more than 1024 distinct side lengths would clear and refill repeatedly, which is the uncached cost plus bookkeeping. No real diagram is near that, and the alternative carries its own per-lookup cost.

### Post-change review

The Goal is met for this cause. Whether dragging still shakes for the other three causes is answered by their own records.

### Mini recap

The port maths was recalculated hundreds of times per pointer move and cost more the wider the side. It is now remembered against the numbers it depends on: 249.4ms to 4.2ms for one Design frame.

## Done

Closed 2026-09-21 under the standing instruction to progress every record that is not `waiting-for` or `parked`. Awaiting the reporter's own testing pass.
