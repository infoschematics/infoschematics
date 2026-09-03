---
id: INFOSCHEMATICS-TOOL-006
area: TOOL
title: Complete artefact editing
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: fb2da8f1d1fb4631b804e2fe68eecc5b0a8bff7f
---

## Goal

Give Design consistent creation, selection, placement, resizing and ordering capabilities across all six Infoschematic artefact kinds.

## Context

Current editing capability is strongest for Cards and Flows. The settled product contract also requires type-appropriate editing for Lanes, Zones, Fabrics and Graphics, explicit per-kind stack order, and a Library that can create reusable Card, Fabric and Flow templates without retaining links to those templates.

## Boundary

This item changes Design capabilities and persistent authored data only where required. It does not own Scene composition, production-mode navigation, package publication, or the visual design of the public site.

## Current state

Cards can be created, selected, moved, renamed, assigned scope, given ports and removed. Flows can be created, selected, rerouted, reattached, relabelled, assigned family and removed. Both participate in draft persistence, undo, redo, discard and a reviewable change set. Fabrics are rendered and selectable but do not pass through the complete Card capability path; Lanes and Zones expose selection without authored geometry operations; Graphics are presentation overlays rather than Design artefacts; resizing, Library-driven creation and explicit within-kind ordering are absent.

## Steps

- [x] Add a capability-matrix test fixture covering create, select, move, resize, edit properties, remove and reorder for Lane, Zone, Fabric, Card, Flow and Graphic.
- [x] Replace stringly selected handles with a discriminated artefact selection that retains kind, stable identity and geometry role through Canvas, View Model and Studio.
- [x] Extend the common draft snapshot, persistence, undo, redo, discard and change ordering model before adding any new mutation so every later capability inherits the same session guarantees.
- [x] Add Lane creation, bounds editing and within-kind ordering while preserving the full-width and geographic constraints declared by the model.
- [x] Add Zone creation, bounds editing, containment and ordering within its owning Lane, rejecting geometry outside the Lane.
- [x] Bring Fabrics through common box movement, resizing, property editing, port editing, removal and within-kind ordering without coupling Design to a renderer implementation.
- [x] Complete Card resizing and within-kind ordering while preserving existing creation, movement, port and adapter behaviour.
- [x] Add Graphic creation, box placement, resizing, renderer-key properties, removal and within-kind ordering for authored overlays.
- [x] Complete Flow ordering, endpoint, port, route, waypoint, label and family operations while preserving valid attachment and orthogonal-route invariants.
- [x] Add Card, Fabric and Flow Library template contracts and controls; instantiation copies serialisable values into a new independent artefact with a newly allocated stable identity and no template provenance.
- [x] Consolidate every new operation into deterministic source-oriented change output in dependency-safe order, including cascades such as removing a Lane, Zone or endpoint.
- [x] Add keyboard and pointer interaction tests for selection, constrained movement, resizing handles, creation, removal, reordering and one-step undo per gesture.
- [x] Update Domain and Studio specifications with the supported capability matrix and explicitly retained non-goals.

## Files touched

- `packages/domain-model/src/artefact.ts`, `infoschematic.ts`, `lane.ts`, `zone.ts`, `fabric.ts`, `card.ts`, `flow.ts`, `graphic.ts` and focused model tests where contracts need extension;
- `packages/view-model/src/editable.ts`, geometry and ordering helpers plus focused tests;
- the owning Design package's editor state, editable adapter, panels, Canvas interaction layer and styles, currently under `packages/view-studio/src/app/**`;
- Library contracts and built-in template definitions without authored-instance provenance;
- `docs/design/view-studio.md`, `docs/specs/domain-model.md`, `docs/specs/view-model.md` and `docs/specs/view-studio.md`.

## Verify

The capability-matrix suite must prove every artefact supports only its type-appropriate operations and every change survives serialisation into valid Domain Model data. Geometry tests must prove Lane and Zone constraints, resizing minima, Graphic bounds, fixed depth and stable within-kind order. Rendered tests must prove pointer and keyboard operations, removal cascades, Library copying and undo/redo. Existing editor tests and `bun run check` must pass.

## Dependencies / blocks

No hard dependency on the production-mode or additive-view work remains. Design capability can be completed behind the current Design tab, and later mode or package extraction moves the already-owned state without changing its contract. Implementation must preserve any newer owner discovered during preflight rather than moving code back to a stale path.

## Documentation impact

### Decision Records

Add a decision only if the Domain Model needs a new durable ordering or template-identity rule beyond the existing structured-editor direction.

### Specifications

Extend Domain Model, View Model and Studio requirements with the six-kind capability matrix, geometry constraints, ordering, Library copy semantics and source-change output.

### Guides

Update authoring guidance for the resulting Design operations and the distinction between Library templates and independent authored artefacts.

### Roadmap

Keep Direct Scene, Theme and Story composition in `INFOSCHEMATICS-TOOL-005`; split only a newly discovered contract decision that cannot be resolved inside this boundary.

## Review

### Delivered

Delivered a six-kind Design capability model and end-to-end draft workflow for Lane, Zone, Fabric, Card, Flow and Graphic creation, selection, type-appropriate geometry, property editing, removal and within-kind ordering.

### Summary of changes

- Added a discriminated six-kind selection contract, capability matrix, constrained immutable operations, deterministic dependency ordering and a framework-neutral materialiser in View Model.
- Added full-shape keyboard and pointer selection, constrained movement and resizing, reorder/remove affordances, authored Graphic Design rendering and non-mutating draft preview to Canvas.
- Replaced Studio's independent draft maps with one versioned, backward-compatible serialisable envelope whose persistence, undo, redo, discard, sweep and change detection cover every field.
- Added typed Studio operation coalescing, property replacement, safe dependency cascades, source-oriented review rows and blocked-reference feedback.
- Added capability-driven Design controls and valid Lane, Zone and Graphic factories alongside Card, Fabric and Flow Library templates that allocate fresh identities and retain no provenance.
- Wired all six kinds through Studio pointer and keyboard interaction while retaining specialised Flow endpoints, routes, waypoints and Card port behavior.

### Verification

- Baseline: `fb2da8f1d1fb4631b804e2fe68eecc5b0a8bff7f`.
- Delivery commits: `9c0d0b10`, `90ed45e0`, `4803abe1`, `66a9aee2`, `3283031b`, `4e2cadf5`, `e27f8e1f`, `573983f7`, `531db583`, `13dbb85a`, `c43080f2`, `fe3dd49c` and `0f22e5ce`.
- View Model capability/materialisation suites, Canvas interaction/preview suites and Studio editor/App/panel suites passed, including all-six, cascade, stale-draft, Library and one-gesture undo coverage.
- View Model, Canvas and Studio TypeScript and dependency-boundary checks passed during focused integration.
- `bun run check` passed on 2026-09-03 after the integrated delivery.

### Outstanding concerns

Legacy string selection remains only for auxiliary Flow labels, ports and waypoints while the six authored artefact kinds use the discriminated contract. Studio blocks removal of a Graphic referenced by a Story and reports the reason; the lower-level materialiser also guarantees valid output by clearing references when invoked directly. Property bags use validated structured JSON until kind-specific forms are justified.

### Post-change review

The implementation preserves fixed kind depth and only reorders within authored kind arrays. Lane and Zone edits preserve their constrained axes, adapter geometry remains derived from the wrapped Card, Flow generic move/resize stays disabled, and Scope/Flow-family or renderer data remains serialisable authored content.

### Mini recap

TOOL-006 is ready for human review. Acceptance, pruning, pushing and releasing remain outside this delivery run.

## Done

Pending human acceptance.

## Discussion

### Geometry and order

Each kind needs geometry appropriate to its role: region bounds for Lanes and Zones, box bounds for Fabrics, Cards and Graphics, and routes with endpoints, ports and waypoints for Flows. Reordering remains within a kind while the fixed depth and kind order remains authoritative.
