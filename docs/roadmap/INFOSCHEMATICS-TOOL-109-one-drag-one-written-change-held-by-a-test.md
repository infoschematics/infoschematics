---
id: INFOSCHEMATICS-TOOL-109
area: TOOL
title: One drag, one change
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 2bb93074089bda6dbbca0c3d6707ad99c7e68074
created_at: 2026-09-21T18:15:00Z
updated_at: 2026-09-21T23:55:00Z
---

# One drag, one change

## Goal

A drag is written to the document when the hand lets go, once, and nothing the Producer can do from the diagram makes it write on every step again.

## Context

Reported on 2026-09-21 as part of the node-dragging defects, asking for a flag that withholds the projection while a drag is in hand. The behaviour asked for already exists: `INFOSCHEMATICS-TOOL-102`'s work landed it in `62292ab4` under the name `gesturing` rather than `dragging`.

What did not exist was anything holding it there from the Producer's side. The existing case asserted the record after a drag; nothing asserted the Card's own position frame by frame, and nothing would have caught the guard being removed except by the record count.

## Boundary

Test coverage for the gesture guard. No second flag, no change to how a gesture opens or closes, no change to what is written.

## Current state

`use-editor.ts` holds `gestureOpen` as a ref and `gesturing` as state, set in `checkpoint` and cleared in `closeGesture`; `App.tsx`'s projection effect returns early while `editor.gesturing`. A duplicate `dragging` flag would restate that in a second name, which is what `INFOSCHEMATICS-TOOL-105` was filed against elsewhere in the editor.

## Steps

- [x] Establish that the guard exists, and under what name, before adding anything.
- [x] Host Studio over a document that writes its changes back, drag a Card across several pointer moves, and assert the Card is drawn at the pointer on each of them.
- [x] Assert no position the Card has already been drawn at is drawn again, by collecting every transform rather than polling for the last one.
- [x] Assert the host is told nothing until the pointer lifts, and then exactly once.
- [x] Prove the case is load-bearing by removing the guard and watching it go red.

## Files touched

- `packages/view-studio/src/app/App.browser.test.tsx` — a dragged Card only ever moves the way the pointer moves

## Verify

`bun run self:check`. Then remove `if (editor.gesturing) return` from the projection effect in `App.tsx`: the case fails on the write count, six writes where none is allowed. Restore it and the suite is green.

## Dependencies / blocks

None. The behaviour it holds was delivered under `INFOSCHEMATICS-TOOL-102`.

## Documentation impact

### Decision Records

None.

### Specifications

None. `CHANGE-011` already states that a gesture writes the document once, where it ended; its `_Evidence:_` now names both drag cases.

### Guides

None.

### Roadmap

`docs/roadmap/_ISSUES.md` reserves `TOOL` through `112`.

## Review

### Delivered

Every Step, within the stated Boundary. Baseline `2bb93074089bda6dbbca0c3d6707ad99c7e68074`, delivered in `41e71a38`.

### Summary of changes

One browser case. It drags a Card down six grid lines against a hosted Studio that applies each change back into the document it renders, waits for the Card to reach each expected position, and reads every transform the Card is drawn at through a `MutationObserver` rather than sampling the attribute afterwards — a shake is two frames, and the second hides the first from anything that reads after the fact.

### Verification

`bun run self:check` — green, 48 tasks. With the guard removed the case fails.

### Outstanding concerns

Worth stating plainly: with the guard removed, the positions the Card was _drawn_ at still tracked the pointer in this harness, because the drag's delta is taken from where the press landed rather than from the last frame. So the no-backward-step assertion alone would not have caught the defect — the write count is what the guard is observable through here. A reproduction where the round trip actually lands a stale frame would need the document write to be slow enough to interleave, which the test harness applies synchronously.

The asked-for `dragging` flag was not added. A second name for a rule already stated is the thing `INFOSCHEMATICS-TOOL-105` was filed against.

### Post-change review

The right outcome for a defect whose fix already existed: prove it, name where it lives, and leave no second copy of the rule behind.

### Mini recap

The guard that keeps a drag from being written on every pointer step already existed, as `gesturing`. It now has a test that goes red without it.

## Done

Closed 2026-09-21 under the standing instruction to progress every record that is not `waiting-for` or `parked`. Awaiting the reporter's own testing pass.

## Discussion

Raised with `INFOSCHEMATICS-TOOL-108`, `-110` and `-111` from the same dragging session. The flag it asked for turned out to exist already: `INFOSCHEMATICS-TOOL-102` landed it in `62292ab4` under the name `gesturing`. So the item became coverage rather than behaviour, which is worth keeping rather than closing as invalid — the guard was load-bearing and nothing but a record count would have noticed it being removed.
