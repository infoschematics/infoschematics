---
id: INFOSCHEMATICS-TOOL-056
area: TOOL
title: Specification evidence integrity
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-15T05:19:55Z
updated_at: 2026-09-15T15:00:00Z
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

## Current state

The corpus holds 188 requirements across 16 feature areas, citing 128 distinct evidence paths. Two of those paths do not exist — `packages/view-studio/src/app/InfoschematicDiagram.tsx` and `packages/view-studio/src/app/infoschematic-context.tsx` — and between them they are the evidence for ten requirements recorded as conforming.

Of the 188, 177 are conforming, 10 are pending, and 1 is divergent. A further requirement, `DESIGN-017`, carries a `_Conformance:_` value that is not one of the three; `ki repo audit` reports it, but no repository check does.

Nothing in the gate parses the corpus. `//#self:verify:repo` already hashes `docs/**` and `packages/*/src/**`, so a check that reads both needs no change to `turbo.json` inputs — the task already reruns when either side moves.

## Steps

- [ ] Add a repository-level check that parses every requirement, resolves each cited evidence path, and fails naming the requirement and the path that does not exist.
- [ ] Extend the same check to reject a `_Conformance:_` value outside `conforming`, `pending`, and `divergent`, which catches `DESIGN-017` today.
- [ ] Repoint the nine requirements citing `InfoschematicDiagram.tsx` to its home in `packages/view-canvas/src/`, and establish what replaced `infoschematic-context.tsx` before repointing `PRESENT-005`.
- [ ] Run each of the ten verification plans against the code in its new home, rather than repointing on faith, and correct any that no longer hold.
- [ ] Decide each of the eleven non-conforming requirements explicitly: bring it to conforming, restate it to match accepted behaviour, or record why the divergence stands.

## Files touched

- `scripts/specification-evidence.test.ts` — new, joining the repository-level suite
- `docs/specs/appearance.md`, `docs/specs/design-editing.md`, `docs/specs/design-session.md`, `docs/specs/presentation.md` — the ten repointed evidence lines and `DESIGN-017`'s conformance value
- Whichever area files own the eleven non-conforming requirements, depending on each decision

## Verify

`bun run self:verify:repo` passes on a clean corpus, and fails naming the requirement when an evidence path is deliberately broken or a conformance value is deliberately mistyped. Prove both, because a check that parses the corpus but never asserts against it would pass either way.

## Dependencies / blocks

Nothing blocks this. [Cross-feature interaction coverage](INFOSCHEMATICS-TOOL-057-cross-feature-interaction-coverage.md) writes new requirements into the same corpus and is worth more once the evidence lines are mechanically defended, but it does not wait on this.

## Documentation impact

### Decision Records

None. The rule that a requirement cites inspectable evidence is already the corpus's own contract; this item enforces it rather than changing it.

### Specifications

This item is the specification change: ten evidence lines repointed and re-verified, one conformance value corrected, and eleven non-conforming requirements given an explicit outcome.

### Guides

None. The check names the requirement and the path it could not resolve, so the failure needs no accompanying prose.

### Roadmap

None beyond the note above.

## Discussion

### Stale evidence is the recurring failure

The package move was correct; the specifications simply were not carried with it. Repointing the ten paths is an afternoon's work and would silently rot again. The durable part of this item is a mechanical gate: no repository check currently parses the corpus, so an evidence path can stop resolving without any run turning red. A check that every cited path exists is cheap and would have caught all ten.

### Repointing is not re-verifying

Correcting a path is not the same as confirming the requirement still holds. Each of the ten needs its verification plan actually run against the code in its new home, because a component that changed package may well have changed behaviour.

### The eleven are a decision, not a backlog

Each pending or divergent requirement needs an explicit outcome: bring it to conforming, restate it to match accepted behaviour, or record why the divergence stands. `SCENE-006` in particular is divergent rather than pending, so something is known to deviate.
