---
id: INFOSCHEMATICS-TOOL-035
area: TOOL
title: Canonical view internals
theme: tool
horizon: future
status: draft
candidate: true
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-034]
baseline_ref: null
---

## Goal

Make View Model, Canvas, Present, and Studio operate on the canonical Infoschematic model so compatibility-shaped concepts stop leaking beyond the legacy input boundary.

## Context

Canonical YAML, JSON-compatible input, typed TypeScript authoring, and public View boundaries now exist, but `establishedInfoschematicOf` still projects definitions into the earlier `InfoschematicConfig` shape. Runtime and Studio internals consequently retain names and structures such as domains, groups, flow families, graphics, source-oriented presentation records, and duplicated compatibility fields that no longer describe the canonical model directly.

The compatibility adapter was an intentional migration seam, not the final internal architecture. Canonical model values should be normalised once at the authoring boundary, after which Views, Studio, and programmatic emitters should see the same structured concepts.

## Boundary

This item does not remove established public input support without a separately reviewed compatibility policy. It does not change authored shorthand syntax, visual treatments, diagram geometry, or presentation concepts being reconsidered by `INFOSCHEMATICS-TOOL-034`.

## Discussion

### Compatibility boundary

Legacy definitions may continue entering through a compatibility adapter, but canonical definitions should not be converted away from their own model before every renderer and editor operation. The migration should identify one boundary where legacy data becomes canonical and keep compatibility aliases out of lower-layer runtime state.

### Vocabulary alignment

Internal types and APIs should distinguish Card Collections, Flow Families, architectural Scopes, Overlays, Assemblies, and independently identified artefacts using the same vocabulary as the domain contract. Renaming alone is insufficient where an older field carries different semantics; each projection must be replaced with the canonical relationship it represented.

### Incremental migration

The work should preserve existing configuration support and IBC visual compatibility while packages migrate in dependency order. Focused contract tests should prove no renderer or Studio boundary observes YAML scalar shorthand, document-tree state, or obsolete compatibility-only relationships.
