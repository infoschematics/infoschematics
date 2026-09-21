---
id: INFOSCHEMATICS-TOOL-113
area: TOOL
title: Where a drawing fails
theme: tool
horizon: triage
status: draft
blocks: [INFOSCHEMATICS-TOOL-107]
blocked_by: []
baseline_ref: null
created_at: 2026-09-21T19:30:00Z
updated_at: 2026-09-21T19:30:00Z
---

# Where a drawing fails

## Goal

Settle whether the product offers a machine-readable account of what is wrong with an [Infoschematic](../reference/vocabulary.md#infoschematic) definition: not only whether it parses, but whether the drawing it describes is readable — boxes that overlap, a route that crosses the Card it leaves, a label with nothing behind it, a Region that does not contain what it claims.

## Context

Validation today answers a narrower question. `ADR-INFOSCHEMATICS-013` validates preferred YAML and compatible JSON against a runtime mirror of the canonical types, and `packages/domain-core/schema/infoschematic.schema.json` sets `additionalProperties: false` in 61 places, so an invented property fails loudly rather than being ignored. What no surface reports is geometry: a definition can satisfy every type and still describe a drawing nobody can read.

Most of the arithmetic already exists, because the renderers need it. `packages/view-model/src/placement.ts` computes clearance between a label, the obstacles around it, and other labels, and scores candidate spots by overlap area. `packages/view-model/src/card-layout.ts` and `packages/view-model/src/point-layout.ts` resolve the geometry both renderers draw. The missing piece is not the measurement but the report: a finding with a stable rule code, the exact subject it concerns, the measured evidence, and the repairs that are legal for it.

There is no place to put such a report yet. `packages/cli/src/options.ts:150` throws on any verb but `render`, so the command surface has exactly one verb; `GDR-INFOSCHEMATICS-005` governs how a second one would be named and held in one test.

The comparison that raised it is [Archify](https://tt-a1i.github.io/archify/), recorded in [the related-tools reference](../reference/related-tools.md). It has no automatic layout engine either, and reliably produces acceptable drawings because its validator carries the geometry knowledge and the generating model iterates against coded diagnostics. That is the answer to the obstacle [INFOSCHEMATICS-TOOL-107](INFOSCHEMATICS-TOOL-107-an-agent-written-first-document.md) names as blocking: the product needs a diagnostic surface, not a layout solver.

## Boundary

A decision item about a reporting surface. It does not add a model concept, change what a definition may carry, or adopt automatic layout: a finding says a drawing is unreadable and what would make it readable, and never moves anything itself. Authored definitions stay serialisable data and hosts keep mounting.

Three consumers would share one surface, and that is the point of deciding it once: an authoring agent closing a repair loop, Studio telling a person what is wrong while they edit, and a build pipeline failing on a document that regressed. Whether it lands as a command verb, a library export, or both is part of what this item settles.

## Discussion

Captured on 2026-09-21 from the Archify comparison. No existing roadmap record, specification, or decision record covers geometric validation; `ADR-INFOSCHEMATICS-013` covers contract validation only, so this is new ground.

The questions worth putting side by side when this is shaped:

- **Where the geometry knowledge lives.** View Model already owns the measurements, which argues for a library export there and a thin command over it, in the shape `ADR-INFOSCHEMATICS-018` already uses for rendering.
- **What a finding has to carry.** A stable rule code, the exact subject, the measured evidence, and the legal repairs are what make a diagnostic actionable rather than a complaint; a rule code is also a public contract once anything depends on it.
- **Which rules are errors and which are observations.** A document that is ugly is not a document that is wrong, and a validator that refuses both teaches authors to ignore it.
- **Whether the compiled geometry is dumpable.** A receipt of what the checker measured makes a disagreement diagnosable without making solver internals into authoring controls.
