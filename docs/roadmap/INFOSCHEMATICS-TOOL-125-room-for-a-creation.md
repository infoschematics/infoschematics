---
id: INFOSCHEMATICS-TOOL-125
area: TOOL
title: Room for a creation
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 8dd156a960b7948e203c0e9e442f5926125257fe
created_at: 2026-09-22T15:30:00Z
updated_at: 2026-09-25T08:50:27Z
---

# Room for a creation

## Goal

A new [Card](../reference/vocabulary.md#standard-card) made in [Design](../reference/vocabulary.md#design) lands somewhere a [Producer](../reference/vocabulary.md#producer) can see it and drag it from, without landing on top of something already drawn.

## Context

`roomForCard` in `packages/view-studio/src/app/App.tsx:183` puts a new Card at the centre of the view box, stepped twenty units per creation already made in the session. Its comment states the reasoning deliberately: the Card is put somewhere visible rather than somewhere correct, because where a Card belongs is a judgement about architecture and dragging it there is a gesture the editor already has.

That reasoning is sound and this is not a request to overturn it. What it does not cover is landing on top of an authored artefact. Opening the Playground on 2026-09-22 and making a Card put it squarely over the Message bus [Fabric](../reference/vocabulary.md#fabric) — visible, but overlapping, and the Producer's first action has to be to move it off something rather than to place it.

`INFOSCHEMATICS-TOOL-113` measures exactly this: `artefacts-overlap` reports two artefacts drawn over each other, with the overlap in diagram units. So the product can already tell whether a candidate position is clear, and the creation path does not ask it.

## Boundary

Where a created Card is first placed, and only that. It does not change the creation route, which `INFOSCHEMATICS-TOOL-112` and `ADR-INFOSCHEMATICS-038` settled, and it does not introduce automatic layout — the Card still goes somewhere provisional that the Producer is expected to move.

An [Adapter](../reference/vocabulary.md#adapter-card) is out of scope: `ADR-INFOSCHEMATICS-032` draws it from the Card it clasps, so its authored box is a starting value nothing depends on.

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

- [x] Settle the boundary question first: whether a creation surface may ask the checker for a measurement. `ADR-INFOSCHEMATICS-036` says a checker measures and never repairs; asking for a measurement is not a repair, but the boundary is close enough to state explicitly rather than assume, and the answer decides whether the overlap test is shared or duplicated. Settled in [`ADR-INFOSCHEMATICS-042`](../decisions/ADR-INFOSCHEMATICS-042-share-the-measurement-never-the-rule.md): share the measurement, never the rule.
- [x] Give the placement a search: candidates outward from the view-box centre, each tested for overlap against the authored artefacts and the operations already pending.
- [x] Keep the current stepped-centre position as the fallback when no candidate is clear, so a dense document still produces a visible Card rather than none.
- [x] Hold the behaviour in the Studio browser suite: create into a document whose centre is occupied and assert the new Card overlaps nothing.
- [x] Look at it in a real browser, since where a Card lands is exactly what a green suite cannot report.

## Files touched

`packages/view-studio/src/app/App.tsx`, `packages/view-studio/src/app/editor/artefact-operations.ts` and its suite for the pending-operation boxes, `packages/view-studio/src/app/App.browser.test.tsx`, and `packages/view-model/src/diagnostics.ts` and its suite for the shared overlap measurement.

The placement itself went to a new module rather than staying inline in `App.tsx`, which this section did not anticipate: `packages/view-studio/src/app/editor/card-placement.ts` with `packages/view-studio/src/app/editor/card-placement.test.ts`. A search with a fallback, a bound and a candidate order has cases worth stating one at a time — the dense document, the wall, the pending sibling — and a browser suite states them at ten times the cost and less precisely. Both files sit beside the other editor modules `App.tsx` already delegates to.

## Verify

`bun run self:check` with the new browser assertion, and a capture in `reports/` of a creation into an occupied centre. Per `AGENTS.md` the capture is the evidence, not the suite.

## Dependencies / blocks

Nothing blocks it and it blocks nothing. It sits downstream of `INFOSCHEMATICS-TOOL-112` and `ADR-INFOSCHEMATICS-038` only in that those settled the creation route this places into.

## Documentation impact

### Decision Records

A record only if the boundary question resolves into a general rule about editing surfaces consuming diagnostics; if it resolves narrowly, `ADR-INFOSCHEMATICS-036`'s consequences gain a clarifying sentence instead.

### Specifications

`docs/specs/design-editing.md` states that a created element is placed clear of what is already drawn where the view allows it, and that the placement is provisional.

### Guides

None. A Producer does not need telling that a new Card avoids other artefacts.

### Roadmap

Nothing follows. Automatic layout remains explicitly out of scope and is not implied by this.

## Review

### Delivered

A Card created in Design is placed clear of what is already drawn. The stepped view-box centre is now the first candidate rather than the only position: when it is clear the placement is unchanged, and when it is not, the search steps outward from it in twenty-unit rings — nearest first, straight neighbours before the diagonals they are further than — until it finds a box that overlaps nothing and sits wholly inside the view. What it avoids is both the artefacts the document draws, read at their current drawn positions rather than where they were authored, and the boxes the pending edits have already claimed, so a second creation avoids the first before either is written. When nothing is clear the stepped centre comes back, because a dense document must still produce a Card somebody can see and drag.

The boundary question is settled and recorded in [`ADR-INFOSCHEMATICS-042`](../decisions/ADR-INFOSCHEMATICS-042-share-the-measurement-never-the-rule.md): share the measurement, never the rule. `ADR-INFOSCHEMATICS-036`'s restraint is about authority over the document, not custody of geometry, so an editor may ask how far two boxes intersect. The rule stays behind, because `artefacts-overlap` excuses a Card drawn on a Fabric and a placement search must not — the Message bus is exactly what a new Card kept landing on.

This is not automatic layout and does not become it. Nothing in the search reads a Flow, a Scope or a neighbour's meaning; it measures boxes. Where a Card belongs is still the Producer's judgement, and the placement is still provisional.

### Change Summary

| File | Change |
| --- | --- |
| `packages/view-model/src/diagnostics.ts` | The module-private `overlap` helper became the documented export `measuredOverlap`, with `MeasuredOverlap`; `overlapFindings` calls it. |
| `packages/view-model/src/diagnostics.test.ts` | Six cases for `measuredOverlap`: shared extent, order-independence, a miss, a touch along an edge, containment, and a box over a Fabric-sized box measured like any other pair. |
| `packages/view-studio/src/app/editor/card-placement.ts` | New. `steppedCentre` and `roomForCard`: the ring search, the view bound, the candidate order and the fallback. |
| `packages/view-studio/src/app/editor/card-placement.test.ts` | New. Eight cases, including the Fabric across the middle, the wall that leaves one position, the whole view claimed, and the still-pending sibling. |
| `packages/view-studio/src/app/editor/artefact-operations.ts` | New export `pendingArtefactBoxes`: the boxes a pending create, move or resize has claimed, with a pending removal taking its artefact out. |
| `packages/view-studio/src/app/editor/artefact-operations.test.ts` | Four cases for it, including the Point and the Flow that have no box to claim. |
| `packages/view-studio/src/app/App.tsx` | The local `roomForCard` is gone; `createCard` gathers the drawn boxes at their current offsets and the pending boxes, and asks the new module. |
| `packages/view-studio/src/app/App.browser.test.tsx` | Two tests through rendered geometry: a creation into an occupied centre overlaps nothing, and a second creation places itself clear of the first, still-pending one. |
| `docs/decisions/ADR-INFOSCHEMATICS-042-share-the-measurement-never-the-rule.md` | New. The boundary decision, its alternatives and what it does not licence. |
| `docs/specs/design-editing.md` | New `EDIT-026`: a created element is placed clear of what is already drawn where the view allows it, and the placement is provisional. |
| `reports/TOOL-125-room-probe.ts` | New, and untracked: `reports/` is ignored, so the probe and its captures are local evidence rather than committed files. It drives the Playground — show panels, open Design, create a Card — and records every drawn box's geometry beside the captures in `reports/TOOL-125-room-for-a-creation/`. |

`pendingArtefactBoxes` deliberately does not subtract the position a move vacates. The result is a superset of what is occupied, which costs a candidate position and never costs correctness, and the alternative is reconstructing where each artefact was before the drag from a record that does not hold it.

### Verification

| Gate | Result |
| --- | --- |
| `bun run typecheck` in `packages/view-model` | Pass, silent. |
| `bun run test` in `packages/view-model` | Pass — `Tests 259 passed (259)`. |
| `bun run typecheck` in `packages/view-studio` | Fails, and every error is `../view-canvas/src/InfoschematicDiagram.tsx … Cannot find name 'selectedArtefact'` — the concurrent `INFOSCHEMATICS-TOOL-115` writer's in-flight edit to a package this one does not touch. Filtering those out leaves nothing. |
| `bun run test` in `packages/view-studio` | Pass — `Test Files 24 passed (24)`, `Tests 142 passed (142)`. An earlier run in the same minute reported `5 failed` against the same tree; re-measured on a quieter tree it is green, and the failures moved with the other writer's edits rather than with this change. |
| `bun run test:browser` in `packages/view-studio` | Pass — `Test Files 3 passed (3)`, `Tests 37 passed (37)`. |
| `bunx turbo run build --filter=@infoschematics/view-model --filter=@infoschematics/view-studio` | Pass — `Tasks: 6 successful, 6 total`. |
| `bunx turbo run typecheck test --filter=@infoschematics/view-model --filter=@infoschematics/view-studio --force` | Fails at `@infoschematics/view-canvas#typecheck`, for the reason above; it is pulled in topologically and is not this item's code. The per-package runs above are the same tasks without it. |
| `bun run self:browser:look -- --name TOOL-125-room-for-a-creation --path /playground/ --probe reports/TOOL-125-room-probe.ts` | Pass — `playground: 319155 bytes`, `card-created: 413441 bytes`, no page or console error. |
| `bun run ki:lint:md` | See below. |
| `ki repo audit --skill ki-work-roadmap --repo .` | See below. |
| `ki repo audit --skill ki-decision-records --repo .` | See below. |

The look is the evidence, per `AGENTS.md`. Before the creation the Playground draws the Message bus Fabric at `120 500 1440×120`, the Object store beneath it, five authored Cards and the Router. The old placement put a new Card at the stepped view-box centre, `760 450`, which runs straight into the bus between `y 500` and `y 620`. In `card-created.png` the new Card — `SCOPE-PIPELINE-01`, "New card", `160×80` — sits at `760 630`: ten units below the bus, in the clear band between it and the Router, to the right of the Object store, overlapping nothing. It is the first clear candidate the search reaches, because the row of authored Cards above blocks every upward candidate at that column and the bus spans the full width beside it. The change pane reads `1 change · SCOPE-PIPELINE-01 -> create card at 22`, so the creation route is unchanged.

`bun run self:check` was not run, and deliberately: a second writer is live in this checkout delivering `INFOSCHEMATICS-TOOL-115`, and a repository-wide gate would measure their half-written work as this item's failure. The coordinator owns that run at commit.

### Outstanding concerns

A second Card created before the first is written supersedes it rather than joining it, so the document gains one Card and not two. `createCard` allocates the new code from `infoschematicRegister.all`, which is the **authored** register: the pending creation is not in it, the same `SCOPE-01` is issued again, and `recordArtefactOperation` supersedes by identity exactly as it should. The placement is not implicated and the browser suite proves it — the second creation is offered `340 240` while the first holds `320 160`, so the search did consult the pending box. This is identity allocation rather than placement, it predates this item, and it sits outside the boundary this item declared (`Where a created Card is first placed, and only that`). It belongs to whoever owns `EDIT-024`'s allocator, as a new item: the allocator should count what is pending as well as what is authored. Undone here.

The search measures boxes and not routes. In the look, the created Card sits across the dashed Flow running from the bus down to the Router — a Flow is a path rather than a place, `ADR-INFOSCHEMATICS-042` records the choice, and treating a route as an obstacle would make the search a layout engine, which this item forbids. Named rather than fixed.

`bun run self:check` is undone for the reason given above and is the coordinator's to run once the checkout has one writer again.

### Post-change review

The measurement moved and the rule did not, which is the whole of the boundary decision and the only part of this change that sets a precedent. It is documented at the export rather than only in the record, because the mistake it prevents is a future caller reaching for `artefacts-overlap` instead — the record is where the reasoning lives, the export is where the reader is.

Two things were resisted. The search does not look at a Flow, a Scope or an artefact's meaning, so no part of it is a layout decision waiting to be extended; and the fallback stayed, so a document with no clear position still produces a Card rather than a refusal. The bound on the search is arbitrary in the way a bound has to be, and stated where it is set.

The placement went to its own module against this item's `## Files touched`, which is recorded there. The gain is that the dense document, the wall and the pending sibling are eight cheap cases rather than eight browser cases.

### Mini recap

A new Card no longer lands on the Message bus. The stepped centre is tried first, and when it is occupied the placement steps outward until it finds room, avoiding what is drawn and what is merely pending, falling back to where it always went when the document has no room at all. The overlap arithmetic is now shared with the checker; the checker's judgement about when overlap matters is not, because it excuses the very case this had to catch.

## Done

Accepted 2026-09-25 by Kris Brown on the review packet above.

## Discussion

Found on 2026-09-22 during the browser look for `INFOSCHEMATICS-TOOL-112`, and deliberately not folded into it — that item converged the creation route and this is about placement, which was unchanged by it and equally true before.

The obvious implementation is to search outward from the centre for a clear box, testing candidates with the same overlap measurement `INFOSCHEMATICS-TOOL-113` already computes, and to keep the current position as the fallback when nothing is clear. Worth settling when shaped: whether reusing the diagnostics rule is right, or whether the checker reviewing a document and the editor choosing a position should stay separate, since `ADR-INFOSCHEMATICS-036` says a checker measures and never repairs — a creation surface asking it for a measurement is not a repair, but the boundary is close enough to state rather than assume.

Per `AGENTS.md` this needs the browser look to verify, since where a Card lands is exactly what a green suite cannot tell anyone.

### Adoption

Adopted into Now on 2026-09-22 while shaping the queue before a pause. The boundary question about a creation surface consuming a measurement is taken as part of delivery and recorded, because it is the one choice here that sets a precedent beyond this placement.
