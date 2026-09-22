---
id: INFOSCHEMATICS-TOOL-125
area: TOOL
title: Room for a creation
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T15:30:00Z
updated_at: 2026-09-22T19:40:00Z
---

# Room for a creation

## Goal

A new [Card](../reference/vocabulary.md#standard-card) made in [Design](../reference/vocabulary.md#design) lands somewhere a [Producer](../reference/vocabulary.md#producer) can see it and drag it from, without landing on top of something already drawn.

## Context

`roomForCard` in `packages/view-studio/src/app/App.tsx:183` puts a new Card at the centre of the view box, stepped twenty units per creation already made in the session. Its comment states the reasoning deliberately: the Card is put somewhere visible rather than somewhere correct, because where a Card belongs is a judgement about architecture and dragging it there is a gesture the editor already has.

That reasoning is sound and this is not a request to overturn it. What it does not cover is landing on top of an authored artefact. Opening the Playground on 2026-09-22 and making a Card put it squarely over the Message bus [Fabric](../reference/vocabulary.md#fabric) — visible, but overlapping, and the Producer's first action has to be to move it off something rather than to place it.

`INFOSCHEMATICS-TOOL-113` measures exactly this: `artefacts-overlap` reports two artefacts drawn over each other, with the overlap in diagram units. So the product can already tell whether a candidate position is clear, and the creation path does not ask it.

## Boundary

Where a created Card is first placed, and only that. It does not change the creation route, which `INFOSCHEMATICS-TOOL-112` and `ADR-INFOSCHEMATICS-042` settled, and it does not introduce automatic layout — the Card still goes somewhere provisional that the Producer is expected to move.

An [Adapter](../reference/vocabulary.md#adapter-card) is out of scope: `ADR-INFOSCHEMATICS-036` draws it from the Card it clasps, so its authored box is a starting value nothing depends on.

## Current state

`roomForCard` in `packages/view-studio/src/app/App.tsx:183` places a new Card at the centre of the view box, stepped twenty diagram units per creation already made in the session:

```ts
const roomForCard = (viewBox: Box, made: number): Box => ({
  height: 80,
  width: 160,
  x: viewBox.x + viewBox.width / 2 - 80 + made * 20,
  y: viewBox.y + viewBox.height / 2 - 40 + made * 20
})
```

Nothing consults what is already drawn. `reviewInfoschematicDrawing` in `packages/view-model/src/diagnostics.ts` already reports `artefacts-overlap` with the overlap in diagram units, so the product can tell whether a candidate box is clear and the creation path does not ask it. Making a Card in the Playground on 2026-09-22 put it squarely over the Message bus Fabric.

## Steps

- [ ] Settle the boundary question first: whether a creation surface may ask the checker for a measurement. `ADR-INFOSCHEMATICS-040` says a checker measures and never repairs; asking for a measurement is not a repair, but the boundary is close enough to state explicitly rather than assume, and the answer decides whether the overlap test is shared or duplicated.
- [ ] Give the placement a search: candidates outward from the view-box centre, each tested for overlap against the authored artefacts and the operations already pending.
- [ ] Keep the current stepped-centre position as the fallback when no candidate is clear, so a dense document still produces a visible Card rather than none.
- [ ] Hold the behaviour in the Studio browser suite: create into a document whose centre is occupied and assert the new Card overlaps nothing.
- [ ] Look at it in a real browser, since where a Card lands is exactly what a green suite cannot report.

## Files touched

`packages/view-studio/src/app/App.tsx`, `packages/view-studio/src/app/editor/artefact-operations.ts` if the pending-operation boxes are needed for the test, `packages/view-studio/src/app/App.browser.test.tsx`, and `packages/view-model/src/diagnostics.ts` only if the overlap measurement needs exposing as its own function.

## Verify

`bun run self:check` with the new browser assertion, and a capture in `reports/` of a creation into an occupied centre. Per `AGENTS.md` the capture is the evidence, not the suite.

## Dependencies / blocks

Nothing blocks it and it blocks nothing. It sits downstream of `INFOSCHEMATICS-TOOL-112` and `ADR-INFOSCHEMATICS-042` only in that those settled the creation route this places into.

## Documentation impact

### Decision Records

A record only if the boundary question resolves into a general rule about editing surfaces consuming diagnostics; if it resolves narrowly, `ADR-INFOSCHEMATICS-040`'s consequences gain a clarifying sentence instead.

### Specifications

`docs/specs/design-editing.md` states that a created element is placed clear of what is already drawn where the view allows it, and that the placement is provisional.

### Guides

None. A Producer does not need telling that a new Card avoids other artefacts.

### Roadmap

Nothing follows. Automatic layout remains explicitly out of scope and is not implied by this.

## Discussion

Found on 2026-09-22 during the browser look for `INFOSCHEMATICS-TOOL-112`, and deliberately not folded into it — that item converged the creation route and this is about placement, which was unchanged by it and equally true before.

The obvious implementation is to search outward from the centre for a clear box, testing candidates with the same overlap measurement `INFOSCHEMATICS-TOOL-113` already computes, and to keep the current position as the fallback when nothing is clear. Worth settling when shaped: whether reusing the diagnostics rule is right, or whether the checker reviewing a document and the editor choosing a position should stay separate, since `ADR-INFOSCHEMATICS-040` says a checker measures and never repairs — a creation surface asking it for a measurement is not a repair, but the boundary is close enough to state rather than assume.

Per `AGENTS.md` this needs the browser look to verify, since where a Card lands is exactly what a green suite cannot tell anyone.

### Adoption

Adopted into Now on 2026-09-22 while shaping the queue before a pause. The boundary question about a creation surface consuming a measurement is taken as part of delivery and recorded, because it is the one choice here that sets a precedent beyond this placement.
