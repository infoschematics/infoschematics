---
id: INFOSCHEMATICS-TOOL-139
area: TOOL
title: Two creations, one code
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-09-25T00:00:00Z
---

# Two creations, one code

## Goal

Making two [Cards](../reference/vocabulary.md#standard-card) in [Design](../reference/vocabulary.md#design) without saving in between produces two Cards.

## Context

It currently produces one. `createCard` allocates a new Card's code from the **authored** register, so a second creation made before the first has been committed reissues the same code, and `recordArtefactOperation` treats the second as superseding the first rather than as a new element. The pending creation is silently replaced.

The allocator is the whole of it. Placement is exonerated: the browser evidence taken under `INFOSCHEMATICS-TOOL-125` shows the second creation being offered a different position from the first, so the placement search did consult the pending box and the operations layer did know both existed. Only code issuing looked at the authored document alone.

## Boundary

Where a new artefact's code comes from while creations are pending, and nothing about the creation route itself, which `INFOSCHEMATICS-TOOL-112` and [ADR-INFOSCHEMATICS-038](../decisions/ADR-INFOSCHEMATICS-038-a-creation-reaches-the-document-by-one-route.md) settled.

It does not change what a code looks like. [ADR-INFOSCHEMATICS-003](../decisions/ADR-INFOSCHEMATICS-003-authored-identity-codes.md) authors human-readable codes rather than deriving them from order, and that stays: the defect is which register is consulted, not what the register contains.

Whether the same fault reaches other artefact kinds is open and should be established before anything is fixed for Cards alone.

## Discussion

Found on 2026-09-24 while delivering `INFOSCHEMATICS-TOOL-125`, which deliberately did not absorb it — that item was about where a Card lands, this is about what it is called, and the two were equally true before it.

The likely shape is that the allocator has to see the authored register and the pending operations as one namespace, which is the same composition the placement search already does for boxes. If so, the two want the same view of pending state and that view is worth having once rather than twice.
