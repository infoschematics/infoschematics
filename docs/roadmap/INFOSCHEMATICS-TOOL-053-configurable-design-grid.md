---
id: INFOSCHEMATICS-TOOL-053
area: TOOL
title: Configurable Design grid
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: e7d790a2174873ec57990d54519394c5ed8f0f5c
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-15T05:41:00Z
---

# Configurable Design grid

## Goal

Require authors to declare the diagram's grid size in YAML, using ten diagram units for the ordinary grid, one as the finest active grid, and zero to disable the grid and grid snapping.

## Context

[Design](../reference/vocabulary.md#design) currently stores `grid` as transient boolean state and takes the ten-unit increment from a visual token. Turning the grid on affects the editing-grid overlay, pointer placement, creation, and resize steps; alignment-guide snapping is controlled separately. The grid is part of the authored diagram's coordinate system, so its size must travel with the model rather than depend on a particular Studio session.

Canonical YAML must expose a required diagram-level `gridSize` alongside required `bounds`. Authors choose `10` for the ordinary grid, `1` for unit placement, another value for a coarser lattice, or `0` when no coordinate grid is active. The authored appearance treatment can still decide whether a non-zero grid is visible outside Design.

## Boundary

This item does not change diagram bounds, rescale existing coordinates, change port-spacing rules, alter alignment-guide thresholds, or merge grid size with the appearance choice for major or minor grid treatment. It does not make Studio preferences part of the Infoschematic document beyond the shared diagram grid itself.

## Current state

Entering Design enables a fixed ten-unit grid and guide snapping. The toolbar can only toggle the transient grid, while Canvas and Studio read the shared ten-unit visual token as both drawing geometry and editing behaviour. Canonical YAML and the Diagram type have no grid-size field.

## Steps

- [x] Add required canonical `diagram.gridSize` model and schema support, accepting `0` or values of `1` and greater with no implicit default.
- [x] Place `gridSize` beside `bounds` in compact serialisation, always emit it, and reject YAML or JSON whose Diagram omits it.
- [x] Migrate every canonical fixture and in-repository example to declare its intended grid size, and document the required migration for external authored models.
- [x] Supply `10` only at the established `InfoschematicConfig` compatibility boundary so the established path remains source-compatible without weakening the canonical contract.
- [x] Replace the Design-session grid boolean with the resolved authored size and let Studio edit `diagram.gridSize` as a reviewable, undoable model change.
- [x] Add an accessible compact grid-size control to the Design tools, preserving a quick way to choose `0` and restore `10`.
- [x] Parameterise the editing-grid overlay, authored grid pattern, pointer placement, creation, and resize snapping from the resolved Diagram field instead of the fixed visual token.
- [x] Keep alignment-guide snapping independent and document how guides and a non-zero grid interact when both are enabled.
- [x] Keep keyboard nudging and numeric placement exact unless the Producer explicitly chooses a grid-stepped operation already covered by the editing contract.
- [x] Cover required, one-unit, custom, and zero-grid behaviour across parse, serialise, compatibility, move, resize, create, mode changes, zoom, pan, Canvas, and static SVG.
- [x] Update the canonical model, routing, placement, Design-session, appearance, and authoring guidance with the diagram-grid contract.

## Files touched

- `packages/domain-model/src/` for the required canonical Diagram field
- `packages/domain-core/src/` for validation, ordering, and serialisation
- `packages/view-model/src/` for compatibility and resolved grid projection
- `packages/view-canvas/src/InfoschematicDiagram.tsx` and focused Canvas tests
- `packages/view-studio/src/app/editor/` for authored Design controls and draft history
- `packages/render-svg/src/` for authored grid rendering parity
- `examples/` and canonical fixtures for required field migration
- `docs/specs/domain-model.md`
- `docs/specs/routing-and-placement.md`
- `docs/specs/design-editing.md`
- `docs/specs/appearance.md`
- affected authoring and Producer guidance under `docs/guides/`

## Verify

Run focused Domain Core, View Model, Canvas, Studio, and static-renderer tests plus `bun run self:check`. Prove canonical YAML without `gridSize` fails validation, declared `10` preserves current output, `1` permits unit placement, a custom value drives editing and rendered grid geometry, and `0` disables grid rendering and grid rounding while guide snapping remains independently controllable. Confirm established configuration still resolves to `10`, a Studio grid-size edit appears in its reviewable YAML change, and undo restores the previous value.

## Dependencies / blocks

No hard dependency is known. Coordinate its browser cases with the `INFOSCHEMATICS-TOOL-037` design-editing regression contract and its toolbar placement with [Design interaction layers](INFOSCHEMATICS-TOOL-045-design-interaction-layers.md), without making either feature a build-order dependency.

## Documentation impact

### Decision Records

Update the diagram-coordinate editing decision, or add a focused decision if none currently owns the distinction between authored grid geometry, appearance treatment, and Studio interaction.

### Specifications

Update the canonical model, routing, Design editing, and appearance requirements to define the required field, valid values, affected operations, renderer behaviour, compatibility default, guide interaction, and exact-placement exceptions.

### Guides

Explain how authors declare coarse, fine, or disabled grid geometry in YAML and how Producers change it through Studio. Include the mandatory-field migration.

### Roadmap

Keep general selection-layer behaviour in `INFOSCHEMATICS-TOOL-045` and existing interaction regression coverage in `INFOSCHEMATICS-TOOL-037`.

## Review

### Delivered

Implemented from immutable baseline `e7d790a2174873ec57990d54519394c5ed8f0f5c`. The model, schema, serialisation, renderer, and Studio work landed in `1b31c0373fca782668482ab763313f4f7834f6e6`; the documentation contract required by the Steps and Documentation impact sections of this plan did not, and was completed separately before closure.

### Summary of changes

`diagram.gridSize` is a required non-negative integer on the canonical Diagram, validated by `packages/domain-core/src/schema.ts`, placed beside `bounds` in compact serialisation, and migrated across every fixture, example, and Playground seed. `packages/view-model/src/tokens.ts` supplies `10` only at the `InfoschematicConfig` compatibility boundary. The Design-session grid boolean is replaced by the resolved authored size; `packages/view-studio/src/app/editor/EditorTools.tsx` adds an accessible grid-size control, and the overlay, pointer placement, creation, and resize snapping read the resolved field rather than the fixed visual token.

The documentation contract added at closure introduces `DIAGRAM-010` for the required authored field, amends `APPEAR-004` where it still required a legacy boolean Design grid that no longer exists, extends `DESIGN-006` with authored spacing and the zero-disables case, and corrects `EDIT-018` so keyboard stepping follows the authored size. `docs/guides/editing-authored-yaml.md` gains the migration an existing document needs.

### Verification

`bun run self:check` passes in full: package builds, visual tokens, schema, 38 unit suites, the Chromium browser matrix, thirteen typecheck projects, dependency-cruise, and the production site build. `packages/domain-core/src/schema.test.ts` asserts an omitted and a negative value are rejected and `0` and `1` accepted; `packages/view-studio/src/app/App.browser.test.tsx` exercises the rendered grid control.

### Outstanding concerns

`APPEAR-004` had asserted a legacy boolean Design grid as a MUST for roughly a day after the implementation removed it, and no gate caught the contradiction. That is the failure mode `INFOSCHEMATICS-TOOL-056` was captured to close, and it remains unadopted in triage.

This plan's Files touched named `docs/specs/domain-model.md`, which does not exist; the requirement was sited in `docs/specs/diagram-elements.md` instead. Its Dependencies section also still names the pruned `INFOSCHEMATICS-TOOL-037`.

### Post-change review

Grid geometry and grid appearance stay separate concerns, so a non-zero size does not by itself make a lattice visible outside Design. Alignment-guide snapping remains independently controllable at size zero. Toolbar placement will need coordinating with `INFOSCHEMATICS-TOOL-045`, which adds further Design controls to the same surface.

### Mini recap

The grid is now authored rather than fixed, required rather than defaulted, and documented rather than implied. The delivery was found at `in-progress` with its code complete and its specification contract missing, which is itself evidence for the cross-feature coverage concern in `INFOSCHEMATICS-TOOL-057`.

## Done

Accepted 2026-09-15 by Kris Brown, on the standing instruction to close this item once it was fit for review.

## Discussion

### Required authored geometry

Grid size is a required property of the diagram's coordinate lattice, just like its bounds. Carrying an explicit value in canonical YAML makes geometry and editing behaviour portable and prevents a renderer or editor from silently choosing a scale.

### Compatibility boundary

Canonical authored models must declare the field. The established configuration adapter may provide `10` because compatibility data predates the canonical requirement; that adaptation must not make omission valid in canonical YAML.

### Appearance and interaction

A non-zero grid size does not require a visible grid in every output. Appearance controls whether and how the lattice is drawn; Design uses the same authored size for its editing overlay and snapping. A size of zero suppresses both because no lattice exists to display or snap to.

### Zero and one

Zero is the unambiguous disabled state. One is the finest active grid and preserves integer-coordinate determinism without pretending that no snapping is occurring.
