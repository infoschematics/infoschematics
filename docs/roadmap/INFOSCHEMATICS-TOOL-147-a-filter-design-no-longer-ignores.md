---
id: INFOSCHEMATICS-TOOL-147
area: TOOL
title: A filter Design no longer ignores
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-10-04T13:30:00Z
updated_at: 2026-10-04T13:30:00Z
---

# A filter Design no longer ignores

## Goal

The design-editing specification agrees with the design-session specification and the code about whether the Scope and Flow-family filters narrow the Design Canvas.

## Context

`EDIT-014` in `docs/specs/design-editing.md` requires that "Design MUST start from complete authored content rather than Audience filters", and its `_Verify:_` line says to "apply an Audience filter and confirm the Design preview ignores it". It is marked `conforming`.

`DESIGN-005` in `docs/specs/design-session.md` requires the opposite, and so does the code. Which Scopes and Flow families are drawn is a question about the Diagram, so the bank that answers it is offered on either axis, its state carries across every move, and Design keeps an artefact reachable by showing which Scopes and families are hidden and letting the Producer restore them. Its `_Verify:_` line hides a Scope, enters Design, and expects the Scope bank to read as off. `packages/view-studio/src/app/hooks/use-presentation.ts` explains the change in its own comment: "The Producer's workspaces used to substitute the complete authored content here". Verified on 2026-10-04.

So a reader following `EDIT-014`'s verification would expect a result the product no longer gives and would read the product as failing. The conforming mark is wrong as well as the wording.

## Boundary

Amend `EDIT-014` so its requirement, `_Verify:_` and `_Evidence:_` lines agree with `DESIGN-005`. The likely shape is that Design materialises its draft over the authored content the Producer's own filters leave drawn, and that Scene focus, which is Present's alone, never narrows it. Check `APPEAR`, `PRESENT` and `CHANGE` requirements for the same stale phrase while there.

It does not change behaviour; the code and `DESIGN-005` already agree. If the review finds the code wrong rather than the specification, that is a different item.

## Discussion

Found on 2026-10-04 by the second drift read under [INFOSCHEMATICS-TOOL-135](INFOSCHEMATICS-TOOL-135-where-a-claim-lives.md), which repaired the same stale claim in `design-view-present.md` and `design-view-studio.md`. Captured rather than repaired there, because that item's Boundary excludes the specification corpus and a specification found to be wrong becomes its own record.
