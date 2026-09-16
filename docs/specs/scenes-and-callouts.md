# Scenes and callouts — SCENE

Activatable Scenes, ordered presentation, Callout placement, custom Callouts, timing, and playback stability. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### SCENE-001 — An active Sequence can be steered

While a Sequence is active, the Audience MUST be able to step forward, step backward and stop it; a timed Sequence MUST additionally allow automatic advance to be held or resumed. Stepping beyond either end MUST wrap within the Sequence.

_Conformance:_ conforming

_Verify:_ inspect `stepSequence`, `toggleAutoAdvance` and `stopSequence` in `packages/view-studio/src/app/hooks/use-presentation.ts`; controls in `packages/view-studio/src/app/panels/SceneCallout.tsx`; keyboard handling in `packages/view-studio/src/app/App.tsx`.

_Evidence:_ `stepSequence`, `toggleAutoAdvance` and `stopSequence` in `packages/view-studio/src/app/hooks/use-presentation.ts`; controls in `packages/view-studio/src/app/panels/SceneCallout.tsx`; keyboard handling in `packages/view-studio/src/app/App.tsx`.

### SCENE-002 — Only activatable presentation material can own focus

Present MUST allow at most one Standalone Scene or Sequence Scene to be active, and activating either MUST clear the other focus source.

An empty Sequence MUST NOT be activatable in Present. Clear and step actions against an empty Sequence, a stale identifier or an invalid step MUST be total operations: they MUST return a valid state without throwing or activating unavailable content.

_Conformance:_ conforming

_Verify:_ presentation-state tests cover focus conflicts, empty Sequences, stale identifiers and invalid steps.

_Evidence:_ presentation-state tests cover focus conflicts, empty Sequences, stale identifiers and invalid steps.

### SCENE-003 — Automatic Callout placement is deterministic

When a Scene does not author an explicit Callout position, Present View MUST choose from the Infoschematic's candidate positions in their declared order, prefer a position clear of focused content and otherwise choose the lowest-cost candidate. The chosen Callout MUST remain inside the Infoschematic view box. An explicitly authored position MUST take precedence.

_Implementation surface: `chooseSpot` in `packages/view-model/src/placement.ts`; focused-content obstacles and authored override in `packages/view-studio/src/app/panels/SceneCallout.tsx`._

_Conformance:_ conforming

_Verify:_ `packages/view-model/src/placement.test.ts` covers candidate order, weighted obstruction, least-cost fallback and view-box clamping.

_Evidence:_ `packages/view-model/src/placement.test.ts` covers candidate order, weighted obstruction, least-cost fallback and view-box clamping.

### SCENE-004 — Custom Callouts retain the Audience contract

Present MUST resolve the exact key-and-version Callout renderer requested through the immutable host registry and MUST validate its serialisable properties before invoking it. An unknown key, unregistered requested version, or invalid property value MUST emit the corresponding structured host diagnostic and use the standard Callout presentation.

A custom implementation MAY replace the Callout's visual content, but Present MUST retain deterministic placement, the accessible live-status frame, Sequence navigation, applicable automatic-advance controls, and exit action. The fallback MUST retain the authored title, body, and takeaways rather than hide explanatory content.

_Verification: `packages/view-present/src/SceneCallout.test.tsx` covers standard, custom, unknown and invalid Callouts through server rendering._

_Conformance:_ conforming

_Verify:_ inspect renderer resolution in `packages/view-canvas/src/renderers.tsx` and Callout composition in `packages/view-present/src/SceneCallout.tsx`. against this requirement.

_Evidence:_ renderer resolution in `packages/view-canvas/src/renderers.tsx` and Callout composition in `packages/view-present/src/SceneCallout.tsx`.

### SCENE-005 — Sequences separate display from timing

A Sequence MUST independently select expanded or collapsed display, manual or timed advance, and whether its Scene Callouts render; each Sequence MUST own its Scenes directly.

_Conformance:_ conforming

_Verify:_ exercise all four display-and-timing combinations with Callouts both enabled and disabled.

_Evidence:_ `packages/view-present/src/presentation.test.ts` covers all four combinations; `PresentationControls.tsx`, Studio's `ProducerControls.tsx`, and both Callout compositions consume the independent switches.

## Quality properties

### SCENE-006 — Automatic playback remains bounded

Automatic Scene playback MUST run for repeated cycles without accumulating timers, retained transition state, or memory in proportion to elapsed cycles.

_Conformance:_ conforming

_Verify:_ the requirement has two halves, and only the first is enforced. What accumulates per cycle — pending timeouts, retained occurrences, retained occurrence keys — is a gate case: `packages/view-present/src/Present.playback.browser.test.tsx` drives a timed Sequence through 240 cycles under fake timers, and `packages/view-canvas/src/occurrences.bounded.test.ts` drives 2000 cycles of per-step occurrence keys through `reconcileOccurrences` in `packages/view-canvas/src/occurrences.ts`, which is the one structure whose growth no markup, timer or retirement would reveal. What accumulates per elapsed second is a Producer procedure instead, run with `VITE_PLAYBACK_PROFILE=measure bun run --cwd packages/view-present test:browser`, because a memory threshold wide enough to survive a loaded machine cannot catch a slow leak and a tighter one gets widened until it cannot either. The procedure reads `Runtime.getHeapUsage` after a forced collection over the DevTools protocol; `performance.memory` is not a usable instrument here, because Chromium caches it — a run retaining 24 MB of deliberate ballast reported the same 33.47 MB at every sample as a clean run.

_Evidence:_ measured rather than argued, and each measurement was shown failing first. Under fake timers, 240 cycles of a timed Sequence hold exactly one retained Flow-signal occurrence and exactly two pending timeouts — the Sequence's step timer and the Canvas retirement timer — at every single cycle, across 240 distinct Scene occurrence keys that prove the run advanced rather than stalled; removing the withdrawn-key release in `packages/view-canvas/src/occurrences.ts` grows the retained-key set from 1 to 2000 over 2000 cycles. A 150-second Chromium profile over 9,902 Scene steps holds retained heap in a 20.3–21.3 MB band that falls as often as it rises, drifting 812 KB in total — under 0.1 KB per step, and not scaling with step count — where a deliberately leaking run of the same shape grows strictly monotonically at 13.8 KB per step. The out-of-memory observation that held this requirement divergent was not reproduced. One caveat belongs with the state: uninterrupted playback does not exercise a step timeout's cleanup at all, because the timeout has always already fired by the time the effect re-runs, so the cleanup is covered by a separate steering case rather than by the sustained run.

## Gaps

- A single fail-fast integrity gate does not yet validate every Scene reference.
- `SCENE-006`'s elapsed-time half is a procedure a Producer runs, not a gate case, so a leak driven by elapsed time rather than by cycle count would reach a release unnoticed. Gating it needs a memory budget that holds on a loaded machine, which the gate cannot currently assume.
