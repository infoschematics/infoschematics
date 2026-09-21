---
id: INFOSCHEMATICS-TOOL-092
area: TOOL
title: What paces a cascade
theme: tool
horizon: now
status: done
blocks: [INFOSCHEMATICS-TOOL-119]
blocked_by: []
baseline_ref: a0232529c2bf58731536b25163007d14bf3675cb
created_at: 2026-09-18T03:50:00Z
updated_at: 2026-09-21T23:55:00Z
---

# What paces a cascade

## Goal

Settle whether an ordered cascade — one Dynamic playing after another in an authored order — is admissible at all, and what paces it when the presentation has no clock.

## Context

Split out of the Scene signal treatments item on 2026-09-18 rather than shaped into it; that item has since been accepted and pruned, so this one is blocked by nothing. That record's Goal originally named four playback statements; the owner's decision gave it two, `once` and `repeat`, and left a cascade out of scope because nothing in the tree answers what a cascade divides.

The difficulty is specific, not a gap in effort. `packages/view-model/src/runtime.ts:381` gives every runtime Scene a `hold`, defaulting to `defaultSceneDuration` at `:131`, so a number always exists. In an untimed Sequence (`presentation.timed: false`, `docs/specs/scenes-and-callouts.md:55-63`) that number is fiction: the Scene stays on screen until the presenter steps, which may be one second or ten minutes. Dividing a nominal hold across stages in a manually driven Scene either finishes before the presenter has finished speaking or waits for a step that may never come.

`DYNAMIC-001` (`docs/specs/diagram-dynamics.md:15`) forbids a declaration from carrying duration, easing or a timer, so a staged cue cannot buy its way out by authoring milliseconds. Any answer has to name a pacing source that is not authored time: the presenter's own steps, a receipt from the previous stage, or a decision that a cascade belongs only to a timed Sequence.

## Boundary

This is a decision item, not an implementation. It does not add a cue field, change `once` or `repeat` as delivered, or introduce authored timing anywhere.

## Waiting condition

The waiting condition was met on 2026-09-21: the owner chose presenter-stepped stages from the three candidates put.

## Current state

Decided and recorded. The answer is that the Sequence paces the cascade and the declaration never does — stages divide the Scene's `hold` in a timed Sequence, and each stage is one presenter step in an untimed one. It is written as `ADR-INFOSCHEMATICS-039`, with amendment notes on `ADR-INFOSCHEMATICS-026`, which owns the Dynamics vocabulary, and on `ADR-INFOSCHEMATICS-038`, which had placed the cascade out of scope for a reason this answer removes.

Neither `DYNAMIC-001` nor `SIGNAL-003` is amended, which was the test the record set itself: an order is not a duration, so nothing about what a declaration may carry has changed, and a cascade is cancelled by leaving its Scene exactly as any other cue is. The two rejected candidates are recorded with their grounds in the decision, so a later reader sees what was weighed rather than only what was chosen.

The implementation follows as `INFOSCHEMATICS-TOOL-119`; this item is closed for what it delivered, which is the decision.

## Steps

- [x] Put the three candidate pacing sources to the owner: presenter-stepped stages, receipt-driven stages, or cascade admitted only in a timed Sequence.
- [x] Record the answer as an amendment to `ADR-INFOSCHEMATICS-026` or a companion record, naming its consequence for `DYNAMIC-001` and `SIGNAL-003`.
- [x] Capture the implementation item that follows, or close this one as decided-against.

## Files touched

- `docs/decisions/ADR-INFOSCHEMATICS-039-a-sequence-paces-a-cascade-and-a-declaration-never-does.md` — the answer, as its own record
- `docs/decisions/ADR-INFOSCHEMATICS-026-name-dynamics-in-the-document.md`, `docs/decisions/ADR-INFOSCHEMATICS-038-a-scene-cues-a-dynamic-and-a-view-owns-the-cadence.md`, `docs/decisions/README.md`
- `docs/specs/diagram-dynamics.md`, `docs/specs/scenes-and-callouts.md` — only if the answer changes what a declaration may carry

## Verify

Read `ADR-INFOSCHEMATICS-039` and confirm it names the pacing source, the rejected candidates, and the contracts it leaves alone; confirm `ADR-INFOSCHEMATICS-026` and `ADR-INFOSCHEMATICS-038` each carry an amendment note pointing to it, and that the decision index lists it. No suite verifies a decision, which is what makes those three cross-references the check.

## Dependencies / blocks

Blocks `INFOSCHEMATICS-TOOL-119`, which implements the answer.

## Documentation impact

### Decision Records

`ADR-INFOSCHEMATICS-039` written; `ADR-INFOSCHEMATICS-026` and `ADR-INFOSCHEMATICS-038` amended; `docs/decisions/README.md` indexes it.

### Specifications

None. The answer deliberately leaves `DYNAMIC-001`, `SIGNAL-003`, `SCENE-006` and `SCENE-007` as written — the spec change belongs to the implementation item, where a notation exists to describe.

### Guides

None. Nothing a reader of the product guidance can use exists yet; the guide gains the cascade when `INFOSCHEMATICS-TOOL-119` builds it.

### Roadmap

`INFOSCHEMATICS-TOOL-119` carries the implementation.

## Review

### Delivered

Every Step. The item was a decision, and the decision is recorded.

### Summary of changes

The owner chose presenter-stepped stages on 2026-09-21. `ADR-INFOSCHEMATICS-039` records that a cascade is admissible wherever a Scene may cue, that the Sequence paces it — stages dividing a timed Scene's `hold`, one presenter step per stage in an untimed one — and that the declaration never carries a measurement. Both rejections are recorded with their grounds: a receipt-driven cascade needs a completion report no static renderer can give, and confining the cascade to timed Sequences answers a general question narrowly.

### Verification

The three cross-references above were read back after writing. `bun run self:check` green.

### Outstanding concerns

An untimed Sequence now gains a step that advances within a Scene rather than past it. That is the accepted cost, named in the decision's Consequences and carried into `INFOSCHEMATICS-TOOL-119` as the thing to hold a test to.

### Post-change review

None. The item wrote no code, so nothing followed it that could reshape it; the decision it recorded is the whole of its output.

### Mini recap

A decision item that could not be decided locally, held open rather than answered by its implementer. The owner chose presenter-stepped stages; the record names the pacing source, the two rejections, and the contracts deliberately left untouched.

## Done

Closed 2026-09-21, the day the owner answered, for what it delivered: the decision. Implementation is `INFOSCHEMATICS-TOOL-119`.

## Discussion

### The candidates as put

Presenter-stepped stages, receipt-driven stages, or a cascade admitted only in a timed Sequence. The recommendation offered alongside them was that the Sequence paces the cascade and the declaration never does: in a timed Sequence the `hold` is real and stages divide it, and in an untimed one each stage is a presenter step, which is what the presenter is already doing. That admits a cascade in both kinds of Sequence, needs no pacing source that is not already there, and leaves `DYNAMIC-001` intact with no cue field added.

### Why it cannot be decided locally

The difficulty is not a gap in effort. `hold` always holds a number, and in an untimed Sequence that number is fiction — the Scene stays up until the presenter steps. Choosing which fiction to build on is an authored decision about what the notation means, not one an implementer can settle from the code, which is why this item was split out rather than shaped into the Scene signal treatments item.

### Closing it is an outcome

If the answer is that a cascade belongs only to a timed Sequence, this item closes as decided-against and the amendment to `ADR-INFOSCHEMATICS-026` records that. A decision item that ends in no implementation has still delivered.
