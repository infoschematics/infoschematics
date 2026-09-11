---
id: INFOSCHEMATICS-TOOL-028
area: TOOL
title: SVG artefact identity
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 40d39468bced5200820a80959241d9cbd94581cc
---

## Goal

Make every rendered diagram artefact addressable by its authored ID through one documented, collision-safe SVG metadata contract shared by static SVG and Canvas output.

## Context

Authored IDs are already present in both SVG paths, but not through one public contract. `@infoschematics/render-svg` emits `data-id` on the outer Region, Fabric, Flow, Card, Point, and Graphic groups. Canvas emits `data-artefact-id` and `data-artefact-kind` on its corresponding interactive groups. Tests exercise those attributes incidentally for focus, signalling, editing, and preview ordering, while the renderer specifications do not promise them.

Using an authored ID directly as the native SVG `id` attribute would introduce unnecessary constraints. Authored IDs are unrestricted strings, native IDs share a document-wide namespace, and several Infoschematics may be mounted in one page. Renderer-owned definitions such as patterns and markers also already use native IDs internally.

## Boundary

This item does not implement diagram dynamics, expose renderer component structure, make internal SVG child nodes addressable, or assign output identity to model records that have no rendered artefact group. It does not add DOM callbacks or browser state to authored definitions. Port identity and whole-diagram identity remain explicit shaping decisions rather than being included implicitly.

## Shaping

Standardise the outer owning SVG group on `data-artefact-id` and `data-artefact-kind`, then document which authored artefact kinds participate. Audit consumers of static `data-id` before choosing removal, compatibility duplication, or migration. Add cross-renderer contract tests and specification requirements that assert identity without freezing child markup or output ordering.

Before promotion to Next, decide the canonical kind names, the compatibility policy for `data-id`, whether a root diagram identity is required when `InfoschematicConfig.id` is present, and whether visible port markers need a composite identity contract. Confirm that custom Graphics retain the authored Graphic ID on their host-owned outer group regardless of renderer output.

## Current state

Canvas already emits `data-artefact-id` and `data-artefact-kind` on the owning group for all six visual element types, except its compatibility-shaped Graphic value still emits `graphic`. Static SVG emits only `data-id` on the same groups. Neither renderer specification defines the attributes as a stable host-facing contract.

The canonical kind values are `region`, `fabric`, `flow`, `card`, `point` and `overlay`. Static SVG retains its existing `data-id` attribute for compatibility while adding the shared pair. Root Diagram and visible Port identity remain outside this first contract because neither is one of the six visual element types.

## Steps

- [x] Add `data-artefact-id` and canonical `data-artefact-kind` attributes to every outer visual-element group in static SVG.
- [x] Retain static SVG `data-id` compatibility and keep renderer-owned native SVG `id` values unchanged.
- [x] Emit canonical `overlay` metadata from Canvas while retaining its internal compatibility selection kind.
- [x] Add renderer-specific contract tests covering all six visual element kinds and collision-safe authored IDs.
- [x] Document the shared metadata contract in the Canvas and Static Renderer specifications.
- [x] Run focused renderer tests and the complete repository verification gate.

## Files touched

- `packages/render-svg/src/index.ts`
- `packages/render-svg/src/index.test.ts`
- `packages/view-canvas/src/InfoschematicDiagram.tsx`
- `packages/view-canvas/src/InfoschematicDiagram.editing.test.tsx`
- `docs/specs/render-svg.md`
- `docs/specs/view-canvas.md`
- This work record

## Verify

- `bunx vitest run packages/render-svg packages/view-canvas/src/InfoschematicDiagram.editing.test.tsx`
- `bun run self:check`
- `ki repo audit --skill ki-work-roadmap --repo .`
- `ki repo audit --skill ki-authoring --repo .`

## Dependencies / blocks

Canonical visual-element names and authored identity are already established. Diagram dynamics may consume this contract later but do not block it.

## Documentation impact

### Decision Records

No new decision record is needed because this is an additive renderer contract that follows canonical vocabulary and preserves the existing static attribute.

### Specifications

Canvas and Static Renderer specifications will define the shared collision-safe outer-group metadata pair and its six canonical kind values.

### Guides

No guide change is needed; the attributes are integration and inspection metadata rather than visible diagram treatment.

### Roadmap

This record will close the output identity prerequisite without widening Diagram dynamics or Port identity work.

## Review

### Delivered

Every outer SVG group that owns a rendered Region, Fabric, Flow, Card, Point or Overlay now carries the authored identifier in `data-artefact-id` and the canonical kind in `data-artefact-kind` across static SVG and Canvas. Static SVG retains `data-id`, and authored IDs are not copied into the native SVG `id` namespace. The immutable implementation baseline is `40d39468bced5200820a80959241d9cbd94581cc`.

### Summary of changes

- `packages/render-svg/src/index.ts` emits the shared metadata pair for all six visual element groups while retaining `data-id`.
- `packages/view-canvas/src/InfoschematicDiagram.tsx` emits canonical `overlay` for compatibility-shaped Graphic selections without changing editor selection values.
- Static renderer tests cover all six kinds, authored IDs containing separators, the compatibility attribute and absence of authored native IDs.
- Canvas editing tests verify the canonical kind projection and absence of authored native IDs across the existing six-kind fixture.
- Static Renderer and Canvas specifications define the stable outer-group contract and explicitly exclude child markup and native-ID ownership.

### Verification

- `bunx vitest run packages/render-svg packages/view-canvas/src/InfoschematicDiagram.editing.test.tsx` passed.
- `bun run self:check` passed.
- `ki repo audit --skill ki-work-roadmap --repo .` passed.
- `ki repo audit --skill ki-authoring --repo .` passed.

### Outstanding concerns

The vocabulary reference still uses the stable legacy `graphic` anchor and older Graphic prose even though the canonical model and emitted kind now say Overlay. The Static Renderer specification therefore links its Overlay term to that existing anchor. A corpus-wide Graphic-to-Overlay terminology migration is still needed but was deliberately not folded into this renderer contract.

### Post-change review

The item’s additive identity contract is complete and collision-safe without changing visible output, geometry, native renderer IDs, editor selection values or authored data. Root Diagram identity, Port identity, dynamics and child-node structure remain outside the contract as planned. The implementation is ready for consumer review.

### Mini recap

Delivered one documented metadata pair across both SVG renderers for all six visual element types, canonicalised Overlay output, retained static compatibility and added contract coverage. All automated gates pass; only the separate documentation terminology migration remains.

## Done

Accepted 2026-09-11 by Kris Brown on the review packet above.

## Discussion

### Recommended attribute contract

`data-artefact-id` and `data-artefact-kind` are the recommended public hooks because they carry authored identity without claiming native document identity. The contract should attach them to the outer group that semantically owns one rendered artefact and should not promise a specific child element, CSS class, or position in the SVG tree.

### Existing coverage

Static SVG already covers Regions, Fabrics, Flows, Cards, Points, and Graphics through `data-id`; Canvas already carries the richer pair on the same broad set. The work is therefore primarily contract alignment, completeness review, compatibility, tests, and documentation rather than inventing identity from scratch.

### Dynamics relationship

Stable rendered identity is useful for diagram dynamics, host integrations, inspection, testing, and accessibility tooling. Dynamics should still target authored IDs through the framework-neutral model rather than manipulating SVG nodes directly; the SVG metadata is an output hook and traceable representation of that identity, not the dynamics API itself.
