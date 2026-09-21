---
id: INFOSCHEMATICS-TOOL-111
area: TOOL
title: A route doubling back
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 2bb93074089bda6dbbca0c3d6707ad99c7e68074
created_at: 2026-09-21T18:15:00Z
updated_at: 2026-09-21T23:55:00Z
---

# A route doubling back

## Goal

A derived route reaches its target without running back over the Card it left, or over its own arrowhead.

## Context

Reported on 2026-09-21 as part of the node-dragging defects: dragging a Card past the one it feeds drew the Flow back across the Card it came from.

`routeBetweenPorts` is the first route a line gets when nobody has drawn one, and — since `INFOSCHEMATICS-TOOL-110` — the route a waypointless Flow is derived into whenever a port moves. So the shape it makes is what a Producer sees throughout a drag, not only at creation.

## Boundary

The construction of a route between two ports. It does not change the clearance a route takes before it turns, what a Producer may draw by hand, or how an authored route is repaired.

## Current state

The construction always turned once, on the axis the leaving run was already travelling: `corner = out.dx !== 0 ? { x: arrive.x, y: left.y } : { x: left.x, y: arrive.y }`. Where the arriving stub is ahead of the leaving direction that is a plain dog-leg, which is what a reader would draw. Where it is behind — which dragging a Card past its target puts it — that same corner sends the run straight back along the axis it has just left, across the Card it came from and over its own arrowhead.

## Steps

- [x] Ask whether the arriving stub is ahead of or behind the direction the source port faces.
- [x] Keep the single corner where it is ahead.
- [x] Turn twice on a lane midway between the two stubs where it is behind, mirrored for vertical ports.
- [x] Keep the whole list normalised, so a straight run still collapses to two points.
- [x] Cover ahead, collapsed straight, behind horizontal and behind vertical, asserting orthogonality in each.
- [x] State the rule in `ROUTE-002`.

## Files touched

- `packages/view-model/src/routing.ts` — `routeBetweenPorts`
- `packages/view-model/src/routing.test.ts` — routing between two ports
- `packages/view-model/src/artefact-draft.test.ts` — the Adapter case, which is itself a doubling-back route
- `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx`
- `docs/specs/routing-and-placement.md` — `ROUTE-002`

## Verify

`bun run self:check`. Then in Design drag a Card to the far side of the Card it feeds: the Flow steps off both ports by the front and crosses between them on a lane, rather than running back over the Card it leaves. Falsified by a route whose first run reverses along the axis it just travelled.

## Dependencies / blocks

None. Reaches further because of `INFOSCHEMATICS-TOOL-110`, which made this construction the one a moved Flow is derived into.

## Documentation impact

### Decision Records

None.

### Specifications

`ROUTE-002` gains one sentence: a derived route MUST NOT double back across the component it leaves, and where the arriving port lies behind the direction the source port faces the construction MUST turn twice, on a lane between the two ports.

### Guides

None.

### Roadmap

`docs/roadmap/_ISSUES.md` reserves `TOOL` through `112`.

## Review

### Delivered

Every Step, within the stated Boundary. Baseline `2bb93074089bda6dbbca0c3d6707ad99c7e68074`, delivered in `2c01cdd0` together with `INFOSCHEMATICS-TOOL-110`.

### Summary of changes

`routeBetweenPorts` computes `ahead` from the sign of the distance between the two stubs along the leaving axis. Ahead keeps the one corner. Behind places two corners on a lane midway between the stubs, which leaves both cards by the front and crosses neither. `normaliseRoute` still runs over the whole list, so two ports that line up still give a straight run of two points.

### Verification

`bun run self:check` — green, 48 tasks. Four cases added: ahead, collapsed straight, behind horizontal, behind vertical, each asserting every run is orthogonal.

### Outstanding concerns

The lane is the midpoint between the two stubs and knows nothing about what it crosses: it clears the two cards at the ends of the route, and may still run through a third element between them. Routing around other elements is not what this construction does, and a Producer who wants a particular path still draws one.

### Post-change review

The defect was only visible because a derived route now follows a drag, which is `INFOSCHEMATICS-TOOL-110`'s doing. The two are independent in cause but were found together, and they land together.

### Mini recap

A route derived between two ports always turned once, which sent it backwards across its own Card whenever the target sat behind the port it left by. It now turns twice on a lane between the two, and keeps the single corner otherwise.

## Done

Closed 2026-09-21 under the standing instruction to progress every record that is not `waiting-for` or `parked`. Awaiting the reporter's own testing pass.

## Discussion

Raised with `INFOSCHEMATICS-TOOL-108`, `-109` and `-110` from the same dragging session, and made visible by `-110`. The defect predates the drag work — the first line of a route nobody had drawn by hand was simply never looked at — which is why it is its own item rather than a regression in `-110`.
