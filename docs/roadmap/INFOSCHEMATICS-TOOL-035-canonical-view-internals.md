---
id: INFOSCHEMATICS-TOOL-035
area: TOOL
title: Canonical view internals
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 76fda523b613c91afed0343c9a3ad7db80cc3cc3
created_at: 2026-09-10T00:14:39Z
updated_at: 2026-09-14T08:25:26Z
---

# Canonical view internals

## Goal

Make View Model, Canvas, Present, and Studio operate on the canonical Infoschematic model so compatibility-shaped concepts stop leaking beyond the legacy input boundary.

## Context

Canonical YAML, JSON-compatible input, typed TypeScript authoring, and public View boundaries exist, but establishedInfoschematicOf still projects definitions into the earlier InfoschematicConfig shape. Runtime and Studio internals consequently retain Domains, Groups, Flow Families, Graphics, source-oriented presentation records, and duplicated compatibility fields that no longer describe the canonical model directly.

## Boundary

This item does not remove established public input support, change authored shorthand syntax, redesign visual treatments or geometry, reopen the Sequence presentation semantics owned by `INFOSCHEMATICS-TOOL-034`, or make YAML document trees part of View state.

## Current state

Domain Core parses canonical documents, but View entry points accept a union and immediately adapt canonical values into the established configuration. Canvas and Studio editing APIs therefore depend on legacy naming and five-kind Graphic compatibility, while Point and Overlay do not yet share the complete editing capability contract.

## Steps

- [x] Inventory every establishedInfoschematicOf call and every legacy-only type or field crossing View Model, Canvas, Present, Studio, and static renderer boundaries.
- [x] Define one canonical runtime input and lookup layer for Scopes, Regions, Fabrics, Flows, Cards, Points, Overlays, Sequences, Scenes, and renderer references.
- [x] Move established input projection to one compatibility adapter at the public boundary and prevent downstream packages from importing legacy configuration shapes.
- [x] Migrate View Model derivation and Canvas rendering in dependency order, preserving geometry, visibility, accessibility, signals, and static parity.
- [x] Migrate Present and Studio runtime state, controls, and selection to canonical concepts while retaining the explicit source-edit projection required by `INFOSCHEMATICS-TOOL-033`.
- [x] Bring Point and Overlay selection and editing through the same typed six-kind capability contract, retaining kind-specific constraints.
- [x] Remove obsolete compatibility-only registries and duplicate fields; isolate the remaining source-edit compatibility bridge for `INFOSCHEMATICS-TOOL-033`.
- [x] Add import-boundary, compatibility-input, canonical-input, visual-parity, and Studio interaction regression tests, then update architecture and public guidance.

## Files touched

- packages/domain-model/src/
- packages/domain-core/src/ only where canonical input helpers are owned
- packages/view-model/src/
- packages/view-canvas/src/
- packages/view-present/src/
- packages/view-studio/src/
- packages/render-svg/src/
- examples/ and apps/site/src/ proving consumers
- .dependency-cruiser.ts
- docs/design/, docs/decisions/, docs/specs/, docs/reference/, and affected guides

## Verify

After `INFOSCHEMATICS-TOOL-034` lands, run focused bunx vitest run suites for compatibility projection, canonical runtime, Canvas, Present, Studio, static SVG, editable capabilities, and visual parity; run bun run self:packages:build and bun run self:check. Add a dependency assertion that View packages do not import the legacy configuration module outside the named boundary, and compare established and canonical inputs for equivalent output.

## Dependencies / blocks

`INFOSCHEMATICS-TOOL-034` established canonical Sequence and presentation semantics and has landed, so this item has no remaining build-order dependency. The established public input remains a supported adapter during the migration.

## Documentation impact

### Decision Records

Update the additive-view and source-ownership decisions to identify the single compatibility boundary; add a decision only if migration exposes a new public compatibility policy.

### Specifications

Update View Model, Canvas, Present, Studio, and static renderer requirements to name canonical inputs and six visual artefact kinds directly.

### Guides

Update integration guidance so canonical input is primary and established input is clearly described as compatibility support.

### Roadmap

Remove the dependency and transition this item to Ready only after `INFOSCHEMATICS-TOOL-034` has landed. Capture removal of established public input separately if a later compatibility policy authorises it.

## Review

### Delivered

- One canonical runtime for canonical and established inputs.
- Canonical Canvas, Present, Studio runtime presentation, and static SVG consumers.
- Explicit established source-edit projection retained for `INFOSCHEMATICS-TOOL-033`.
- Stable code-based matching between canonical selections and established authored records.

### Summary of changes

View Model now normalises canonical and established inputs once into a canonical runtime. Downstream rendering and presentation consume canonical Cards, Fabrics, Flows, Points, Regions, Overlays, Scopes, Sequences, Collections, Families, and Specifications.

The migration also fixed the compatibility identity seam exposed by browser editing: canonical code-like selections resolve established records by stable code, so moving or removing a Card continues to update its attached Flows.

### Verification

- `bun run self:check` passes: 85 test files and 644 unit/integration tests, 4 browser files and 13 browser tests, every package and example typecheck, dependency-cruiser, schema and token checks, and the production Site build.
- Focused View Model, Canvas, Present, Studio, and SVG suites pass: 49 files and 377 tests.
- Established and canonical inputs have explicit runtime-equivalence coverage; visual-treatment parity and vocabulary citation checks pass.
- `ki repo audit --skill ki-authoring`, `ki-specs`, and `ki-guides` pass.

### Outstanding concerns

Studio source editing still projects through `compatibilityConfig`; replacing that final legacy edit representation is the bounded remaining work in `INFOSCHEMATICS-TOOL-033`. Established Flow points remain authoritative at the compatibility boundary so older diagrams retain their authored routing exactly.

The Decision Record audit reports the pre-existing filename finding for `ADR-INFOSCHEMATICS-018-keep-renderer-command-thin.md`. It is unrelated to this migration and has not been renamed incidentally.

### Post-change review

Review canonical-versus-established runtime parity, code-like editing identity, Sequence-only presentation behaviour, and the explicit location of the Studio source-edit bridge.

### Mini recap

Canonical model concepts now remain canonical throughout runtime rendering and presentation. The remaining legacy edit projection is isolated and named for the next dependent roadmap item.

## Discussion

### Compatibility boundary

Legacy definitions may continue entering through one adapter, but canonical definitions should not be converted away from their own model before rendering or editing. The adapter remains testable and deliberately narrow.

### Migration order

View Model must move before interactive Views so geometry and lookup semantics remain shared. Present and Studio follow Canvas, then obsolete registries can be removed once no consumer observes them.

### Six-kind editing

Point and Overlay should enter the common typed selection and operation machinery while retaining their distinct capabilities. Canonicalisation is not permission to pretend every artefact supports the same geometry.
