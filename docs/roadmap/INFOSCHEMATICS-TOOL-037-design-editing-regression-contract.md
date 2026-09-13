---
id: INFOSCHEMATICS-TOOL-037
area: TOOL
title: Harden Design interactions
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
---

# Harden Design interactions

## Goal

Make every existing Design interaction preserve the same valid Infoschematic relationships whether a Producer uses Canvas, keyboard, or property controls, and prove those behaviours through rendered regression tests.

## Context

Studio already specifies that component movement carries attached Flow ends and that typed operations compose with established drafts. A current failure leaves a connected Flow on an old port after its Card moves. Pure View Model tests and static-markup tests cover individual calculations and exposed controls, but no complete test drives interaction through Studio and asserts Card, port, Flow route, change set, and undo state together.

## Boundary

This item hardens behaviour already required by the Studio specification. It does not add a free-form drawing tool, redesign Direct mode, implement lossless YAML editing, remove established input compatibility, complete canonical View migration, or add Point and Overlay capabilities still gated by [Canonical view internals](INFOSCHEMATICS-TOOL-035-canonical-view-internals.md).

## Current state

Design composes typed artefact operations with established component-offset, route, waypoint, attachment, port-count, label, creation, and removal drafts. Canvas owns pointer and keyboard interaction and SVG coordinate conversion; Studio owns semantic edit consolidation. The existing test environment does not execute the full rendered pointer lifecycle.

## Steps

- [ ] Add a Vitest browser test surface for Canvas and Studio using the repository's supported browser runner, real SVG geometry stubs only where the browser cannot provide layout, and helpers for pointer, keyboard, property, viewport, undo, and change-set assertions.
- [ ] Build the operation matrix required by EDIT-059 across authored and created Cards, Fabrics and Flows, composed Cards, applicable routes, and each supported input surface; assert unsupported cells are unavailable.
- [ ] Add the known failing Card-movement case first and enforce projection order from effective component geometry through ports, attachments, interior route geometry, and route labels.
- [ ] Cover moves and resizes with plain routes, interior Waypoints, existing route drafts, reattached ends, Wrapper and Adapter composition, and newly created endpoints.
- [ ] Cover port-count changes, typed and established draft composition, creation, pending removal, individual change removal, whole-draft discard, undo, and redo as coherent semantic edits.
- [ ] Cover pointer release outside Canvas, selection changes during a gesture, unmount cancellation, pointer and keyboard equivalence, numeric placement, zoom, pan, fit, panel layout, and stable coordinate conversion.
- [ ] Keep an authored artefact marked for removal visible, selectable, and visibly pending until the mark is lifted or applied; name dependent Flow removals in the reviewable change set.
- [ ] Fix production seams exposed by each failing matrix cell without moving geometry or dependency logic out of View Model.
- [ ] Update verification hooks and close specification gaps only when the rendered matrix proves the required behaviour.

## Files touched

- package.json, bun.lock, and Vitest browser configuration
- packages/view-model/src/ editable geometry and operation helpers
- packages/view-canvas/src/ interaction code and browser-rendered tests
- packages/view-studio/src/app/ editor projection, controls, and browser-rendered tests
- docs/specs/view-studio.md
- docs/guides/ only if the visible pending-removal treatment changes Producer guidance

## Verify

Run the dedicated Vitest browser project for the EDIT-059 matrix in its supported browser, focused pure suites for View Model geometry and Studio operations, bun run self:packages:build, and bun run self:check. The matrix must assert both rendered SVG geometry and the reviewable change set, include at least one zoomed and panned movement, and prove undo and cancellation leave no partial edit.

## Dependencies / blocks

All behaviours in scope are already specified and their current production paths exist. [Canonical view internals](INFOSCHEMATICS-TOOL-035-canonical-view-internals.md) will later extend the same matrix to Point and Overlay but is not required to harden the existing paths.

## Documentation impact

### Decision Records

No new decision record is expected because this work enforces existing ownership and editing decisions. Record one only if a fix requires changing those durable boundaries.

### Specifications

Update EDIT-059 verification links and remove covered gaps. Preserve EDIT-067 pending-removal reviewability and EDIT-083 dependency ordering.

### Guides

Update Studio guidance only if the visible pending-removal state or a supported interaction changes for Producers.

### Roadmap

Capture newly discovered capabilities separately; defects inside the approved matrix remain part of this hardening item.

## Discussion

### Contract matrix

Rows describe semantic operations and input surfaces. Columns describe authored, created, composed, routed, and viewport states. Each supported cell proves rendered geometry, one consolidated change, and reversal; unsupported cells prove the control is absent.

### Test altitude

Pure route tests remain useful for orthogonality and normalisation. Browser-rendered Canvas or Studio tests are required for pointer capture, event ordering, SVG coordinate conversion, selection, and interaction between draft layers.

### Projection order

The known defect is a dependency-order failure. Effective component and port geometry must precede endpoint attachment, interior route geometry, and label placement so a later draft layer cannot restore stale coordinates.

### Removal semantics

EDIT-067 resolves the earlier ambiguity: pending authored removals remain visible and reviewable with a distinct treatment. Application performs the actual cascade; the draft names affected Flows and can be lifted before application.
