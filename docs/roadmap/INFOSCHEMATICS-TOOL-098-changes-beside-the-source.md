---
id: INFOSCHEMATICS-TOOL-098
area: TOOL
title: Changes beside the source
theme: tool
horizon: soon
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-19T13:06:00Z
updated_at: 2026-09-19T13:06:00Z
---

# Changes beside the source

## Goal

Settle what the change list is for now that the authored source is visible on its own tab, so a Producer making an edit sees one account of what they have done rather than a list that flickers and a document that updates.

## Context

Raised by user-acceptance testing on 2026-09-19, third item of the 12:10 recording, verbatim: _"I'm wondering as well, as change has now lost its need, because we've now got the source on this tab, if we're making changes to the source directly, rather than having a set of changes. So what I mean for example is I click this and move this, we still see it briefly on the change list and it disappears."_

Two observations are in there, and only the second is evidence.

The first is a question: if the Studio writes the source and a Producer can read it, is a separate pending-change list still earning its place?

The second is a behaviour: a move appears in the change list and then leaves it. That is the consolidation path working as designed — a completed edit is projected into the document and stops being pending — but from the outside it reads as a list that loses things. The list's own account of a change is briefer than the change.

## Boundary

This is about the change list's purpose and its relationship to the Source tab. It does not change undo, redo or discard semantics, the consolidation rules in `document-operations.ts`, or what a projected edit does to the authored source. It does not remove the change list on this evidence alone — the reporter raised a question, and answering it by deletion would take a reversible affordance away on the strength of one observation about flicker.

## Shaping

Three questions, in order.

**What does the list assert?** Today `ChangePane` shows `editor.pending` in Design and a layer-specific list elsewhere, with a count. If pending means "not yet projected", the disappearance the reporter saw is correct and the list is doing its job silently. If a Producer reads it as "what I have changed in this session", it is wrong, because it empties as work succeeds.

**Does the Source tab replace it?** The Source tab shows the document, not the difference. A Producer asking "what did I just change" gets an answer from a diff, not from a document; reading a moved Card's new coordinates out of the source means knowing the old ones. So source alone probably does not replace it, and the honest alternative to the pending list is a session diff.

**If it stays, what does it say while it is empty?** An empty list after a successful edit currently looks like a lost edit. A line naming what was consolidated, or a count of edits applied this session, would make the emptiness mean something.

Known dependencies: none in build order. `EDIT-003` requires every route change to be represented and `DESIGN-002` requires the Studio not to write authored source, so both remain true whichever answer is taken.

Promotion condition: the first question answered — what the list asserts — since the other two follow from it.

## Discussion

### Why the flicker is worth keeping as evidence even if the list stays

The reporter did not complain about correctness; they complained that something appeared and vanished. A control whose success state is indistinguishable from a control losing data is a reporting problem regardless of what is decided about the list's existence, and it is the concrete, reproducible half of this item.

### Why "change has lost its need" is not obviously true

A pending list is the handle for discarding one edit without undoing the sequence — `onDiscardOne` exists for that. If the list goes, that capability needs somewhere else to live or it goes with it, and undo-only recovery is coarser than what a Producer has today.
