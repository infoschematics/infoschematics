---
id: INFOSCHEMATICS-TOOL-056
area: TOOL
title: Specification evidence integrity
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-15T05:19:55Z
updated_at: 2026-09-15T05:19:55Z
---

# Specification evidence integrity

## Goal

Make every accepted requirement in the Specifications corpus provably tested, so a conforming state is backed by evidence that still exists and still exercises the behaviour it claims.

## Context

The corpus holds 170 requirements across 16 feature areas. Structurally it is in good order: every requirement carries a conformance state, a verification plan, and an evidence line. The weakness is that nothing checks whether those evidence lines remain true.

Ten requirements currently cite evidence at paths that no longer exist. All ten point into `packages/view-studio/src/app/`, and nine name `InfoschematicDiagram.tsx`, which has since moved to `packages/view-canvas/src/`; the tenth names `infoschematic-context.tsx`, which no longer exists under any name in that directory. The affected requirements are `APPEAR-013`, `EDIT-005`, `EDIT-006`, `EDIT-007`, `EDIT-010`, `DESIGN-006`, `DESIGN-011`, `DESIGN-012`, `PRESENT-004`, and `PRESENT-005`. Each is recorded as conforming on proof that cannot be inspected.

A further eleven requirements are not conforming: `APPEAR-005` through `APPEAR-009`, `DIRECT-001`, `DIRECT-002`, `STATIC-001`, `STATIC-002`, and `STATIC-013` are pending, and `SCENE-006` is divergent. Those are honestly recorded rather than hidden, but they are the concrete list of accepted behaviour without conforming verification.

## Boundary

This item does not rewrite the specification format, renumber requirements, relax a requirement to match the implementation, or accept the candidates sitting in the unnumbered Gaps sections. Discovering cross-feature usability collisions is separate work.

## Discussion

### Stale evidence is the recurring failure

The package move was correct; the specifications simply were not carried with it. Repointing the ten paths is an afternoon's work and would silently rot again. The durable part of this item is a mechanical gate: no repository check currently parses the corpus, so an evidence path can stop resolving without any run turning red. A check that every cited path exists is cheap and would have caught all ten.

### Repointing is not re-verifying

Correcting a path is not the same as confirming the requirement still holds. Each of the ten needs its verification plan actually run against the code in its new home, because a component that changed package may well have changed behaviour.

### The eleven are a decision, not a backlog

Each pending or divergent requirement needs an explicit outcome: bring it to conforming, restate it to match accepted behaviour, or record why the divergence stands. `SCENE-006` in particular is divergent rather than pending, so something is known to deviate.
