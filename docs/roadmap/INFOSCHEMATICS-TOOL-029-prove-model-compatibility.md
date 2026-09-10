---
id: INFOSCHEMATICS-TOOL-029
area: TOOL
title: Prove model compatibility
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 46c7c7168118aeaeda2a3e54c47248b52da6c7e8
---

# Prove model compatibility

## Goal

Prove that the agreed domain-model direction can preserve the visual meaning of existing Infoschematic configurations before those configurations or the public documentation are migrated.

## Context

IBC-2026 is the representative compatibility fixture. It contains Cards, Fabrics, Regions, Flows, Graphics, source-and-sink Points, standalone Scenes, Themes, Stories, high-numbered Port bindings, and custom semantic metadata. Its existing authored configuration must remain unchanged during this proof.

The user approved implementation after the domain-model walkthrough and then narrowed the delivery order: establish deterministic visual evidence against existing configurations first; migrate authored configurations and documentation only after that evidence is clean.

## Boundary

This item does not rewrite IBC-2026 source files, migrate repository examples to the new authoring shape, update public guidance, or remove legacy input support. It does not treat a raster comparison as evidence for non-visual metadata such as authored IDs.

## Current state

The repository starts clean at the immutable baseline above and `bun run self:check` passes. The static SVG renderer can render the unchanged external IBC-2026 package in its default state and all 38 authored Scene states. No durable all-state raster compatibility gate exists yet.

## Steps

- [x] Capture deterministic semantic, SVG, and fixed-viewport PNG evidence for every IBC-2026 presentation state without editing the fixture.
- [x] Add the compatibility model boundary needed to express the agreed concepts while retaining existing configuration input.
- [x] Preserve source-and-sink Points, existing Port IDs, route geometry, presentation focus, and visual treatments through normalization.
- [x] Compare the post-change output with the immutable baseline and resolve every unexplained difference.
- [x] Add focused regression coverage for the compatibility boundary and all-state comparison workflow.
- [x] Run the repository verification gate and prepare the delivery for review without migrating documentation.

## Files touched

- `packages/domain-model/src/`
- `packages/domain-core/src/`
- `scripts/`
- `docs/roadmap/INFOSCHEMATICS-TOOL-029-prove-model-compatibility.md`
- `docs/roadmap/_ISSUES.md`

The external IBC-2026 repository is read-only test input for this item.

## Verify

`bun run self:check` must pass. The IBC compatibility command must report semantic equality and pixel-identical PNG output for the default view, seven standalone Scenes, nine Theme Scenes, and twenty-two Story Scenes at one pinned viewport and scale.

## Dependencies / blocks

No build-order dependency remains. IBC-2026 is available locally at the path supplied by the user and is clean at `bd36fe48478003a172d0fff05a5908a8c677d872`.

## Documentation impact

### Decision Records

No Decision Record changes in this proof. Any durable contract adoption waits for compatibility evidence and the subsequent model rollout.

### Specifications

No public specification changes in this proof. The compatibility boundary remains an implementation and verification instrument until reviewed.

### Guides

No guide changes in this proof. Public documentation rollout is deliberately sequenced after visual compatibility succeeds.

### Roadmap

This item records the compatibility proof separately from the later authored-config and documentation migration.

## Review

### Delivered

Added an additive, vocabulary-aligned Infoschematic model and a one-way compatibility projection from the established serialisable contract. Existing authored inputs remain accepted and unchanged. Captured all 39 IBC-2026 presentation states from immutable core baseline `46c7c7168118aeaeda2a3e54c47248b52da6c7e8` and unchanged consumer baseline `bd36fe48478003a172d0fff05a5908a8c677d872`.

The proof deliberately excludes authored-config migration, renderer adoption of the new model, schema replacement, and public documentation rollout.

### Summary of changes

- `packages/domain-model/src/model.ts` expresses the agreed root, Diagram, grouping, six visible element types, Assembly, embedded Scene, and specification vocabulary. Point is retained as a visible source-or-sink endpoint.
- `packages/domain-core/src/model.ts` projects established configurations without mutation, rewrites element references to their code-like IDs, materialises legacy seven-per-side Port defaults, converts wrapped Cards to Assemblies, extracts route waypoints, and copies source-Scene content into owning Stories.
- `scripts/ibc-visual-compatibility.ts` renders every IBC state and records exact diagnostic hashes, exact semantic and 48×32 spatial-topology gates, and a fuzzy perceptual raster sample.
- `scripts/fixtures/ibc-2026-visual-baseline.json` retains the 39-state evidence with explicit Sharp/libvips version, viewport, sample dimensions, and tolerances.
- Focused tests cover the compatibility projection, evidence completeness, strict topology checks, and permitted raster fuzziness.

### Verification

`diff -qr` over the 78 baseline and post-model SVG/PNG files reported no difference. The compatibility command matched the default view, seven standalone Scenes, nine Theme Scenes, and twenty-two Story Scenes: semantic relationships and quantised grid topology match exactly; all rasters are within tolerance.

`bun run self:check` exits 0: 70 test files and 482 tests pass, every TypeScript workspace compiles, dependency-cruiser reports no violations across 367 modules and 1,150 dependencies, generated artefacts are current, and the production Site builds. `ki repo audit --skill ki-work-roadmap --repo .` passes. The external IBC repository remains clean at its baseline commit.

### Outstanding concerns

The new model is deliberately additive and reached through `infoschematicModelOf`; renderers and authored definitions still use the established contract. That is the next rollout phase, not an unchecked part of this compatibility proof. Exact SVG and full-resolution pixel hashes are retained for diagnosis but are not acceptance gates because harmless serializer and anti-aliasing changes are allowed.

### Post-change review

The item meets its bounded producer goal: there is now evidence that the agreed concepts can represent the existing IBC model without moving elements, changing Flow topology, rebinding Ports, or altering any rendered state. The unchanged IBC consumer provides the required external compatibility evidence. This is ready for human review before the new model becomes the primary authoring and rendering contract.

### Mini recap

Established the future model boundary, retained Points as source-and-sink endpoints, protected 39 IBC views with semantic and grid-topology checks, allowed bounded perceptual fuzziness, and proved the generated files remain byte-identical in this change. No existing configuration or public documentation was migrated.

## Done

Accepted 2026-09-10 by Kris Brown on the review packet above.

## Discussion

### Visual evidence

The comparison covers every selectable presentation state rather than one default screenshot. SVG is retained for inspection, PNG is rasterized with a pinned renderer at a fixed size, and a semantic projection covers information pixels cannot prove.

### Points

Point remains a visible source-or-sink endpoint. It is not reduced to geometry or forced into Card solely to reach a five-element count. Existing Point coordinates and Flow port bindings remain unchanged.

### Presentation ownership

The future model may embed Scenes under Themes and Stories, but this proof keeps standalone Scene input intact. Removing source-Scene indirection and copying reused Scene content belongs to authored-config migration after parity is established.
