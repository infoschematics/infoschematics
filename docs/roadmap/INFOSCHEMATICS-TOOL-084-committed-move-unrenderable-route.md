---
id: INFOSCHEMATICS-TOOL-084
area: TOOL
title: A committed Card move leaves an unrenderable route
theme: tool
horizon: now
status: done
blocks: [INFOSCHEMATICS-TOOL-085]
blocked_by: []
baseline_ref: b8325a18298dfc8967da31de7c22cc22a58d53d7
created_at: 2026-09-17T09:40:00Z
updated_at: 2026-09-18T12:40:00Z
---

# A committed Card move leaves an unrenderable route

## Goal

Make a geometry edit that a Producer is allowed to perform leave a document the renderer can draw, so moving a Card off the axis of a Flow attached to it cannot take the host down.

## Context

Found by hand while delivering `INFOSCHEMATICS-TOOL-057`, and recorded there and as `COMPOSE-002` in `docs/specs/composition.md`.

On the site Playground, in Design, selecting the Player Card and pressing `ArrowDown` once throws `A route may not run diagonally: 960,240 to 1020,250` and the page is replaced by nothing — Diagram, panel dock and site chrome — taking the draft and its undo history with it. It reproduces through all three placement paths `EDIT-018` promises are equivalent (pointer drag, keyboard nudge, typed coordinate), at grid sizes 0, 10 and 37, and for more than one Card. Horizontal movement of the same Card is fine, because the Flow it carries is horizontal: it is crossing the attached Flow's axis that produces the geometry.

The mechanism is a second derivation path. `moveRouteEnd` in `packages/view-model/src/routing.ts` inserts a bend when a straight two-point route cannot stay orthogonal, which is what `ROUTE-002` requires, and the draft overlay reaches it through `flowsAfterMoves`. `createInfoschematicRuntime` does not: for a Flow authored by its two ports and no waypoints it derives the route as `[portAt(source), portAt(target)]` and calls `routePath` on it, so once the move is committed the bend calculation is never consulted. `routePath` in `packages/view-model/src/geometry.ts` then throws, inside a `useMemo` in `packages/view-studio/src/app/App.tsx`, which is why the whole tree unmounts rather than one Flow failing to draw.

## Boundary

This item does not change what `ROUTE-001` promises — a diagonal run stays rejected — and does not introduce automatic re-routing of authored routes. It does not add an error boundary as a substitute for the fix, though it may add one as well.

## Current state

Read against `b8325a18` on 2026-09-18. The defect reproduces and the shape of the fix is narrower than the record first supposed, because the construction it needs already exists.

- The bendless derivation is `packages/view-model/src/runtime.ts:289-293`: for a Flow with no `route.waypoints` and no established points, the route is exactly `[portAt(source), portAt(target)]`, and `:310` calls `routePath` on it.
- `routePath` throws at `packages/view-model/src/geometry.ts:45`, reproduced at the command line as `A route may not run diagonally: 140,50 to 240,230`.
- **Both** interactive hosts build the runtime inside a `useMemo` — `packages/view-canvas/src/Canvas.tsx:208` as well as `packages/view-studio/src/app/App.tsx:227` — so the throw unmounts the tree in the site Playground too, not only in Studio. The record previously named Studio alone.
- The orthogonal construction is already written and already exported: `routeBetweenPorts` at `packages/view-model/src/routing.ts:73` builds `[from, left, corner, arrive, to]` with a 20-unit port clearance (`:50`) and normalises it, and `runtime.ts:22` already imports it for another path.
- A port's side needs no new field: `portsForBox` at `packages/view-model/src/ports.ts:120-131` issues ids that encode it — `N1`, `E1`, `S1`, `W1` — so the side is the id's first letter.

## Steps

1. [x] Decide where the bend belongs. **Derive the bend**: a port-derived route goes through the same orthogonal construction the editor uses. The alternative — refusing a Producer's move — makes a legal edit fail for a reason the Producer cannot act on, and would leave `INFOSCHEMATICS-TOOL-085`'s command-line surface needing a second, different answer. Deriving settles both.
2. [x] Route an unrouted two-port Flow through `routeBetweenPorts` in `createInfoschematicRuntime`, taking each side from its port id, so the command line, the static renderer and both interactive hosts get the same answer from one construction.
3. [x] Confirm the derived route matches what the draft overlay produces for the same move, so committing a move does not change the drawn route.
4. [x] Add the rendered case `COMPOSE-002` names, proving it fails when the naked two-point derivation is restored.
5. [x] Decide separately whether a thrown runtime construction should also be contained by the host, and record the answer where a future host author reads it. A contained throw is a better failure than an unmounted page either way. **Recommended, not required**: the product owes a document the contract accepted a runtime it can construct, and no host containment substitutes for that; a host mounting a View beside anything else is advised to wrap it in an error boundary so a construction defect costs one surface rather than the page. Recorded in the host boundary of [the architecture guide](../design/architecture.md).
6. [x] Move `COMPOSE-002` to `conforming` and repoint its evidence at the case.

## Files touched

- `packages/view-model/src/runtime.ts` — the port-derived route for an unrouted Flow
- `packages/view-model/src/routing.ts` — `routeBetweenPorts`, the construction that already knows how to keep a route orthogonal
- `packages/view-model/src/runtime.test.ts` — the derivation's own case, at every side pairing
- `packages/view-studio/src/app/App.browser.test.tsx` — the rendered case
- `docs/specs/composition.md` — `COMPOSE-002`'s conformance and evidence
- `docs/specs/routing-and-placement.md` — `ROUTE-002`'s reach across every derivation
- `docs/design/architecture.md` — the host-containment answer, in the host boundary

## Verify

`bun run test --filter=@infoschematics/view-model`, `bun run test:browser --filter=@infoschematics/view-studio`, and the hand check: nudge the Player Card down on the Playground and confirm the page is still there.

## Dependencies / blocks

Nothing blocks it. `INFOSCHEMATICS-TOOL-085` shares the root cause on the command-line surface and is worth landing in the same pass.

## Documentation impact

### Specifications

`docs/specs/composition.md` changes `COMPOSE-002`'s conformance state. `ROUTE-002` gains a sentence saying every route derivation must reach the orthogonal construction, not only the editor's.

### Decision Records

None. `ROUTE-001` keeps refusing a diagonal run and `ROUTE-002` keeps requiring the bend; this is one derivation that skipped a rule reaching it.

### Guides

None. Nothing an author writes changes.

## Review

### Delivered

A Flow with no authored waypoints is now routed between its two ports by the same orthogonal construction the editor uses, in the document's own derivation as well as the draft overlay's, so a Producer's legal Card move can no longer commit a route the renderer refuses to draw or take the host down with it.

### Summary of changes

- `packages/view-model/src/runtime.ts` — `createInfoschematicRuntime` routes any waypoint-free Flow through `routeBetweenPorts` instead of joining its two ports directly, and `flowsAfterMoves` re-derives a two-point run from the moved ports rather than bending it, through a new `shiftedPoint` helper. Routes that carry authored waypoints, and established points, are still taken verbatim.
- `packages/view-model/src/runtime.test.ts` — the derivation's own case at every side pairing (`E1`/`N1`/`S1`/`W1` against `dy` −90, 10 and 240), plus a draft-equals-commit case proving a committed move draws the route its preview drew, and an aligned Flow that must stay the straight `M220 130 H400`.
- `packages/view-studio/src/app/App.browser.test.tsx` — the rendered case `COMPOSE-002` asks for: nudge, typed coordinate and drag of a Card off its Flow's axis, each asserting the host is still mounted and the path is orthogonal.
- `docs/specs/composition.md` — `COMPOSE-002` moves to `conforming` with its evidence repointed at the two suites.
- `docs/specs/routing-and-placement.md` — `ROUTE-002` now says every derivation of a route must reach the construction, not only the editor's.
- `docs/design/architecture.md` — step 5's answer, in the host boundary a host author reads.

### Verification

| Gate | Outcome |
| --- | --- |
| `bunx turbo run test typecheck --filter=@infoschematics/view-model` | Pass — 196 tests |
| `bun run --cwd packages/view-studio test:browser` | Pass — 22 tests |
| `bunx vitest run --root .` | Pass — 95 tests, showcase render byte-identical |
| Non-vacuity, `waypoints.length > 0` restored to the naked derivation | Fails as required — 5 cases |
| Non-vacuity, `flowsAfterMoves`' two-point branch disabled | Fails as required |
| Hand check, Playground nudge | Page still mounted, route gains a bend |

### Outstanding concerns

`INFOSCHEMATICS-TOOL-085` records the same root cause on the command-line surface and is unclaimed by this item. The host error boundary is recommended in the architecture guide and not implemented anywhere, including the site Playground; that stays a host's choice. A Flow whose authored waypoints themselves describe a diagonal is still rejected by `ROUTE-001`, unchanged and intentionally.

### Post-change review

The fix is a derivation reaching an existing rule, not a new rule: `routeBetweenPorts` was already exported and already imported by `runtime.ts` for another path, and a port's side is the first letter of its id, so nothing new had to be invented or stored. The two-point branch in `flowsAfterMoves` was the second half and less obvious — bending a preview's run while the commit re-derives it is how draft and commit disagreed in the first place, so both now re-derive.

### Mini recap

Two derivations, one construction. The editor's path had the bend; the document's did not, so committing a move handed `routePath` a diagonal and the page went with it.

## Done

Accepted 2026-09-18 by Kris Brown on the review packet above.

## Discussion

Shaped on 2026-09-18 against `b8325a18`. Step 1's decision was taken in shaping rather than deferred to the owner, because the code answered it: the orthogonal construction is already exported and a port's side is already in its id, so deriving is the smaller change as well as the one that keeps every contract-accepted document renderable. Refusing the edit would have needed a Producer-visible refusal, a second answer for the command line, and a reason a Producer could act on.
