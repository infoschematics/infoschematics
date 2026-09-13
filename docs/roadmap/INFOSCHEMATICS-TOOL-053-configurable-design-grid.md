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
updated_at: 2026-09-13T20:08:57Z
---

# Configurable Design grid

## Goal

Let Producers choose the [Design](../reference/vocabulary.md#design) editing-grid increment, using ten diagram units by default, one as the finest active grid, and zero to turn grid snapping off.

## Context

Design currently stores `grid` as a boolean and takes the ten-unit increment from a visual token. Turning the grid on affects the editing-grid overlay, pointer placement, creation, and resize steps; alignment-guide snapping is controlled separately. A configurable diagram-coordinate increment gives precise placement without requiring a different model scale or viewport size.

## Boundary

This item does not change authored Canvas grid appearance, the canonical diagram coordinate system, port-spacing rules, alignment-guide thresholds, keyboard nudging's exact-placement contract, or persist an editing preference in authored YAML.

## Current state

Entering Design enables a fixed ten-unit grid and guide snapping. The toolbar can only toggle the grid, and Canvas and Studio read the shared ten-unit visual token as both drawing geometry and editing behaviour.

## Steps

- [ ] Replace the Design-session grid boolean with a validated numeric increment: `10` by default, `0` disabled, and active values constrained to `1` or greater.
- [ ] Add an accessible compact grid-size control to the Design tools, preserving a quick way to switch snapping off and restore the default.
- [ ] Parameterise the editing-grid overlay, pointer placement, creation, and resize snapping from the selected increment instead of the fixed visual token.
- [ ] Keep alignment-guide snapping independent and document how guides and a non-zero grid interact when both are enabled.
- [ ] Keep keyboard nudging and numeric placement exact unless the Producer explicitly chooses a grid-stepped operation already covered by the editing contract.
- [ ] Cover default, one-unit, custom, and zero-grid behaviour across move, resize, create, mode changes, zoom, and pan.
- [ ] Update routing, placement, Design-session, and Producer guidance with the configurable-grid contract.

## Files touched

- `packages/view-model/src/` for parameterised grid projection where framework-neutral calculation is needed
- `packages/view-canvas/src/InfoschematicDiagram.tsx` and focused Canvas tests
- `packages/view-studio/src/app/editor/` for Design-session state and controls
- `docs/specs/routing-and-placement.md`
- `docs/specs/design-editing.md`
- affected Producer guidance under `docs/guides/`

## Verify

Run focused View Model, Canvas, and Studio tests plus `bun run self:check`. In a browser fixture, confirm a fresh Design session uses ten-unit snapping, `1` permits unit placement, a custom increment is reflected by both overlay and pointer operations, `0` removes the editing grid and grid rounding, guide snapping remains independently controllable, and no setting changes authored YAML.

## Dependencies / blocks

No hard dependency is known. Coordinate its browser cases with [Design editing regression contract](INFOSCHEMATICS-TOOL-037-design-editing-regression-contract.md) and its toolbar placement with [Design interaction layers](INFOSCHEMATICS-TOOL-045-design-interaction-layers.md), without making either feature a build-order dependency.

## Documentation impact

### Decision Records

No new decision record is expected because this extends the existing diagram-coordinate editing-grid decision. Add one only if grid size becomes authored model data or changes ownership between View Model and Studio.

### Specifications

Update the routing and Design editing requirements to define default, minimum active value, disabled value, affected operations, guide interaction, and exact-placement exceptions.

### Guides

Explain how Producers choose coarse, fine, custom, or disabled grid snapping and distinguish the editing grid from authored Canvas appearance.

### Roadmap

Keep general selection-layer behaviour in `INFOSCHEMATICS-TOOL-045` and existing interaction regression coverage in `INFOSCHEMATICS-TOOL-037`.

## Discussion

### Scale independence

The increment is expressed in diagram coordinates. Authors who want finer relative placement can use a larger coordinate space, but they should not need to rescale a model merely to make an occasional off-ten placement.

### Zero and one

Zero is the unambiguous disabled state. One is the finest active grid and preserves integer-coordinate determinism without pretending that no snapping is occurring.

### Session ownership

Grid size is an editing preference, not Diagram semantics. It belongs to transient Studio state unless a later host-preference contract deliberately supplies persistence outside the Infoschematic document.
