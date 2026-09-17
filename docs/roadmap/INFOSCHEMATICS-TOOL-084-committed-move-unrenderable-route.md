---
id: INFOSCHEMATICS-TOOL-084
area: TOOL
title: A committed Card move leaves an unrenderable route
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-17T09:40:00Z
updated_at: 2026-09-17T09:40:00Z
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

## Steps

1. [ ] Decide where the bend belongs: a port-derived route that passes through the same orthogonal construction the editor uses, or a refusal of the edit before it is committed. The first keeps every authored document renderable; the second keeps authored geometry untouched and needs a Producer-visible refusal.
2. [ ] Implement it once, in View Model, so the command line, the static renderer and both interactive hosts get the same answer.
3. [ ] Add the rendered case `COMPOSE-002` names, proving it fails when the naked two-point derivation is restored.
4. [ ] Decide separately whether a thrown runtime construction should also be contained by the host, and record the answer where a future host author reads it.
5. [ ] Move `COMPOSE-002` to `conforming` and repoint its evidence at the case.

## Files touched

- `packages/view-model/src/runtime.ts` — the port-derived route for an unrouted Flow
- `packages/view-model/src/routing.ts` — the construction that already knows how to keep a route orthogonal
- `packages/view-studio/src/app/App.browser.test.tsx` — the rendered case
- `docs/specs/composition.md` — `COMPOSE-002`'s conformance and evidence

## Verify

`bun run test --filter=@infoschematics/view-model`, `bun run test:browser --filter=@infoschematics/view-studio`, and the hand check: nudge the Player Card down on the Playground and confirm the page is still there.

## Dependencies / blocks

Nothing blocks it. `INFOSCHEMATICS-TOOL-085` shares the root cause on the command-line surface and is worth landing in the same pass.

## Documentation impact

`docs/specs/composition.md` changes conformance state. `ROUTE-002` may gain a sentence saying which derivations must reach it.
