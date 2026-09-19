---
id: INFOSCHEMATICS-TOOL-099
area: TOOL
title: Flows follow the Adapter
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 70f9474c35a5419b4edef88147ab78a2658bd592
created_at: 2026-09-19T13:06:00Z
updated_at: 2026-09-19T13:40:00Z
---

# Flows follow the Adapter

## Goal

Draw a Flow attached to an Adapter Card from where the Adapter actually is. An Adapter is positioned by the Card it holds, so moving that Card must carry the Adapter's Flows with it rather than leaving them behind at the Adapter's authored coordinates.

## Context

Found by user-acceptance testing on 2026-09-19, fourth item of the 12:10 recording, verbatim: _"Still seeing some really strange behaviours with the flows. If I move this one the flows move, if I move this one the flows don't move. They are still attached here, but they're not attached or being redrawn here, which is a bit strange."_

The two cases differ by kind. Move a plain Card and its Flows follow. Move a Card that an Adapter holds and the Adapter follows — because it is drawn from what it holds — while the Flows attached to the Adapter stay where the Adapter was authored. One end of the Flow is correct and the other is stale, which is exactly the "attached here, not attached there" the reporter described.

`ADR-INFOSCHEMATICS-036` states the rule: an Adapter is positioned by what it holds. `adapterBoundsFor` in `packages/view-model/src/assembly.ts` implements it, and the drawing path, the draft path in `artefact-draft.ts` and the compatibility layer in `compatibility.ts` all go through it. The route endpoint lookup did not.

## Boundary

This is about where a Flow's endpoint resolves for a Card that an Adapter wraps. It does not change the Adapter's own geometry rule, the inset `adapterBoundsFor` applies, port counts or port ordering on an Adapter, or anything about a Flow attached to a plain Card, a Fabric or a Point. It does not address the diagonal-route crash a move could cause — that is `INFOSCHEMATICS-TOOL-102`, found in the same recording and fixed in the same pass.

## Current state

`createInfoschematicRuntime` built `endpointById` from `cards.map((entry) => [entry.id, { box: entry.bounds, ports: entry.ports }])`. For an Adapter, `entry.bounds` is the authored box, which is not where the Adapter is drawn and is not what any other consumer of an Adapter's geometry reads.

Every other path had already been corrected to the ADR: `placeables` derives an Adapter's box through `adapterBoundsFor`, `compatibility.ts:168` resolves the held Card and insets, and `artefact-draft.ts` moves a wrapper with its held Card. This one lookup was the exception, and because it only feeds route endpoints, the symptom was confined to Flows.

## Steps

- [x] Resolve a Card's drawn bounds once in the runtime — the held Card's box through `adapterBoundsFor` where the Card wraps something, its own bounds otherwise.
- [x] Build `endpointById` from those drawn bounds, so a port resolves where the element is drawn.
- [x] Prove it with a runtime case that moves a held Card and asserts the Adapter's Flow endpoint lands on the Adapter's new east edge rather than its authored one.

## Files touched

- `packages/view-model/src/runtime.ts` — `cardBoundsById` and `drawnBounds` above `endpointById`
- `packages/view-model/src/runtime.test.ts`

## Verify

`bun run self:check`, then open the playground, enter Design, and drag a Card that an Adapter holds: the Adapter moves with it, and every Flow attached to the Adapter stays joined to the Adapter's edge throughout and after the move.

## Dependencies / blocks

None. `INFOSCHEMATICS-TOOL-102` touches the same function and landed in the same pass; the two changes are independent — one decides where an endpoint is, the other decides how the run reaching it is drawn.

## Documentation impact

### Decision Records

None. `ADR-INFOSCHEMATICS-036` already states the rule this restores; the defect was one call site not following it, not a decision that needed making.

### Specifications

None. The requirement that dependent geometry follows a moved component is already stated — `EDIT-019` requires a created Flow to follow a moved Card, and `EDIT-018` requires dependent Flow projection to agree across placement inputs. Adding a requirement that named the Adapter case specifically would restate `ADR-INFOSCHEMATICS-036` in a second voice.

### Guides

None. No guide states where an Adapter's Flows are drawn.

### Roadmap

None.

## Review

### Delivered

Every Step, within the stated Boundary. Baseline `70f9474c35a5419b4edef88147ab78a2658bd592`.

### Summary of changes

`runtime.ts` gains `cardBoundsById`, a map of every Card's authored box, and `drawnBounds`, which returns `adapterBoundsFor(held)` where the Card wraps another Card and the Card's own bounds otherwise. `endpointById` is built from `drawnBounds(entry)`. The comment above them cites `ADR-INFOSCHEMATICS-036` and states what the stale lookup did, so the next reader sees why the authored box is the wrong answer here.

The map is built from `cards` rather than from the definition, so a held Card resolved through it is the same box every other consumer sees.

### Verification

`bun run self:check` — green, 48 tasks. `packages/view-model` 198 cases, green.

The new case authors `HELD` at one position, `GRIP` wrapping it, and a Flow from `GRIP` to `SINK`, then moves `HELD` and asserts the Flow's first point against the Adapter's east edge computed from the moved Card. Before the change it resolved against the authored box, so the case fails on the old code for the right reason.

### Outstanding concerns

None. The lookup now agrees with `placeables`, `compatibility.ts` and `artefact-draft.ts`, which is the whole of what the ADR asks.

### Post-change review

The Goal is met and the change is four lines plus a comment in one function. The regression risk is low and bounded: `drawnBounds` differs from the previous expression only for a Card whose `wraps` resolves, and an Adapter whose held Card is missing falls back to its own bounds exactly as before.

The wider risk this exposes is that an ADR-stated geometry rule was implemented four times rather than once, and the fourth was wrong for long enough to reach a recording. That is a shape worth watching, not a change to make here.

### Mini recap

A Flow attached to an Adapter resolved its port against the Adapter's authored box while the Adapter itself was drawn from the Card it holds, so moving the held Card left the Flows behind. The runtime now resolves a wrapping Card's drawn bounds through `adapterBoundsFor`, as every other consumer already did. Proved by a runtime case that moves the held Card and measures the Adapter's east edge.

## Done

Accepted 2026-09-19 by Kris Brown on the review packet above.

## Discussion

### Why only Flows showed it

The Adapter itself was always drawn correctly, because `placeables` had the rule. Selection, hover and the draft overlay all read from that. `endpointById` exists solely to answer "where is the port this Flow attaches to", so the stale box had exactly one visible consequence, on exactly one kind, and only when the held Card moved. That is why it reads as intermittent — a reporter moving a plain Card sees nothing wrong.

### Why the map, rather than reaching for the register

The runtime is building `cards` at this point and the register is derived later; a local map of the boxes it already has is the smallest thing that answers the question, and it cannot disagree with the array it was built from.
