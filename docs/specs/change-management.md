# Change management — CHANGE

Atomic drafts, undo, reviewable change sets, consolidation, and selective dropping of pending changes. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### CHANGE-001 — Every draft edit can be undone

Studio MUST offer undo and redo for every draft-changing action. One pointer gesture MUST form one undo step even when it produces many pointer events. A discrete command MUST form its own step.

_Conformance:_ conforming

_Verify:_ inspect checkpoints, gesture closure, undo and redo in `packages/view-studio/src/app/editor/use-editor.ts`. against this requirement.

_Evidence:_ checkpoints, gesture closure, undo and redo in `packages/view-studio/src/app/editor/use-editor.ts`.

### CHANGE-002 — Change actions form one control group

Undo, redo, discard and change-set export SHOULD be presented together because they all operate on the same pending set. A disabled action SHOULD remain visible and communicate why it does not currently apply.

_Conformance:_ conforming

_Verify:_ inspect `packages/view-studio/src/app/editor/ChangePane.tsx` and `packages/view-studio/src/app/editor/EditorTools.tsx`. against this requirement.

_Evidence:_ `packages/view-studio/src/app/editor/ChangePane.tsx` and `packages/view-studio/src/app/editor/EditorTools.tsx`.

### CHANGE-003 — Undo history is not persisted

Draft data MAY survive reload, but undo and redo history MUST be scoped to the current mounted editing session.

_Conformance:_ conforming

_Verify:_ inspect draft persistence and in-memory history in `packages/view-studio/src/app/editor/use-editor.ts`. against this requirement.

_Evidence:_ draft persistence and in-memory history in `packages/view-studio/src/app/editor/use-editor.ts`.

### CHANGE-004 — Drafts already reflected by the model are dropped

A pending change whose value the authored model now states MUST be removed. A draft naming a thing the model no longer knows MUST also be removed. Each endpoint and each port-count side MUST be compared independently where one may have caught up without the other.

_Conformance:_ conforming

_Verify:_ `packages/view-studio/src/app/editor/use-editor.test.ts` covers spent component, endpoint and port-count drafts, partial endpoint changes and missing model keys.

_Evidence:_ `packages/view-studio/src/app/editor/use-editor.test.ts` covers spent component, endpoint and port-count drafts, partial endpoint changes and missing model keys.

### CHANGE-005 — Typed operations share one atomic draft lifecycle

Typed artefact operations MUST persist in the same serialisable draft envelope as route, attachment, label, port and text changes. One pointer gesture MUST produce one history snapshot; one discrete operation MUST produce one snapshot. Undo, redo, discard and review MUST observe the same atomic draft value.

The change set MUST order creates before updates and updates before removals. Creation MUST order containers before dependants; removal MUST order dependants before owners. Updates MUST use stable kind, owner, authored index, field and identity order rather than event arrival order.

_Conformance:_ conforming

_Verify:_ inspect `packages/view-studio/src/app/editor/editor-draft.ts`, `packages/view-studio/src/app/editor/artefact-operations.ts`, `packages/view-studio/src/app/editor/source-changes.ts` and `packages/view-studio/src/app/editor/use-editor.ts`. against this requirement.

_Evidence:_ `packages/view-studio/src/app/editor/editor-draft.ts`, `packages/view-studio/src/app/editor/artefact-operations.ts`, `packages/view-studio/src/app/editor/source-changes.ts` and `packages/view-studio/src/app/editor/use-editor.ts`.

### CHANGE-006 — Changes accumulate in one set

Every draft adjustment MUST appear in one reviewable change set. The producer MUST be able to discard the whole set in one action.

_Conformance:_ conforming

_Verify:_ inspect `pending`, `changeCount` and `discard` in `packages/view-studio/src/app/editor/use-editor.ts`. against this requirement.

_Evidence:_ `pending`, `changeCount` and `discard` in `packages/view-studio/src/app/editor/use-editor.ts`.

### CHANGE-007 — One pending change can be dropped

Each independently authored pending change MUST be removable without discarding unrelated changes. Removing that pending change MUST itself be undoable. A derived change MUST remain attached to the change from which it follows.

_Conformance:_ conforming

_Verify:_ inspect pending origins and `drop` in `packages/view-studio/src/app/editor/use-editor.ts`. against this requirement.

_Evidence:_ pending origins and `drop` in `packages/view-studio/src/app/editor/use-editor.ts`.

### CHANGE-008 — A change names what it describes

Every pending change MUST identify the artefact or flow it describes. Selecting a change SHOULD select the described thing, and pointing at either SHOULD make their relationship visible.

_Conformance:_ conforming

_Verify:_ inspect `PendingChange`, selection and hover in `packages/view-studio/src/app/editor/use-editor.ts`. against this requirement.

_Evidence:_ `PendingChange`, selection and hover in `packages/view-studio/src/app/editor/use-editor.ts`.

### CHANGE-009 — Changes are consolidated by property

The change set MUST contain at most one effective entry for a property of an authored thing. A later draft of the same property MUST replace the earlier draft. Entries MUST be ordered deterministically by code and property rather than by time of arrival.

_Conformance:_ conforming

_Verify:_ `packages/view-studio/src/app/editor/use-editor.test.ts` covers natural code ordering and property grouping.

_Evidence:_ `packages/view-studio/src/app/editor/use-editor.test.ts` covers natural code ordering and property grouping.
