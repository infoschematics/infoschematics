---
id: INFOSCHEMATICS-TOOL-031
area: TOOL
title: Adopt canonical model boundaries
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
---

# Adopt canonical model boundaries

## Goal

Make the canonical Infoschematic model the directly supported input at reusable rendering and View boundaries, then migrate the repository-owned example definitions without rewriting established editor internals.

## Context

`INFOSCHEMATICS-TOOL-030` delivered canonical normalisation and a compatibility adapter, and IBC-2026 has proved a direct canonical definition across all 39 presentation states. The remaining repository rollout should now let canonical data enter the reusable SVG, Canvas, Present, Studio, and runtime surfaces while legacy definitions continue to work during the transition.

Another thread owns documentation and Site content reorganisation. This item is limited to types, runtime boundaries, authored examples, focused tests, and existing verification scripts.

## Boundary

This item does not rewrite Studio editing state, replace the established runtime contract internally, migrate the Playground document schema, edit public documentation or Site content, alter visual design, or remove legacy compatibility. It does not change IBC-2026.

## Current state

Canonical definitions must be manually adapted by each host before they can enter reusable Views. Repository-owned examples still author the established contract. The repository is clean and the full verification gate passes at the current planning point.

## Steps

- [ ] Define one public input union and make compatibility adaptation idempotent for canonical and established definitions.
- [ ] Accept canonical data at runtime, SVG, Canvas, Present, and Studio boundaries while retaining the established internal runtime.
- [ ] Migrate the three repository-owned example definitions to direct canonical authoring.
- [ ] Add focused boundary tests proving canonical and established inputs render equivalently.
- [ ] Preserve existing Playground format behaviour and avoid documentation or Site content edits.
- [ ] Run the full repository verification gate.

## Files touched

- `packages/domain-model/src/`
- `packages/view-model/src/`
- `packages/render-svg/src/`
- `packages/view-canvas/src/`
- `packages/view-present/src/`
- `packages/view-studio/src/`
- `examples/is-blank/src/`
- `examples/is-infoschematics/src/`
- `examples/is-system/src/`
- Existing focused tests and verification scripts under the same ownership roots.
- `docs/roadmap/INFOSCHEMATICS-TOOL-031-adopt-canonical-model-boundaries.md`
- `docs/roadmap/_ISSUES.md`

## Verify

`bun run self:check` must pass. Existing legacy inputs and migrated canonical examples must retain their rendered output and public View behaviour.

## Dependencies / blocks

The canonical authoring and compatibility entry points delivered by `INFOSCHEMATICS-TOOL-030` are present. IBC-2026 has independently proved the authored migration, so no external block remains.

## Documentation impact

### Decision Records

No Decision Record changes are included; this applies the already agreed compatibility-boundary direction.

### Specifications

The established YAML, JSON, and TypeScript document schema remains unchanged in this item. Canonical document parsing can follow after the runtime and examples are stable.

### Guides

No guide changes are included. The concurrent documentation thread retains ownership of documentation reorganisation.

### Roadmap

This record owns the remaining code-side canonical input rollout while explicitly excluding public documentation and Site content.

## Discussion

### Boundary adaptation

Reusable consumers accept either direct canonical data or the established configuration. Adaptation occurs once at the runtime boundary, so renderer and editor internals can migrate independently later without forcing hosts to retain the old authoring model.

### Compatibility

Legacy callers remain valid. Canonical callers no longer need to know about `establishedInfoschematicOf`, while the adapter stays public for specialised integration and verification.
