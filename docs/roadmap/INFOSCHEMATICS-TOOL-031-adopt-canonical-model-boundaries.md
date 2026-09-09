---
id: INFOSCHEMATICS-TOOL-031
area: TOOL
title: Adopt canonical model boundaries
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 85f9a75de7daa6e606e8a33f7d41ef507adafc97
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

Canonical definitions must be manually adapted by each host before they can enter reusable Views. Repository-owned examples still author the established contract. The repository is clean and the full verification gate passes at the immutable implementation baseline `85f9a75de7daa6e606e8a33f7d41ef507adafc97`.

## Steps

- [x] Define one public input union and make compatibility adaptation idempotent for canonical and established definitions.
- [x] Accept canonical data at runtime, SVG, Canvas, Present, and Studio boundaries while retaining the established internal runtime.
- [x] Migrate the three repository-owned example definitions to direct canonical authoring.
- [x] Add focused boundary tests proving canonical and established inputs render equivalently.
- [x] Preserve existing Playground format behaviour and avoid documentation or Site content edits.
- [x] Run the full repository verification gate.

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
- `apps/site/src/Playground.tsx`
- `apps/site/package.json`
- `scripts/render-example.ts`
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

## Review

### Delivered

Canonical Infoschematic data is now accepted directly by the framework-neutral runtime, Static SVG Renderer, Canvas, Present, and Studio. All three repository-owned examples author the canonical model directly while established callers remain compatible.

### Summary of changes

- `InfoschematicInput` names the supported union of direct canonical and established serialisable definitions.
- `establishedInfoschematicOf` is idempotent, and `createInfoschematicRuntime` performs the single compatibility adaptation used by downstream Views and renderers.
- Canonical Flows may override their Family's default line treatment, so direct versus indirect routes do not create duplicate semantic Families.
- Static SVG, Canvas, Present, and Studio public props accept canonical definitions without host-side adaptation.
- Blank, System, and Infoschematics examples now use `defineInfoschematicModel`, code-like element identities, Collections, Families, Sets, Flow endpoints, and embedded Scenes.
- Legacy visibility scopes become Collections only when they supply a Card's primary identity; otherwise they remain Sets.
- Existing example Flow bindings that disagreed with their drawn terminals were corrected to the exact Ports already used by the routes.
- Playground presets continue to serialise the established document shape through a Studio compatibility subpath, leaving its YAML, JSON, and TypeScript parser contract unchanged.

### Verification

- The migrated System and Infoschematics example PNGs are byte-identical to their pre-migration captures; SVG differences are limited to intended canonical `data-id` values.
- Focused canonical-boundary and example tests pass.
- `bun run self:check` exits 0: 71 test files and 487 tests pass, every TypeScript workspace compiles, dependency boundaries pass across 372 modules and 1,164 dependencies, generated artefacts are current, and the production Site builds.

### Outstanding concerns

The established configuration remains the internal runtime and Studio editing shape, and the public document parser still validates that established schema. Those are deliberate later migrations; compatibility is retained rather than removed here.

### Post-change review

The rollout remains within code-side model boundaries and authored examples. Documentation and Site content were not reorganised. The only Site source adjustment preserves existing Playground preset behaviour, and dependency-cruiser confirms the adapter remains behind an allowed Studio boundary.

### Mini recap

Completed the repository-wide consumer boundary and example migration after the IBC proof, with byte-identical visuals and legacy compatibility intact. Human review is required before closure; no push or release has occurred.

## Discussion

### Boundary adaptation

Reusable consumers accept either direct canonical data or the established configuration. Adaptation occurs once at the runtime boundary, so renderer and editor internals can migrate independently later without forcing hosts to retain the old authoring model.

### Compatibility

Legacy callers remain valid. Canonical callers no longer need to know about `establishedInfoschematicOf`, while the adapter stays public for specialised integration and verification.
