---
id: INFOSCHEMATICS-TOOL-069
area: TOOL
title: Bounded playback profile
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-16T09:00:00Z
updated_at: 2026-09-16T10:45:00Z
---

# Bounded playback profile

## Goal

Decide `SCENE-006` on a measurement, so automatic Scene playback is either proved bounded or has a named leak.

## Context

`SCENE-006` requires automatic Scene playback to run repeated cycles without accumulating timers, retained transition state, or memory in proportion to elapsed cycles. It is recorded divergent on a single observation: repeated automated demo cycles produced an out-of-memory failure during a regression review. That observation was never reproduced, never profiled, and never attributed.

Raised while deciding every non-conforming requirement in `INFOSCHEMATICS-TOOL-056`. Reading the code makes the divergence look doubtful — every playback effect clears its timeout on cleanup, and the presentation state holds no collection that grows per cycle — but reading is not the verification the requirement asks for, and a requirement recorded divergent on an anecdote is exactly as unhelpful as one recorded conforming on one.

The measurement is also missing a place to live. Nothing in the repository calls `vi.useFakeTimers`, the node suites configure no DOM environment, and `packages/view-present` has no browser suite at all — so the first cost of this item is deciding where a sustained run belongs, not writing assertions.

## Boundary

This item establishes what happens over sustained playback and fixes a leak if it finds one. It does not change playback behaviour, Scene semantics, the Sequence timing options, or the Dynamics occurrence contract that `ADR-INFOSCHEMATICS-026` fixed. It does not add a held or persistent occurrence; that is `INFOSCHEMATICS-TOOL-059`'s question and this item measures whichever lifecycle is in the tree when it runs.

## Current state

- Three components each hold at most one automatic-playback timeout and each returns a cleanup that clears it: `packages/view-present/src/Present.tsx:49-68`, and `packages/view-studio/src/app/App.tsx:674-694`, whose effect has two branches — the timed Sequence at `App.tsx:676` and the legacy Story at `App.tsx:686`.
- Canvas retires each accepted occurrence on its own single timeout, cleared on cleanup: Flow signals at `packages/view-canvas/src/Canvas.tsx:130-135` over `flowSignalDuration` (`packages/view-canvas/src/flow-signals.ts:9`), element emphasis at `Canvas.tsx:179-184`. Studio holds a fourth, unrelated to Scene playback, to retire its own Dynamics preview at `App.tsx:566-569`.
- `packages/view-present/src/presentation.ts:18-19` holds `playing` and a `sceneOccurrence` counter. Every step increments the counter (`presentation.ts:113-117`) and derives a fresh signal key `present-scene-${sceneOccurrence}` (`presentation.ts:184-190`). No field accumulates per cycle; the counter is an unbounded integer, not an unbounded allocation.
- The one structure that could retain a key per cycle is the `seen` set Canvas holds for the component's lifetime (`Canvas.tsx:111` for signals, `Canvas.tsx:151` for emphasis). `packages/view-canvas/src/occurrences.ts:50-52` deletes every key the host no longer supplies, and the active list is filtered to currently supplied keys at `occurrences.ts:64`; the comment at `occurrences.ts:33-38` claims exactly the boundedness `SCENE-006` demands. So the accumulation the requirement forbids has a designed answer already — which is what makes the anecdote hard to place, and is still an argument rather than a measurement.
- Key freshness across steps is covered only at reducer level, by `packages/view-present/src/presentation.test.ts:285-286` and `:330-334`. Those are pure reducer assertions: no effect runs and no timer is created.
- Nothing measures pending timers or retained memory. `vi.useFakeTimers` appears nowhere under `packages/`, `apps/`, or `scripts/`, and `scripts/vitest-workspace.ts:29-38` sets no `environment` for the node suites, so `Present.tsx`'s effect never executes under `bun run test` — the Present cases render through `renderToStaticMarkup` (`packages/view-present/src/Present.dynamics.test.tsx:29`).
- Browser suites exist only in `packages/view-canvas`, `packages/view-studio`, and `apps/site`; each pairs a `vitest.browser.config.ts` with a `test:browser` script. `turbo.json:38-40` already defines a generic `test:browser` task, so giving `packages/view-present` a browser suite needs a package config and script, not a task-graph change.
- `SCENE-006` at `docs/specs/scenes-and-callouts.md:67-75` already carries a verification plan naming this measurement (`:73`). What it lacks is evidence (`:75`) and a conformance state resting on it (`:71`).

## Steps

- [ ] Choose where the sustained run lives and record why: Studio's existing browser suite (`packages/view-studio/vitest.browser.config.ts`), or a new browser suite in `packages/view-present` with its own `vitest.browser.config.ts` and `test:browser` script. Verifiable by the chosen `bun run --cwd <package> test:browser` collecting the new file.
- [ ] Confirm in that runner that `vi.useFakeTimers` actually controls `window.setTimeout` for a mounted component, before writing assertions on top of it. This is untried in this repository; if it does not hold, fall back to a short real `hold` and a bounded wall-clock run, and say so in the case.
- [ ] Drive a timed Sequence through many cycles — enough that a per-cycle retention would be unmistakable — and assert both that the pending-timer count stays flat and that the Canvas `seen` set does not grow with cycles.
- [ ] Prove the assertion can fail: remove the cleanup at `Present.tsx:60` (or `App.tsx:694`) and confirm the case fails, then restore it. A measurement that cannot fail is not a measurement.
- [ ] Take a browser memory profile over the same sustained run in Chromium and record the heap shape across cycles as the evidence text, not as a screenshot.
- [ ] If growth exists, name the retained object and fix it in the module that owns it. If it does not, record `SCENE-006` as conforming and cite the case and the profile.
- [ ] Decide whether the sustained run stays in the gate or becomes a procedure a Producer runs, and update `SCENE-006`'s verification plan to say which. The plan already names the measurement, so this changes its wording rather than adding it.

## Files touched

- `packages/view-studio/src/app/App.browser.test.tsx`, or a new browser case beside it, or a first browser suite under `packages/view-present`
- `packages/view-present/package.json` and a new `packages/view-present/vitest.browser.config.ts`, only if the run lands there
- `docs/specs/scenes-and-callouts.md`
- Whichever module retains the object, if one does

## Verify

Run the chosen browser suite — `bun run --cwd packages/view-studio test:browser`, or the new `packages/view-present` equivalent — and confirm the sustained case passes. Then delete a playback effect's cleanup and confirm the same case fails; restore it. Run `bun run self:check` last, because `test:browser` is the final stage of that gate and the new case must survive it rather than only passing in isolation.

## Dependencies / blocks

None. Found while delivering [Specification evidence integrity](INFOSCHEMATICS-TOOL-056-specification-evidence-integrity.md). Adjacent to but independent of [Held element emphasis](INFOSCHEMATICS-TOOL-059-held-element-emphasis.md): if a held occurrence lands first, this measurement must be written so that a deliberately sustained emphasis is not read as a leak.

## Documentation impact

### Decision Records

None. `ADR-INFOSCHEMATICS-026` already states that holding a key holds the occurrence and withdrawing it cancels; this item measures whether the implementation keeps that promise over time rather than revising it.

### Specifications

`SCENE-006` gains evidence and a conformance state that rests on it, and its verification plan is narrowed to say whether the sustained run is a gate case or a procedure.

### Guides

None.

### Roadmap

None.

## Discussion

### Whether an unreproduced failure should hold a requirement divergent

The observation was serious enough to record and never serious enough to chase. Shaping should decide whether a requirement stays divergent on an unreproduced report, or whether the honest state is pending until someone measures — the two say different things about how much is known, and only one of them says nobody has looked.

### Whether fake timers can see what the failure was

Fake timers collapse elapsed time, so they measure accumulation driven by cycle count: timers, keys, retained references. The original failure came from repeated demo cycles running in real time, where anything driven by elapsed time rather than by steps — retained paint, animation nodes, a renderer's own caches — would also be in play. A flat pending-timer count under fake timers could therefore be a green that does not contradict the anecdote at all. If that is the case, the fake-timer assertion is a regression guard and the browser profile is the actual measurement, and `SCENE-006` should be worded to say which of the two its conformance rests on.
