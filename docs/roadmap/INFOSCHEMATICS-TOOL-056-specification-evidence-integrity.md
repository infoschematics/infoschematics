---
id: INFOSCHEMATICS-TOOL-056
area: TOOL
title: Specification evidence integrity
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 6c48dc0332cceb39900858bc2480423fb6798844
created_at: 2026-09-15T05:19:55Z
updated_at: 2026-09-16T10:35:00Z
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

The corpus holds 187 requirements across 16 feature areas, citing 128 distinct evidence paths. Two of those paths do not exist — `packages/view-studio/src/app/InfoschematicDiagram.tsx` and `packages/view-studio/src/app/infoschematic-context.tsx` — and between them they are the evidence for ten requirements recorded as conforming.

Of the 187, 176 are conforming, 10 are pending, and 1 is divergent. A further requirement, `DESIGN-017`, carries a `_Conformance:_` value that is not one of the three; `ki repo audit` reports it, but no repository check does.

Nothing in the gate parses the corpus. `//#self:verify:repo` already hashes `docs/**` and `packages/*/src/**`, so a check that reads both needs no change to `turbo.json` inputs — the task already reruns when either side moves.

## Steps

- [x] Add a repository-level check that parses every requirement, resolves each cited evidence path, and fails naming the requirement and the path that does not exist.
- [x] Extend the same check to reject a `_Conformance:_` value outside `conforming`, `pending`, and `divergent`, which catches `DESIGN-017` today.
- [x] Repoint the nine requirements citing `InfoschematicDiagram.tsx` to its home in `packages/view-canvas/src/`, and establish what replaced `infoschematic-context.tsx` before repointing `PRESENT-005`.
- [x] Run each of the ten verification plans against the code in its new home, rather than repointing on faith, and correct any that no longer hold.
- [x] Decide each of the eleven non-conforming requirements explicitly: bring it to conforming, restate it to match accepted behaviour, or record why the divergence stands.

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

## Review

### Delivered

The gate now reads the Specifications corpus. Every requirement's conformance state must be one of the three the format allows, and every path or file name cited on a `_Verify:_` or `_Evidence:_` line must resolve. The corpus is clean against both: 187 requirements, 184 conforming and 3 divergent, citing 140 distinct paths that all exist.

### Summary of changes

- `scripts/specification-evidence.test.ts` — new, in the repository-level suite. Three cases: one recognised conformance state per requirement, cited paths resolve, cited file names name a file that exists somewhere.
- `turbo.json` — `//#self:verify:repo` gains `.dependency-cruiser.ts`, the one cited file outside the paths the task already hashed.
- `docs/specs/appearance.md`, `design-editing.md`, `design-session.md`, `presentation.md` — nine evidence lines repointed, each re-verified in its new home.
- `docs/specs/design-session.md` — `DESIGN-017` and `DESIGN-018` no longer carry their caveat inside the conformance value; `DESIGN-014` is divergent.
- `docs/specs/appearance.md`, `directing.md`, `static-rendering.md` — ten requirements moved from pending to conforming, each with the verification plan and evidence that already existed and had never been written down.
- `docs/specs/scenes-and-callouts.md` — `SCENE-006` stays divergent and says why.
- `packages/view-present/src/presentation.test.ts` — an empty Sequence leaves presentation focus untouched.
- `docs/roadmap/INFOSCHEMATICS-TOOL-069-bounded-playback-profile.md` — new; `docs/roadmap/_ISSUES.md` reserves through `069`.

### Verification

- All three cases were proved by breaking the corpus deliberately, one at a time: a renamed evidence path, a conformance value of `conformant`, and a renamed cited file name. Each failed naming the file, the requirement and what it could not resolve, and each was restored.
- The new `turbo.json` input was proved load-bearing by appending random content to `.dependency-cruiser.ts` and observing `//:self:verify:repo: cache miss`.
- `bun run self:check` green; `ki repo audit --repo .` findings 10 → 8, the two `CONFORMANCE-1` failures gone and nothing added.
- Each of the nine repointings was checked against the code rather than repointed on faith, and two were wrong: `DESIGN-012`'s selected-flow derivation is in Canvas now, with the attachment presentation in `FlowEnds.tsx`; `PRESENT-005`'s geometry is derived by View Model's runtime and reaches Canvas through `runtime-context.tsx`. `EDIT-005` and `DESIGN-011` cited View Studio's stylesheet for port and route rules that live in Canvas's.

### Outstanding concerns

`EDIT-005` and `DESIGN-011` now cite Canvas's stylesheet, but View Studio's still carries near-identical `.audit-port` and `.infoschematic-route-hit` rules. Which one a reader is looking at when both are loaded is [Editor stylesheet shadowing](INFOSCHEMATICS-TOOL-064-editor-stylesheet-shadowing.md), not this item, and the evidence deliberately names the stylesheet that ships with the component that renders the class.

The file-name case is weaker than the path case by design: it asks only that a cited name exists somewhere, because a bare file name in prose has no directory to resolve against. A file moved between packages still passes it. The path case is what catches a move, which is why every one of the nine stale citations was a full path.

`SCENE-006` is the one requirement this pass could not settle, because settling it means running a sustained playback profile rather than reading code.

### Post-change review

Marking `DESIGN-014` divergent was not in the plan. It came out of `DESIGN-018`'s caveat: the gap being described — Point is declared selectable and no renderer hit-tests one — is `DESIGN-014`'s contract, not `DESIGN-018`'s, and `DESIGN-018` was carrying it because it was the requirement whose conformance line someone was editing at the time. Filtering a kind that has no interaction is vacuously satisfied. Being declared pointer-selectable while unreachable is not.

The ten pending requirements were the surprise. The expectation was ten pieces of missing work; what was there was ten pieces of missing bookkeeping, nine of them describing behaviour with tests already asserting exactly the clauses in the statement. The `_Verify:_` stub — "add a focused implementation or rendered-output check for this accepted requirement" — is what a requirement says when it was written before anyone looked, and it survived being true.

### Mini recap

A corpus that recorded its own proof had nothing checking the proof, so ten requirements were conforming on paths that had moved and ten more were pending on work that was finished. Both are now mechanical: a citation that stops resolving fails the gate, and a conformance value outside the three fails it too.

## Discussion

### Stale evidence is the recurring failure

The package move was correct; the specifications simply were not carried with it. Repointing the ten paths is an afternoon's work and would silently rot again. The durable part of this item is a mechanical gate: no repository check currently parses the corpus, so an evidence path can stop resolving without any run turning red. A check that every cited path exists is cheap and would have caught all ten.

### Repointing is not re-verifying

Correcting a path is not the same as confirming the requirement still holds. Each of the ten needs its verification plan actually run against the code in its new home, because a component that changed package may well have changed behaviour.

### The eleven are a decision, not a backlog

Each pending or divergent requirement needs an explicit outcome: bring it to conforming, restate it to match accepted behaviour, or record why the divergence stands. `SCENE-006` in particular is divergent rather than pending, so something is known to deviate.
