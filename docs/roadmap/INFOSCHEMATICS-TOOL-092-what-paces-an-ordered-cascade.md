---
id: INFOSCHEMATICS-TOOL-092
area: TOOL
title: What paces an ordered cascade in an untimed Sequence
theme: tool
horizon: waiting-for
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-18T03:50:00Z
updated_at: 2026-09-19T00:00:00Z
---

# What paces an ordered cascade in an untimed Sequence

## Goal

Settle whether an ordered cascade — one Dynamic playing after another in an authored order — is admissible at all, and what paces it when the presentation has no clock.

## Context

Split out of the Scene signal treatments item on 2026-09-18 rather than shaped into it; that item has since been accepted and pruned, so this one is blocked by nothing. That record's Goal originally named four playback statements; the owner's decision gave it two, `once` and `repeat`, and left a cascade out of scope because nothing in the tree answers what a cascade divides.

The difficulty is specific, not a gap in effort. `packages/view-model/src/runtime.ts:381` gives every runtime Scene a `hold`, defaulting to `defaultSceneDuration` at `:131`, so a number always exists. In an untimed Sequence (`presentation.timed: false`, `docs/specs/scenes-and-callouts.md:55-63`) that number is fiction: the Scene stays on screen until the presenter steps, which may be one second or ten minutes. Dividing a nominal hold across stages in a manually driven Scene either finishes before the presenter has finished speaking or waits for a step that may never come.

`DYNAMIC-001` (`docs/specs/diagram-dynamics.md:15`) forbids a declaration from carrying duration, easing or a timer, so a staged cue cannot buy its way out by authoring milliseconds. Any answer has to name a pacing source that is not authored time: the presenter's own steps, a receipt from the previous stage, or a decision that a cascade belongs only to a timed Sequence.

## Boundary

This is a decision item, not an implementation. It does not add a cue field, change `once` or `repeat` as delivered, or introduce authored timing anywhere.

## Steps

1. [x] Put the three candidate pacing sources to the owner: presenter-stepped stages, receipt-driven stages, or cascade admitted only in a timed Sequence.
2. [ ] Record the answer as an amendment to `ADR-INFOSCHEMATICS-026` or a companion record, naming its consequence for `DYNAMIC-001` and `SIGNAL-003`.
3. [ ] Capture the implementation item that follows, or close this one as decided-against.

## Files touched

- `docs/decisions/ADR-INFOSCHEMATICS-026-name-dynamics-in-the-document.md`, `docs/decisions/README.md`
- `docs/specs/diagram-dynamics.md`, `docs/specs/scenes-and-callouts.md` — only if the answer changes what a declaration may carry

## Waiting condition

Move this item to Next only when the owner has chosen between the three candidate pacing sources, or has decided against a cascade altogether.

## Current state

The waiting condition is **not met**. The three candidates were put to the owner on 2026-09-19, which is the whole of step 1; the answer has not been given. Nothing else in the item can proceed without it, because every remaining step records or implements that answer.

## Discussion

### The candidates as put

Presenter-stepped stages, receipt-driven stages, or a cascade admitted only in a timed Sequence. The recommendation offered alongside them was that the Sequence paces the cascade and the declaration never does: in a timed Sequence the `hold` is real and stages divide it, and in an untimed one each stage is a presenter step, which is what the presenter is already doing. That admits a cascade in both kinds of Sequence, needs no pacing source that is not already there, and leaves `DYNAMIC-001` intact with no cue field added.

### Why it cannot be decided locally

The difficulty is not a gap in effort. `hold` always holds a number, and in an untimed Sequence that number is fiction — the Scene stays up until the presenter steps. Choosing which fiction to build on is an authored decision about what the notation means, not one an implementer can settle from the code, which is why this item was split out rather than shaped into the Scene signal treatments item.

### Closing it is an outcome

If the answer is that a cascade belongs only to a timed Sequence, this item closes as decided-against and the amendment to `ADR-INFOSCHEMATICS-026` records that. A decision item that ends in no implementation has still delivered.
