---
id: INFOSCHEMATICS-TOOL-105
area: TOOL
title: A creation the document can take
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 62292ab43e512e5367423997f9bf3d6df6ee8148
created_at: 2026-09-19T17:55:00Z
updated_at: 2026-09-19T18:05:00Z
---

# A creation the document can take

## Goal

An element added from the Library reaches the authored document, at the size its template promised.

## Context

Found while proving `INFOSCHEMATICS-TOOL-104` on 2026-09-19. With the identity fixed, the Card moved on the canvas and still nothing was written: the change pane stayed empty and the host's document never mentioned it. A temporary projection harness printed the reason — `Card CRD-001 references unknown id: SCOPE`.

Two defects in the same path, both about a creation describing something the document has not got.

## Boundary

This is about what a Library creation says about itself: which Collection it joins, and how big it is. It does not change the Library's contents, the operation shape, the projection, or the validation that caught it.

## Current state

`detailsArtefactContexts` supplied a `scope` and nothing else, and `instantiateLibraryTemplate` wrote that Scope into the Card's Collection field. A Scope and a Collection answer different questions — which sittings show an element, and which group it belongs to — so the Card named a Collection the document had never declared. `projectStudioDocumentOperations` validates before it writes and rejects the whole projection, so the creation, the move, and everything else in the batch were dropped together and the pane had nothing to report.

Separately, `instantiateLibraryTemplate` spread the context's box over the template's: `{ ...seed.placement.box, ...context.box }`. The type says the context supplies a position, `Pick<Box, 'x' | 'y'>`, but the panel passes the full placement rectangle it worked out, and a structural type accepts the extra fields silently. A Square card came out 240 wide and 120 high — the panel's size, under the name of a template that promises a square.

## Steps

- [x] Carry the declared Collection into the Library context, from the selection or the first the document declares.
- [x] Omit it where the document declares none, rather than inventing one.
- [x] Place a template at the given position while keeping its own size.
- [x] Cover both in the Library unit tests, and the end of the path in the browser test.
- [x] State the rule as `EDIT-025`.

## Files touched

- `packages/view-studio/src/app/panels/DetailsPanel.tsx` — `detailsArtefactContexts`
- `packages/view-studio/src/app/editor/library.ts` — `LibraryContext.collection`, `placedBox`
- `packages/view-studio/src/app/editor/library.test.ts`
- `packages/view-studio/src/app/App.browser.test.tsx`
- `docs/specs/design-editing.md` — `EDIT-025`

## Verify

`bun run self:check`, then in Design add a Square card from the Library: it is drawn square, and the change pane gains a line naming it. The host's document holds it in the Collection of whatever was selected.

## Dependencies / blocks

Found under `INFOSCHEMATICS-TOOL-104` and fixed with it. Neither alone gets a Library creation into the document.

## Documentation impact

### Decision Records

None. Writing only what the document declares is the ordinary reading of a validated projection.

### Specifications

`EDIT-025` added to `docs/specs/design-editing.md`: a creation takes its Collection from the document and omits it where there is none, and a template keeps its own size at the position it is given.

### Guides

None.

### Roadmap

`docs/roadmap/_ISSUES.md` reserves `TOOL` through `106`.

## Review

### Delivered

Every Step, within the stated Boundary. Baseline `62292ab43e512e5367423997f9bf3d6df6ee8148`.

### Summary of changes

`LibraryContext` gains an optional `collection`, which `detailsArtefactContexts` fills from the selected element's own Collection where it has one and from the first the document declares otherwise. `instantiateLibraryTemplate` writes `domain` only when it is given one, so a document that declares no Collection gets a Card with no Collection rather than a Card naming one that does not exist.

`placedBox` replaces the spread: the template's size, at the context's `x` and `y`. The Point seed is built the same way, from the two coordinates rather than the whole box.

### Verification

`bun run self:check` — green, 48 tasks.

The unit tests assert a Square card placed inside a 240 by 120 rectangle comes out 120 by 120, that a given Collection is named, and that none is written where none is given. The browser test asserts the Card added from the Library appears in the written record — which only a projection the document accepts can do, and is therefore the end-to-end statement of this fix.

### Outstanding concerns

The Collection is chosen for the Producer rather than asked for. Adding beside a selected element joins that element's Collection, which is the reading that needs no dialogue; adding with nothing selected joins the first declared one, which may not be the one intended. Changing it afterwards is a property edit, so nothing is stuck.

The type that let the second defect through is still structurally satisfiable by a full `Box`. `placedBox` names the two fields it uses, so a wider object can no longer leak through it, but nothing stops a future caller from passing one.

### Post-change review

The Goal is met. The two defects share a shape worth naming: both were a creation asserting something about the document that the document had not agreed to. One was caught by validation and silently dropped everything; the other was not caught at all and drew the wrong rectangle.

The validation was right to reject. What was missing was any signal to the Producer that a projection had been refused — the pane simply stayed empty, which reads as "nothing happened" rather than "that could not be written". That gap is real and is not closed here.

### Mini recap

A Library creation named the Scope as its Collection, so the document rejected the whole projection and nothing was written; and it spread the panel's rectangle over the template's, so a square came out twice as wide as tall. The context now carries the declared Collection, or none, and a template keeps its own size at the given point. `EDIT-025` states the rule.

## Done

Closed 2026-09-19 under the standing instruction to progress every record that is not `waiting-for` or `parked`. Awaiting the reporter's own testing pass.

## Discussion

### Why a silent rejection was possible at all

`projectStudioDocumentOperations` returns a result that says why it refused, and the effect that calls it drops the refusal on the floor. That made a whole class of bug — anything that produces an unwritable document — present as the change pane doing nothing. Diagnosing it needed a throwaway harness to print the reason. Surfacing a refusal where the Producer can see it is its own piece of work and is not in this Boundary.
