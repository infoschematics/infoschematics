---
id: INFOSCHEMATICS-TOOL-102
area: TOOL
title: Move without breaking
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 70f9474c35a5419b4edef88147ab78a2658bd592
created_at: 2026-09-19T13:06:00Z
updated_at: 2026-09-19T13:40:00Z
---

# Move without breaking

## Goal

Let a Producer move a component attached to a Flow with waypoints without taking the view down. A move that the draft overlay drew correctly must still draw correctly once it is accepted.

## Context

Found by user-acceptance testing on 2026-09-19, last item of the 12:10 recording, verbatim: _"So go back to edit mode again, try to move the router, it breaks. Realistically speaking, whilst this is a good thing to do, we need to make it so that it works. Yeah? You should be able to move things around and not break things like this."_

The frame at t129 shows the Playground replaced by an error surface reading _"The Playground could not be drawn — a route may not run diagonally: 1200,880 to 1560,900"_. That string comes from `routePath` in `packages/view-model/src/geometry.ts:45`, which rejects a non-orthogonal run.

The sequence is: a Flow carries authored waypoints; a Producer drags a component at one end; the drag is committed; the commit rewrites the component's placement and leaves the Flow's authored waypoints untouched, which is correct and deliberate — a waypointed route is a shape someone drew. Rebuilding `[port, ...waypoints, port]` from the moved component then produces a run between the moved port and the first authored waypoint that is neither horizontal nor vertical, and `routePath` throws on it.

It throws inside the host's `useMemo`, so it is not a route that fails to draw — it is a render that fails, and the whole view goes with it.

The asymmetry that makes this a defect rather than a limit: the draft path already repaired this. `moveRouteEnd` leans the neighbouring point onto the moved end's axis or inserts a corner, so while the drag is in hand the route is drawn correctly. Only the committed path was unrepaired, which is why the view looks right until the moment the Producer lets go.

## Boundary

This is about the one run between a port and the authored point beside it, when reading a document back. It does not re-route an authored Flow: every waypoint stays exactly where it was authored, and a route whose ends are already square is returned unchanged. It does not change `routePath`'s rejection of diagonals, which is the check that caught this. It does not change the host's error surface or make a render failure survivable — that is worth doing and is not this item. It does not address a Flow attached to an Adapter resolving against a stale box, which is `INFOSCHEMATICS-TOOL-099`.

## Current state

`createInfoschematicRuntime`'s flow assembly branched on whether the Flow carried waypoints. With none, it derived the route through `routeBetweenPorts`, the shared construction `ROUTE-002` requires. With waypoints, it built `[portAt(source), ...waypoints, portAt(target)]` and handed that straight on, under a comment saying a route with waypoints is a shape someone drew and is taken as it stands.

That is right about the waypoints and wrong about the ends. The authored document was consistent when it was authored; a move makes the port move and the waypoint stay, and nothing between the two reconciled them.

## Steps

- [x] Add a construction that reconnects a run reaching a port while leaving every authored point where it was placed.
- [x] Use it on both ends of the waypointed branch when reading a document back.
- [x] Prove it with runtime cases: a moved component whose route still draws, and the waypoints unmoved by the repair.
- [x] State the rule in `ROUTE-002`, which already governs how a route reaches a port.

## Files touched

- `packages/view-model/src/routing.ts` — `joinedToPort`
- `packages/view-model/src/runtime.ts` — the waypointed branch of flow assembly
- `packages/view-model/src/runtime.test.ts`
- `packages/cli/src/index.test.ts` — expected diagnostic
- `docs/specs/routing-and-placement.md` — `ROUTE-002`

## Verify

`bun run self:check`, then open the playground, enter Design, drag a component attached to a Flow that carries waypoints, and release: the view stays up, the route is drawn as the draft drew it, and the interior waypoints are where they were.

## Dependencies / blocks

None. `INFOSCHEMATICS-TOOL-099` touches the same function; the two are independent.

## Documentation impact

### Decision Records

None. `ROUTE-002` already states that every derivation of a route must reach one construction and that a bend is introduced rather than an endpoint moved; this extends that statement to the waypointed case rather than deciding something new.

### Specifications

`ROUTE-002` extended in `docs/specs/routing-and-placement.md` with the waypointed case: authored waypoints stay where they were, only the run reaching a port may be repaired, and a committed move must draw the route the draft showed rather than a diagonal. Its Verify line gains the move-and-accept case and its Evidence cites `joinedToPort`.

### Guides

None.

### Roadmap

None. The host's inability to survive a render failure is a real finding and is deliberately not raised from this evidence — the recording shows it as a consequence, and it should be raised from a look at the error surface rather than inferred here.

## Review

### Delivered

Every Step, within the stated Boundary. Baseline `70f9474c35a5419b4edef88147ab78a2658bd592`.

### Summary of changes

`joinedToPort(end, port, points)` in `routing.ts` returns the points unchanged when the terminal run is already square. Otherwise it leans the interior neighbour onto the port's axis — horizontal for an `E` or `W` port, vertical otherwise — but only where the leaned point keeps the next run orthogonal; where it would not, it inserts a bend instead and moves nothing that was authored. The terminal point itself is never moved, so the route still reaches the port the document names.

`runtime.ts` wraps the waypointed assembly in `joinedToPort` at both ends, and the comment above the branch now says what is preserved and what is repaired, replacing the sentence that claimed the whole route is taken as it stands.

One expected diagnostic changed in `packages/cli/src/index.test.ts`, and the change is the behaviour working rather than a test being appeased. The fixture's route ran out of a port diagonally and also ran diagonally between two authored waypoints. The model now repairs the first — the port moves, the authored waypoint does not — so the pair the message names is the one between the two authored waypoints, which is the stretch the author actually drew and did not draw squarely. The comment in the test records that reasoning.

### Verification

`bun run self:check` — green, 48 tasks. `packages/view-model` 198 cases and `packages/cli` 34 cases, green.

The runtime cases are constructed so the repair is observable in both directions: one asserts the route draws at all after a move that previously threw, the other asserts the interior waypoints are at their authored coordinates afterwards. A repair that moved the waypoints would pass the first and fail the second.

### Outstanding concerns

None blocking.

Worth stating plainly: this repairs the drawing, not the document. The authored waypoints still describe a shape that no longer quite fits the components around it, and a Producer who moves a component a long way will see a route that is orthogonal and ugly rather than one that is wrong. That is the correct trade under `ROUTE-002` — re-routing an authored shape without being asked would discard a Producer's work — but it means "the route looks odd after a big move" is expected behaviour and not a bug report against this item.

### Post-change review

The Goal is met: the crash the recording shows cannot occur from this path, because the only run a move can invalidate is now reconciled before `routePath` sees it.

Regression risk is bounded by the early return: a document whose routes are already square goes through `joinedToPort` unchanged, which is why the existing route suites needed no amendment. The one behaviour change outside that is the CLI diagnostic, which now names a different pair — and names a better one.

The wider risk is the asymmetry this exposes rather than the one it fixes: the draft path and the read-back path were each correct on their own and disagreed about the same route, and that disagreement was invisible until it threw. Both now go through constructions in `routing.ts`, which is where a future divergence would be visible.

### Mini recap

Moving a component attached to a waypointed Flow rewrote the component and left the waypoints, producing a diagonal run into the port; `routePath` threw inside the host's `useMemo` and took the whole view down. The draft overlay had always repaired that run; the committed path had not. `joinedToPort` now makes the same repair when a document is read back, leaving every authored waypoint where it was. `ROUTE-002` states the rule, and a CLI diagnostic now names the diagonal the author actually drew.

## Done

Accepted 2026-09-19 by Kris Brown on the review packet above.

## Discussion

### Why repair rather than re-route

Re-routing the whole Flow through `routeBetweenPorts` would have fixed the crash in one line and thrown away the shape the Producer drew. The waypoints are the authored content here; the run into the port is derived from a port position that just changed. Repairing only the derived part is the smallest change that keeps both the drawing valid and the authorship intact.

### Why leaning is preferred to bending

Leaning the neighbouring point onto the port's axis keeps the point count the same and usually keeps the route looking like what was drawn. It is only safe where the next run stays orthogonal, which is why `joinedToPort` checks the point beyond the neighbour before leaning and falls back to inserting a bend. The fallback never moves an authored point; it adds one.

### Why a crash and not a blank Flow

`routePath` throws rather than returning an empty path, and the call sits inside the memo the host renders from, so one unrenderable Flow is one unrenderable Diagram. That is a design worth revisiting — a route that cannot be drawn is a defect in one element, not in the document — but the fix for it is a change to how the host isolates failure, and making the model stop producing the impossible route is the change that belongs here.
