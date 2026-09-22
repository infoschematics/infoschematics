---
id: INFOSCHEMATICS-TOOL-126
area: TOOL
title: Emphasis for a Point
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T12:10:00Z
updated_at: 2026-09-22T19:40:00Z
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

## Current state

Nothing on `main` outsets an emphasis treatment around a Point. `packages/view-model/src/perimeter.ts` has no radius for one, and neither renderer resolves a Point as an emphasis target, so a document may name a Point in an `emphasise-elements` Dynamic, validate, and produce no visible change when the occurrence fires. `ADR-INFOSCHEMATICS-031` made a Point a sixth artefact kind and `ADR-INFOSCHEMATICS-026` requires every Dynamic kind to reach whatever the renderer actually drew, so this is a gap against both.

The work exists off `main`. The worktree at `.claude/worktrees/agent-abd13720a30e3e0ad`, on branch `worktree-agent-abd13720a30e3e0ad`, carries `e5709216` and `8f288a52` — `emphasisPointRadius` in `perimeter.ts` and a Point resolved in `Canvas.tsx`, `InfoschematicDiagram.tsx` and `render-svg/src/index.ts`, plus a View Canvas browser test. That branch has not moved since 2026-09-16 and its base is 91 commits behind `main`: the Region label layer has rewritten the same part of `render-svg/src/index.ts` and `InfoschematicDiagram.tsx`, and the colour-scheme work moved the tokens underneath `perimeter.ts`. It also holds three uncommitted files belonging to that writer, including an edit to `scripts/visual-treatment-parity.test.ts`.

## Steps

- [ ] Ask the owner what to do with the three uncommitted files in that worktree before touching it. They belong to another writer and are not this record's to discard.
- [ ] Read the two commits as a statement of intent and decide whether to cherry-pick or rewrite against current `main`. Given 91 commits of divergence across exactly the files they touch, expect a rewrite; the branch is a reference, not a change to replay.
- [ ] Give a Point an emphasis perimeter in `packages/view-model/src/perimeter.ts`, so both outlets read one geometry.
- [ ] Resolve a Point as an emphasis target in the interactive Diagram and in static output, so a Dynamic that names one marks it the way naming a Card or a Region does.
- [ ] Honour the reduced-motion and accessible-announcement obligations every Dynamic kind already owes under `ADR-INFOSCHEMATICS-026`, asking the runner for the preference through the browser command rather than reading the rule out of the stylesheet.
- [ ] Extend the visual-treatment parity task so the two outlets cannot drift on it.
- [ ] Remove the stale worktree and branch once the behaviour is on `main` and the uncommitted files are dispositioned.

## Files touched

`packages/view-model/src/perimeter.ts` and its tests; `packages/view-canvas/src/Canvas.tsx` and `InfoschematicDiagram.tsx`; `packages/render-svg/src/index.ts`; `scripts/visual-treatment-parity.test.ts`; a View Canvas browser test; `docs/specs/diagram-dynamics.md`.

## Verify

`bun run self:check`, with a browser test asserting the emphasis reaches a Point and a reduced-motion case taken through the `emulateColourScheme`-style browser command rather than from the stylesheet. Per `AGENTS.md`, capture the marked Point from a real browser into `reports/` — an emphasis outset around a disc is precisely the treatment a passing assertion says nothing about.

## Dependencies / blocks

Nothing blocks it and it blocks nothing. It is independent of `INFOSCHEMATICS-TOOL-121`, though both end at the same parity task.

## Documentation impact

### Decision Records

None. `ADR-INFOSCHEMATICS-026` already requires this; delivering it is conformance, not a new decision.

### Specifications

`docs/specs/diagram-dynamics.md` states that `emphasise-elements` reaches a Point, with its verification and evidence, so the gap cannot reopen silently.

### Guides

None. An author naming a Point in a Dynamic already expects it to be marked.

### Roadmap

Nothing follows. The worktree hygiene question — stranded agent branches being invisible to anyone reading `main` — is worth a separate record if it recurs.

## Discussion

Captured on 2026-09-22 while taking stock before a pause, by reading the worktree list rather than by finding the defect in the product. That is the point of the record: the work was invisible to anyone reading `main`, and a branch nobody names is indistinguishable from work that was never done.

The uncommitted files in that worktree belong to another writer and are untouched. Landing this means deciding what to do with them too — they are not this record's to discard.

### Adoption

Adopted into Now on 2026-09-22 while shaping the queue before a pause. The disposition of the other writer's three uncommitted files is a question for the owner and is the first step, not a detail of delivery.
