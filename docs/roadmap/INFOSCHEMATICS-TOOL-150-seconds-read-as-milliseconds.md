---
id: INFOSCHEMATICS-TOOL-150
area: TOOL
title: Seconds read as milliseconds
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-10-04T21:08:00Z
updated_at: 2026-10-04T21:08:00Z
---

# Seconds read as milliseconds

## Goal

A timed Scene holds for the `duration` its document authors, in the seconds the contract documents, so a timed Story is watchable rather than spinning through its Scenes many times a second.

## Context

The published schema describes a Scene's `duration` as "How long this Scene holds, in seconds, when the Sequence is timed" (`packages/domain-core/schema/infoschematic.schema.json`), and both `examples/is-showcase` and `examples/is-infoschematics` author whole seconds (`duration: 4` to `6`). The runtime copies the authored number straight into a Scene's `hold` (`packages/view-model/src/runtime.ts`, `hold: scene.duration ?? defaultSceneDuration`), where `defaultSceneDuration` is `3100` and the timers in `packages/view-studio/src/app/App.tsx` and `packages/view-present/src/Present.tsx` pass `hold` (divided by the stage count through `cueStageHold`) to `window.setTimeout` as milliseconds. `SceneListPanel.tsx` also reads `hold` as milliseconds when it shows seconds. An authored `duration: 4` therefore holds for four milliseconds.

Measured on 2026-10-04 in the Playground's Benchmark preset while delivering [INFOSCHEMATICS-TOOL-142](https://github.com/infoschematics/infoschematics/blob/38d882f9f7ed9ce974ee5f5406ddceaaae41e30b/docs/roadmap/INFOSCHEMATICS-TOOL-142-a-showcase-without-points.md), against the unmodified baseline document as well as the changed one: entering any Scene of `STORY-01` from the Sequences rail cycled `SCENE-01` -> `SCENE-02` -> `SCENE-03` about fifteen times a second, remounted the Diagram SVG around 90 times in two seconds, and restarted every cued emphasis before its 900 ms finite fade could play. A held state still shows, because its breath never reaches zero opacity, which is why the spin is easy to miss. Holding auto-advance (Space) stops it, and a finite emphasis then plays to completion. The probe that measured it is `scripts/probes/TOOL-142-point-emphasis.ts`.

## Boundary

The unit of an authored Scene `duration` as the runtime reads it, in Studio's Present surface and in Present, and whatever editor reads or writes it back. Whether the runtime converts at the document boundary or the contract changes its documented unit is the decision to shape; the documented unit and the authored examples both say seconds. It does not change cue staging, the emphasis treatments, or the Story's step controls.

## Discussion

Captured on 2026-10-04 by the agent delivering `INFOSCHEMATICS-TOOL-142`, which needed a real-browser look at a finite emphasis and could only take one by holding the Story still. Not fixed there because it is a runtime change outside that record's boundary, which authors one Dynamic into an example.

Worth checking while shaping: whether any browser or unit test exercises an authored `duration` end to end, since one that had would have caught this, and whether the Studio's Scene editor round-trips a typed hold through the same unit.
