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

_Conformance:_ divergent

_Verify:_ run automatic playback for a sustained interval under fake timers, asserting the pending-timer count stays flat across cycles, and take a browser memory profile over the same run.

_Evidence:_ not established. Repeated automated demo cycles produced an out-of-memory failure during regression review, and that observation has never been reproduced or profiled. Both playback effects — `packages/view-present/src/Present.tsx` and `packages/view-studio/src/app/App.tsx` — clear their timeout on cleanup, and `packages/view-present/src/presentation.ts` holds no per-cycle collection, so the accumulation the requirement forbids has no obvious home; that is an argument, not a measurement. Tracked as [Bounded playback profile](../roadmap/INFOSCHEMATICS-TOOL-069-bounded-playback-profile.md).

## Gaps

- A single fail-fast integrity gate does not yet validate every Scene reference.
