---
id: INFOSCHEMATICS-TOOL-112
area: TOOL
title: One creation path unwritten
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 0a41cbb1952944312efcfe1f2374125b9338737f
created_at: 2026-09-21T18:15:00Z
updated_at: 2026-09-22T14:07:29Z
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

- [x] Take the decision and record it: whether a `cards` draft is for anything the operation path does not cover, and if not, that creation converges on the operation path.
- [x] Route `createCard` through the same `CreateArtefactOperation` the Library path produces, so one kind of creation reaches the document by one route.
- [x] Retire what the draft map carried: `createdCards`, the `map: 'cards'` origin in the change pane, and any undo that depended on the draft rather than on the operation.
- [x] Hold the convergence with a test that asserts a control-made Card reaches the projected document, which is the assertion whose absence let the two paths carry separate defects.
- [x] State the rule where a reader of either path meets it, in `EDIT-023` and `EDIT-024` of `docs/specs/design-editing.md`.

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

## Review

### Delivered

Every Step, within the stated Boundary. The decision the record left open was taken as part of delivery, as its Adoption note said it would be: the paths converge.

### Summary of changes

`editor.createCard` is gone, and with it the `cards` draft map it wrote into. `createCard` now lives in `packages/view-studio/src/app/App.tsx`, where it still makes the Infoschematic-shaped decisions a creation needs — the Scope, its prefix, the next free code allocated against `infoschematicRegister.all`, and the room a new Card is given — and then expresses them as a `CardConfig` handed to `editor.createArtefact`. That is the same call the Library and the artefact factories make, so a control-made Card is projected by `projectStudioDocumentOperations` exactly as a Library-made one is.

`nextArtefactIndex` in `packages/view-studio/src/app/editor/artefact-operations.ts` is new, and is the one expression of where a creation lands: after everything authored and everything already created. `DetailsPanel` and `App` both use it, so two Cards made in a row cannot land on each other and no surface can hold a different idea of the end of the document.

An Adapter seeds its box from the Card it clasps. Per `ADR-INFOSCHEMATICS-036` that box is a legal starting value only — the Adapter is drawn at what it holds, wherever that goes — so seeding it is about the operation being well formed rather than about the drawing.

`use-editor.ts` lost the whole `cards` seam: the `create-card` field, `setCards`, `createdCards`, the `map: 'cards'` change-pane origin, and the `cards[...]` reads in `ordered`, `retext`, `remove`, the sweep and `discardOne`. `editor-draft.ts` dropped `CardCreation` from `EditorDraft`, and `infoschematic-editable.ts` no longer takes a `createdCards` parameter. The `CreatedComponent` seam itself stays in View Model and View Canvas, which is outside this record's Files touched and serves the created-Flow path.

`ADR-INFOSCHEMATICS-042` records the decision and why the alternative was rejected. `EDIT-023` gained the requirement that every creation reach the document by the same route whichever surface offers it; `EDIT-024` gained the requirement that a code be allocated against the document register rather than a surface's own record.

### Verification

`bun run self:check` — green, 48 of 48 tasks.

A new browser case in `packages/view-studio/src/app/App.browser.test.tsx` mounts Studio against a host that echoes its document, makes a Card from the control, and asserts it appears among the drawn artefacts carrying a code with the document Scope's own prefix, then that undo takes it back out. It reads the document the host holds rather than the editor's draft, which is precisely the distinction the two paths disagreed about: before this change the Card was drawn from `createdCards` and the assertion would have passed against a document that never received it. It is asserted through the host echo for that reason.

Studio was opened in a browser at `/playground/` and a Card made from the control, per `AGENTS.md`. It is drawn, selected, coded `SCOPE-PIPELINE-01` from the document's own Scope prefix, and the change pane reads `SCOPE-PIPELINE-01 -> create card at 22`. The drawing is itself the evidence: the Card now appears only because the host echoed the document back, so seeing it means the document received it. Captured at `reports/tool-112-card-made-from-control.png`.

### Outstanding concerns

A Studio given no `onDocumentChange` no longer draws a Card made from the control. Argued and accepted in the ADR: it was already true of every other kind, so the alternative was keeping one kind working by a mechanism nothing else used.

A persisted draft holding a `cards` map is ignored rather than migrated. Those entries described creations that never reached a document, so there is nothing to carry forward.

The browser look showed the new Card placed over an authored Fabric. `roomForCard` steps along by count and does not consult what is already drawn, so it can land on something. That is unchanged by this work and is exactly what `INFOSCHEMATICS-TOOL-113`'s `artefacts-overlap` rule measures; it belongs to placement, not to the creation route, and is not folded in here.

### Post-change review

The useful part was that the convergence forced two decisions into the open that had been sitting inside one path each. Where a creation lands was computed twice with two different counts; what an Adapter starts as was implicit in a draft that never had to be a legal operation. Neither was named in the record's Steps, and neither could be left unstated once there was one route, which is the argument for converging rather than documenting the split.

### Mini recap

Studio made an element two ways and only one of them reached the document. It now makes one: a create operation the projection carries, offered from the Library, the factories and the element controls alike. The `cards` draft map is retired rather than repurposed, because nothing in the product wanted what it was holding. A browser case asserts a control-made Card in the document the host holds, and undo taking it back out — the assertion whose absence let `-104`, `-105` and `-106` be found and fixed three separate times.

## Done

Making an element in Studio reaches the document by one route: a create operation the projection carries, offered alike from the Library, the artefact factories and the element controls. The `cards` draft map is retired, one expression says where a creation lands, and a control-made Card is asserted in the document the host holds rather than in the editor's own draft.

## Discussion

Captured on 2026-09-21 while closing `INFOSCHEMATICS-TOOL-104` and `-105`, each a defect in one of the two creation paths where neither touched the other. The item was captured without assuming the paths should converge: a draft Card the host has not been told about may be a coherent thing for an editor to hold. What argues the other way is the defect history — while the question stays open, a defect in one path says nothing about the other, which is how those two arrived separately.

### Adoption

Adopted for immediate work on 2026-09-21. The decision is taken as part of delivery rather than ahead of it, and `ADR-INFOSCHEMATICS-032` is the precedent: the same question was answered once for Points, from the Library, and never generalised to the artefact kinds that came after.
