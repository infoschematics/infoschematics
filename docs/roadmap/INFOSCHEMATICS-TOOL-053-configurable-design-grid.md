---
id: INFOSCHEMATICS-TOOL-053
area: TOOL
title: Configurable Design grid
theme: tool
horizon: next
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-13T20:11:33Z
---

# Configurable Design grid

## Goal

Let authors declare the diagram's grid size in YAML, using ten diagram units by default, one as the finest active grid, and zero to disable the grid and grid snapping.

## Context

[Design](../reference/vocabulary.md#design) currently stores `grid` as transient boolean state and takes the ten-unit increment from a visual token. Turning the grid on affects the editing-grid overlay, pointer placement, creation, and resize steps; alignment-guide snapping is controlled separately. The grid is part of the authored diagram's coordinate system, so its size must travel with the model rather than depend on a particular Studio session.

The canonical YAML should expose a diagram-level `gridSize`. Omitting it retains the compact default of `10`; `1` permits unit placement; `0` means that no coordinate grid is active. The authored appearance treatment can still decide whether an active grid is visible outside Design.

## Boundary

This item does not change diagram bounds, rescale existing coordinates, change port-spacing rules, alter alignment-guide thresholds, or merge grid size with the appearance choice for major or minor grid treatment. It does not make Studio preferences part of the Infoschematic document beyond the shared diagram grid itself.

## Current state

Entering Design enables a fixed ten-unit grid and guide snapping. The toolbar can only toggle the transient grid, while Canvas and Studio read the shared ten-unit visual token as both drawing geometry and editing behaviour. Canonical YAML has no grid-size field.

## Steps

- [ ] Add canonical `diagram.gridSize` model and schema support, accepting `0` or values of `1` and greater, defaulting omitted values to `10` internally.
- [ ] Place `gridSize` with diagram geometry in compact serialisation, omit the default, and cover YAML and JSON structural and shorthand round trips.
- [ ] Replace the Design-session grid boolean with the resolved authored size and let Studio edit `diagram.gridSize` as a reviewable, undoable model change.
- [ ] Add an accessible compact grid-size control to the Design tools, preserving a quick way to choose `0` and restore the default.
- [ ] Parameterise the editing-grid overlay, authored grid pattern, pointer placement, creation, and resize snapping from the resolved diagram grid instead of the fixed visual token.
- [ ] Keep alignment-guide snapping independent and document how guides and a non-zero grid interact when both are enabled.
- [ ] Keep keyboard nudging and numeric placement exact unless the Producer explicitly chooses a grid-stepped operation already covered by the editing contract.
- [ ] Cover omitted, one-unit, custom, and zero-grid behaviour across parse, serialise, move, resize, create, mode changes, zoom, pan, Canvas, and static SVG.
- [ ] Update the canonical model, routing, placement, Design-session, appearance, and authoring guidance with the diagram-grid contract.

## Files touched

- `packages/domain-model/src/` for the canonical Diagram field
- `packages/domain-core/src/` for validation, defaulting, ordering, and serialisation
- `packages/view-model/src/` for resolved grid projection
- `packages/view-canvas/src/InfoschematicDiagram.tsx` and focused Canvas tests
- `packages/view-studio/src/app/editor/` for authored Design controls and draft history
- `packages/render-svg/src/` for authored grid rendering parity
- `docs/specs/domain-model.md`
- `docs/specs/routing-and-placement.md`
- `docs/specs/design-editing.md`
- `docs/specs/appearance.md`
- affected authoring and Producer guidance under `docs/guides/`

## Verify

Run focused Domain Core, View Model, Canvas, Studio, and static-renderer tests plus `bun run self:check`. Prove omitted YAML normalises to `10` without serialising boilerplate, `1` permits unit placement, a custom value drives editing and rendered grid geometry, and `0` disables grid rendering and grid rounding while guide snapping remains independently controllable. Confirm a Studio grid-size edit appears in its reviewable YAML change and undo restores the previous value.

## Dependencies / blocks

No hard dependency is known. Coordinate its browser cases with [Design editing regression contract](INFOSCHEMATICS-TOOL-037-design-editing-regression-contract.md) and its toolbar placement with [Design interaction layers](INFOSCHEMATICS-TOOL-045-design-interaction-layers.md), without making either feature a build-order dependency.

## Documentation impact

### Decision Records

Update the diagram-coordinate editing decision, or add a focused decision if none currently owns the distinction between authored grid geometry, appearance treatment, and Studio interaction.

### Specifications

Update the canonical model, routing, Design editing, and appearance requirements to define field ownership, default, minimum active value, disabled value, affected operations, renderer behaviour, guide interaction, and exact-placement exceptions.

### Guides

Explain how authors declare coarse, fine, custom, or disabled grid geometry in YAML and how Producers change it through Studio.

### Roadmap

Keep general selection-layer behaviour in `INFOSCHEMATICS-TOOL-045` and existing interaction regression coverage in `INFOSCHEMATICS-TOOL-037`.

## Discussion

### Authored geometry

Grid size is a property of the diagram's coordinate lattice. Carrying it in canonical YAML makes the same geometry and editing behaviour portable across Studio instances and renderers.

### Appearance and interaction

An active grid size does not require a visible grid in every output. Appearance controls whether and how the lattice is drawn; Design uses the same authored size for its editing overlay and snapping. A size of zero suppresses both because no lattice exists to display or snap to.

### Zero and one

Zero is the unambiguous disabled state. One is the finest active grid and preserves integer-coordinate determinism without pretending that no snapping is occurring.
