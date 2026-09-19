---
id: INFOSCHEMATICS-TOOL-103
area: TOOL
title: One drag, one entry
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 9380b68adb68e58ee176e1f238ca20d910c3dab1
created_at: 2026-09-19T17:15:00Z
updated_at: 2026-09-19T17:45:00Z
---

# One drag, one entry

## Goal

Moving one Card once leaves one entry in the change record, naming where the Card was dropped.

## Context

Found by user-acceptance testing on 2026-09-19, verbatim: _"All I've done is move a box once, and I've got nine entries in the changelog."_ The screenshot shows `CARD-01` selected at `80, 200` with the pane reading "9 written to the document" and nine `CARD-01 -> move:` lines whose `y` values step 140, 160, 160, 180, 180, 180, 200, 200 — the positions the hand passed through on its way.

The reporter's reading of it is the one this follows: the record is a record of changes made, and a drag makes one change. Where it passed through is not a change the Producer chose.

## Boundary

This is about when the authored document is written during a pointer gesture, and therefore what the written record holds. It does not change what a drag does to the diagram, which still follows the pointer live from the draft; it does not change the pending change set, which already consolidated a drag into one line; and it does not change undo, whose gesture grouping this reuses rather than alters.

Two keyboard paths are corrected because they fed the same gesture state, not because the report named them.

## Current state

`App.tsx` projected `editor.artefactOperations` into the authored document from an effect that ran whenever those operations changed — which during a drag is every pointer event past the threshold. Each projection was acknowledged by the host, and each acknowledgement called `editor.recordWritten`, so the pane grew a line per step. The pending set stayed at one line throughout, because `recordArtefactOperation` supersedes a move of the same target: the draft was already saying that a drag is one change while the document was being told it was nine.

The editor already knew when a gesture was running. `gestureOpen` is a ref, set by `checkpoint` and cleared by `closeGesture`, and `releaseDrag` — wired to the Canvas's `onArtefactRelease` for every drag — closes it when the pointer lifts. A ref cannot drive an effect, so the host had no way to ask.

Two paths recorded as though a pointer were coming up when none was: a keyboard step through `moveArtefact(point, exact)` recorded non-discretely, and the Canvas's keyboard resize called `onArtefactResize` without ever calling `onArtefactRelease`. Both left the gesture open until some later discrete edit closed it, which was harmless while nothing read the flag and would have stalled the document write once something did.

## Steps

- [x] Give the editor a reactive `gesturing` alongside the existing ref, set and cleared at the same two points.
- [x] Hold the document projection while a gesture is running, so the pointer lifting is what makes it run.
- [x] Record a keyboard artefact move discretely: it arrives finished and has no release coming.
- [x] Release the Canvas's keyboard resize, for the same reason.
- [x] Prove it in a browser test that drags a Card across eight steps and reads the written record.
- [x] State the rule as `CHANGE-011`.

## Files touched

- `packages/view-studio/src/app/editor/use-editor.ts` — `gesturing`, `checkpoint`, `closeGesture`, `moveSelectedArtefact`
- `packages/view-studio/src/app/App.tsx` — the document projection effect
- `packages/view-canvas/src/InfoschematicDiagram.tsx` — the resize handle's keyboard branch
- `packages/view-studio/src/app/App.browser.test.tsx`
- `docs/specs/change-management.md` — `CHANGE-011`

## Verify

`bun run self:check`, then open Studio with a document host, enter Design, and drag a Card across the canvas in one press: the pane reads "1 written to the document" and the line names where the Card came to rest. A keyboard step writes immediately, as it did before.

## Dependencies / blocks

None. It sits behind `INFOSCHEMATICS-TOOL-100` and `INFOSCHEMATICS-TOOL-102`, which changed what a drag reports rather than when it is written.

## Documentation impact

### Decision Records

None. Writing a gesture at its end is the ordinary reading of what a gesture means; there is no alternative worth recording as a choice.

### Specifications

`CHANGE-011` added to `docs/specs/change-management.md`: a pointer gesture writes the authored document once, carrying the position it ended at, and the positions it passed through are neither written nor recorded; a discrete command writes immediately because it arrives already finished. `CHANGE-001` and `CHANGE-005` already said a gesture is one undo step and one snapshot — this is the same fact about the document rather than about history.

### Guides

None. No guide describes when Studio writes the host's document.

### Roadmap

`docs/roadmap/_ISSUES.md` reserves `TOOL` through `103`.

## Review

### Delivered

Every Step, within the stated Boundary. Baseline `9380b68adb68e58ee176e1f238ca20d910c3dab1`.

### Summary of changes

`useEditor` keeps the existing `gestureOpen` ref and adds `gesturing` state beside it, set in `checkpoint` and cleared in `closeGesture`. A discrete edit does both in one handler, so the two updates batch and the host never observes a gesture at all; only a drag leaves one open across events. `App.tsx` returns early from the document projection while `gesturing` is true and lists it as a dependency, so `releaseDrag` clearing it is what runs the effect — with the final operations, once.

`moveSelectedArtefact` now passes `exact` as the discreteness of the record it makes, which is exactly the keyboard case, and the Canvas's keyboard resize calls `onArtefactRelease` after reporting the new size. Both are gestures that arrive complete, and neither had anything to close them.

The acknowledgement branch is untouched and still runs first, so a document coming back mid-drag is taken as before.

### Verification

`bun run self:check` — green, 48 tasks.

The browser case hosts Studio over a document, opens Design, waits for the editing grid — which is drawn from the editor session rather than from the production mode, and is therefore the signal that a press will drag rather than merely select — then presses a Card and moves it through eight positions. Before the pointer lifts, the written record MUST be empty though the Card has visibly travelled; after it lifts, the record holds exactly one line. On the unfixed code the case fails on the first of those, which is the reported bug in the smallest form a test can hold it.

### Outstanding concerns

A gesture whose pointer is never released — the page loses the pointer without `pointercancel`, say — holds its write until the next discrete edit closes the gesture. The Canvas cancels on `pointercancel` and cleans up on unmount, so the window for this is a browser that reports neither, and the draft is not lost meanwhile: it is still pending, still visible, still undoable.

### Post-change review

The Goal is met. The change is small and its risk is concentrated in one place: anything that opens a gesture and never closes it now delays a document write rather than only muddling undo. That is why the two keyboard paths were corrected in the same pass rather than left — they were the only ones in the repository, and both were already wrong about undo.

Worth saying plainly: the diagram still follows the hand. Only the host's document and the written record wait, which is what makes the record a list of choices instead of a trace of a hand moving.

### Mini recap

One drag wrote the authored document once per pointer event, and the pane accounted for every write, so moving a Card once left nine entries naming positions the Producer passed through. The projection now waits for the pointer to lift. Two keyboard paths that left a gesture open with no release coming were closed in the same pass, and `CHANGE-011` states the rule.

## Done

Closed 2026-09-19 under the standing instruction to progress every record that is not `waiting-for` or `parked`. Awaiting the reporter's own testing pass.

## Discussion

### Why not coalesce at the record instead

The written record could have merged consecutive lines naming the same target, which would have hidden the nine without changing what the host was told. The host is a real consumer — it receives nine document changes, nine model rebuilds and nine chances to persist — so the count in the pane was reporting something true about the system rather than mis-drawing it. Fixing the report would have left the waste and the noise in place for every other host.

### Why the ref stayed

`checkpoint` reads `gestureOpen` synchronously within one pointer event to decide whether a snapshot has already been taken; state would be a render behind and would take a snapshot per event. The ref is right for that and the state is right for the effect, so both are kept and set together rather than one being derived from the other.
