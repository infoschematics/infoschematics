---
id: INFOSCHEMATICS-TOOL-092
area: TOOL
title: What paces an ordered cascade in an untimed Sequence
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-023]
baseline_ref: null
created_at: 2026-09-18T03:50:00Z
updated_at: 2026-09-18T03:50:00Z
---

# What paces an ordered cascade in an untimed Sequence

## Goal

Settle whether an ordered cascade — one Dynamic playing after another in an authored order — is admissible at all, and what paces it when the presentation has no clock.

## Context

Split out of `INFOSCHEMATICS-TOOL-023` on 2026-09-18 rather than shaped into it. That record's Goal originally named four playback statements; the owner's decision gave it two, `once` and `repeat`, and left a cascade out of scope because nothing in the tree answers what a cascade divides.

The difficulty is specific, not a gap in effort. `packages/view-model/src/runtime.ts:381` gives every runtime Scene a `hold`, defaulting to `defaultSceneDuration` at `:131`, so a number always exists. In an untimed Sequence (`presentation.timed: false`, `docs/specs/scenes-and-callouts.md:55-63`) that number is fiction: the Scene stays on screen until the presenter steps, which may be one second or ten minutes. Dividing a nominal hold across stages in a manually driven Scene either finishes before the presenter has finished speaking or waits for a step that may never come.

`DYNAMIC-001` (`docs/specs/diagram-dynamics.md:15`) forbids a declaration from carrying duration, easing or a timer, so a staged cue cannot buy its way out by authoring milliseconds. Any answer has to name a pacing source that is not authored time: the presenter's own steps, a receipt from the previous stage, or a decision that a cascade belongs only to a timed Sequence.

## Boundary

This is a decision item, not an implementation. It does not add a cue field, change `once` or `repeat` as `INFOSCHEMATICS-TOOL-023` delivers them, or introduce authored timing anywhere.

## Steps

1. [ ] Put the three candidate pacing sources to the owner: presenter-stepped stages, receipt-driven stages, or cascade admitted only in a timed Sequence.
2. [ ] Record the answer as an amendment to `ADR-INFOSCHEMATICS-026` or a companion record, naming its consequence for `DYNAMIC-001` and `SIGNAL-003`.
3. [ ] Capture the implementation item that follows, or close this one as decided-against.

## Files touched

- `docs/decisions/ADR-INFOSCHEMATICS-026-name-dynamics-in-the-document.md`, `docs/decisions/README.md`
- `docs/specs/diagram-dynamics.md`, `docs/specs/scenes-and-callouts.md` — only if the answer changes what a declaration may carry
