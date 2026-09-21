---
id: INFOSCHEMATICS-TOOL-110
area: TOOL
title: One route derived twice
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 2bb93074089bda6dbbca0c3d6707ad99c7e68074
created_at: 2026-09-21T18:15:00Z
updated_at: 2026-09-21T23:55:00Z
---

# One route derived twice

## Goal

A Flow attached to a dragged Card is drawn the same way while the drag is in hand as it is once the drag is accepted.

## Context

Reported on 2026-09-21 as part of the node-dragging defects. `ROUTE-002` already requires that every derivation of a route reach one construction, and `INFOSCHEMATICS-TOOL-102` brought the runtime overlay to it. The draft document — the config the artefact operations are applied to, which the preview renders and the projection writes from — was never brought with it.

## Boundary

How a Flow end moves when the component it is attached to moves. It does not change how a Producer drags a route end by hand, what is written to the document, or which Flows are written at all.

## Current state

`artefact-draft.ts` moved every attached Flow end through `moveRouteEnd`, which inserts a corner against the anchored far end. For a Flow with waypoints that is right — the waypoints are a shape someone drew, and only the run beside the moved port may be repaired. For a Flow with none it is wrong: its two ports are all the document says, nothing writes a derived route back, and the corner leaves a run arriving sideways into a port that the committed document does not have.

`runtime.ts` had the rule and stated it inline; `document-operations.ts` skips writing a waypointless route for the same reason and named `moveRouteEnd` in its comment.

## Steps

- [x] Put the rule in one function in the View Model, taking both ends at once, since both can move together.
- [x] Move the draft document's Flow ends through it.
- [x] Move the draft overlay's Flow ends through it, replacing the inline copy.
- [x] Cover the derived case, the both-ends case, the waypointed case and the no-move case.
- [x] Update the four draft cases and the render cases that pinned the old construction.
- [x] Name the shared construction in `ROUTE-002`'s evidence and in the projection's comments.

## Files touched

- `packages/view-model/src/routing.ts` — `moveRouteEnds`
- `packages/view-model/src/artefact-draft.ts` — `moveAttachedFlowEnds`, `movePointFlowEnds`
- `packages/view-model/src/runtime.ts` — `flowsAfterMoves`
- `packages/view-model/src/routing.test.ts`, `packages/view-model/src/artefact-draft.test.ts`
- `packages/view-canvas/src/InfoschematicDiagram.preview.test.tsx`, `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx`
- `packages/view-studio/src/app/editor/document-operations.ts` — comments only
- `docs/specs/routing-and-placement.md` — `ROUTE-002` evidence

## Verify

`bun run self:check`. Then in Design drag a Card carrying a Flow that has no waypoints: the route leaves and arrives square to both ports while the drag is in hand, and accepting the change draws the same route rather than a second answer. Then give a Flow an interior waypoint and drag the same Card: the waypoint stays where it was authored.

## Dependencies / blocks

None. Extends `INFOSCHEMATICS-TOOL-102`'s rule to the path it did not reach.

## Documentation impact

### Decision Records

None.

### Specifications

`ROUTE-002` needed no new requirement — it already says every derivation must reach one construction. Its `_Evidence:_` now names `moveRouteEnds` as the construction both paths move an end through.

### Guides

None.

### Roadmap

`docs/roadmap/_ISSUES.md` reserves `TOOL` through `112`.

## Review

### Delivered

Every Step, within the stated Boundary. Baseline `2bb93074089bda6dbbca0c3d6707ad99c7e68074`, delivered in `2c01cdd0` together with `INFOSCHEMATICS-TOOL-111`.

### Summary of changes

`moveRouteEnds` takes a route, its two port sides and an offset for either end. A two-point route is derived again through `routeBetweenPorts` from the moved ports; anything longer keeps every point and has each moved end repaired by `moveRouteEnd`. Both ends are given at once because a Flow whose ends are on the same Card, or on two Cards dragged as a group, must be derived once from both new ports rather than twice.

The two commits are one because the test values move with both changes: the Adapter case in `artefact-draft.test.ts` is itself a route that doubles back, so it could not be written once and left alone.

### Verification

`bun run self:check` — green, 48 tasks. Four cases added for `moveRouteEnds`; four draft cases, one preview case and four browser route assertions updated, because the new ends sit exactly on their ports where the old ones did not.

### Outstanding concerns

A derived route is now longer in points than it was: where the old bend gave three points, the construction gives four or six. Nothing is written to the document, so this is drawing cost rather than authored weight, but a diagram with many derived Flows draws more segments per frame than it did.

### Post-change review

The rule was already written and already decided; what was missing was one place to state it. Two callers now read the same function, and the third — the projection that declines to write a derived route — names it in its reasoning.

### Mini recap

The draft document bent a derived route where the runtime re-derived it, so a drag showed one route and accepting it drew another. `moveRouteEnds` is now the single construction both move a Flow end through.

## Done

Closed 2026-09-21 under the standing instruction to progress every record that is not `waiting-for` or `parked`. Awaiting the reporter's own testing pass.

## Discussion

Raised with `INFOSCHEMATICS-TOOL-108`, `-109` and `-111` from the same dragging session. This is where the draft document's derivation and the written document's stopped agreeing: `ROUTE-002` requires one construction for every derivation, and the runtime overlay was brought to it while the draft was not. It also exposed `-111`, because deriving a waypointless Flow whenever a port moves makes the shape `routeBetweenPorts` produces visible throughout a drag rather than only at creation.
