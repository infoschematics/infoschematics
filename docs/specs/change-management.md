# Change management — CHANGE

Atomic drafts, undo, reviewable change sets, consolidation, and selective dropping of pending changes. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### CHANGE-001 — Every draft edit can be undone

Studio MUST offer undo and redo for every draft-changing action. One pointer gesture MUST form one undo step even when it produces many pointer events. A discrete command MUST form its own step.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-studio`, then edit a draft in Studio and count undo steps against gestures: drag one Card across the canvas — many pointer events, one gesture — and confirm a single undo returns it to where it started rather than part of the way. Then issue a discrete command and confirm it takes its own step. Do this for each draft-changing action the editor offers and confirm every one is reachable by undo and then redo.

_Evidence:_ checkpoints, gesture closure, undo and redo in `packages/view-studio/src/app/editor/use-editor.ts`.

### CHANGE-002 — Change actions form one control group

Undo, redo, discard and change-set export SHOULD be presented together because they all operate on the same pending set. A disabled action SHOULD remain visible and communicate why it does not currently apply.

_Conformance:_ conforming

_Verify:_ Open Studio's editing tools with pending changes present and read the group: undo, redo, discard, and change-set export sit together, because they all act on the one pending set. Then reach a state where one of them cannot apply — no pending changes, nothing to redo — and confirm the action is still on screen, disabled, and says why rather than disappearing and leaving a reader to wonder where it went.

_Evidence:_ `packages/view-studio/src/app/editor/ChangePane.tsx` and `packages/view-studio/src/app/editor/EditorTools.tsx`.

### CHANGE-003 — Undo history is not persisted

Draft data MAY survive reload, but undo and redo history MUST be scoped to the current mounted editing session.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-studio`, then make several draft edits, undo one, reload the page, and try to undo again: the draft data may still be there, and the history must not be. Falsified by an undo after reload that changes anything, which means the history outlived the session that owned it.

_Evidence:_ draft persistence and in-memory history in `packages/view-studio/src/app/editor/use-editor.ts`.

### CHANGE-004 — Drafts already reflected by the model are dropped

A pending change whose value the authored model now states MUST be removed. A draft naming a thing the model no longer knows MUST also be removed. Each endpoint and each port-count side MUST be compared independently where one may have caught up without the other.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-studio`, then set up drafts the model has caught up with: a component moved to where the authored model now places it, an endpoint change the model now states, and a port-count change it now states. Each must drop out of the pending set. Then remove an artefact a draft names and confirm that draft goes too. Change the endpoint but not the port count on one Flow and confirm only the spent half is dropped — comparing them together is how a live change disappears with a spent one.

_Evidence:_ `packages/view-studio/src/app/editor/use-editor.test.ts` covers spent component, endpoint and port-count drafts, partial endpoint changes and missing model keys.

### CHANGE-005 — Typed operations share one atomic draft lifecycle

Typed artefact operations MUST persist in the same serialisable draft envelope as route, attachment, label, port and text changes. One pointer gesture MUST produce one history snapshot; one discrete operation MUST produce one snapshot. Undo, redo, discard and review MUST observe the same atomic draft value.

The change set MUST order creates before updates and updates before removals. Creation MUST order containers before dependants; removal MUST order dependants before owners. Updates MUST use stable kind, owner, authored index, field and identity order rather than event arrival order.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-studio`, then make a route change, an attachment change, a label edit, a port-count edit, and a typed artefact operation, and read the persisted draft: one serialisable envelope holds all of them. Confirm one pointer gesture produced one snapshot and one discrete operation produced one, and that undo, redo, discard, and the review pane all read the same draft value rather than their own copies. Then export the change set and confirm creates come before updates and updates before removals.

_Evidence:_ `packages/view-studio/src/app/editor/editor-draft.ts`, `packages/view-studio/src/app/editor/artefact-operations.ts`, `packages/view-studio/src/app/editor/source-changes.ts` and `packages/view-studio/src/app/editor/use-editor.ts`.

### CHANGE-006 — Changes accumulate in one set

Every draft adjustment MUST appear in one reviewable change set. The producer MUST be able to discard the whole set in one action.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-studio`, then make draft adjustments of several kinds and open the review: every one of them is in the single change set, with a count that matches what was done. Discard once and confirm the whole set goes in that one action. Falsified by an adjustment that is in effect but not in the set, which is a change a Producer cannot review or discard.

_Evidence:_ `pending`, `changeCount` and `discard` in `packages/view-studio/src/app/editor/use-editor.ts`.

### CHANGE-007 — One pending change can be dropped

Each independently authored pending change MUST be removable without discarding unrelated changes. Removing that pending change MUST itself be undoable. A derived change MUST remain attached to the change from which it follows.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-studio`, then build a pending set holding several independently authored changes plus one derived from another. Drop a single change and confirm the unrelated ones stand; undo and confirm the drop itself is undoable; then drop the change the derived one follows and confirm the derived change goes with it rather than being left pointing at nothing.

_Evidence:_ pending origins and `drop` in `packages/view-studio/src/app/editor/use-editor.ts`.

### CHANGE-008 — A change names what it describes

Every pending change MUST identify the artefact or flow it describes. Selecting a change SHOULD select the described thing, and pointing at either SHOULD make their relationship visible.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-studio`, then read each pending change and confirm it names the artefact or flow it describes. Select the change and confirm the described thing is selected; hover each of the two and confirm the relationship is visible from either end. Falsified by a pending entry a reader cannot trace to a thing on the diagram.

_Evidence:_ `PendingChange`, selection and hover in `packages/view-studio/src/app/editor/use-editor.ts`.

### CHANGE-009 — Changes are consolidated by property

The change set MUST contain at most one effective entry for a property of an authored thing. A later draft of the same property MUST replace the earlier draft. Entries MUST be ordered deterministically by code and property rather than by time of arrival.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-studio`, then draft the same property of the same thing twice with different values: the change set must hold one effective entry, the later one. Draft changes to several things in a scattered order and read the entry order — it must follow authored code and property, so the same set of edits made in a different sequence lists identically. Falsified by an order that reflects when each edit arrived.

_Evidence:_ `packages/view-studio/src/app/editor/use-editor.test.ts` covers natural code ordering and property grouping.

### CHANGE-010 — A change that leaves the pending set is accounted for

A pending change removed because the authored document now carries it MUST remain visible to the Producer as a record of what was written, distinct from what is still pending. An empty pending set MUST NOT be presented as an untouched session while changes have been written in it. The record MAY be read-only: a written change is no longer the editor's to select, drop or discard.

_Conformance:_ conforming

_Verify:_ Run `bun run test:browser --filter=@infoschematics/view-studio`, then in Design make a typed artefact edit and watch the change list: the line appears and then leaves it as the document takes the change. Read the pane afterwards — it MUST still say that change was written, and MUST NOT be showing the prompt it shows a Producer who has done nothing. Falsified by a pane that empties on success, which is the state a Producer cannot tell from a lost edit.

_Evidence:_ the written record in `packages/view-studio/src/app/editor/ChangePane.tsx`, fed from the document acknowledgement in `packages/view-studio/src/app/App.tsx`.

### CHANGE-011 — A gesture writes the document once, where it ended

A pointer gesture that edits authored geometry MUST write the authored document once, carrying the position the gesture ended at. The positions it passed through MUST NOT be written, and MUST NOT appear in the record of written changes. A discrete command — a keyboard step, a numeric placement, an action from a control — MUST write immediately, because it arrives already finished and has no end to wait for.

_Conformance:_ conforming

_Verify:_ Run `bun run test:browser --filter=@infoschematics/view-studio`, then in Design drag one Card across the canvas in a single press and read the written record: it MUST hold one line, naming where the Card was dropped. Falsified by a record holding one line per pointer event, each naming a position the Producer travelled through rather than chose.

_Evidence:_ the gesture guard on the document projection in `packages/view-studio/src/app/App.tsx`, `gesturing` in `packages/view-studio/src/app/editor/use-editor.ts`, and the drag case in `packages/view-studio/src/app/App.browser.test.tsx`.
