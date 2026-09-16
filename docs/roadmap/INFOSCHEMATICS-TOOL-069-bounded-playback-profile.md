---
id: INFOSCHEMATICS-TOOL-069
area: TOOL
title: Bounded playback profile
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: f9c1c7af81a528380f89ba3f7811ebf79a7b62a0
created_at: 2026-09-16T09:00:00Z
updated_at: 2026-09-16T13:20:00Z
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

- [x] Choose where the sustained run lives and record why: Studio's existing browser suite (`packages/view-studio/vitest.browser.config.ts`), or a new browser suite in `packages/view-present` with its own `vitest.browser.config.ts` and `test:browser` script. Verifiable by the chosen `bun run --cwd <package> test:browser` collecting the new file.
- [x] Confirm in that runner that `vi.useFakeTimers` actually controls `window.setTimeout` for a mounted component, before writing assertions on top of it. This is untried in this repository; if it does not hold, fall back to a short real `hold` and a bounded wall-clock run, and say so in the case.
- [x] Drive a timed Sequence through many cycles — enough that a per-cycle retention would be unmistakable — and assert both that the pending-timer count stays flat and that the Canvas `seen` set does not grow with cycles.
- [x] Prove the assertion can fail: remove the cleanup at `Present.tsx:60` (or `App.tsx:694`) and confirm the case fails, then restore it. A measurement that cannot fail is not a measurement.
- [x] Take a browser memory profile over the same sustained run in Chromium and record the heap shape across cycles as the evidence text, not as a screenshot.
- [x] If growth exists, name the retained object and fix it in the module that owns it. If it does not, record `SCENE-006` as conforming and cite the case and the profile.
- [x] Decide whether the sustained run stays in the gate or becomes a procedure a Producer runs, and update `SCENE-006`'s verification plan to say which. The plan already names the measurement, so this changes its wording rather than adding it.

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

## Review

### Delivered

`SCENE-006` is decided on a measurement rather than on an argument, and the measurement says there is no leak. Sustained automatic playback accumulates no pending timers, no retained transition state, no retained occurrence keys, and no heap in proportion to elapsed cycles or elapsed seconds. No production module needed a fix, which is the outcome this item was written to be able to reach — and the reason most of the work went into making each assertion capable of going red first.

All seven steps are delivered. Step 1's answer is a new browser suite in `packages/view-present` rather than a case in Studio's existing one: the playback effect under measurement lives in `packages/view-present/src/Present.tsx`, and measuring it through Studio would have put Studio's own dock, editor and persisted preferences inside the same heap and timer counts. Step 4's proposed falsification was carried out and found not to falsify — removing the cleanup at `Present.tsx:60` leaves the uninterrupted sustained case green on every cycle — so a second case was added that does catch it, and the finding is recorded rather than papered over.

### Summary of changes

`packages/view-present/vitest.browser.config.ts` and `packages/view-present/package.json` — the package's first browser suite, configured through `workspaceBrowserTests` in `scripts/vitest-workspace.ts` rather than as another hand-written config, and a `test:browser` script matching the other packages' shape. This is the gate's 44th Turborepo task.

`packages/view-present/src/vite-env.d.ts` — `vite/client` types, so the profile can read its mode off `import.meta.env` under the package's own typecheck.

`packages/view-present/src/Present.playback.browser.test.tsx` — the gate cases. Three tests. The first establishes the instrument, because nothing in this repository had relied on it before: `vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })` does control a mounted component's `window.setTimeout`, and `vi.getTimerCount()` does report the pending count exactly. The second drives a timed Sequence through 240 cycles and asserts the steady state absolutely, not merely flatly. The third steers the Sequence mid-hold through 240 cycles, which is the only shape that exercises a step timeout's cleanup at all.

Two details in that file are load-bearing and were each arrived at by watching a weaker version pass wrongly. Observation happens at quiescence — macrotasks are yielded until two consecutive readings agree, throwing on a 20-attempt cap — because React commits and runs passive effects outside the faked clock, and a single `requestAnimationFrame` flush passed and then failed on a later run with the step committed and the next timer not yet scheduled. And the assertion is against the absolute constant `'1/2'` rather than against the run's own first cycle, because a flatness-only assertion accepted the deliberately broken build: a leaked timeout per step settles at a constant offset and reads as perfectly bounded. Each measurement test also asserts `keysSeen`, the count of distinct Scene occurrence keys the page actually showed, so a run that stalled on its first step fails instead of satisfying every flatness assertion trivially.

`packages/view-canvas/src/occurrences.bounded.test.ts` — 2000 cycles of per-step occurrence keys through `reconcileOccurrences`, asserting the `seen` set holds exactly one key and one active occurrence at every cycle while accepting all 2000 as fresh. This is measured at the module that owns the set rather than through the page, because a retained key changes no markup, retires no occurrence and alters no timer: it is invisible until it is a heap profile. It is the one structure a Sequence running indefinitely could actually grow.

`packages/view-present/src/Present.playback.profile.browser.test.tsx` — the elapsed-time half, as an on-demand procedure gated behind `VITE_PLAYBACK_PROFILE` and skipped in the gate. It reads retained bytes over the DevTools protocol — `HeapProfiler.collectGarbage` then `Runtime.getHeapUsage` — and has a `leak` mode that retains ballast for the whole run, so the procedure can be shown seeing a leak before a flat reading from it is believed. The first attempt used `performance.memory` and was a measurement of nothing: Chromium caches the value, and a 30-second run retaining about 24 MB of deliberate ballast reported the same 33.47 MB at every sample as a clean run, to the last digit.

`docs/specs/scenes-and-callouts.md` — `SCENE-006` moves from `divergent` to `conforming`. Its verification plan is split explicitly: what accumulates per cycle is a gate case, what accumulates per elapsed second is a Producer procedure, with the reason the second is not gated stated in the requirement rather than left as an omission. The evidence line records the measured numbers and the caveat about uninterrupted cleanup. A `Gaps` bullet records that the elapsed-time half is ungated.

No production module changed. `packages/view-present/src/Present.tsx` and `packages/view-canvas/src/occurrences.ts` are byte-identical to baseline; both were edited to falsify and both were restored.

### Verification

`bun run self:check` — 44 tasks, 44 successful, and then re-run with `--force` across the whole task list: 44 successful, 0 cached, 23.4s. The forced run is what is cited, because a replayed task is not a fresh result. Within it, `@infoschematics/view-present:test:browser` ran fresh: 3 passed, 1 skipped, the skip being the profile.

The new test files are cited from `docs/specs/scenes-and-callouts.md`, which makes `//#self:scripts:test` read them through the specification-evidence check. Its declared `inputs` already cover them via `packages/*/src/**` and `docs/**`, and that was proved rather than assumed: the task replayed `>>> FULL TURBO` twice in a row, then appending one comment line to `packages/view-canvas/src/occurrences.bounded.test.ts` produced `0 cached, 1 total`. The probe line was removed. No `turbo.json` change was needed.

Three falsifications, each run and then reverted to a zero diff:

- Deleting the withdrawn-key release from `reconcileOccurrences` fails the bounded case, with the retained-set sizes becoming `1, 2, 3, 4, …` across 2000 cycles instead of the single value `1`.
- Deleting `return () => window.clearTimeout(timer)` from `Present.tsx:60` fails the steering case on all 240 of 240 cycles, each observing `'1/3'` — one pending timeout left behind per steer — while the uninterrupted sustained case and the instrument case both stay green. That asymmetry is the finding behind the caveat in the evidence line.
- Running the profile in `leak` mode makes the heap trend unmistakable, which is what stops a flat reading from `measure` mode being a reading of nothing.

The two profile modes were then run back to back on the same machine within the same minute, 30 seconds each at a 12ms hold, so the comparison is paired rather than taken against a remembered baseline. `measure`: 2004 steps, retained heap moving within 20.15–21.08 MB, falling as often as rising, drifting 131 KB in total from its warm floor — 0.065 KB per step. `leak`: 2005 steps, retained heap rising strictly monotonically at every one of 15 samples from 21.97 MB to 43.52 MB, drifting 22,059 KB — 11.0 KB per step, 169 times the clean run. One signal node was live at every sample in both. The longer 150-second run recorded in the evidence line held the same shape over 9,902 steps.

`bun run --cwd packages/view-present test:browser` in isolation, repeatedly during development, including five consecutive runs of the instrument case to confirm the quiescence loop is deterministic where the `requestAnimationFrame` version was not.

### Outstanding concerns

The elapsed-time half is not gated, and a leak driven by elapsed time rather than by cycle count would therefore reach a release unnoticed. This was decided deliberately rather than deferred for convenience: a memory budget wide enough to survive a loaded machine cannot catch a slow leak, and a budget tight enough to catch one goes red on an unrelated commit and is then widened until it is the first kind. Recorded as a `Gaps` bullet on the specification rather than shipped as a threshold that cannot fail. Gating it would need a machine-independent instrument — a forced-collection heap delta under `--expose-gc` with a per-step rather than per-run budget is the shape to try — and that is a separate item, not a tightening of this one.

Uninterrupted playback does not exercise a step timeout's cleanup, because the timeout has always already fired by the time the effect re-runs. The cleanup is real and is covered, but by the steering case only. Anyone reading the sustained case as the guard on that line will be wrong.

The profile's absolute numbers are machine-dependent and this machine had other agents active throughout. That is why the claim rests on a paired same-minute comparison and on a ratio, not on either run's absolute band; the ratio between clean and leaking is nearly three orders of magnitude and no plausible contention accounts for it.

`self:unused:verify` is red, and was already red: `packages/view-studio/src/app/panels/ThemeStrip.tsx` is an unused file and `apps/site/src/routes.ts` and `apps/site/src/VisualGuide.tsx` each carry an unused export. None of the five files this item adds is flagged, and the built `packages/view-present/dist` contains no test or environment artefact. It sits outside `self:check`, so it is left alone rather than fixed here.

`self:boundaries:verify` is green in the gate runs above and is not cited as evidence for anything here, because it reports `0 modules, 0 dependencies cruised` and so cannot have checked this change. That is `INFOSCHEMATICS-TOOL-074`.

### Post-change review

No visual treatment changed, so there is no rendered comparison to make. What was looked at instead is the live page during the real-time profile, which is the only part of this work that observes a running Present at all: across every sample of both a clean and a deliberately leaking 30-second run, exactly one `.infoschematic-flow-signal` node was live in the document while the Sequence advanced through more than two thousand steps. Signal nodes are minted per Scene entry and retired on a timer, so that count staying at one while the step ordinal climbed past 2000 is the DOM-level statement of the same boundedness the counts assert, seen rather than inferred.

The step ordinal itself is read out of the occurrence key — `derivePresentation` names each one `present-scene-N` from a monotonic counter — after an earlier version that accumulated keys seen at each sample undercounted by two orders of magnitude, reporting a few dozen steps for a run that had taken thousands. A profile reporting the wrong step count would have divided its drift by the wrong denominator.

### Mini recap

The measurement says playback is bounded, and the reason to believe it is that every assertion was watched failing first. Three independent statements now hold it: the page's pending-timer and signal counts under fake timers, absolutely and not merely flatly; the `seen` set at the module that owns it, where growth would be invisible from the page; and a Chromium heap profile validated against a deliberate leak. The genuinely hard part was not the leak hunt — there was no leak — but building instruments that could report one, since the first attempt at each of the three was a false green: a single frame flush that was nondeterministic, a flatness assertion that accepted a constant offset, and a `performance.memory` reading that was identical to the last digit whether 24 MB was retained or not.

## Discussion

### Whether an unreproduced failure should hold a requirement divergent

The observation was serious enough to record and never serious enough to chase. Shaping should decide whether a requirement stays divergent on an unreproduced report, or whether the honest state is pending until someone measures — the two say different things about how much is known, and only one of them says nobody has looked.

### Whether fake timers can see what the failure was

Fake timers collapse elapsed time, so they measure accumulation driven by cycle count: timers, keys, retained references. The original failure came from repeated demo cycles running in real time, where anything driven by elapsed time rather than by steps — retained paint, animation nodes, a renderer's own caches — would also be in play. A flat pending-timer count under fake timers could therefore be a green that does not contradict the anecdote at all. If that is the case, the fake-timer assertion is a regression guard and the browser profile is the actual measurement, and `SCENE-006` should be worded to say which of the two its conformance rests on.
