---
id: INFOSCHEMATICS-TOOL-011
area: TOOL
title: Remove IBC residue
theme: tool
horizon: now
status: awaiting-review
blocks: [INFOSCHEMATICS-TOOL-008]
blocked_by: []
baseline_ref: 1ac734b31673cf2cdf6948be580fc6d31fea786e
---

## Goal

Remove the original IBC 2026 realisation's authored and rendering residue from reusable packages so the Canvas, Present, and Studio extraction starts from a host-neutral baseline.

## Context

A source comparison with the original IBC 2026 repository found first-realisation material still embedded in `packages/view-studio`. The residue includes fixed Story Graphics and narrative text, Fabric implementations and coordinates, exact labels and identifiers, IBC-specific runtime coupling, source-specific icon mappings, fixed card placement, media-service copy, test fixtures, comments, selectors, and stale interface CSS.

The authored IBC definition itself is not present. Historical documentation provenance and the legacy persistence-key compatibility path are intentional and are not residue. `INFOSCHEMATICS-TOOL-008` is explicitly behaviour-preserving, so it would otherwise distribute the embedded assumptions into the new package boundaries.

## Boundary

This item removes, generalises, or isolates first-realisation material only where it leaks into reusable product behaviour. The approved delivery includes the matching host declaration and compatibility migration in the original IBC repository. It does not erase historical provenance, remove intentional storage compatibility, design the versioned renderer registry and validation contract owned by `INFOSCHEMATICS-TOOL-007`, complete editing owned by `INFOSCHEMATICS-TOOL-006`, or centralise all visual tokens owned by `INFOSCHEMATICS-TOOL-009`.

## Current state

`packages/view-studio` can render the blank example, but its reusable implementation still knows the IBC story names, Fabric layout, labels, codes, lane identifiers, scopes, geometry, and vocabulary. Some of those details are visible output; others are hidden branches or styling hooks that make the package source-specific even when the current definition is blank.

## Steps

- [x] Add an explicit host-owned renderer configuration to Studio for Fabric components, Story Graphics, shared SVG definitions, and Scope icons while keeping authored definitions serialisable.
- [x] Replace the reusable package's IBC-specific Fabric selection and coupling with independent key lookup, generic bounds-driven fallback rendering, and host-neutral interaction wrappers.
- [x] Resolve Story Graphic references through authored Graphic records and configured renderers, removing the implicit `gap` and `cycle` fallback and its embedded narrative.
- [x] Remove fixed IBC label branches, telemetry state, lane selectors, scope mappings, card placement coordinates, stale interface CSS, and source-specific visible or accessibility copy from reusable code.
- [x] Move the four IBC Fabric renderers, their SVG definitions and CSS, both Story Graphic renderers, Scope icon mapping, and explicit Graphic declarations into the IBC 2026 host.
- [x] Migrate the IBC host to the current Infoschematics package names and ownership-root paths so local linking and clean vendor builds consume the same public surfaces.
- [x] Add focused reusable-package tests for renderer injection, generic fallback behaviour, bounds-driven placement, and unresolved Graphic references, plus IBC host assertions for every declared renderer key.
- [x] Run both repositories' complete checks and record the paired commit evidence without pushing either repository.

## Files touched

- `packages/view-studio/src/app/**`, `packages/view-studio/src/index.ts`, and `packages/view-studio/src/styles.css` for the renderer seam, neutral fallbacks, composition, copy, and tests;
- removal of `packages/view-studio/src/library/**` and the embedded Story Graphic component;
- `docs/specs/view-studio.md` and `docs/guides/react-integration.md` for the host-owned rendering contract;
- the IBC repository's package manifests, authored Graphic declarations, Site renderer components, host composition, CSS, tests, and integration guidance.

## Verify

In Infoschematics, focused tests must prove the blank example and a representative host-neutral configuration render without IBC names, codes, narrative, fixed coordinates, or source-specific runtime branches; injected renderers receive authored data and effective bounds; unknown Fabric keys use the generic fallback; and unresolved Story Graphic references render no invented content. A bounded source search must distinguish zero reusable-package residue from the explicitly retained provenance and compatibility occurrences. `bun run check` is the final gate.

In the IBC repository, type checking, tests, and the production build must pass against the linked current Infoschematics checkout. Tests or static assertions must show that every authored Fabric, Graphic, and Scope icon key has a host renderer. A clean vendor-path install must remain supported by the committed manifests and lockfile.

## Dependencies / blocks

This item blocks `INFOSCHEMATICS-TOOL-008` so package extraction does not preserve or spread source-specific assumptions. Both repositories are available locally and the user has explicitly authorised the paired changes and commits. `INFOSCHEMATICS-TOOL-007`, `INFOSCHEMATICS-TOOL-006`, and `INFOSCHEMATICS-TOOL-009` retain their renderer-registry, editing, and visual-token scopes; this item establishes only the minimal host injection seam required for separation.

## Documentation impact

### Decision Records

No new decision is expected unless classification reveals a change to renderer or host ownership.

### Specifications

Document the host renderer configuration, generic Fabric fallback, and authored Graphic resolution behaviour in the Studio specification.

### Guides

Document how a React host declares renderers separately from its serialisable Infoschematic definition, and update the IBC repository's integration guidance to name the current packages.

### Roadmap

Keep this item as the active blocker and return `INFOSCHEMATICS-TOOL-008` to Next until this delivery reaches review.

## Review

### Delivered

Removed IBC-specific rendering and narrative residue from reusable Studio code while preserving the complete visual realisation through explicit, serialisable declarations and host-owned React renderers in the IBC 2026 repository.

### Summary of changes

Studio now accepts an `InfoschematicRenderers` host configuration for Fabrics, Graphics, shared SVG definitions, and Scope icons. It resolves Story Graphics through authored records, renders each visible Fabric independently, and supplies a generic bounds-driven fallback. The IBC host now owns its four Fabric implementations, two authored Graphics, shared SVG resources, visual CSS, icon mapping, and current package integration. The paired implementation commits are Infoschematics `cb2a7caee13605bf90997648e87825bbbe3becbf` and IBC 2026 `1a9be3d598d9af5297a7a0be04967d6e5c3ee178`, delivered from baseline `1ac734b31673cf2cdf6948be580fc6d31fea786e`.

### Verification

Infoschematics passed `bun run check`, including tests, all TypeScript workspaces, dependency boundaries, and the production Site build. IBC 2026 passed `bun run typecheck`, `bun run test`, and `bun run build`. Focused tests cover configured renderers, generic Fabric fallback, authored and unresolved Story Graphic references, complete IBC renderer-key coverage, and server-rendered host Fabric output. A bounded reusable-package source search found no remaining first-realisation names, labels, narrative, renderer keys, or source-specific visual selectors covered by this item.

### Outstanding concerns

The production builds retain their existing large-chunk advisory. General renderer registration ergonomics, versioned property schemas, diagnostics, and future unknown-key policy remain correctly assigned to `INFOSCHEMATICS-TOOL-007`; they are not residue required for this separation.

### Post-change review

Ready for human acceptance. The reusable-to-host ownership boundary is explicit, the original information is retained in serialisable IBC declarations and host renderers, and both repositories build against the same current public package surfaces.

### Mini recap

Infoschematics no longer embeds knowledge of the IBC 2026 diagram. The IBC project now composes that realisation through configuration and host rendering, making the boundary visible in both repositories' commit histories.

## Discussion

### Renderer configuration

The authored definition retains stable renderer keys and primitive properties only. Studio accepts a separate React host configuration that maps those keys to Fabric and Graphic components, supplies optional shared SVG definitions, and maps authored Scope icon keys to icon components. The reusable package owns the wrapper, selection behaviour, generic fallback, and prop contract; the IBC host owns its visual implementations and styling.

This is deliberately smaller than the general registry work. `INFOSCHEMATICS-TOOL-007` still owns public registration ergonomics, versioned property schemas, validation, diagnostics, and deterministic unknown-key policy across future View packages.

### Cross-repository sequence

The reusable public seam lands first so the linked IBC checkout can consume it. The IBC host then declares all keys and moves the visual implementation locally. Both repositories are verified together before the Infoschematics item records review evidence.

### Ownership test

Content, geometry, identifiers, or branching that exists only because of the first IBC 2026 authored Infoschematic belongs in authored data or its host. A reusable implementation may retain a general rendering capability only when its inputs and behaviour no longer encode that specific realisation.

### Compatibility

Delivery must measure the original IBC host's dependency on every removed built-in and record the required handoff. Compatibility risk is evidence for migration work, not a reason to leave undocumented source-specific behaviour in reusable packages.
