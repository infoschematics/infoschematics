---
id: INFOSCHEMATICS-TOOL-119
area: TOOL
title: Ordered cascade of cues
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-21T21:15:00Z
updated_at: 2026-09-22T19:40:00Z
---

# Ordered cascade of cues

## Goal

A [Scene](../reference/vocabulary.md#scene) can cue several [Diagram Dynamics](../reference/vocabulary.md#diagram-dynamic) in an authored order, and the [Sequence](../reference/vocabulary.md#sequence) it sits in paces them: stages divide a timed Scene's hold, and each stage is one presenter step in an untimed Sequence.

## Context

`ADR-INFOSCHEMATICS-038` gave a Scene the power to cue a Dynamic under a `once` or `repeat` policy and left the ordered cascade out of scope, because nothing said what a cascade divides when a Scene declares no duration. `INFOSCHEMATICS-TOOL-092` put that question to the owner, who chose presenter-stepped stages; `ADR-INFOSCHEMATICS-039` records the answer. This item implements it.

The decision is the whole of the design constraint. The document carries an order and never a measurement, so `DYNAMIC-001` needs no amendment; a cascade is cancelled by leaving its Scene exactly as a single cue is, so `SIGNAL-003` needs none either. What changes is that an untimed Sequence gains a step that advances within a Scene rather than past it.

## Boundary

This is cue ordering and the stepping that plays it. It is not a new Dynamic kind, not a second way of saying how something is drawn, and not a timing field: a cue that carries a duration must still fail validation after this item as before it.

Derivation stays pure. `packages/view-present/src/presentation.ts` derives occurrences from `cueCycle` and the focused Scene without reading a clock, and a cascade's stage index belongs in that same presentation state rather than in a timer. The View continues to own every interval, per `ADR-INFOSCHEMATICS-038`.

## Current state

A Scene's cues are an unordered set in effect: `packages/view-model/src/runtime.ts:435` maps each authored cue to a `dynamic` and a `playback` defaulting to `once`, and `presentation.ts:206` turns the focused Scene's cues into occurrences all at once under the `focused-flows` signal policy. `SCENE-007` states the cue contract and `SCENE-006` bounds automatic playback. `packages/view-present/src/cues.ts` holds the single repeat interval, and `Present.dynamics.test.tsx`, `Present.playback.browser.test.tsx` and `presentation.test.ts` cover the cue paths that exist today.

## Steps

- [ ] Give a Scene's cues an authored stage, so ordering is expressible without any cue carrying a measurement, and reject a stage that names a Dynamic another stage in the same Scene already cues.
- [ ] Validate the notation in Domain Core alongside the existing cue rules, keeping a duration-bearing cue a validation failure.
- [ ] Carry a stage index in presentation state beside `cueCycle`, and derive only the stages up to it, so deriving twice from one state gives one answer and no derivation reads a clock.
- [ ] Advance the stage on a presenter step in an untimed Sequence, moving to the next Scene only once the last stage has played, and divide the Scene's `hold` across stages where the Sequence is timed.
- [ ] Cancel a part-played cascade on Scene change under `SIGNAL-003`, and originate nothing from it under a `none` signal policy.
- [ ] State the rule in `docs/specs/scenes-and-callouts.md` as a clause of `SCENE-007`, with `SCENE-006`'s bound covering staged stepping.
- [ ] Hold the stepping to a test in both kinds of Sequence: a cascading Scene must land where it lands today having passed through its stages, and a Scene with no cascade must step exactly as it does now.

## Files touched

- `packages/domain-model/src/scene.ts`, `packages/domain-core` validation — the authored notation and its rules
- `packages/view-model/src/runtime.ts` — the runtime Scene's cues
- `packages/view-present/src/presentation.ts`, `packages/view-present/src/cues.ts` — derivation and stepping
- `docs/specs/scenes-and-callouts.md` — `SCENE-007`, and `SCENE-006` where the bound covers staged stepping

## Verify

`bun run self:check`, plus the stepping test above run in a timed and an untimed Sequence. A document that declares no cascade must serialise and render byte for byte as it does today.

## Dependencies / blocks

Follows `INFOSCHEMATICS-TOOL-092`, which took the decision this implements. Blocks nothing.

## Documentation impact

### Decision Records

None new: `ADR-INFOSCHEMATICS-039` already states the rule, and this item implements it rather than revisiting it.

### Specifications

`docs/specs/scenes-and-callouts.md` — a cascade clause on `SCENE-007`, and `SCENE-006` where its bound covers staged stepping. `DYNAMIC-001` and `SIGNAL-003` stay as written; if either needs amending, the implementation has drifted from the decision.

### Guides

The Producer-facing guidance on Sequences gains the cascade once it exists; deferred to its own item rather than written ahead of the feature.

### Roadmap

Closes this item; nothing else depends on it.

## Discussion

### Why the stage index belongs in presentation state

`packages/view-present/src/presentation.ts` derives occurrences purely from `cueCycle` and the focused Scene, so deriving twice from one state gives one answer. A stage index kept anywhere else — a ref, a timer, a renderer — would make the second derivation disagree with the first, which is the property `ADR-INFOSCHEMATICS-038` set out to keep.
