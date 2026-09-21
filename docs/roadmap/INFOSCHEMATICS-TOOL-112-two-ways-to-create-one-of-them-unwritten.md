---
id: INFOSCHEMATICS-TOOL-112
area: TOOL
title: One creation path unwritten
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-21T18:15:00Z
updated_at: 2026-09-21T23:55:00Z
---

# One creation path unwritten

## Goal

Settle whether Studio keeps two ways of making an element, and if not, which one survives.

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

## Steps

1. [ ] Name what a `cards` draft is for, if it is for anything the operation path does not already cover.
2. [ ] Decide: converge on the operation path, or state the two purposes and where each belongs.
3. [ ] If they converge, file the implementation item and say what happens to `createdCards`, the `cards` origin in the change pane, and undo across both.

## Files touched

Decision only. The implementation, if there is one, names its own.

## Verify

The answer is recorded where a reader of either path will meet it — `EDIT-023` and `EDIT-024` in `docs/specs/design-editing.md` if it is a rule, an ADR if it is a structural choice.

## Dependencies / blocks

None. Raised under `INFOSCHEMATICS-TOOL-104` and `-105`, distinct from both.

## Documentation impact

### Decision Records

Possibly one, if the answer is that the two paths stay and mean different things.

### Specifications

`EDIT-023` states what a creation whose precondition is unmet must do. Neither it nor `EDIT-024` says whether a creation must reach the document.

### Guides

None until the answer is known.

### Roadmap

`docs/roadmap/_ISSUES.md` reserves `TOOL` through `112`.

## Discussion

Captured on 2026-09-21 while closing `INFOSCHEMATICS-TOOL-104` and `-105`, each a defect in one of the two creation paths where neither touched the other. The question is deliberately left open: a draft Card the host has not been told about may be a coherent thing for an editor to hold, so the item exists to decide that rather than to assume the paths should converge. Until it is decided, a defect in one path says nothing about the other, which is how those two arrived separately.
