---
id: INFOSCHEMATICS-TOOL-023
area: TOOL
title: Scene signal treatments
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: b8325a18298dfc8967da31de7c22cc22a58d53d7
created_at: 2026-09-08T02:09:11Z
updated_at: 2026-09-18T12:40:00Z
---

# Scene signal treatments

## Goal

Let a Scene declaratively play named Diagram Dynamics, each once or on a bounded repeat, so a presentation can show activity arriving without a host writing a schedule. A statement that lasts is already authored as `depicts: state` on the Dynamic itself and sustained by the delivered treatment; an ordered cascade is deferred, for the reason stated under Discussion.

## Context

The current Scene signal path emits one transient occurrence for every focused Flow and Canvas renders a single 900 millisecond travelling marker. Present wires that path and the authored model cannot express repetition, component receipt, or ordered propagation. The 5G-EMERGE walkthrough needs telemetry pulses during a long hold, visible receipt by prediction Cards, convergence into demand control, and a closing circulation loop.

Diagram dynamics (`INFOSCHEMATICS-TOOL-055`, delivered) supplied the vocabulary this item was waiting on, and `ADR-INFOSCHEMATICS-026` closes by naming this record as the item that binds that vocabulary "instead of defining a parallel animation contract". Since then two adjacent records have claimed neighbouring ground: held element emphasis (`INFOSCHEMATICS-TOOL-059`, ready) states in its own Context that this record "chooses when and how often a Dynamic plays from a Scene" while it owns "what a renderer does when asked to sustain one". That division matters here, because a `continuous` playback policy and a sustained emphasis treatment are two descriptions of the same observable outcome.

## Boundary

This item composes the named Dynamics delivered by Diagram dynamics (`INFOSCHEMATICS-TOOL-055`, delivered). It does not create a parallel animation vocabulary, expose arbitrary timelines or offsets, change Flow routing, make motion the only carrier of meaning, infer activity from focus, or add callbacks and timers to authored data. It does not define the sustained treatment itself, which held element emphasis (`INFOSCHEMATICS-TOOL-059`) has delivered; it does not define an ordered cascade, which is deferred; and it does not apply any of this to the 5G-EMERGE walkthrough, which is a separate authoring pass.

## Current state

Re-read against `b8325a18` on 2026-09-18. Three of the constraints below have since lifted, which is most of why this record can be Ready.

- **Held element emphasis is delivered**, not ready: `INFOSCHEMATICS-TOOL-059` was accepted and pruned in `8c2a8c35`. `depicts: 'event' | 'state'` is authored on the Dynamic itself (`packages/domain-model/src/model.ts:205-213`), so a statement that lasts needs nothing from a Scene policy — which is why `continuous` leaves this record's scope rather than being designed here.
- **`SCENE-006` is conforming, and measured**: bounded playback profile (`INFOSCHEMATICS-TOOL-069`) was delivered in the same pass. 240 cycles under fake timers hold exactly one retained occurrence and two pending timeouts, and a 150-second profile over 9,902 Scene steps drifts 812 KB in total. A repeat policy is therefore being added on top of a measured loop rather than an unmeasured one. The one caveat recorded there applies to step 9: uninterrupted playback never exercises a step timeout's cleanup, so a repeat's cleanup needs its own steering case.
- **The playback decision has been taken** — see Discussion — so step 1 records it rather than waiting for it.

The reading below was taken on 2026-09-16 and still holds except where the three points above correct it. Two of this record's earlier claims were already stale then, and the remaining gap is narrower and more specific than it was.

**Delivered, and not to be rebuilt.**

- Named Dynamics are declared on the Diagram, not on a Scene: `packages/domain-model/src/model.ts:186-212` for the two kinds, `:228` for `diagram.dynamics`. Validated at `packages/domain-core/src/model.ts:439-456`, canonicalised with sorted targets at `:356-359`, mirrored in the schema at `packages/domain-core/src/schema.ts:425-441` and `:535`, and serialised in fixed field order at `packages/domain-core/src/serialise.ts:67`.
- Occurrence resolution is pure and framework-neutral: `packages/view-model/src/dynamics.ts:51-80` turns a `DynamicOccurrence` into `FlowSignal[]` and `ElementEmphasis[]`, resolves a repeated Dynamic-and-key pair once, and ignores an occurrence naming an undeclared Dynamic.
- Canvas already accepts occurrences and owns the treatments: `packages/view-canvas/src/Canvas.tsx:49` takes `dynamics`, `:77-86` resolves them and joins resolved Flow signals onto the host-supplied ones so a Dynamic gains no lifecycle a direct signal lacks, `:134` retires a signal after `flowSignalDuration` (900 ms, `packages/view-canvas/src/flow-signals.ts:9`), and `:183` retires emphasis after `elementEmphasisDuration` (`packages/view-canvas/src/element-emphasis.ts:11`). The travelling pulse markup is at `packages/view-canvas/src/InfoschematicDiagram.tsx:1577-1578`.
- **Studio pass-through exists.** This record previously said it did not. `packages/view-studio/src/app/App.tsx:554-570` holds one `DynamicOccurrence`, keys it by click count so a second press replays rather than merges, and retires it on a timer; `:1056-1057` passes both `emphasis` and `signals` into the diagram. `DYNAMIC-005` records this conforming at `docs/specs/diagram-dynamics.md:63-73`.
- **Static output already requires an explicit occurrence.** This record's step 6 is already satisfied. `packages/render-svg/src/index.ts:43` takes `dynamics`, `:243-247` resolves them and joins them with the direct `signals` option, and nothing infers an active timeline. `DYNAMIC-004` is conforming at `docs/specs/diagram-dynamics.md:51-61`.

**Genuinely missing.**

- No Scene can name a Dynamic. `packages/domain-model/src/model.ts:124-131` gives `Scene` exactly `id`, `label`, `description`, `visibility`, `focus`, and `callout`; `:139` adds only `duration` for a `SequenceScene`. The schema mirror is `packages/domain-core/src/schema.ts:462-469` and `:480`, both `strictObject`, so any new field is a deliberate, validated addition.
- Present has no place a Scene-originated occurrence could come from. `packages/view-present/src/presentation.ts:184-189` derives signals from the focused Scene's Flows alone, keyed `present-scene-${state.sceneOccurrence}` off the counter at `:19` and `:51`. `SceneSignalPolicy` at `:13` is exactly `'focused-flows' | 'none'`. `packages/view-present/src/Present.tsx:14-20` takes `dynamics` as a **host** prop and passes it untouched to the Canvas at `:156`, and its own comment states the delivered intent plainly: "Presentation drives Scene signalling itself; a Dynamic is the other direction — something outside the presentation happened."
- No playback policy and no repetition mechanism exists anywhere. Both renderer treatments are single-shot and token-bounded, so any repeat must come from a host or Present re-keying an occurrence on a timer. (No cascade staging exists either; that stays out of scope.)
- Nothing authored combines a Scene with a Dynamic. `examples/is-system/infoschematic.yaml:103-114` is the only document that declares Dynamics and it has no Sequences; `examples/is-infoschematics/infoschematic.yaml:294` is the only document with Sequences and it declares no Dynamics.
- There is no gallery in which to look at a Dynamic outside Studio's rehearsal bank. `apps/site/src/visual-guide/specimens.ts` contains no Dynamic, and `scripts/visual-guide-catalogue.test.ts` checks only the appearance-option projection of `packages/domain-model/src/option-catalogue.ts`, so "add visual-guide treatments" means building a new specimen kind rather than extending a list.
- `packages/view-present` has no `test:browser` script, unlike `packages/view-canvas` and `packages/view-studio`. A browser proof of Present's scheduling needs that script and a Vitest browser config added, or the case placed in a package that already has one.

**What the specifications already require of any answer.**

- `docs/specs/flow-signals.md:41` (`SIGNAL-003`, conforming): "Scene signal derivation MUST remain pure, framework-neutral, and independent of timers." A Present-owned schedule contradicts that sentence as written.
- `docs/specs/diagram-dynamics.md:15` (`DYNAMIC-001`): a declaration MUST NOT carry duration, easing, timer, or any other runtime instruction. `:29` (`DYNAMIC-002`): occurrences, keys, and timers MUST remain host or View state and MUST NOT enter the authored Infoschematic.
- `docs/specs/scenes-and-callouts.md:67-75` records `SCENE-006`, bounded automatic playback, **divergent** on an unreproduced out-of-memory observation, tracked by bounded playback profile (`INFOSCHEMATICS-TOOL-069`). Adding repeated playback on top of an unmeasured playback loop would make that divergence harder to attribute, not easier.
- `scripts/specification-evidence.test.ts` runs in the gate through `bun run self:scripts:test` and fails when a requirement declares no recognised conformance state or cites a path that does not resolve, so any new requirement must land with real evidence paths.

## Steps

1. [x] Record the taken decision as an amendment to `ADR-INFOSCHEMATICS-026` or a companion record: a Scene may name Dynamics and a bounded `once` or `repeat` policy; a statement that lasts is `depicts: state` on the Dynamic and not a Scene policy; an ordered cascade is out of scope. Verifiable by the record existing, naming its consequence for `DYNAMIC-001` and `SIGNAL-003`, and being linked from `docs/decisions/README.md`.
2. [x] Add the Scene cue field to `packages/domain-model/src/model.ts:124-131`: a list of stable Diagram Dynamic ids, each with an optional playback of `once` (the default) or `repeat`. No duration, easing or timer, as `DYNAMIC-001` requires. Verifiable by `bun run --cwd packages/domain-model typecheck` and by a document that declares a cue typechecking.
3. [x] Mirror the field in `packages/domain-core/src/schema.ts:462-469`, validate it in `packages/domain-core/src/model.ts` beside the Dynamic checks at `:439-456`, and add its key to the serialisation order in `packages/domain-core/src/serialise.ts`. Verifiable by `bun run self:schema:verify` regenerating `packages/domain-core/schema/infoschematic.schema.json` with no diff, and by new cases in `packages/domain-core/src/model.test.ts` rejecting an unknown Dynamic id, a duplicate cue for one Dynamic in one Scene, and an unrecognised playback value.
4. [x] Prove a document that declares no cue is byte-identical through the whole pipeline, as `DYNAMIC-001` requires of the Dynamics collection. Verifiable by `bun run self:examples:verify` and by `bun run self:examples:render --all` producing unchanged SVG bytes.
5. [x] Project the cue onto the runtime Scene in `packages/view-model/src/runtime.ts` beside `hold` at `:381`, carrying the ids and the policy and no timing at all. Verifiable by pure tests in `packages/view-model/src/runtime.test.ts` asserting the projection for a cue with each policy, at an authored and a defaulted `duration`.
6. [x] Extend `SceneSignalPolicy` at `packages/view-present/src/presentation.ts:13` and originate `DynamicOccurrence` values in `derivePresentation` at `:184-189`, keyed off `sceneOccurrence` so a re-render does not replay and a Scene change cancels. Verifiable by pure reducer tests in `packages/view-present/src/presentation.test.ts` covering initial play, replay on re-entry, cancellation on Scene change and on clear, and the `none` policy deriving nothing.
7. [x] Merge the Scene-originated occurrences with the existing host `dynamics` prop in `packages/view-present/src/Present.tsx:156` without letting either suppress the other, and correct the prop comment at `:14-20`, which currently states that a Dynamic is the opposite direction from Scene signalling. Verifiable by a rendered case in `packages/view-present/src/Present.dynamics.test.tsx` where a host occurrence and a Scene cue are live together and both reach the Canvas.
8. [x] Route the same Scene state through Studio, reusing the occurrence path at `packages/view-studio/src/app/App.tsx:554-570` rather than adding a second scheduler, so rehearsal and presentation agree. Verifiable by a case in `packages/view-studio/src/app/App.browser.test.tsx` showing a Scene cue playing in Studio's Present surface while the rehearsal bank still replays on demand.
9. [x] Hold `repeat` to `SCENE-006`'s measured bound rather than assuming it: drive a repeated cue through many cycles under fake timers and assert the retained-occurrence and pending-timeout counts stay flat, following `packages/view-present/src/Present.playback.browser.test.tsx`. Add the steering case that `SCENE-006`'s own caveat says uninterrupted playback never reaches — a repeat interrupted mid-cycle by a Scene change. Verifiable by each case failing when the matching cleanup is removed.
10. [x] Author the first combined example: give `examples/is-infoschematics/infoschematic.yaml` Dynamics beside its Sequence at `:294`, or give `examples/is-system/infoschematic.yaml` a Sequence beside its Dynamics at `:103-114`. Verifiable by `bun run self:examples:generate` and the example package's own suite.
11. [x] Add a Dynamics specimen kind to `apps/site/src/visual-guide/specimens.ts` and `curriculum.ts` covering `once`, `repeat` and a `depicts: state` Dynamic, so each treatment can be watched side by side in full and reduced motion. Verifiable by `bun run --cwd apps/site test` and by the specimen appearing in the built guide.
12. [x] Update the contracts: the requirements listed under Current state, and the authoring guidance under `docs/guides/`. Verifiable by `bun run self:scripts:test`, which fails on an unrecognised conformance state or an unresolvable evidence path.

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
3. `bun run self:dev`, then open the Playground, load the combined example from step 10, and watch a `once` cue and a `repeat` cue play through a Sequence Scene from start to finish. Confirm by eye: the pulse travels the Flow it names and no other; a receiving Card takes visible emphasis and its own label stays legible under it; a repeat stays inside the Scene's hold rather than spilling into the next Scene; nothing is left painted after the Scene changes.
4. Repeat step 3 with the operating system set to reduce motion. Every treatment must still be perceptible as a change and none may become a slower version of the same travel.
5. Watch a repeated or sustained cue for at least ten times the single-shot duration and confirm it reads as one continuous statement rather than a stutter, and that the live region says its meaning once — the failure mode `INFOSCHEMATICS-TOOL-059` was raised to describe.
6. Confirm the blueprint backdrop and the Flow arrowheads are unchanged in all of the above, since both have previously survived a fully green run in a broken state.

## Dependencies / blocks

Nothing blocks it. Every record it was waiting on is delivered: diagram dynamics (`INFOSCHEMATICS-TOOL-055`) supplied the named Dynamics, `DynamicOccurrence` resolution and the renderer interpretations; held element emphasis (`INFOSCHEMATICS-TOOL-059`) delivered the sustained treatment and took `continuous` out of this record's scope; bounded playback profile (`INFOSCHEMATICS-TOOL-069`) delivered the `SCENE-006` measurement that step 9 extends rather than establishes.

## Documentation impact

### Decision Records

Expected, and step 1 writes it. `ADR-INFOSCHEMATICS-026` is amended, or a companion record is added under `docs/decisions/` and linked from `docs/decisions/README.md`. It records that a bounded `once`-or-`repeat` policy is authored data while duration, easing and keys are not, says explicitly what that does to `DYNAMIC-001`'s prohibition on timing in a declaration, and states that a lasting statement is `depicts: state` rather than a Scene policy.

### Specifications

Expected, in three documents under `docs/specs/`:

- `docs/specs/flow-signals.md` — `SIGNAL-003:41` requires Scene signal derivation to be "independent of timers". A Present-owned schedule either amends that sentence or is carved out by a new requirement that states where the timer lives and what bounds it.
- `docs/specs/diagram-dynamics.md` — `DYNAMIC-002` gains the Scene-originated occurrence as a recognised source, since today it names only a host.
- `docs/specs/scenes-and-callouts.md` — a new `SCENE` requirement for cue declaration and validation, and a note against `SCENE-006` that repeated playback now depends on its measurement.

Every new requirement lands with a conformance state and evidence paths that resolve, or `bun run self:scripts:test` fails.

### Guides

Expected: `docs/guides/editing-authored-yaml.md` gains the authored cue and a statement that focus and Dynamics remain separate concepts — a Scene focusing a Flow is not a Scene signalling it.

### Roadmap

Expected: three captures, none in this record's scope. An ordered cascade is deferred and needs its own record once the untimed-Sequence question under Discussion has an answer. Site-owned consumer prose under `apps/site/content/` is a follow-up record once the feature lands, and applying these treatments to the 5G-EMERGE walkthrough is an authoring pass of its own. No sequencing edit is needed: `INFOSCHEMATICS-TOOL-059` is delivered.

## Review

### Delivered

A Scene now cues the named Diagram Dynamics its own Diagram declares, each `once` on entry or on a `repeat` while the Scene holds, and nothing authored carries timing to do it: the cue names the Dynamic and at most how often, while the View that plays the Scene owns the beat. Present derives the occurrences, Studio's Present surface plays them on the same single cadence rather than a second scheduler, and the components guide has a Dynamics page that plays all three policies — `once`, `repeat`, and a held `depicts: state` — side by side under the reader's own hand.

### Summary of changes

`SceneCue` joins `Scene` in `packages/domain-model/src/model.ts`, mirrored in `packages/domain-core/src/schema.ts`, validated beside the Dynamics checks in `packages/domain-core/src/model.ts` (a cue naming an undeclared Dynamic and the same Dynamic cued twice in one Scene both fail integrity), given its place in the fixed field order in `serialise.ts`, and projected into the regenerated `packages/domain-core/schema/infoschematic.schema.json`. `packages/view-model/src/runtime.ts` projects the cue onto the runtime Scene with an absent policy read as `once`, carrying ids and policy and no timing at all.

Present holds a `cueCycle` counter and a `replay-cues` action in `packages/view-present/src/presentation.ts`, turning each cue into a `DynamicOccurrence` keyed `present-cue-{sceneOccurrence}` or, for a repeat, `present-cue-{sceneOccurrence}-{cueCycle}`: a retained key holds, a new key replays, and leaving the Scene withdraws both. The one interval that advances the cycle is `useCueCadence` in the new `packages/view-present/src/cues.ts`, exported from the package index so Studio calls the same hook; `Present.tsx` merges cued occurrences with the host-supplied `dynamics` prop, neither suppressing the other, and the prop comment that said a Dynamic travels only the other direction is corrected.

Site gains `apps/site/src/visual-guide/dynamics.ts` (a canonical-model specimen, because the legacy specimen shape cannot express `diagram.dynamics` or a Scene cue at all), `DynamicsSpecimen.tsx` rendering three Canvases with occurrences supplied the way a Scene cue supplies them, a `dynamics` guide section and route, and two real-browser cases. `GuideSectionId` records honestly that Dynamics is a guide section without being a specimen kind. Two authored documents now carry cues: `examples/is-infoschematics/` declares Dynamics and cues its Scenes, and `examples/is-showcase/` cues `DYN-EVENT` `once` and `DYN-SIGNAL` on a `repeat`.

Contracts moved with the behaviour: `SIGNAL-003` now says where the cadence lives while keeping derivation pure and clock-free, `DYNAMIC-002` recognises a Scene-originated occurrence alongside a host one, `SCENE-007` states what a cue may declare and how it is validated, `SCENE-006`'s bound is extended over the cue cadence, `docs/guides/editing-authored-yaml.md` gains the authored cue and says focus and Dynamics stay separate concepts, and `ADR-INFOSCHEMATICS-038` records the decision.

### Verification

| Gate | Outcome |
| --- | --- |
| `bun run self:check` | 48 tasks successful, 48 total |
| `bun run self:scripts:test` | 16 files, 95 tests passed |
| `bunx turbo run test --force` over domain-core, view-model, view-present, view-studio | 9 successful; 8, 16, 6 and 22 test files passed |
| `bun run --cwd apps/site test` | 10 files, 150 tests passed |
| `bun run --cwd apps/site test:browser` | 5 files, 6 tests passed, including the two new Dynamics cases |
| `bun run self:boundaries:verify` | cruised 344 modules, 171 cross-package type-only |
| `bun run self:examples:verify` | generated example exports current: 5 |
| `bun run self:schema:verify` | JSON Schema current |
| `bun run self:examples:render showcase --png --width 1600` | rendered, and looked at |

Looked at: the showcase still rendering, whole. The blueprint backdrop, both Region frames, the Adapter and Wrapper clasps, every Flow treatment and both arrowheads are as they were, and no cue paints anything into a still output — which is `DYNAMIC-004` holding rather than an omission. The byte comparison says the same thing across all five example documents: rendered before and after this change under a stash of exactly these paths, `blank`, `infoschematics`, `homepage`, `showcase` and `system` are byte-identical, including the two documents that now declare cues.

Non-vacuity was proved rather than assumed. Removing `playback: 'repeat'` from the guide specimen and starting the state pane withdrawn fails the new site case on its state-emphasis assertion; the browser cases distinguish a playing cadence from a paused one by counting distinct occurrence keys over two and a half intervals, so a pane that never moves and a pane that never stops both fail.

### Outstanding concerns

A React 19 warning — `g: 'key' is not a prop` — appears in the new site browser run. It reproduces identically on HEAD in `packages/view-canvas/src/Canvas.dynamics.browser.test.tsx`, so it is pre-existing in view-canvas's dynamics rendering and outside this item; it belongs in a later wave rather than here.

`apps/site/content/authoring.md` still frames Dynamics as something only a host plays ("Name the Dynamics a host can play") and does not mention cues. That is site-owned consumer prose, deferred to its own record as this repository's convention has it, and it is the one place a reader could still be told the old story.

The ordered cascade stays deferred for the reason under Discussion: it would have to invent authored timing to divide, and an untimed Sequence has no duration to divide. The 5G-EMERGE walkthrough authoring pass is its own work. Within the guide, the property-specimen machinery still cannot express Dynamics; the page works because it bypasses it.

### Post-change review

`scripts/example-capability-coverage.test.ts` was red until the showcase authored cues, and that is the check working: it derives its capability list from the Zod schema, so `sequences.scenes.cues`, `.dynamic` and `.playback` became required the moment the field landed, and both enum values had to appear in a published document. The showcase now shows them and its README says so. `turbo.json` already listed `examples/*/*.yaml` under `//#self:scripts:test`, so no inputs edit was owed here.

The site build needed `turbo run build` for `@infoschematics/view-present` before it could see `useCueCadence`, because `vite build` resolves the package's `dist` while suites and typechecks resolve source. Nothing in the change works around that; it is the known cost recorded elsewhere.

`apps/site/package.json` now declares `@infoschematics/view-present`, which the `site-does-not-own-product-model` boundary permits and `not-to-dev-dep` requires to be explicit.

### Mini recap

Three things are worth looking at by eye before this is accepted: the Dynamics guide page at `/docs/components/dynamics/`, where the three panes should show a pulse that travels once, a pulse that keeps arriving on one steady beat, and an emphasis that simply stays until withdrawn; the same page with the operating system set to reduce motion, where the travelling pulse should become a still outline over the same span rather than a slower journey; and a Sequence in the Playground over `examples/is-infoschematics/` or `examples/is-showcase/`, watching that a repeat stays inside its Scene's hold and leaves nothing painted behind when the Scene changes.

## Done

Accepted 2026-09-18 by Kris Brown on the review packet above.

## Discussion

### Whether a playback policy is authored data at all — decided

Decided by the owner on 2026-09-18: **a Scene names Dynamics and a bounded `once` or `repeat` policy.** A lasting statement is authored as `depicts: state` on the Dynamic and sustained by the delivered treatment, so `continuous` is not a Scene policy. Present gains the schedule, `SIGNAL-003` is amended to say where the timer lives, and `SCENE-006`'s measurement — now delivered and conforming — is what bounds the repeat.

The three options as they were put, and why the choice reads this way:

The Goal names four playback statements: once, repeatedly, continuously, and in an ordered cascade. Three separate delivered artefacts now say different things about whether a document may carry them.

`ADR-INFOSCHEMATICS-026` line 33 says "Scene-authored choreography (`INFOSCHEMATICS-TOOL-023`) binds this vocabulary instead of defining a parallel animation contract" — which sanctions a Scene cue. `DYNAMIC-001` (`docs/specs/diagram-dynamics.md:15`) says a declaration must carry no duration, easing, or timer, and `DYNAMIC-002:29` says occurrences, keys, and timers must stay out of the authored document. `packages/view-present/src/Present.tsx:17-18` says, in the delivered code, that a Dynamic is "the other direction" from Scene signalling — something outside the presentation happened. And held element emphasis (`INFOSCHEMATICS-TOOL-059`, ready) already claims the sustained treatment that `continuous` would produce.

The owner needs to choose one of three, and it is not a choice shaping can make from the code:

1. **A Scene names Dynamics only.** Each cue plays once on Scene entry — a strict extension of `SIGNAL-002`, needing no new timer and no contract amendment. Repetition becomes a host concern; sustain comes from `INFOSCHEMATICS-TOOL-059`. Cheapest, and drops two of the four statements from the Goal.
2. **A Scene names Dynamics plus a bounded policy** of `once` or `repeat`, with `continuous` reassigned to `INFOSCHEMATICS-TOOL-059`. Present gains a schedule, `SIGNAL-003` is amended to say where the timer lives, and `SCENE-006` must be measured first.
3. **A Scene owns all four.** `DYNAMIC-001`, `DYNAMIC-002`, and `SIGNAL-003` are all amended, and this record absorbs the sustained-treatment contract that `INFOSCHEMATICS-TOOL-059` was separated out to hold.

Option 2 was chosen. It is the reading of `ADR-INFOSCHEMATICS-026` that leaves `DYNAMIC-001` and `DYNAMIC-002` intact — a policy is not a duration, an easing or a key — and it keeps the sustained treatment where `INFOSCHEMATICS-TOOL-059` delivered it rather than describing the same observable outcome twice.

### What a cascade divides when there is nothing to divide — deferred, and why

The ordered cascade named in this record's original Goal is **out of scope** and left uncaptured until the question below has an answer. It is not a treatment gap: nothing in the tree settles what paces a cascade in a manually driven Sequence, and a staged cue that cannot say what it divides would have to invent authored timing, which is exactly what `DYNAMIC-001` forbids. Once-and-repeat need no such answer, which is why they proceed without it.

Derived cascade timing needs a duration to divide. `packages/view-model/src/runtime.ts:381` gives every runtime Scene a `hold`, defaulting to `defaultSceneDuration` at `:131`, so a number always exists — but for an untimed Sequence (`presentation.timed: false`, `docs/specs/scenes-and-callouts.md:55-63`) that number is fiction: the Scene stays on screen until a presenter steps, which may be one second or ten minutes. Dividing 3100 milliseconds across three stages in a manually driven Scene either finishes before the presenter has finished speaking, or must wait for a step that may never come. Whether a cascade is admissible in an untimed Sequence at all, and if so what paces it, is not settled by anything in the tree and is not answered by the decision above.
