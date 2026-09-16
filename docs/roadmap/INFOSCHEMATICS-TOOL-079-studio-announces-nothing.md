---
id: INFOSCHEMATICS-TOOL-079
area: TOOL
title: Studio announces nothing
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: 00c067a113f38e84959d8eb0ce71358f092672e5
created_at: 2026-09-16T15:30:00Z
updated_at: 2026-09-16T16:49:00Z
---

# Studio announces nothing

## Goal

Give the Studio surface the accessible announcement its renderers already compose, so a Flow signal or a Diagram Dynamic rehearsed in Studio is reported to assistive technology as it is in Present.

## Context

Reported by the delivery of held element emphasis (`INFOSCHEMATICS-TOOL-059`) and confirmed independently on 2026-09-16. `packages/view-canvas/src/Canvas.tsx:203` and `:218` hold the two `role="status"` live regions that announce a signal or an emphasis. Studio does not mount `Canvas`: `packages/view-studio/src/app/App.tsx:1034` mounts `InfoschematicDiagram` directly. So Studio has no live region in any mode, and rehearsing a Dynamic there announces nothing.

This is wider than the item that found it. It is not specific to held emphasis, or to Dynamics — a Flow signal rehearsed in Studio is equally silent, and has been for as long as Studio has mounted the Diagram directly. `packages/view-present/src/SceneCallout.tsx:164` and `packages/view-studio/src/app/panels/SceneCallout.tsx:189` each carry their own `role="status"` for Callout text, which is why the absence is easy to miss: Studio does announce something, just never the thing a renderer composed.

The accessible obligation is owned by `ADR-INFOSCHEMATICS-026`, which placed it on the Dynamic kind list, and `ADR-INFOSCHEMATICS-029` extended it to `depicts: state`. Both are satisfied by the renderer and defeated by the host.

## Boundary

The announcement path from renderer to Studio's page. Not the wording of announcements, not Callout announcement, and not a change to what `Canvas` composes.

## Steps

1. [ ] Establish where the obligation belongs: whether the live region is `InfoschematicDiagram`'s to render, so any host gets it by mounting the Diagram, or `Canvas`'s to keep with Studio composing its own. The first makes it impossible for a host to omit; the second keeps the Diagram free of page-level furniture. Verifiable by the reasoning being written where a future host author reads it, and by which package the change lands in.
2. [ ] Make the case that would have caught this, before fixing it: assert that the Studio surface reports a rehearsed Flow signal and a rehearsed Dynamic to assistive technology. Verifiable by that case failing against today's tree.
3. [ ] Deliver step 1's answer, and confirm Present's existing announcement is unchanged rather than duplicated — two live regions reporting the same event is its own defect.
4. [ ] Check the remaining hosts. `apps/site` mounts Canvas and Studio both, and an inline Canvas in a documentation page is a third case.
5. [ ] State the host obligation in `docs/specs/` beside whichever requirement owns accessible naming for Dynamics, so a host that mounts the Diagram directly is told what it still owes.

## Files touched

- `packages/view-canvas/src/Canvas.tsx` and `InfoschematicDiagram.tsx`, depending on step 1
- `packages/view-studio/src/app/App.tsx`
- `packages/view-studio/src/app/App.browser.test.tsx`
- `docs/specs/diagram-dynamics.md`, and possibly `docs/specs/flow-signals.md`

## Verify

- The new Studio case fails on today's tree and passes after.
- Present's announcement is asserted unchanged, and no surface announces twice.
- `bun run self:check`.

## Dependencies / blocks

None. Independent of the emphasis work that found it.

## Discussion

Worth noting how it stayed hidden: every announcement assertion in the suite runs against `Canvas` or against `Present`, both of which compose the live region, so the announcement contract is thoroughly tested — in the two hosts that satisfy it. Studio's browser suite asserts plenty about Studio, but never that it announces, because nothing in Studio was ever written to. A contract tested only where it holds is the same shape as the checks collected in `INFOSCHEMATICS-TOOL-074` and `INFOSCHEMATICS-TOOL-078`.
