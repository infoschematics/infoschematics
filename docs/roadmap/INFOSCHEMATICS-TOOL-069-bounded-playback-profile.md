---
id: INFOSCHEMATICS-TOOL-069
area: TOOL
title: Bounded playback profile
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-16T09:00:00Z
updated_at: 2026-09-16T09:00:00Z
---

# Bounded playback profile

## Goal

Decide `SCENE-006` on a measurement, so automatic Scene playback is either proved bounded or has a named leak.

## Context

`SCENE-006` requires automatic Scene playback to run repeated cycles without accumulating timers, retained transition state, or memory in proportion to elapsed cycles. It is recorded divergent on a single observation: repeated automated demo cycles produced an out-of-memory failure during a regression review. That observation was never reproduced, never profiled, and never attributed.

Raised while deciding every non-conforming requirement in `INFOSCHEMATICS-TOOL-056`. Reading the code makes the divergence look doubtful — both playback effects clear their timeout on cleanup, and the presentation state holds no collection that grows per cycle — but reading is not the verification the requirement asks for, and a requirement recorded divergent on an anecdote is exactly as unhelpful as one recorded conforming on one.

## Boundary

This item establishes what happens over sustained playback and fixes a leak if it finds one. It does not change playback behaviour, Scene semantics, or the Sequence timing options.

## Current state

- `packages/view-present/src/Present.tsx` and `packages/view-studio/src/app/App.tsx` each hold one `window.setTimeout` for the next automatic step, and each returns a cleanup that clears it.
- `packages/view-present/src/presentation.ts` holds `playing` and a `sceneOccurrence` counter; no field accumulates per cycle.
- The Scene signal path assigns a fresh key per entry and cancels obsolete signals, covered by `packages/view-present/src/presentation.test.ts`.
- No suite runs playback for more than a few steps, and nothing measures pending timers or retained memory.

## Steps

- [ ] Drive a timed Sequence through many cycles under fake timers and assert the pending-timer count stays flat, in a suite that runs in the gate.
- [ ] Take a browser memory profile over the same sustained run, in Chromium, and record the shape of the heap across cycles.
- [ ] If a leak exists, name the retained object and fix it; if none exists, record `SCENE-006` as conforming on the measurement.
- [ ] Decide whether the sustained run belongs in the gate or is a procedure a Producer runs, and say which in the requirement's verification plan.

## Files touched

- `packages/view-studio/src/app/App.browser.test.tsx` or a new browser case beside it
- `docs/specs/scenes-and-callouts.md`
- Whichever module retains the object, if one does

## Verify

The new case fails when a timeout is deliberately left unclaimed by removing an effect cleanup, and passes otherwise. A measurement that cannot fail is not a measurement.

## Dependencies / blocks

None. Found while delivering [Specification evidence integrity](INFOSCHEMATICS-TOOL-056-specification-evidence-integrity.md).

## Documentation impact

### Decision Records

None.

### Specifications

`SCENE-006` gains a verification plan that names the measurement, and a conformance state that rests on it.

### Guides

None.

### Roadmap

None.

## Discussion

### Whether an unreproduced failure should hold a requirement divergent

The observation was serious enough to record and never serious enough to chase. Shaping should decide whether a requirement stays divergent on an unreproduced report, or whether the honest state is pending until someone measures — the two say different things about how much is known, and only one of them says nobody has looked.
