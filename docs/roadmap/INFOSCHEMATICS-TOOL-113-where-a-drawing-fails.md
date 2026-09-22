---
id: INFOSCHEMATICS-TOOL-113
area: TOOL
title: Where a drawing fails
theme: tool
horizon: now
status: done
blocks: [INFOSCHEMATICS-TOOL-107]
blocked_by: []
baseline_ref: f93c162c6dfcd8e93c6c52a6110601d60a7bcd30
created_at: 2026-09-21T19:30:00Z
updated_at: 2026-09-22T14:07:29Z
---

# Where a drawing fails

## Goal

The product gives a machine-readable account of what is wrong with an [Infoschematic](../reference/vocabulary.md#infoschematic) definition: not only whether it parses, but whether the drawing it describes is readable — boxes that overlap, an artefact drawn outside the view, a route that crosses the Card it leaves or one it never touches, a label pinned onto something, two Flows meeting one port.

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

- [x] Take the decision and record it: the geometry knowledge is a View Model export and the command is a thin caller over it, as `ADR-INFOSCHEMATICS-018` already does for rendering.
- [x] Define the finding shape in View Model — stable rule code, severity, the subject's authored identity, the measured evidence, and the repairs that are legal for that rule — and export a function that takes an assembled document and returns findings in a deterministic order.
- [x] Implement a first rule set over the geometry already resolved: overlapping artefacts, an artefact outside the authored bounds, a route that runs back across an endpoint, a route through an artefact it never touches, an obstructed Flow label, and two Flows meeting one port.
- [x] Separate errors from observations, so a drawing that is merely tight does not fail a pipeline that a drawing nobody can read should fail.
- [x] Add the `check` verb per `GDR-INFOSCHEMATICS-005`, over a generalised option table, with human-readable output by default, `--json` for a machine, and an exit code that a build can act on.
- [x] State the rules and the finding shape in a specification, with a requirement id per rule so a later change to a rule code is a visible contract change.

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

## Review

### Delivered

Every Step, within the stated Boundary, with one rule fewer than the Goal first named and two named rules deliberately not admitted.

Region containment is not in the delivered set. `region-geometry.ts` derives a Region's box from the artefacts it claims, so a Region always contains them and the rule could not fire — the case the Goal was reaching for is an artefact drawn outside the view, which `artefact-outside-view` reports. The port audit's `crowded` and `misassigned` severities are left where they are for the same reason, argued in `DRAW-010` and in `ADR-INFOSCHEMATICS-040`: they describe an endpoint moved away from the port it names, which only an editing host produces.

### Summary of changes

`reviewInfoschematicDrawing` in the new `packages/view-model/src/diagnostics.ts` assembles a document once and reports six rules over the geometry the renderers already resolve: `artefact-outside-view`, `artefacts-overlap`, `flow-label-obstructed`, `port-collision`, `route-crosses-artefact` and `route-re-enters-endpoint`. Each finding carries the rule code, the authored identities in the order the rule names them, the measurement in diagram units, one sentence for a person, the legal repairs, and a severity; the list is sorted by rule and subject so a repair loop sees a repaired finding leave it. `drawingIsUnreadable` is the gate, and only an error closes it. The module is its own `exports` subpath, since View Model has no barrel index.

The command gained its second verb. `packages/cli/src/options.ts` now holds one option table per command rather than one shared list, so `check` accepts `--json` and `--help` and nothing else, and the usage text is still derived from the tables it parses. `render` and `check` share `readDocument`, so a parse failure reads the same way through both. `infoschematics check` prints subject, measurement and repairs, `--json` emits the same review as data, and it exits `1` only when a finding says the drawing cannot be read as authored.

`docs/specs/diagnostics.md` states the contract as `DRAW-001` to `DRAW-012`, one requirement per rule, with the append-only rule-code promise written down before anything depends on it; `docs/specs/command-line-rendering.md` gained `CLI-012` and `CLI-005` was amended to name the View Model dependency the checker needs. `ADR-INFOSCHEMATICS-040` records why a checker measures and never repairs.

### Verification

`bun run self:check` — green, including the dependency-boundary gate, whose `renderer-command-stays-thin` rule now permits the CLI to reach View Model as `CLI-005` says it may.

Beyond the suites, two assertions exist because a green run proves nothing on its own. `scripts/example-drawings.test.ts` reviews every published Infoschematic and requires no finding, then re-breaks one on purpose and requires the same walk to report it — without the second case the first passes just as well against a checker that has stopped measuring. And every unit case asserts the rule code, the identities and the measurement rather than a count, because a checker that fires the right number of times for the wrong reasons is the check this repository's own guidance warns about.

### Outstanding concerns

The checker cannot see the defect that made the label rule worth having. `labelAt` is a distance in diagram units, and `is-system` and `is-showcase` author `0.5` and `0.4` as though it were a fraction, pinning those labels half a unit from their source port. The drawing still reads, no finding fires, and the published documents therefore pass — captured separately rather than folded in here.

`DRAW-010` measures a collision only. Port spacing beyond that is unreachable from a document and stays Studio's live audit, which is a deliberate gap rather than an unfinished one.

### Post-change review

The rule set shrank while it was being built, and that was the useful part of the work. Two candidate rules could be written but never made to fire from any authored document, so rather than ship them as coverage that measures nothing, the reasoning is recorded where the next reader will look for it — in `diagnostics.ts`, in `DRAW-010`, and in the ADR — so nobody restores them as an oversight.

### Mini recap

A valid document can describe an unreadable drawing, and nothing reported that. View Model now reviews one: six rules, each finding naming its subject and its measurement and the repairs that would clear it, ordered so a repair loop converges. `infoschematics check` is a thin outlet over it that exits `1` when the drawing cannot be read and `0` when it is merely tight. Every published example is asserted clean by a walk that also proves it is still measuring. It unblocks `INFOSCHEMATICS-TOOL-107`, whose repair loop had nothing to iterate against, and delivers the reporting half of `INFOSCHEMATICS-TOOL-116`.

## Done

A valid document is reviewed for the drawing it describes. Six rules report what a reader cannot read, each finding naming its subject, its measurement in diagram units and the repairs that would clear it, ordered so a repair loop converges; `infoschematics check` is the outlet, exiting `1` only when the drawing cannot be read as authored, and every published example is asserted clean by a walk proven to still be measuring.

## Discussion

Captured on 2026-09-21 from the Archify comparison. No existing roadmap record, specification, or decision record covers geometric validation; `ADR-INFOSCHEMATICS-013` covers contract validation only, so this is new ground.

The questions worth putting side by side when this is shaped:

- **Where the geometry knowledge lives.** View Model already owns the measurements, which argues for a library export there and a thin command over it, in the shape `ADR-INFOSCHEMATICS-018` already uses for rendering.
- **What a finding has to carry.** A stable rule code, the exact subject, the measured evidence, and the legal repairs are what make a diagnostic actionable rather than a complaint; a rule code is also a public contract once anything depends on it.
- **Which rules are errors and which are observations.** A document that is ugly is not a document that is wrong, and a validator that refuses both teaches authors to ignore it.
- **Whether the compiled geometry is dumpable.** A receipt of what the checker measured makes a disagreement diagnosable without making solver internals into authoring controls.

### Adoption

Adopted for immediate work on 2026-09-21. The questions above are answered as part of delivery: the first rule codes issued here become a public contract, so they are named in a specification rather than left to the implementation that emits them.
