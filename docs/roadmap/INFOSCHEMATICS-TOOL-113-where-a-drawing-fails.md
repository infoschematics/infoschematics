---
id: INFOSCHEMATICS-TOOL-113
area: TOOL
title: Where a drawing fails
theme: tool
horizon: now
status: ready
blocks: [INFOSCHEMATICS-TOOL-107]
blocked_by: []
baseline_ref: null
created_at: 2026-09-21T19:30:00Z
updated_at: 2026-09-22T00:15:00Z
---

# Where a drawing fails

## Goal

The product gives a machine-readable account of what is wrong with an [Infoschematic](../reference/vocabulary.md#infoschematic) definition: not only whether it parses, but whether the drawing it describes is readable — boxes that overlap, a route that crosses the Card it leaves, a label with nothing behind it, a Region that does not contain what it claims.

## Context

Validation today answers a narrower question. `ADR-INFOSCHEMATICS-013` validates preferred YAML and compatible JSON against a runtime mirror of the canonical types, and `packages/domain-core/schema/infoschematic.schema.json` sets `additionalProperties: false` in 61 places, so an invented property fails loudly rather than being ignored. What no surface reports is geometry: a definition can satisfy every type and still describe a drawing nobody can read.

Most of the arithmetic already exists, because the renderers need it. `packages/view-model/src/placement.ts` computes clearance between a label, the obstacles around it, and other labels, and scores candidate spots by overlap area. `packages/view-model/src/card-layout.ts` and `packages/view-model/src/point-layout.ts` resolve the geometry both renderers draw. The missing piece is not the measurement but the report: a finding with a stable rule code, the exact subject it concerns, the measured evidence, and the repairs that are legal for it.

There is no place to put such a report yet. `packages/cli/src/options.ts:150` throws on any verb but `render`, so the command surface has exactly one verb; `GDR-INFOSCHEMATICS-005` governs how a second one would be named and held in one test.

The comparison that raised it is [Archify](https://tt-a1i.github.io/archify/), recorded in [the related-tools reference](../reference/related-tools.md). It has no automatic layout engine either, and reliably produces acceptable drawings because its validator carries the geometry knowledge and the generating model iterates against coded diagnostics. That is the answer to the obstacle [INFOSCHEMATICS-TOOL-107](INFOSCHEMATICS-TOOL-107-an-agent-written-first-document.md) names as blocking: the product needs a diagnostic surface, not a layout solver.

## Boundary

A decision item about a reporting surface. It does not add a model concept, change what a definition may carry, or adopt automatic layout: a finding says a drawing is unreadable and what would make it readable, and never moves anything itself. Authored definitions stay serialisable data and hosts keep mounting.

Three consumers would share one surface, and that is the point of deciding it once: an authoring agent closing a repair loop, Studio telling a person what is wrong while they edit, and a build pipeline failing on a document that regressed. Whether it lands as a command verb, a library export, or both is part of what this item settles.

## Current state

The measurements exist; the report does not.

- `packages/view-model/src/placement.ts` scores candidate label spots by overlap area against obstacles and other labels, so clearance is already computed and then discarded.
- `packages/view-model/src/card-layout.ts`, `point-layout.ts`, `region-geometry.ts` and `perimeter.ts` resolve the boxes, ports and perimeters both renderers draw; `routing.ts` and `waypoints.ts` resolve a Flow's route from those ports.
- `packages/domain-core` validates the contract only: the schema sets `additionalProperties: false` in 61 places, and `ADR-INFOSCHEMATICS-013` covers types rather than geometry.
- `packages/cli/src/options.ts:148` throws `Unknown command ${argv[0]}` for any verb but `render`, and `renderOptionSpecs` is the single declarative option table that both parsing and the usage text read. A second verb needs the table generalised rather than copied.
- Nothing reports a finding today, so no rule code is yet a public contract. This item issues the first ones.

## Steps

- [ ] Take the decision and record it: the geometry knowledge is a View Model export and the command is a thin caller over it, as `ADR-INFOSCHEMATICS-018` already does for rendering.
- [ ] Define the finding shape in View Model — stable rule code, severity, the subject's authored identity, the measured evidence, and the repairs that are legal for that rule — and export a function that takes an assembled document and returns findings in a deterministic order.
- [ ] Implement a first rule set over the geometry already resolved: overlapping artefacts, an artefact outside the authored bounds, a Region that does not contain what it claims, a route that crosses the Card it leaves, and a label with no clear backing.
- [ ] Separate errors from observations, so a drawing that is merely tight does not fail a pipeline that a drawing nobody can read should fail.
- [ ] Add the `check` verb per `GDR-INFOSCHEMATICS-005`, over a generalised option table, with human-readable output by default, `--json` for a machine, and an exit code that a build can act on.
- [ ] State the rules and the finding shape in a specification, with a requirement id per rule so a later change to a rule code is a visible contract change.

## Files touched

New `packages/view-model/src/diagnostics.ts` and its test; `packages/cli/src/options.ts`, `index.ts` and `index.test.ts` for the second verb and the generalised option table; `packages/cli/README.md` and the command-line guide for the new surface; a new `docs/specs/diagnostics.md`; a new Decision Record.

## Verify

`bun run self:check`, which includes the command-line convention gate that holds every verb's options and usage text together.

Each rule has a focused test with a document that breaks it and a document that does not, asserting the rule code, the subject, and the evidence rather than only the count — a checker that reports the right number of wrong things is not a checker an agent can repair against.

The command is exercised end to end: a readable document exits zero, a broken one exits non-zero and names the rule, and `--json` parses to the same findings the library returned.

## Dependencies / blocks

Nothing blocks it. It blocks [INFOSCHEMATICS-TOOL-107](INFOSCHEMATICS-TOOL-107-an-agent-written-first-document.md), whose repair loop has nothing to iterate against until findings exist, and [INFOSCHEMATICS-TOOL-116](INFOSCHEMATICS-TOOL-116-promises-a-document-holds.md), which declares promises this surface reports on.

## Documentation impact

### Decision Records

A new record deciding that the checker is a View Model export with a thin command over it, that a finding carries a code, a subject, evidence and legal repairs, and that a rule code is a public contract once anything depends on it.

### Specifications

A new `docs/specs/diagnostics.md` states the finding shape and one requirement per rule. `docs/specs/command-line-rendering.md` gains the second verb, or the command-line contract is split so that `render` and `check` each state their own.

### Guides

The consumer guide gains a short section on checking a document before committing it; the authoring guide points at it as the way to find out why a drawing reads badly.

### Roadmap

Discharges the blocker on TOOL-107 and the reporting half of TOOL-116.

## Discussion

Captured on 2026-09-21 from the Archify comparison. No existing roadmap record, specification, or decision record covers geometric validation; `ADR-INFOSCHEMATICS-013` covers contract validation only, so this is new ground.

The questions worth putting side by side when this is shaped:

- **Where the geometry knowledge lives.** View Model already owns the measurements, which argues for a library export there and a thin command over it, in the shape `ADR-INFOSCHEMATICS-018` already uses for rendering.
- **What a finding has to carry.** A stable rule code, the exact subject, the measured evidence, and the legal repairs are what make a diagnostic actionable rather than a complaint; a rule code is also a public contract once anything depends on it.
- **Which rules are errors and which are observations.** A document that is ugly is not a document that is wrong, and a validator that refuses both teaches authors to ignore it.
- **Whether the compiled geometry is dumpable.** A receipt of what the checker measured makes a disagreement diagnosable without making solver internals into authoring controls.

### Adoption

Adopted for immediate work on 2026-09-21. The questions above are answered as part of delivery: the first rule codes issued here become a public contract, so they are named in a specification rather than left to the implementation that emits them.
