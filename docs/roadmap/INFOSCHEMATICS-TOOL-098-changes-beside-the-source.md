---
id: INFOSCHEMATICS-TOOL-098
area: TOOL
title: Changes beside the source
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: ccec3f412965801b60139b31a9d783f357d7a6ca
created_at: 2026-09-19T13:06:00Z
updated_at: 2026-09-19T13:36:00Z
---

# Changes beside the source

## Goal

Give a Producer one account of what they have done, so a change that succeeds does not read the same as a change that was lost.

## Context

Raised by user-acceptance testing on 2026-09-19, third item of the 12:10 recording, verbatim: _"I'm wondering as well, as change has now lost its need, because we've now got the source on this tab, if we're making changes to the source directly, rather than having a set of changes. So what I mean for example is I click this and move this, we still see it briefly on the change list and it disappears."_

Two observations are in there, and only the second is evidence.

The first is a question: if the Studio writes the source and a Producer can read it, is a separate pending-change list still earning its place?

The second is a behaviour: a change appears in the change list and then leaves it. That is the projection path working as designed — a typed artefact operation is written into the authored document as soon as it succeeds, and stops being pending — but from the outside it reads as a list that loses things.

## Boundary

This is about the change list's account of its own contents. It does not change undo, redo or discard semantics, the projection path in `App.tsx`, the consolidation rules, or what a projected edit does to the authored source. It does not remove the change list: the reporter raised a question, and answering it by deletion would take a reversible affordance away on the strength of one observation about flicker.

## Current state

`ChangePane` renders `editor.pending` in Design and a layer-specific list elsewhere, with a count, and falls back to a prompt — _"Drag a flow label to place it, or select a component to change its ports."_ — when the count is zero.

The flicker has one specific cause, and it is narrower than "changes disappear". `App.tsx`'s projection effect takes the editor's typed artefact operations, projects them into the authored document, and offers the result to the host through `onDocumentChange`. When the host hands that document back, `isStudioDocumentAcknowledgement` recognises it and the effect calls `editor.discardOne(origin)` for every artefact-operation origin it emitted. So a typed artefact operation — a Region created, a Point moved, an artefact resized or reordered — passes through the pending list on its way into the document. Route, attachment, label, port and text drafts do not: they stay pending until a Producer acts on them.

Two classes of edit with visibly different lifecycles in one list, and nothing in the list saying which is which.

## Steps

- [x] Keep the pending list. It is the handle for discarding one change without undoing the sequence, and nothing else offers that.
- [x] Record every change line the Studio hands to the host, and keep it once the host takes it.
- [x] Show that record beneath the pending list, set back and read-only — a written change is no longer the editor's to select, drop or discard.
- [x] Withhold the fresh-session prompt while anything has been written, so emptiness after a successful edit does not read as emptiness before any edit.
- [x] Prove it in a browser: make a typed artefact edit, watch the line leave the pending list, and assert it is still accounted for.

## Files touched

- `packages/view-studio/src/app/editor/use-editor.ts` — `written` state and `recordWritten`
- `packages/view-studio/src/app/App.tsx` — the emitted document carries its change lines; the acknowledgement records them before dropping the origins
- `packages/view-studio/src/app/editor/ChangePane.tsx`, `packages/view-studio/src/app/panels/DetailsPanel.tsx`, `packages/view-studio/src/styles.css`
- `packages/view-studio/src/app/App.browser.test.tsx`, `packages/view-studio/src/app/panels/DetailsPanel.artefacts.test.tsx`
- `docs/specs/change-management.md` — CHANGE-010; `apps/site/content/studio.md`

## Verify

`bun run self:check`, then open the playground in Design and create a Region: the change appears in CHANGES and moves to the written record beneath, which keeps a count. Then drag a Flow label: that change stays pending, because nothing has taken it, and the two lists show the difference.

## Dependencies / blocks

None. `EDIT-003` requires every route change to be represented and `DESIGN-002` requires the Studio not to write authored source; both remain true, and the second is why a change can leave the pending set in the first place — the host takes it, the Studio does not write it.

## Documentation impact

### Decision Records

None. The lifecycle this makes visible is already decided — `ADR-INFOSCHEMATICS-020` gives the host authority over authored source, and this is a reporting change downstream of it.

### Specifications

`CHANGE-010` added to `docs/specs/change-management.md`: a pending change removed because the document now carries it stays visible as a record, and an empty pending set is not presented as an untouched session while changes have been written in it.

### Guides

`apps/site/content/studio.md` gains one bullet in "Drafts and the handoff", beside the consolidation and discard bullets, saying that a change the host has taken leaves the pending set and is listed beneath it as written.

### Roadmap

None raised.

## Review

### Delivered

Every Step, within the stated Boundary. Baseline `ccec3f412965801b60139b31a9d783f357d7a6ca`.

The Shaping left three questions for the user. Under the instruction to progress every `now` item to `done`, they were decided here:

**What does the list assert?** "Not yet taken into the authored document." That is what it has always meant, and it is correct — the disappearance was the list being right and silent about it. The fix is the second list, not a change to the first.

**Does the Source tab replace it?** No. The Source tab shows the document, not the difference; a Producer asking "what did I just change" gets an answer from a diff, not from a document. Reading a moved Card's new coordinates out of the source means already knowing the old ones.

**What does it say while it is empty?** What was written this session. That is a stronger answer than a count of edits applied, because the line it shows is the same line the Producer watched appear.

### Summary of changes

`use-editor.ts` holds `written`, a session log of change lines, most recent first, and `recordWritten` to append to it. Nothing clears it: `discard` drops what is still pending, and undoing a written change writes the undo, which appears as its own line. It is a log of what happened, not a model of current state, and treating it as state is the way this becomes wrong.

`App.tsx` already computed the artefact-operation origins it was about to emit; it now keeps the corresponding change lines on `emittedDocument.current` alongside them, and calls `editor.recordWritten` in the acknowledgement branch immediately before dropping the origins. Recording on acknowledgement rather than on emission is deliberate: an offer the host declines leaves the change pending, and logging it as written would be a lie the Producer could check.

`ChangePane` renders the record beneath the pending list, styled back in `#7892ad` with a rule above it, as plain `li`s with no select, hover or drop control. The fresh-session prompt is now withheld when anything has been written.

### Verification

`bun run self:check` — 48 tasks, all successful.

A browser case in `App.browser.test.tsx` creates a Region twice against a hosted Studio that takes every document offered, and asserts both halves of the move each time: the pending list is empty and the written record holds the line, with the count reading `1 written to the document` and then `2`. It also asserts the fresh-session prompt is present before the first edit and absent after it, which is the specific reading the reporter had.

The case is non-vacuous by construction: before this change `.change-written` does not exist, so every written assertion reads zero and fails, and the prompt assertion fails in the opposite direction.

### Outstanding concerns

None blocking. Two judgements worth stating.

The record is per-session and is not persisted, while drafts are. A Producer who reloads keeps their pending changes and loses the account of what was already written — which is defensible, because what was written is in the document they reloaded, but it does mean the two halves of the pane have different lifetimes and nothing says so.

The record grows without bound in a long sitting. Forty written lines will push the pending list up the pane. A cap, or a collapsed summary with the last few lines, is the obvious next move if that is what it feels like in use; it was not done now because a cap chosen without watching someone work is a guess.

### Post-change review

The Goal is met for the case that was reported. The risk is the one named above: a session log placed in a pane otherwise made of live state invites being read as live state, and the only thing preventing that is that it says "written to the document" rather than "changes". If a Producer reads it as pending, the count will look wrong to them, and the fix would be wording rather than behaviour.

The narrower risk is that `recordWritten` sits in an effect that runs on every render. It is guarded by the acknowledgement check and returns early on an empty list, and the existing `discardOne` calls in the same branch have the same shape, so it adds no new loop hazard — but the guard is the acknowledgement, not the record, and a future change that moves the record out of that branch would need its own.

### Mini recap

A typed artefact edit is written into the document the moment it succeeds, so it passed through the change list and left — and success looked exactly like a lost edit. The pending list stays and still means "not yet taken"; a second, read-only record beneath it says what has been, and the fresh-session prompt is withheld once anything has. The reporter's other question — whether the Source tab makes the change list unnecessary — is answered no: a document is not a diff.

## Done

Accepted 2026-09-19 by Kris Brown on the review packet above.

## Discussion

### Why the flicker was worth keeping as evidence even though the list stays

The reporter did not complain about correctness; they complained that something appeared and vanished. A control whose success state is indistinguishable from a control losing data is a reporting problem regardless of what is decided about the list's existence, and it was the concrete, reproducible half of the item.

### Why "change has lost its need" is not true

A pending list is the handle for discarding one change without undoing the sequence — `onDiscardOne` exists for that, and `CHANGE-007` requires it. If the list goes, that capability needs somewhere else to live or it goes with it, and undo-only recovery is coarser than what a Producer has today. The Source tab offers neither: it is a document, and a document cannot tell you which of its lines you are responsible for.

### Recording on acknowledgement, not on emission

The Studio offers a document and the host decides. A host may decline — validation, a rejected commit, a read-only session — and `App.tsx` already handles that by leaving the change pending. Logging at the point of offer would report work that did not happen, and the Producer would find out by reading the document. The acknowledgement is the only moment the Studio knows the change is real.

### Why the two lifecycles were invisible

Nothing in the pane distinguished a change that would leave on its own from one that would sit until acted on, and both were true of different rows at the same time. That is a harder thing to notice than a bug, because each row is individually correct; only watching one row behave unlike its neighbour reveals it. The written record does not remove the difference — it gives the departing row somewhere to go, which is what makes the difference legible.
