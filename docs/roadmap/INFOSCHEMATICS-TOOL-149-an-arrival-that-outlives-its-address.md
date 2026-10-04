---
id: INFOSCHEMATICS-TOOL-149
area: TOOL
title: An arrival that outlives its address
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-10-04T20:45:00Z
updated_at: 2026-10-04T20:45:00Z
---

# An arrival that outlives its address

## Goal

A reader who follows an address that does not resolve, after an earlier one that did, is not left looking at the earlier arrival as though it were the answer.

## Context

`INFOSCHEMATICS-TOOL-138` made an arrival visible on a read-only Canvas. Its browser look found that a failed address following a resolved one leaves the earlier arrival painted, so the second link appears to have arrived where the first did. `DIAGRAM-013` in `docs/specs/diagram-elements.md` therefore claims only that a first address that does not resolve selects nothing.

## Boundary

Whether a later unresolved address withdraws a standing arrival, and how that is shown. What is addressable and what arriving means stay with `ADR-INFOSCHEMATICS-041`; this may need an amendment to it rather than only a code change.

## Discussion

Raised as a non-blocking finding in the Fable review of `INFOSCHEMATICS-TOOL-138` (2026-10-04). Capture `reports/TOOL-138-arrival/03-address-that-leads-nowhere.png` shows the case.
