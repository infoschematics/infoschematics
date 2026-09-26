---
id: INFOSCHEMATICS-TOOL-144
area: TOOL
title: A record's stale evidence
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-26T00:00:00Z
updated_at: 2026-09-26T00:00:00Z
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

## Discussion

Found on 2026-09-25 by the documentation drift read that [INFOSCHEMATICS-TOOL-135](INFOSCHEMATICS-TOOL-135-where-a-claim-lives.md) performs over the four design documents. It is captured separately because TOOL-135's Boundary says it does not reopen what a Decision Record decided, and directs a disagreement that may reveal a decision was never taken into its own record. This is that case: whether Direct should preselect was arguably never decided, only observed not to happen.

Verified on 2026-09-26 against the working tree rather than carried from the read: the call at `App.tsx:465` is present and is the only one.
