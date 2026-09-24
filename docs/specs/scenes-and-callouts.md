# Scenes and callouts — SCENE

Activatable Scenes, ordered presentation, Callout placement, custom Callouts, timing, and playback stability. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### SCENE-001 — An active Sequence can be steered

While a Sequence is active, the Audience MUST be able to step forward, step backward and stop it; a timed Sequence MUST additionally allow automatic advance to be held or resumed. Stepping beyond either end MUST wrap within the Sequence.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-studio`, then activate a Sequence in Studio and steer it from both the controls and the keyboard: forward, backward, and stop must all be reachable while it is active, and stepping past the last Scene must wrap to the first rather than leave the Sequence. Activate a timed Sequence as well and confirm its automatic advance can be held and resumed. Falsified by a steering action reachable only for timed Sequences.

_Evidence:_ `stepSequence`, `toggleAutoAdvance` and `stopSequence` in `packages/view-studio/src/app/hooks/use-presentation.ts`; controls in `packages/view-studio/src/app/panels/SceneCallout.tsx`; keyboard handling in `packages/view-studio/src/app/App.tsx`.

### SCENE-002 — Only activatable presentation material can own focus

Present MUST allow at most one Standalone Scene or Sequence Scene to be active, and activating either MUST clear the other focus source.

An empty Sequence MUST NOT be activatable in Present. Clear and step actions against an empty Sequence, a stale identifier or an invalid step MUST be total operations: they MUST return a valid state without throwing or activating unavailable content.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-present`, then activate a Standalone Scene and a Sequence Scene in turn and confirm each clears the other rather than leaving two focus sources. Then attack the state: activate an empty Sequence, clear an empty Sequence, step a stale identifier, and step past a bound. Each must return usable state, throw nothing, and activate nothing unavailable.

_Evidence:_ presentation-state tests cover focus conflicts, empty Sequences, stale identifiers and invalid steps.

### SCENE-003 — Automatic Callout placement is deterministic

When a Scene does not author an explicit Callout position, Present View MUST choose from the Infoschematic's candidate positions in their declared order, prefer a position clear of focused content and otherwise choose the lowest-cost candidate. The chosen Callout MUST remain inside the Infoschematic view box. An explicitly authored position MUST take precedence.

_Implementation surface: `chooseSpot` in `packages/view-model/src/placement.ts`; focused-content obstacles and authored override in `packages/view-studio/src/app/panels/SceneCallout.tsx`._

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-model`, then drive `chooseSpot` in `packages/view-model/src/placement.ts` with a Scene that authors no position: it must take the candidates in their declared order, return the first clear of the focused content, otherwise return the lowest-cost one, and in every case stay inside the view box. Repeat with an authored position and confirm that position wins. Falsified by a chosen spot outside the box, or an authored position losing to a candidate.

_Evidence:_ `packages/view-model/src/placement.test.ts` covers candidate order, weighted obstruction, least-cost fallback and view-box clamping.

### SCENE-004 — Custom Callouts retain the Audience contract

Present MUST resolve the exact key-and-version Callout renderer requested through the immutable host registry and MUST validate its serialisable properties before invoking it. An unknown key, unregistered requested version, or invalid property value MUST emit the corresponding structured host diagnostic and use the standard Callout presentation.

A custom implementation MAY replace the Callout's visual content, but Present MUST retain deterministic placement, the accessible live-status frame, Sequence navigation, applicable automatic-advance controls, and exit action. The fallback MUST retain the authored title, body, and takeaways rather than hide explanatory content.

_Verification: `packages/view-present/src/SceneCallout.test.tsx` covers standard, custom, unknown and invalid Callouts through server rendering._

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-present`, then request a Callout renderer by exact key and version. An unknown key, an unregistered version, and an invalid property value must each emit the matching structured host diagnostic and fall back to the standard Callout with the authored title, body, and takeaways still shown rather than hidden. With a valid custom renderer, confirm its visual content replaces only that: placement, the live-status frame, Sequence navigation, the automatic-advance controls where they apply, and the exit action must all survive.

_Evidence:_ renderer resolution in `packages/view-canvas/src/renderers.tsx` and Callout composition in `packages/view-present/src/SceneCallout.tsx`.

### SCENE-005 — Sequences separate display from timing

A Sequence MUST independently select expanded or collapsed display, manual or timed advance, and whether its Scene Callouts render; each Sequence MUST own its Scenes directly.

_Conformance:_ conforming

_Verify:_ exercise all four display-and-timing combinations with Callouts both enabled and disabled.

_Evidence:_ `packages/view-present/src/presentation.test.ts` covers all four combinations; `PresentationControls.tsx`, Studio's `ProducerControls.tsx`, and both Callout compositions consume the independent switches.

### SCENE-007 — A Scene may cue the Dynamics its Diagram declares

A Scene MAY cue named [Diagram Dynamics](../reference/vocabulary.md#diagram-dynamic) its own Diagram declares. A cue MUST name the Dynamic and, at most, how often it plays and where it falls in the Scene's order: absent a policy it plays `once` on entry to the Scene, and `repeat` plays it again while the Scene holds; absent a stage it belongs to the Scene's first stage. A stage MUST be a whole number counting from one, and is an order rather than a measurement. A cue MUST carry nothing else — no duration, no easing, no timer, and no occurrence key.

A Scene whose cues name more than one stage plays as an ordered cascade, and the Sequence holding it MUST pace that cascade rather than the cue doing so itself ([ADR-INFOSCHEMATICS-035](../decisions/ADR-INFOSCHEMATICS-035-a-sequence-paces-a-cascade-and-a-declaration-never-does.md)). A timed Sequence MUST divide the Scene's own hold between its stages, so a cascading Scene leaves exactly when it would have left without one; an untimed Sequence MUST spend one presenter step on each stage, advancing within the Scene while stages remain and past it only once the last has played. Stepping backwards MUST arrive at a Scene with its cascade played out, so that a step back undoes a step forward. A Scene taken up outside a Sequence — a Standalone Scene, or one expanded beside its Sequence — has no pacer and MUST play every cue on entry.

Validation MUST reject a cue naming a Dynamic the Diagram does not declare, and MUST reject two cues for one Dynamic in one Scene whatever stages they name. Leaving the Scene MUST end every occurrence its cues originated, and a cue MUST be suppressed by the same Scene signal policy that suppresses focus-derived Flow signals (`SIGNAL-003`), because a cue is an authored request rather than a host event.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/domain-core --filter=@infoschematics/view-present`, then author a Scene that cues one Dynamic twice and another that cues an identifier no Diagram declares: both must fail integrity rather than reach a renderer. Enter a Scene cueing one Dynamic `once` and one on `repeat`, advance the cue cycle, and leave the Scene: the single-shot key must not move, the repeating key must move with the cycle and nothing else, and both occurrences must be gone on exit. Under the `none` signal policy no cue may originate anything. Then author a Scene staging three cues in a Sequence of each kind and drive it: stepping an untimed Sequence must add one stage at a time and reach the next Scene on the step after the last stage, a step back must return to the previous Scene with its cascade complete, and a timed Sequence must show all three stages within the hold the Scene already had. Falsified by a cue that outlives its Scene, a duplicate cue that validates whatever stages it names, a cue carrying a duration, a staged Scene that leaves before or after the hold it declares, or a stage index that advances in derivation but not in a host.

_Evidence:_ the authored cue shape is `SceneCue` in `packages/domain-model/src/model.ts`, carrying the optional `stage`, with its schema in `packages/domain-core/src/schema.ts` — strict, so a cue that paces itself fails to parse, covered by `packages/domain-core/src/schema.test.ts` — and its reference and duplicate checks in `packages/domain-core/src/model.ts`, covered by `packages/domain-core/src/model.test.ts`; an absent stage resolves to the first in `packages/view-model/src/runtime.ts`, so no View reads an absence; derivation to occurrences is in `packages/view-present/src/presentation.ts`, which filters the cues to the stages reached and says whether a step stays in the Scene, covered by `packages/view-present/src/presentation.test.ts` and `packages/view-present/src/Present.dynamics.test.tsx`; the stage division of a hold is `cueStageHold` in `packages/view-present/src/cues.ts`, spent by `packages/view-present/src/Present.tsx` and `packages/view-studio/src/app/App.tsx` so both hosts keep the same beat; a cascade is driven in a real browser, stepped and timed, by `packages/view-present/src/Present.cascade.browser.test.tsx`; `examples/is-showcase/infoschematic.yaml` authors one; the three policies are drawn side by side and driven in a real browser by `apps/site/src/visual-guide/DynamicsSpecimen.browser.test.tsx`.

## Quality properties

### SCENE-006 — Automatic playback remains bounded

Automatic Scene playback MUST run for repeated cycles without accumulating timers, retained transition state, or memory in proportion to elapsed cycles.

A Scene cue on `repeat` (`SCENE-007`) plays under the same obligation: the cadence a View runs while the Scene holds MUST retire its timer when the Scene changes or the Sequence stops, so a cued repetition accumulates no timers, no retained occurrences, and no retained occurrence keys however long it plays.

Staged stepping (`SCENE-007`) falls under the same bound and MUST add no cadence of its own. A timed Sequence beating once per stage MUST hold no more pending timers at any stage of a cascade than it holds for a Scene that stages nothing, and a stage advance MUST retain nothing beyond the occurrences the stages reached have originated — so a Sequence looped indefinitely through a cascading Scene accumulates no more than one looped through a flat one.

_Conformance:_ conforming

_Verify:_ the requirement has two halves, and only the first is enforced. What accumulates per cycle — pending timeouts, retained occurrences, retained occurrence keys — is a gate case: `packages/view-present/src/Present.playback.browser.test.tsx` drives a timed Sequence through 240 cycles under fake timers, and `packages/view-canvas/src/occurrences.bounded.test.ts` drives 2000 cycles of per-step occurrence keys through `reconcileOccurrences` in `packages/view-canvas/src/occurrences.ts`, which is the one structure whose growth no markup, timer or retirement would reveal. What accumulates per elapsed second is a Producer procedure instead, run with `VITE_PLAYBACK_PROFILE=measure bun run --cwd packages/view-present test:browser`, because a memory threshold wide enough to survive a loaded machine cannot catch a slow leak and a tighter one gets widened until it cannot either. The procedure reads `Runtime.getHeapUsage` after a forced collection over the DevTools protocol; `performance.memory` is not a usable instrument here, because Chromium caches it — a run retaining 24 MB of deliberate ballast reported the same 33.47 MB at every sample as a clean run.

_Evidence:_ measured rather than argued, and each measurement was shown failing first. Under fake timers, 240 cycles of a timed Sequence hold exactly one retained Flow-signal occurrence and exactly two pending timeouts — the Sequence's step timer and the Canvas retirement timer — at every single cycle, across 240 distinct Scene occurrence keys that prove the run advanced rather than stalled; removing the withdrawn-key release in `packages/view-canvas/src/occurrences.ts` grows the retained-key set from 1 to 2000 over 2000 cycles. A 150-second Chromium profile over 9,902 Scene steps holds retained heap in a 20.3–21.3 MB band that falls as often as it rises, drifting 812 KB in total — under 0.1 KB per step, and not scaling with step count — where a deliberately leaking run of the same shape grows strictly monotonically at 13.8 KB per step. The out-of-memory observation that held this requirement divergent was not reproduced. One caveat belongs with the state: uninterrupted playback does not exercise a step timeout's cleanup at all, because the timeout has always already fired by the time the effect re-runs, so the cleanup is covered by a separate steering case rather than by the sustained run. The cue cadence this bound now also covers is `useCueCadence` in `packages/view-present/src/cues.ts`, a single interval that exists only while the focused Scene cues a repeat; its retirement with the Scene is driven in `packages/view-present/src/Present.dynamics.test.tsx` and `packages/view-present/src/presentation.test.ts`. Staged stepping adds no structure to that: a stage is an index on the state the reducer already holds, spent through the step timer a timed Sequence already sets, so the 240-cycle case measures the cascade's cadence as well as the Scene's; `packages/view-present/src/Present.cascade.browser.test.tsx` drives a three-stage Scene through both hosts' pacing to show the beat is the Scene's hold divided rather than added to.

## Gaps

- A single fail-fast integrity gate does not yet validate every Scene reference.
- `SCENE-006`'s elapsed-time half is a procedure a Producer runs, not a gate case, so a leak driven by elapsed time rather than by cycle count would reach a release unnoticed. Gating it needs a memory budget that holds on a loaded machine, which the gate cannot currently assume.
