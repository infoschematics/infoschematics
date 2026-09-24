---
id: INFOSCHEMATICS-TOOL-119
area: TOOL
title: Ordered cascade of cues
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: cfead134fa5faef9fe960b9d8ef6a202d1c1621a
created_at: 2026-09-21T21:15:00Z
updated_at: 2026-09-24T18:30:00Z
---

# Ordered cascade of cues

## Goal

A [Scene](../reference/vocabulary.md#scene) can cue several [Diagram Dynamics](../reference/vocabulary.md#diagram-dynamic) in an authored order, and the [Sequence](../reference/vocabulary.md#sequence) it sits in paces them: stages divide a timed Scene's hold, and each stage is one presenter step in an untimed Sequence.

## Context

`ADR-INFOSCHEMATICS-034` gave a Scene the power to cue a Dynamic under a `once` or `repeat` policy and left the ordered cascade out of scope, because nothing said what a cascade divides when a Scene declares no duration. `INFOSCHEMATICS-TOOL-092` put that question to the owner, who chose presenter-stepped stages; `ADR-INFOSCHEMATICS-035` records the answer. This item implements it.

The decision is the whole of the design constraint. The document carries an order and never a measurement, so `DYNAMIC-001` needs no amendment; a cascade is cancelled by leaving its Scene exactly as a single cue is, so `SIGNAL-003` needs none either. What changes is that an untimed Sequence gains a step that advances within a Scene rather than past it.

## Boundary

This is cue ordering and the stepping that plays it. It is not a new Dynamic kind, not a second way of saying how something is drawn, and not a timing field: a cue that carries a duration must still fail validation after this item as before it.

Derivation stays pure. `packages/view-present/src/presentation.ts` derives occurrences from `cueCycle` and the focused Scene without reading a clock, and a cascade's stage index belongs in that same presentation state rather than in a timer. The View continues to own every interval, per `ADR-INFOSCHEMATICS-034`.

## Current state

A Scene's cues are an unordered set in effect: `packages/view-model/src/runtime.ts:435` maps each authored cue to a `dynamic` and a `playback` defaulting to `once`, and `presentation.ts:206` turns the focused Scene's cues into occurrences all at once under the `focused-flows` signal policy. `SCENE-007` states the cue contract and `SCENE-006` bounds automatic playback. `packages/view-present/src/cues.ts` holds the single repeat interval, and `Present.dynamics.test.tsx`, `Present.playback.browser.test.tsx` and `presentation.test.ts` cover the cue paths that exist today.

## Steps

- [x] Give a Scene's cues an authored stage, so ordering is expressible without any cue carrying a measurement, and reject a stage that names a Dynamic another stage in the same Scene already cues.
- [x] Validate the notation in Domain Core alongside the existing cue rules, keeping a duration-bearing cue a validation failure.
- [x] Carry a stage index in presentation state beside `cueCycle`, and derive only the stages up to it, so deriving twice from one state gives one answer and no derivation reads a clock.
- [x] Advance the stage on a presenter step in an untimed Sequence, moving to the next Scene only once the last stage has played, and divide the Scene's `hold` across stages where the Sequence is timed.
- [x] Cancel a part-played cascade on Scene change under `SIGNAL-003`, and originate nothing from it under a `none` signal policy.
- [x] State the rule in `docs/specs/scenes-and-callouts.md` as a clause of `SCENE-007`, with `SCENE-006`'s bound covering staged stepping.
- [x] Hold the stepping to a test in both kinds of Sequence: a cascading Scene must land where it lands today having passed through its stages, and a Scene with no cascade must step exactly as it does now.

## Files touched

- `packages/domain-model/src/model.ts` — the authored notation. This record said `scene.ts`, which does not exist: `SceneCue` has always lived in `model.ts`.
- `packages/domain-core/src/schema.ts`, `packages/domain-core/src/model.ts`, `packages/domain-core/schema/infoschematic.schema.json` — the rules, and the projected schema the generator writes
- `packages/view-model/src/runtime.ts` — the runtime Scene's cues
- `packages/view-present/src/presentation.ts`, `packages/view-present/src/cues.ts` — derivation and the stage division of a hold
- `packages/view-present/src/Present.tsx` and `packages/view-studio/src/app/App.tsx` with `packages/view-studio/src/app/hooks/use-presentation.ts` — the two hosts that actually step. This record omitted them, and a stage index landing only in `presentation.ts` would have advanced in neither; `SCENE-006` requires both to keep the same beat.
- `examples/is-showcase/infoschematic.yaml` and its generated `src/infoschematic.ts` — one authored cascade, which the capability-coverage gate requires of any new contract property
- `docs/specs/scenes-and-callouts.md` — `SCENE-007`, and `SCENE-006` where the bound covers staged stepping
- `docs/decisions/references/design-view-present.md` — the sentence saying what presentation activity now holds

## Verify

`bun run self:check`, plus the stepping test above run in a timed and an untimed Sequence. A document that declares no cascade must serialise and render byte for byte as it does today.

## Dependencies / blocks

Follows `INFOSCHEMATICS-TOOL-092`, which took the decision this implements. Blocks nothing.

## Documentation impact

### Decision Records

None new: `ADR-INFOSCHEMATICS-035` already states the rule, and this item implements it rather than revisiting it.

### Specifications

`docs/specs/scenes-and-callouts.md` — a cascade clause on `SCENE-007`, and `SCENE-006` where its bound covers staged stepping. `DYNAMIC-001` and `SIGNAL-003` stay as written; if either needs amending, the implementation has drifted from the decision.

### Guides

The Producer-facing guidance on Sequences gains the cascade once it exists; deferred to its own item rather than written ahead of the feature.

### Roadmap

Closes this item; nothing else depends on it.

## Review

### Delivered

A Scene's cues can now carry a `stage`, and a Scene whose cues name more than one plays as an ordered cascade the Sequence paces. A stage is an order and never a measurement: the schema stays strict, so a cue carrying its own duration is still a validation failure, and the division of time happens in the View. A timed Sequence divides the Scene's own `hold` between its stages, so a cascading Scene leaves exactly when it would have left without one; an untimed Sequence spends one presenter step per stage, reaching the next Scene on the step after the last stage, and a step back arrives at the previous Scene with its cascade played out so that back and forward reverse each other. A Scene taken up outside a Sequence — Standalone, or expanded beside its Sequence — has no pacer and plays every cue on entry, exactly as before. A document that stages nothing behaves and renders as it did.

### Change Summary

`SceneCue` in `packages/domain-model/src/model.ts` gains an optional `stage`; `packages/domain-core/src/schema.ts` admits it as a positive integer inside the same `strictObject`; `packages/domain-core/src/model.ts` extends the per-Scene duplicate check so a stage cannot re-cue what another stage of the same Scene already cues, naming both stages in the message; `packages/domain-core/schema/infoschematic.schema.json` was regenerated by `bun run self:schema:generate`. `packages/view-model/src/runtime.ts` resolves an absent stage to the first, so no View reads an absence.

`packages/view-present/src/presentation.ts` holds a `cueStage` beside `cueCycle`, resets it on every Scene change, adds a `step-cues` action that moves within the cascade and stops at either end, makes `step-sequence` spend its step on a stage before spending it on a Scene, and filters the derived cues and occurrences to the stages reached — exposing `cueStages` and `stepStaysInScene`. Occurrence keys are deliberately unchanged, so an unstaged document derives byte for byte what it derived before. `cueStageHold` in `packages/view-present/src/cues.ts` divides a hold between stages; `cueRepeatInterval` is untouched. Both hosts spend it: `packages/view-present/src/Present.tsx` and `packages/view-studio/src/app/App.tsx`, the latter through `packages/view-studio/src/app/hooks/use-presentation.ts`, which had to expose the stage. Each timed effect lists `cueStage` in its dependencies on purpose — a stage advance leaves every runtime object identical, so without it the beat would be set once per Scene and a cascade would stall on its first stage.

`docs/specs/scenes-and-callouts.md` states the cascade as a clause of `SCENE-007` with its verification and evidence, and extends `SCENE-006`'s bound to staged stepping. `docs/decisions/references/design-view-present.md` says presentation activity now holds how far the cascade has reached, and why it belongs there. `examples/is-showcase/infoschematic.yaml` stages `SCENE-03` in two: the Fabric's degraded state, then the signal that flows over it anyway. `docs/specs/diagram-dynamics.md` and `docs/specs/flow-signals.md` were not touched and needed nothing.

### Verification

Every command below was run from the repository root, and each outcome is what the run reported. `bun run self:check` was not run: the coordinator owns that gate.

| Gate | Outcome |
| --- | --- |
| `bun run test --filter=@infoschematics/domain-model` | pass, 9 tests |
| `bun run test --filter=@infoschematics/domain-core` | pass, 57 tests |
| `bun run test --filter=@infoschematics/view-model` | pass, 229 tests |
| `bun run test --filter=@infoschematics/view-present` | pass, 45 tests |
| `bun run test:browser --filter=@infoschematics/view-present` | pass, 7 tests and 1 skipped† |
| `bun run test:browser --filter=@infoschematics/view-studio` | pass, 35 tests |
| `bun run self:schema:verify` | `JSON Schema current` |
| `bun run self:examples:verify` | `Generated example exports current: 5` |
| `bun run ki:lint:md` | `No issues found in 117 files` |
| `ki repo audit --skill ki-work-roadmap --repo .` | `PASS · 1 skill` |
| Render guard, `examples/is-infoschematics` | byte for byte identical before and after |

† This gate was blocked for part of the work. A second agent is writing in this checkout, and its uncommitted `packages/view-canvas/src/Canvas.dynamics.browser.test.tsx` did not typecheck for a while; both `test:browser` tasks depend on `@infoschematics/view-canvas#typecheck` through Turborepo, so neither could complete while that edit was in flight. Half-written work is supposed to fail to compile, and reverting another writer's file is not available, so the suite was run directly meanwhile — `bunx vitest run --config vitest.browser.config.ts` from `packages/view-present`, same Chromium, same result. The other writer's file has since compiled and both gates were then run in their proper form, which is what the table records.

The render guard is `examples/is-infoschematics`, because `examples/is-showcase` now authors a cascade and so is no longer an unchanged document. The showcase's own render is identical too, which is the expected result rather than the guard: a cue is presentation, and the static render draws none.

Playback was driven rather than argued. `packages/view-present/src/Present.cascade.browser.test.tsx` mounts the real `Present` in Chromium and reads the cascade off the rendered Diagram. Stepping an untimed Sequence showed `first`, then `first,second`, then `first,second,third`, with the Scene bank marking the cascading Scene as the one on screen throughout; the next step moved to the following Scene and drew nothing; stepping back returned to the cascade complete, then to its second stage. A Scene whose cues name no stage played all three on entry and left on one step. Under fake timers, a 900ms Scene of three stages showed one more stage at each 300ms beat and had left by 900ms — the hold it always had. Studio's Present surface is not driven for the cascade specifically; it shares `cueStageHold` and `stepSequence` with `Present`, and its browser suite passes.

### Outstanding concerns

None. Every gate listed ran and passed. One thing for the coordinator to know rather than to fix: these measurements were taken in a checkout another agent is writing in, so the aggregate gate should be the one that speaks for a quiet tree.

### Post-change review

Two things were nearly wrong. The first is that a stage index reaching only `presentation.ts` would have passed every reducer test while advancing in neither host — the presenter's step and the timed beat both live in `Present.tsx` and Studio's `App.tsx`, which this record did not list. That is why the browser case exists: it failed against a correct reducer until the hosts were changed, which a unit test could not have done.

The second is subtler and shaped the derivation. The filter applies only where the focused Scene is the Scene the Sequence is playing. A Standalone or expanded Scene has no step to divide, so had the filter applied there a cascade would have been enterable and never advanceable — a Scene showing its first stage for ever with nothing able to move it. Scoping the filter to the pacer keeps every existing path exactly as it was and leaves no state a presenter can reach and not leave.

One deliberate omission: occurrence keys do not encode the stage. They did not need to, because `reconcileOccurrences` releases a withdrawn key, so a re-entered stage is accepted afresh — and leaving them alone is what keeps an unstaged document identical rather than merely equivalent.

### Mini recap

A Scene's cues can now be ordered, and the Sequence holding the Scene paces that order: it divides a timed Scene's hold between the stages, or spends one presenter step on each. Nothing in a document gained a duration, both hosts keep the same beat, and a document that stages nothing is unchanged in behaviour and byte for byte in render.

## Discussion

### Why the stage index belongs in presentation state

`packages/view-present/src/presentation.ts` derives occurrences purely from `cueCycle` and the focused Scene, so deriving twice from one state gives one answer. A stage index kept anywhere else — a ref, a timer, a renderer — would make the second derivation disagree with the first, which is the property `ADR-INFOSCHEMATICS-034` set out to keep.
