---
id: INFOSCHEMATICS-TOOL-126
area: TOOL
title: Emphasis for a Point
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T12:10:00Z
updated_at: 2026-09-22T12:10:00Z
---

# Emphasis for a Point

## Goal

An `emphasise-elements` [Diagram Dynamic](../reference/vocabulary.md#diagram-dynamic) that names a [Point](../reference/vocabulary.md#point) marks it, in both renderers, the way naming a Card or a Region marks those.

## Context

`ADR-INFOSCHEMATICS-031` made a Point a sixth artefact kind, and `ADR-INFOSCHEMATICS-026` requires every Dynamic kind to reach whatever the renderer actually drew. A Point is drawn — a disc, in both outlets — but nothing on `main` outsets an emphasis treatment around it: `packages/view-model/src/perimeter.ts` has no radius for one, and neither renderer resolves a Point as an emphasis target. So a document may name a Point in a Dynamic, validate, and produce no visible change when the occurrence fires.

The work exists and is not on `main`. A worktree at `.claude/worktrees/agent-abd13720a30e3e0ad`, on branch `worktree-agent-abd13720a30e3e0ad`, carries two commits — `e5709216` "fix(dynamics): mark a Point a Dynamic names" and `8f288a52` its `view-canvas` browser test — adding `emphasisPointRadius` to `perimeter.ts` and resolving a Point in `Canvas.tsx`, `InfoschematicDiagram.tsx` and `render-svg/src/index.ts`. It also holds three uncommitted files belonging to that writer, including an edit to `scripts/visual-treatment-parity.test.ts`.

That branch has not moved since 2026-09-16 and its base is now **91 commits** behind `main`. Every file it touches has changed since: the Region label layer rewrote the same part of `render-svg/src/index.ts` and `InfoschematicDiagram.tsx`, and the colour-scheme work moved the tokens underneath `perimeter.ts`. A merge is therefore a real reconciliation, not a fast-forward, and the stale branch is worth treating as a reference for the intent rather than as a change to replay.

## Boundary

The behaviour is the deliverable: a Point that is named by a Dynamic reads as marked, in the interactive Diagram and in static output, with the reduced-motion and accessible obligations every kind already owes under `ADR-INFOSCHEMATICS-026`. Whether the stranded commits are merged, cherry-picked, or rewritten against current `main` is an implementation choice, not the goal.

It does not add a Dynamic kind, change the finite vocabulary, or make a Point emphasis-only: the same occurrence shape serves it.

## Discussion

Captured on 2026-09-22 while taking stock before a pause, by reading the worktree list rather than by finding the defect in the product. That is the point of the record: the work was invisible to anyone reading `main`, and a branch nobody names is indistinguishable from work that was never done.

The uncommitted files in that worktree belong to another writer and are untouched. Landing this means deciding what to do with them too — they are not this record's to discard.
