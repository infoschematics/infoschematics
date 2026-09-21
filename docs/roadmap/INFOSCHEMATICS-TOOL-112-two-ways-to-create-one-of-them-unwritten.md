---
id: INFOSCHEMATICS-TOOL-112
area: TOOL
title: One creation path unwritten
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-21T18:15:00Z
updated_at: 2026-09-22T00:15:00Z
---

# One creation path unwritten

## Goal

Making an element in Studio reaches the document by one route, so a defect found in one way of creating something is a defect found in all of them.

## Context

Raised on 2026-09-21 while closing `INFOSCHEMATICS-TOOL-104` and `-105`, both of which were defects in one of the two paths and neither of which touched the other.

Studio can make an element two ways. The Library and the artefact factories build a domain-shaped value and one `create` artefact operation, which the projection turns into a document edit. `editor.createCard` — the Card and Adapter buttons in the artefact controls — writes into a `cards` draft map instead, which the overlay draws and the change pane accounts for, but which `projectStudioDocumentOperations` never reads, because it is given `editor.artefactOperations` alone.

So one kind of creation reaches the document and the other does not. That is not obviously wrong — a draft Card the host has not been told about is a coherent thing for an editor to hold — but nothing says which it is, and the two paths have now carried separate defects.

## Boundary

A decision about the two creation paths and what each is for. It is not a refactor in itself: if the answer is that they converge, the work follows as its own record.

## Current state

- Library and factory creations: `instantiateLibraryTemplate` in `packages/view-studio/src/app/editor/library.ts` returns a `CreateArtefactOperation`, which joins `artefactOperations` and is projected by `packages/view-studio/src/app/editor/document-operations.ts`.
- Control creations: `createCard` at `packages/view-studio/src/app/editor/use-editor.ts:1308` sets `cards[code]` and selects it. The draft reaches the runtime through `createdCards` and the change pane through an origin of `map: 'cards'`, and reaches the document nowhere.
- `INFOSCHEMATICS-TOOL-104` (a made Card answering to two names) and `INFOSCHEMATICS-TOOL-105` (a creation the document can take) were both Library-path defects. `INFOSCHEMATICS-TOOL-106` was a control-path defect. None of the three could have been found from the other path.
- `ADR-INFOSCHEMATICS-032` already decided that a Point is created from the Library, which is the same question answered once for one artefact kind and never generalised.

## Steps

- [ ] Take the decision and record it: whether a `cards` draft is for anything the operation path does not cover, and if not, that creation converges on the operation path.
- [ ] Route `createCard` through the same `CreateArtefactOperation` the Library path produces, so one kind of creation reaches the document by one route.
- [ ] Retire what the draft map carried: `createdCards`, the `map: 'cards'` origin in the change pane, and any undo that depended on the draft rather than on the operation.
- [ ] Hold the convergence with a test that asserts a control-made Card reaches the projected document, which is the assertion whose absence let the two paths carry separate defects.
- [ ] State the rule where a reader of either path meets it, in `EDIT-023` and `EDIT-024` of `docs/specs/design-editing.md`.

## Files touched

`packages/view-studio/src/app/editor/use-editor.ts`, `document-operations.ts`, and the change-pane accounting that reads the `cards` origin; their tests; `docs/specs/design-editing.md`; a new Decision Record if the answer is structural rather than a rule.

## Verify

`bun run self:check`. A control-created Card is asserted to appear in the projected document operations, and undo is asserted across both creation routes rather than one.

Studio is opened and a Card made from the controls, per `AGENTS.md`: the change pane and the document view have to agree about a creation that previously only one of them knew about.

## Dependencies / blocks

None. Raised under `INFOSCHEMATICS-TOOL-104` and `-105`, distinct from both.

## Documentation impact

### Decision Records

A new record if the paths converge, stating that creation reaches the document by one route and what a draft that never reaches it would have been for. `ADR-INFOSCHEMATICS-032` answered the same question for Points and is the precedent to cite.

### Specifications

`EDIT-023` states what a creation whose precondition is unmet must do. Neither it nor `EDIT-024` says whether a creation must reach the document; that is the gap this closes.

### Guides

None. The Studio guide describes making an element, not which internal path carries it.

### Roadmap

Nothing follows if the paths converge here. If the decision keeps both, the second path needs its own stated purpose and its own tests, which would be its own record.

## Discussion

Captured on 2026-09-21 while closing `INFOSCHEMATICS-TOOL-104` and `-105`, each a defect in one of the two creation paths where neither touched the other. The item was captured without assuming the paths should converge: a draft Card the host has not been told about may be a coherent thing for an editor to hold. What argues the other way is the defect history — while the question stays open, a defect in one path says nothing about the other, which is how those two arrived separately.

### Adoption

Adopted for immediate work on 2026-09-21. The decision is taken as part of delivery rather than ahead of it, and `ADR-INFOSCHEMATICS-032` is the precedent: the same question was answered once for Points, from the Library, and never generalised to the artefact kinds that came after.
