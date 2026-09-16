---
id: INFOSCHEMATICS-TOOL-023
area: TOOL
title: Scene signal treatments
theme: tool
horizon: now
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-08T02:09:11Z
updated_at: 2026-09-16T10:45:00Z
---

# Scene signal treatments

## Goal

Let a Scene declaratively play named Diagram Dynamics once, repeatedly, continuously, or in an ordered cascade so a presentation can show activity arriving and progressing through an Infoschematic.

## Context

The current Scene signal path emits one transient occurrence for every focused Flow and Canvas renders a single 900 millisecond travelling marker. Present wires that path and the authored model cannot express repetition, component receipt, or ordered propagation. The 5G-EMERGE walkthrough needs telemetry pulses during a long hold, visible receipt by prediction Cards, convergence into demand control, and a closing circulation loop.

Diagram dynamics (`INFOSCHEMATICS-TOOL-055`, delivered) supplied the vocabulary this item was waiting on, and `ADR-INFOSCHEMATICS-026` closes by naming this record as the item that binds that vocabulary "instead of defining a parallel animation contract". Since then two adjacent records have claimed neighbouring ground: held element emphasis (`INFOSCHEMATICS-TOOL-059`, ready) states in its own Context that this record "chooses when and how often a Dynamic plays from a Scene" while it owns "what a renderer does when asked to sustain one". That division matters here, because a `continuous` playback policy and a sustained emphasis treatment are two descriptions of the same observable outcome.

## Boundary

This item composes the named Dynamics delivered by Diagram dynamics (`INFOSCHEMATICS-TOOL-055`, delivered). It does not create a parallel animation vocabulary, expose arbitrary timelines or offsets, change Flow routing, make motion the only carrier of meaning, infer activity from focus, or add callbacks and timers to authored data. It does not define the sustained treatment itself, which belongs to held element emphasis (`INFOSCHEMATICS-TOOL-059`), and it does not apply any of this to the 5G-EMERGE walkthrough, which is a separate authoring pass.

## Current state

Read against the tree on 2026-09-16. Two of this record's earlier claims are now stale, and the remaining gap is narrower and more specific than it was.

**Delivered, and not to be rebuilt.**

- Named Dynamics are declared on the Diagram, not on a Scene: `packages/domain-model/src/model.ts:186-212` for the two kinds, `:228` for `diagram.dynamics`. Validated at `packages/domain-core/src/model.ts:439-456`, canonicalised with sorted targets at `:356-359`, mirrored in the schema at `packages/domain-core/src/schema.ts:425-441` and `:535`, and serialised in fixed field order at `packages/domain-core/src/serialise.ts:67`.
- Occurrence resolution is pure and framework-neutral: `packages/view-model/src/dynamics.ts:51-80` turns a `DynamicOccurrence` into `FlowSignal[]` and `ElementEmphasis[]`, resolves a repeated Dynamic-and-key pair once, and ignores an occurrence naming an undeclared Dynamic.
- Canvas already accepts occurrences and owns the treatments: `packages/view-canvas/src/Canvas.tsx:49` takes `dynamics`, `:77-86` resolves them and joins resolved Flow signals onto the host-supplied ones so a Dynamic gains no lifecycle a direct signal lacks, `:134` retires a signal after `flowSignalDuration` (900 ms, `packages/view-canvas/src/flow-signals.ts:9`), and `:183` retires emphasis after `elementEmphasisDuration` (`packages/view-canvas/src/element-emphasis.ts:11`). The travelling pulse markup is at `packages/view-canvas/src/InfoschematicDiagram.tsx:1577-1578`.
- **Studio pass-through exists.** This record previously said it did not. `packages/view-studio/src/app/App.tsx:554-570` holds one `DynamicOccurrence`, keys it by click count so a second press replays rather than merges, and retires it on a timer; `:1056-1057` passes both `emphasis` and `signals` into the diagram. `DYNAMIC-005` records this conforming at `docs/specs/diagram-dynamics.md:63-73`.
- **Static output already requires an explicit occurrence.** This record's step 6 is already satisfied. `packages/render-svg/src/index.ts:43` takes `dynamics`, `:243-247` resolves them and joins them with the direct `signals` option, and nothing infers an active timeline. `DYNAMIC-004` is conforming at `docs/specs/diagram-dynamics.md:51-61`.

**Genuinely missing.**

- No Scene can name a Dynamic. `packages/domain-model/src/model.ts:124-131` gives `Scene` exactly `id`, `label`, `description`, `visibility`, `focus`, and `callout`; `:139` adds only `duration` for a `SequenceScene`. The schema mirror is `packages/domain-core/src/schema.ts:462-469` and `:480`, both `strictObject`, so any new field is a deliberate, validated addition.
- Present has no place a Scene-originated occurrence could come from. `packages/view-present/src/presentation.ts:184-189` derives signals from the focused Scene's Flows alone, keyed `present-scene-${state.sceneOccurrence}` off the counter at `:19` and `:51`. `SceneSignalPolicy` at `:13` is exactly `'focused-flows' | 'none'`. `packages/view-present/src/Present.tsx:14-20` takes `dynamics` as a **host** prop and passes it untouched to the Canvas at `:156`, and its own comment states the delivered intent plainly: "Presentation drives Scene signalling itself; a Dynamic is the other direction — something outside the presentation happened."
- No playback policy, no cascade staging, and no repetition mechanism exists anywhere. Both renderer treatments are single-shot and token-bounded, so any repeat must come from a host or Present re-keying an occurrence on a timer.
- Nothing authored combines a Scene with a Dynamic. `examples/is-system/infoschematic.yaml:103-114` is the only document that declares Dynamics and it has no Sequences; `examples/is-infoschematics/infoschematic.yaml:294` is the only document with Sequences and it declares no Dynamics.
- There is no gallery in which to look at a Dynamic outside Studio's rehearsal bank. `apps/site/src/visual-guide/specimens.ts` contains no Dynamic, and `scripts/visual-guide-catalogue.test.ts` checks only the appearance-option projection of `packages/domain-model/src/option-catalogue.ts`, so "add visual-guide treatments" means building a new specimen kind rather than extending a list.
- `packages/view-present` has no `test:browser` script, unlike `packages/view-canvas` and `packages/view-studio`. A browser proof of Present's scheduling needs that script and a Vitest browser config added, or the case placed in a package that already has one.

**What the specifications already require of any answer.**

- `docs/specs/flow-signals.md:41` (`SIGNAL-003`, conforming): "Scene signal derivation MUST remain pure, framework-neutral, and independent of timers." A Present-owned schedule contradicts that sentence as written.
- `docs/specs/diagram-dynamics.md:15` (`DYNAMIC-001`): a declaration MUST NOT carry duration, easing, timer, or any other runtime instruction. `:29` (`DYNAMIC-002`): occurrences, keys, and timers MUST remain host or View state and MUST NOT enter the authored Infoschematic.
- `docs/specs/scenes-and-callouts.md:67-75` records `SCENE-006`, bounded automatic playback, **divergent** on an unreproduced out-of-memory observation, tracked by bounded playback profile (`INFOSCHEMATICS-TOOL-069`). Adding repeated playback on top of an unmeasured playback loop would make that divergence harder to attribute, not easier.
- `scripts/specification-evidence.test.ts` runs in the gate through `bun run self:scripts:test` and fails when a requirement declares no recognised conformance state or cites a path that does not resolve, so any new requirement must land with real evidence paths.

## Steps

1. [ ] **Needs the owner decision named under Discussion.** Record the playback-policy decision as an amendment to `ADR-INFOSCHEMATICS-026` or a companion record: which of once, repeat, and continuous is authored data, which is host or View policy, and which is held element emphasis (`INFOSCHEMATICS-TOOL-059`) rather than this record. Verifiable by the record existing, naming its consequence for `DYNAMIC-001` and `SIGNAL-003`, and being linked from `docs/decisions/README.md`.
2. [ ] Add the Scene cue field to `packages/domain-model/src/model.ts:124-131` in whatever shape step 1 settles — at minimum a list of stable Diagram Dynamic ids, plus an optional non-negative integer cascade stage. Verifiable by `bun run --cwd packages/domain-model typecheck` and by a document that declares a cue typechecking.
3. [ ] Mirror the field in `packages/domain-core/src/schema.ts:462-469`, validate it in `packages/domain-core/src/model.ts` beside the Dynamic checks at `:439-456`, and add its key to the serialisation order in `packages/domain-core/src/serialise.ts`. Verifiable by `bun run self:schema:verify` regenerating `packages/domain-core/schema/infoschematic.schema.json` with no diff, and by new cases in `packages/domain-core/src/model.test.ts` rejecting an unknown Dynamic id, a duplicate cue for one Dynamic in one Scene, and a negative stage.
4. [ ] Prove a document that declares no cue is byte-identical through the whole pipeline, as `DYNAMIC-001` requires of the Dynamics collection. Verifiable by `bun run self:examples:verify` and by `bun run self:examples:render --all` producing unchanged SVG bytes.
5. [ ] Project the cue onto the runtime Scene in `packages/view-model/src/runtime.ts` beside `hold` at `:381`, and derive ordered stage timing from `hold` alone — no authored milliseconds — falling back to `defaultSceneDuration` at `:131` when `duration` is absent. Verifiable by pure tests in `packages/view-model/src/runtime.test.ts` asserting the stage boundaries for a two-stage and a three-stage cascade at an authored and a defaulted duration.
6. [ ] Extend `SceneSignalPolicy` at `packages/view-present/src/presentation.ts:13` and originate `DynamicOccurrence` values in `derivePresentation` at `:184-189`, keyed off `sceneOccurrence` so a re-render does not replay and a Scene change cancels. Verifiable by pure reducer tests in `packages/view-present/src/presentation.test.ts` covering initial play, replay on re-entry, cancellation on Scene change and on clear, and the `none` policy deriving nothing.
7. [ ] Merge the Scene-originated occurrences with the existing host `dynamics` prop in `packages/view-present/src/Present.tsx:156` without letting either suppress the other, and correct the prop comment at `:14-20`, which currently states that a Dynamic is the opposite direction from Scene signalling. Verifiable by a rendered case in `packages/view-present/src/Present.dynamics.test.tsx` where a host occurrence and a Scene cue are live together and both reach the Canvas.
8. [ ] Route the same Scene state through Studio, reusing the occurrence path at `packages/view-studio/src/app/App.tsx:554-570` rather than adding a second scheduler, so rehearsal and presentation agree. Verifiable by a case in `packages/view-studio/src/app/App.browser.test.tsx` showing a Scene cue playing in Studio's Present surface while the rehearsal bank still replays on demand.
9. [ ] Give repetition a bounded measurement before it ships, because `SCENE-006` is divergent. Drive a repeated cue through many cycles under fake timers and assert the pending-timer count stays flat. Verifiable by the case failing when an effect cleanup is removed. Coordinate with bounded playback profile (`INFOSCHEMATICS-TOOL-069`) so one measurement serves both.
10. [ ] Author the first combined example: give `examples/is-infoschematics/infoschematic.yaml` Dynamics beside its Sequence at `:294`, or give `examples/is-system/infoschematic.yaml` a Sequence beside its Dynamics at `:103-114`. Verifiable by `bun run self:examples:generate` and the example package's own suite.
11. [ ] Add a Dynamics specimen kind to `apps/site/src/visual-guide/specimens.ts` and `curriculum.ts` covering each policy the decision admits, plus receipt and cascade, so each treatment can be watched side by side in full and reduced motion. Verifiable by `bun run --cwd apps/site test` and by the specimen appearing in the built guide.
12. [ ] Update the contracts: the requirements listed under Current state, and the authoring guidance under `docs/guides/`. Verifiable by `bun run self:scripts:test`, which fails on an unrecognised conformance state or an unresolvable evidence path.

## Files touched

Existing:

- `packages/domain-model/src/model.ts`
- `packages/domain-core/src/schema.ts`, `packages/domain-core/src/model.ts`, `packages/domain-core/src/serialise.ts`, and the generated `packages/domain-core/schema/infoschematic.schema.json`
- `packages/view-model/src/runtime.ts`
- `packages/view-present/src/presentation.ts`, `packages/view-present/src/Present.tsx`, `packages/view-present/src/use-presentation.ts`
- `packages/view-present/src/presentation.test.ts`, `packages/view-present/src/Present.signals.test.tsx`, `packages/view-present/src/Present.dynamics.test.tsx` — all three already exist and are where the new cases belong
- `packages/view-studio/src/app/App.tsx` and `packages/view-studio/src/app/App.browser.test.tsx`
- `packages/view-canvas/src/Canvas.tsx` only if a policy needs a treatment Canvas does not already have
- `examples/is-infoschematics/infoschematic.yaml` or `examples/is-system/infoschematic.yaml`, and the matching `src/infoschematic.ts`
- `apps/site/src/visual-guide/specimens.ts` and `apps/site/src/visual-guide/curriculum.ts`
- `docs/specs/flow-signals.md`, `docs/specs/diagram-dynamics.md`, `docs/specs/scenes-and-callouts.md`
- `docs/decisions/ADR-INFOSCHEMATICS-026-name-dynamics-in-the-document.md` and `docs/decisions/README.md`
- `docs/guides/editing-authored-yaml.md`

New:

- A new Decision Record under `docs/decisions/`, if step 1 lands as a companion rather than an amendment
- `packages/view-present/vitest.browser.config.ts` and a `test:browser` script in `packages/view-present/package.json` — both new, following `packages/view-studio/vitest.browser.config.ts`, and needed only if the browser proof lives in that package rather than in `packages/view-studio`, which already has both

`packages/render-svg/src/` is **not** expected to change: `packages/render-svg/src/index.ts:243-247` already renders only explicitly supplied occurrences, which is what this record asked of it.

## Verify

Suites and checks:

- `bun run self:schema:verify` and `bun run self:examples:verify` pass with no regenerated diff.
- `bun run --cwd packages/domain-core test`, `bun run --cwd packages/view-model test`, `bun run --cwd packages/view-present test`, and `bunx turbo run test --filter=...@infoschematics/view-model` for everything downstream of the runtime change.
- `bun run --cwd packages/view-studio test:browser` and `bun run --cwd packages/view-canvas test:browser`.
- `bun run self:scripts:test`, which runs `scripts/specification-evidence.test.ts` over the amended requirements.
- `bun run self:packages:build`, then `bun run self:check`.

Rendering the result and looking at it, because this changes visual treatment and a green suite is not evidence:

1. `bun run self:examples:render system --png --width 1600` and open `reports/system.png`. A document with no live occurrence must look exactly as it did before this work; keep the pre-change PNG beside it and compare them. `--png` needs `rsvg-convert` on `PATH` (`brew install librsvg`), per `scripts/render-example.ts:72`.
2. Render the same document with an explicit occurrence supplied through the `dynamics` option of `renderInfoschematicSvg` and open the result. The still emphasis must be visibly painted and must not move, and must be identical for two different occurrence keys — the `DYNAMIC-004` property, checked by eye rather than by hash.
3. `bun run self:dev`, then open the Playground, load the combined example from step 10, and watch each policy the decision admits play through a Sequence Scene from start to finish. Confirm by eye: the pulse travels the Flow it names and no other; a receiving Card takes visible emphasis and its own label stays legible under it; cascade stages fire in authored stage order and finish inside the Scene's hold rather than spilling into the next Scene; nothing is left painted after the Scene changes.
4. Repeat step 3 with the operating system set to reduce motion. Every treatment must still be perceptible as a change and none may become a slower version of the same travel.
5. Watch a repeated or sustained cue for at least ten times the single-shot duration and confirm it reads as one continuous statement rather than a stutter, and that the live region says its meaning once — the failure mode `INFOSCHEMATICS-TOOL-059` was raised to describe.
6. Confirm the blueprint backdrop and the Flow arrowheads are unchanged in all of the above, since both have previously survived a fully green run in a broken state.

## Dependencies / blocks

Diagram dynamics (`INFOSCHEMATICS-TOOL-055`, delivered) supplied the named Dynamics, `DynamicOccurrence` resolution, and the renderer interpretations, so that contract now exists and this record no longer waits on it.

What blocks Ready now is a product decision from the repository owner, stated exactly under Discussion. Steps 2 onward cannot be written executably until it lands, because the cue's authored shape follows from it.

Two neighbours must be sequenced rather than duplicated:

- Held element emphasis (`INFOSCHEMATICS-TOOL-059`, ready) owns the sustained treatment. If the decision keeps `continuous` in this record, this record depends on that one; if the decision assigns sustain to that record, `continuous` leaves this record's scope. Either way the two must not both define it.
- Bounded playback profile (`INFOSCHEMATICS-TOOL-069`) owns the `SCENE-006` measurement. Step 9 should be delivered with it or after it, not in parallel, so one sustained-run measurement covers both.

## Documentation impact

### Decision Records

Expected, and step 1 depends on it. `ADR-INFOSCHEMATICS-026` is amended, or a companion record is added under `docs/decisions/` and linked from `docs/decisions/README.md`. It must record which playback statements are authored data and say explicitly what that does to `DYNAMIC-001`'s prohibition on timing in a declaration, since the record's own Consequences already name this item as the one that binds the vocabulary.

### Specifications

Expected, in three documents under `docs/specs/`:

- `docs/specs/flow-signals.md` — `SIGNAL-003:41` requires Scene signal derivation to be "independent of timers". A Present-owned schedule either amends that sentence or is carved out by a new requirement that states where the timer lives and what bounds it.
- `docs/specs/diagram-dynamics.md` — `DYNAMIC-002` gains the Scene-originated occurrence as a recognised source, since today it names only a host.
- `docs/specs/scenes-and-callouts.md` — a new `SCENE` requirement for cue declaration, validation, and derived cascade timing, and a note against `SCENE-006` that repeated playback now depends on its measurement.

Every new requirement lands with a conformance state and evidence paths that resolve, or `bun run self:scripts:test` fails.

### Guides

Expected: `docs/guides/editing-authored-yaml.md` gains the authored cue and a statement that focus and Dynamics remain separate concepts — a Scene focusing a Flow is not a Scene signalling it.

### Roadmap

Expected: two captures, neither in this record's scope. Site-owned consumer prose under `apps/site/content/` is a follow-up record once the feature lands, and applying these treatments to the 5G-EMERGE walkthrough is an authoring pass of its own. Also expected: `blocked_by` or `blocks` edited to reflect whichever sequencing step 1 chooses for `INFOSCHEMATICS-TOOL-059`.

## Discussion

### Whether a playback policy is authored data at all — the decision that blocks Ready

The Goal names four playback statements: once, repeatedly, continuously, and in an ordered cascade. Three separate delivered artefacts now say different things about whether a document may carry them.

`ADR-INFOSCHEMATICS-026` line 33 says "Scene-authored choreography (`INFOSCHEMATICS-TOOL-023`) binds this vocabulary instead of defining a parallel animation contract" — which sanctions a Scene cue. `DYNAMIC-001` (`docs/specs/diagram-dynamics.md:15`) says a declaration must carry no duration, easing, or timer, and `DYNAMIC-002:29` says occurrences, keys, and timers must stay out of the authored document. `packages/view-present/src/Present.tsx:17-18` says, in the delivered code, that a Dynamic is "the other direction" from Scene signalling — something outside the presentation happened. And held element emphasis (`INFOSCHEMATICS-TOOL-059`, ready) already claims the sustained treatment that `continuous` would produce.

The owner needs to choose one of three, and it is not a choice shaping can make from the code:

1. **A Scene names Dynamics only.** Each cue plays once on Scene entry — a strict extension of `SIGNAL-002`, needing no new timer and no contract amendment. Repetition becomes a host concern; sustain comes from `INFOSCHEMATICS-TOOL-059`. Cheapest, and drops two of the four statements from the Goal.
2. **A Scene names Dynamics plus a bounded policy** of `once` or `repeat`, with `continuous` reassigned to `INFOSCHEMATICS-TOOL-059`. Present gains a schedule, `SIGNAL-003` is amended to say where the timer lives, and `SCENE-006` must be measured first.
3. **A Scene owns all four.** `DYNAMIC-001`, `DYNAMIC-002`, and `SIGNAL-003` are all amended, and this record absorbs the sustained-treatment contract that `INFOSCHEMATICS-TOOL-059` was separated out to hold.

Option 2 looks like the intended reading of `ADR-INFOSCHEMATICS-026` alongside `INFOSCHEMATICS-TOOL-059`, but that is an inference about intent, not a decision, and the cue's authored shape, the specification amendments, and the boundary against a ready neighbour all follow from whichever answer is given.

### What a cascade divides when there is nothing to divide

Derived cascade timing needs a duration to divide. `packages/view-model/src/runtime.ts:381` gives every runtime Scene a `hold`, defaulting to `defaultSceneDuration` at `:131`, so a number always exists — but for an untimed Sequence (`presentation.timed: false`, `docs/specs/scenes-and-callouts.md:55-63`) that number is fiction: the Scene stays on screen until a presenter steps, which may be one second or ten minutes. Dividing 3100 milliseconds across three stages in a manually driven Scene either finishes before the presenter has finished speaking, or must wait for a step that may never come. Whether a cascade is admissible in an untimed Sequence at all, and if so what paces it, is not settled by anything in the tree and is not answered by the decision above.
