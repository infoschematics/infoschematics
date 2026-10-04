---
id: INFOSCHEMATICS-TOOL-144
area: TOOL
title: A record's stale evidence
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: debb840f7fd296abd5fc0644e3538b65c9c027c9
created_at: 2026-09-26T00:00:00Z
updated_at: 2026-10-04T16:32:48Z
---

# A record's stale evidence

## Goal

A Decision Record's account of what the code does is true of the code as it stands, or the record says which moment it is describing.

## Context

[ADR-INFOSCHEMATICS-026](../decisions/ADR-INFOSCHEMATICS-026-panels-follow-both-axes.md) line 50 states that Direct does not preselect a target when it opens, and gives as the mechanism that `reconcileDirectTargets` "is declared and never called". It is called, at `packages/view-studio/src/app/App.tsx:465`, against the `directTargets` the document yields; the function itself is at `packages/view-studio/src/app/hooks/use-presentation.ts:163`.

So the record's conclusion may still be right — reconciling the available targets is not the same operation as preselecting one — while the evidence it offers for that conclusion is false. A reader checking the record against the code finds the named function wired up and has no way to tell whether the record is stale about the behaviour or only about the mechanism.

## Boundary

One record's account of one function. It does not reopen what `ADR-INFOSCHEMATICS-026` decided about panels following both axes, and it does not change Direct's preselection behaviour: if the right answer turns out to be that Direct should preselect, that is a product change and belongs in its own record rather than in a repair to this paragraph.

The likely repair is to read what `reconcileDirectTargets` now does at its call site, then restate the paragraph in terms of that — which is the difference between reconciling a list and choosing from it — rather than to delete the paragraph, because the observation it records about an empty-feeling panel is still the reason the clause exists.

## Current state

The record's conclusion holds and only its mechanism is stale. `reconcileDirectTargets` (`packages/view-studio/src/app/hooks/use-presentation.ts`) dispatches `reconcile-direct-target`, and `reduceProduction` in `packages/view-present/src/production.ts` handles it by clearing a held target that is no longer among the available targets and otherwise returning the same state; it never sets one. `packages/view-studio/src/app/App.tsx` derives the available targets once through `directOptionsFor` and calls it whenever they change. A target is chosen only by the Producer through `setDirectTarget` from the chooser, so Direct still opens with no target. The sentence is at line 51 of the record, not 50.

## Steps

- [x] Restate the paragraph's mechanism: Studio keeps the active target in step with the targets the document offers, which releases one that has left the document and never chooses one on the Producer's behalf. Keep the observation that Direct does not preselect and that this is the panel's own content rather than the dock's visibility.

## Files touched

`docs/decisions/ADR-INFOSCHEMATICS-026-panels-follow-both-axes.md` only.

## Verify

`grep -n "declared and never called" docs/decisions/ADR-INFOSCHEMATICS-026-panels-follow-both-axes.md` returns nothing, and the restated sentence is checked against the `reconcile-direct-target` case in `packages/view-present/src/production.ts` and the call in `packages/view-studio/src/app/App.tsx`. `ki repo audit --skill ki-decision-records` passes, `bunx rumdl check` is clean on the file, and `bun run self:check` passes.

## Dependencies / blocks

None.

## Documentation impact

### Decision Records

`ADR-INFOSCHEMATICS-026` is amended in place: a correction of its stated evidence under the living-record rule, not a change of what it decided.

### Specifications

None.

### Guides

None.

### Roadmap

None.

## Review

### Delivered

`ADR-INFOSCHEMATICS-026`'s Direct paragraph now gives a mechanism that is true of the code: `reconcileDirectTargets` keeps the active target in step with the targets the document offers, releasing one that has left the document and never choosing one. The observation the paragraph exists to keep - Direct does not preselect a target when it opens, and that is the panel's content rather than the dock's visibility - is unchanged. Excluded and untouched: what the record decided about panels following both axes, and Direct's preselection behaviour. Baseline `debb840f7fd296abd5fc0644e3538b65c9c027c9`; the change is the commit carrying this packet.

### Change Summary

- `docs/decisions/ADR-INFOSCHEMATICS-026-panels-follow-both-axes.md` - one sentence in the paragraph beginning "Direct still does not preselect a target" replaces "`reconcileDirectTargets` is declared and never called" with what the function does. Amended in place under the `ki-decision-records` living-record rule: a correction of stated evidence, not a change of decision, so no new record and no dated note.
- No approved deviation.

### Verification

- Read against code: `reduceProduction`'s `reconcile-direct-target` case in `packages/view-present/src/production.ts` clears a held target absent from the available list and otherwise returns the same state; it never sets one. `packages/view-studio/src/app/App.tsx` derives the list through `directOptionsFor` and calls `reconcileDirectTargets` whenever it changes; a target is set only through `setDirectTarget` from the chooser.
- `grep -n "declared and never called" docs/decisions/ADR-INFOSCHEMATICS-026-panels-follow-both-axes.md` - no match.
- `bunx rumdl check` on the record - no issues.
- `ki repo audit --skill ki-decision-records` - PASS.
- `bun run self:check` - fails for causes outside this change, as recorded on `INFOSCHEMATICS-TOOL-136`: `ROUTE-011` without a conformance state at `638e2818`, and view-canvas token cases against the concurrent uncommitted `INFOSCHEMATICS-TOOL-129` work.

### Outstanding concerns

- Repository-wide `bun run self:check` is red for the unrelated causes above.
- Whether Direct should preselect remains undecided, as the record's Discussion notes; that would be its own product record.

### Post-change review

The goal is met: a reader checking the record against the code now finds the named function doing what the record says. Scope held to one sentence. No regression risk beyond documentation. Ready for acceptance.

### Mini recap

One sentence of `ADR-INFOSCHEMATICS-026` corrected in place to describe reconciliation rather than claim the function is unused; decision records audit passes. Learning route (not promoted): a Decision Record that names a function as evidence ages with that function; prefer stating the behaviour and naming the function as the place to read it.

## Done

Accepted 2026-10-04 by the Fable reviewer on the review packet above, under the owner's delegated estate-push authority. No nits.

## Discussion

Found on 2026-09-25 by the documentation drift read that [INFOSCHEMATICS-TOOL-135](INFOSCHEMATICS-TOOL-135-where-a-claim-lives.md) performs over the four design documents. It is captured separately because TOOL-135's Boundary says it does not reopen what a Decision Record decided, and directs a disagreement that may reveal a decision was never taken into its own record. This is that case: whether Direct should preselect was arguably never decided, only observed not to happen.

Verified on 2026-09-26 against the working tree rather than carried from the read: the call at `App.tsx:465` is present and is the only one.

Adopted 2026-10-04 under the owner's delegated estate-push authority, moved from Triage to Now and shaped to Ready in the same change.
