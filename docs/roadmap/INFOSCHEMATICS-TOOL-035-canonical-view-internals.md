---
id: INFOSCHEMATICS-TOOL-035
area: TOOL
title: Canonical view internals
theme: tool
horizon: next
status: ready
blocks: [INFOSCHEMATICS-TOOL-033]
blocked_by: []
baseline_ref: null
created_at: 2026-09-10T00:14:39Z
updated_at: 2026-09-14T07:03:21Z
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

- [ ] Inventory every establishedInfoschematicOf call and every legacy-only type or field crossing View Model, Canvas, Present, Studio, and static renderer boundaries.
- [ ] Define one canonical runtime input and lookup layer for Scopes, Regions, Fabrics, Flows, Cards, Points, Overlays, Sequences, Scenes, and renderer references.
- [ ] Move established input projection to one compatibility adapter at the public boundary and prevent downstream packages from importing legacy configuration shapes.
- [ ] Migrate View Model derivation and Canvas rendering in dependency order, preserving geometry, visibility, accessibility, signals, and static parity.
- [ ] Migrate Present and Studio state, controls, selection, change sets, and Direct output to canonical concepts without converting canonical input back to legacy records.
- [ ] Bring Point and Overlay selection and editing through the same typed six-kind capability contract, retaining kind-specific constraints.
- [ ] Remove obsolete compatibility-only registries and duplicate fields after all consumers use the canonical layer.
- [ ] Add import-boundary, compatibility-input, canonical-input, visual-parity, and Studio interaction regression tests, then update architecture and public guidance.

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

## Discussion

### Compatibility boundary

Legacy definitions may continue entering through one adapter, but canonical definitions should not be converted away from their own model before rendering or editing. The adapter remains testable and deliberately narrow.

### Migration order

View Model must move before interactive Views so geometry and lookup semantics remain shared. Present and Studio follow Canvas, then obsolete registries can be removed once no consumer observes them.

### Six-kind editing

Point and Overlay should enter the common typed selection and operation machinery while retaining their distinct capabilities. Canonicalisation is not permission to pretend every artefact supports the same geometry.
