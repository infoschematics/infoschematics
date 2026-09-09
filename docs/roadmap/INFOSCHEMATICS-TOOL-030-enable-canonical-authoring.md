---
id: INFOSCHEMATICS-TOOL-030
area: TOOL
title: Enable canonical authoring
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 6697d617eed10cfa4e4786a4e0b2f6bd2a559164
---

# Enable canonical authoring

## Goal

Make the vocabulary-aligned Infoschematic model directly authorable and consumable through a compatibility adapter so IBC-2026 can migrate before the rest of the Infoschematics applications and examples.

## Context

`INFOSCHEMATICS-TOOL-029` proved that the agreed model can project the unchanged IBC definition without visual drift. The next delivery order is explicit: finish the model and its compatibility boundary in this repository, migrate IBC-2026, then update the remaining Infoschematics consumers.

Another thread owns documentation and Site reorganisation. This item therefore stays inside model, normalisation, compatibility, package exports, and verification surfaces.

## Boundary

This item does not migrate Infoschematics examples, Playground seeds, Canvas, Present, Studio, static renderer internals, public schemas, specifications, guides, or vocabulary documentation. It does not alter IBC source files. Those changes follow after the IBC consumer proves the canonical authoring path.

## Current state

The canonical types and legacy-to-model projection are additive. There is no canonical authoring normaliser, reference validation, model-to-established view adapter, or compatibility-test path that renders a canonical definition. The repository is clean and `bun run self:check` passes at the immutable baseline above.

## Steps

- [x] Refine the canonical types to preserve required IBC semantics without restoring retired model concepts.
- [x] Add canonical definition normalisation and validation with serialisable defaults and globally checked references.
- [x] Add a framework-neutral adapter from the canonical model to the established renderer/view contract, including derived route terminals and legacy Port defaults.
- [x] Make the IBC compatibility harness accept either contract and compare both through one canonical state identity.
- [x] Add focused model, adapter, route, Assembly, Scene-copy, and validation tests.
- [x] Export the canonical authoring and compatibility entry points without changing existing entry points.
- [x] Run the full repository verification gate and prepare the IBC handoff.

## Files touched

- `packages/domain-model/src/`
- `packages/domain-model/package.json`
- `packages/domain-core/src/`
- `packages/domain-core/package.json`
- `packages/view-model/src/`
- `packages/view-model/package.json`
- `scripts/ibc-visual-compatibility.ts`
- `scripts/ibc-visual-compatibility.test.ts`
- `docs/roadmap/INFOSCHEMATICS-TOOL-030-enable-canonical-authoring.md`
- `docs/roadmap/_ISSUES.md`

## Verify

`bun run self:check` must pass. Focused compatibility tests must prove canonical normalisation is serialisable, reference-safe, and reversible into the established view contract. The unchanged IBC fixture must still pass all 39 semantic, grid-topology, and fuzzy-raster comparisons.

## Dependencies / blocks

`INFOSCHEMATICS-TOOL-029` has delivered the compatibility evidence and baseline. Its pending lifecycle acceptance does not block build order because the required code and fixture already exist.

## Documentation impact

### Decision Records

No Decision Record changes are included; this implements the model direction agreed in the walkthrough and represented by `INFOSCHEMATICS-TOOL-029`.

### Specifications

Public specifications remain unchanged until IBC has exercised the canonical path and the remaining repository consumers are ready to migrate together.

### Guides

No guide changes are included. The concurrent documentation thread retains ownership of documentation reorganisation.

### Roadmap

This record isolates the minimal producer-side authoring adapter. IBC owns its consumer migration in `IBC2026-CONTRACT-005`; a subsequent Infoschematics item will own the remaining local rollout.

## Review

### Delivered

Canonical Infoschematic definitions can now be normalised, validated, and adapted into the established rendering contract. The unchanged IBC-2026 definition passes through that path with all 39 rendered PNGs byte-identical to the pre-adapter capture.

### Summary of changes

- `packages/domain-model/src/model.ts` completes the directly authorable canonical shape needed by IBC, including Card interfaces and complete normalised result types.
- `packages/domain-core/src/model.ts` validates global Diagram references, supplies one-Port canonical defaults, copies legacy source Scenes into their owners, and preserves legacy seven-Port geometry during projection.
- Mixed legacy dashed and solid Flows retain one semantic Family, with line treatment projected as a per-Flow override without changing the rendered lines.
- `packages/view-model/src/compatibility.ts` derives the established view contract from canonical data, including Assembly geometry and full Flow routes.
- Diagram callout placement candidates survive both compatibility directions; empty candidate sets fall back safely to centre.
- `scripts/ibc-visual-compatibility.ts` accepts legacy or canonical IBC exports and renders both through the same canonical boundary.

### Verification

- Focused model, adapter, and compatibility-harness tests pass: 7 tests across 3 files.
- All 39 post-adapter IBC PNG hashes exactly match the pre-adapter capture; no fuzzy allowance was required.
- `bun run self:check` exits 0: 71 test files and 496 tests pass, every TypeScript workspace compiles, dependency boundaries pass, generated artefacts are current, and the production Site builds.

### Outstanding concerns

The adapter is deliberately temporary. Existing renderer and View packages still consume the established contract, and the rest of this repository has not yet moved to canonical authoring. That work remains outside this item until IBC-2026 proves the authored migration against the captured canonical baseline.

### Post-change review

The change remains inside the approved model and compatibility boundary. Documentation, Site source, examples, Playground, renderer internals, public schemas, and IBC source files are unchanged. The canonical model removes `sourceScene` relationships while retaining exact legacy output through copied Scenes and per-Flow line treatment.

### Mini recap

Established the minimal canonical authoring path, preserved all existing IBC visual output exactly, and prepared a strict semantic, grid-topology, and raster baseline for the IBC-2026 data migration. Human review is required before lifecycle closure; no push or release has occurred.

## Discussion

### Compatibility direction

Existing inputs continue through `defineInfoschematic`. Canonical inputs use an explicit authoring entry point and can be adapted at application boundaries while renderers still consume the established runtime contract. This keeps the first cross-repository change data-focused and reversible.

### Visual identity

Canonical IDs are code-like and become the only element references. Collections and Families provide shared Card and Flow identity; Fabrics, Points, and Regions retain direct identity. A Flow may override its Family's default line treatment without changing that semantic identity. Point remains a visible source-or-sink endpoint.

### Presentation model

Themes and Stories own copied Scenes. The canonical model has no top-level Scene list, `sourceScene`, or Scene inheritance. The adapter may project owned Scenes into the established runtime shape but must not recreate an authored relationship.
