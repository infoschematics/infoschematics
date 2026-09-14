---
id: INFOSCHEMATICS-TOOL-037
area: TOOL
title: Harden Design interactions
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 6e2c957ac37f4349d3e70bc213d17ea777fde986
created_at: 2026-09-13T15:00:21Z
updated_at: 2026-09-14T06:49:55Z
---

# Harden Design interactions

## Goal

Make every existing Design interaction preserve the same valid Infoschematic relationships whether a Producer uses Canvas, keyboard, or property controls, and prove those behaviours through rendered regression tests.

## Context

Studio already specifies that component movement carries attached Flow ends and that typed operations compose with established drafts. A current failure leaves a connected Flow on an old port after its Card moves. Pure View Model tests and static-markup tests cover individual calculations and exposed controls, but no complete test drives interaction through Studio and asserts Card, port, Flow route, change set, and undo state together.

## Boundary

This item hardens behaviour already required by the Studio specification. It does not add a free-form drawing tool, redesign Direct mode, implement lossless YAML editing, remove established input compatibility, complete canonical View migration, or add Point and Overlay capabilities still gated by [Canonical view internals](INFOSCHEMATICS-TOOL-035-canonical-view-internals.md).

## Current state

Design composes typed artefact operations with established component-offset, route, waypoint, attachment, port-count, label, creation, and removal drafts. Canvas owns pointer and keyboard interaction and SVG coordinate conversion; Studio owns semantic edit consolidation. The test environment now executes the full rendered pointer lifecycle in headless Chromium.

The reported Card-movement defect is reproduced at materialiser, rendered-preview, and browser-interaction altitude. View Model now moves each attached Flow end by the displacement of its named port and keeps the resulting route orthogonal. The dedicated headless Chromium project exercises native SVG coordinate transforms, pointer events and the complete operation and change-set matrix.

The composed movement slice now uses one shared Adapter-bounds calculation across compatibility, runtime, and draft projection. Moving a held Card carries Flow ends attached either to that Card or to its derived Adapter; focused tests also cover newly created Card/Flow pairs and route-property drafts applied before movement. A real Chromium gesture proves dragging the Adapter moves its held Card and the Adapter-attached route together.

Pointer-driven Design gestures now share one listener lifecycle. Pointer release and cancellation remove move, up, and cancel listeners; cancellation closes an edit already in motion, and component unmount removes every active gesture without invoking stale callbacks. Chromium coverage proves both cancellation and unmount cleanup.

## Steps

- [x] Add a Vitest browser test surface for Canvas and Studio using the repository's supported browser runner, real SVG geometry stubs only where the browser cannot provide layout, and helpers for pointer, keyboard, property, viewport, undo, and change-set assertions. The Canvas and Studio surfaces and their shared interaction helpers are complete.
- [x] Build the operation matrix required by DESIGN-015 across authored and created Cards, Fabrics and Flows, composed Cards, applicable routes, and each supported input surface; assert unsupported cells are unavailable.
- [x] Add the known failing Card-movement case first and enforce projection order from effective component geometry through ports, attachments, interior route geometry, and route labels. Authored, composed and created endpoint cases are covered.
- [x] Cover moves and resizes with plain routes, interior Waypoints, existing route drafts, reattached ends, Wrapper and Adapter composition, and newly created endpoints.
- [x] Cover port-count changes, typed and established draft composition, creation, pending removal, individual change removal, whole-draft discard, undo, and redo as coherent semantic edits.
- [x] Cover pointer release outside Canvas, selection changes during a gesture, unmount cancellation, pointer and keyboard equivalence, numeric placement, zoom, pan, fit, panel layout, and stable coordinate conversion.
- [x] Keep an authored artefact marked for removal visible, selectable, and visibly pending until the mark is lifted or applied; name dependent Flow removals in the reviewable change set.
- [x] Fix production seams exposed by each failing matrix cell without moving geometry or dependency logic out of View Model.
- [x] Update verification hooks and close specification gaps only when the rendered matrix proves the required behaviour.

## Files touched

- package.json, bun.lock, and Vitest browser configuration
- packages/view-model/src/ editable geometry and operation helpers
- packages/view-canvas/src/ interaction code and browser-rendered tests
- packages/view-studio/src/app/ editor projection, controls, and browser-rendered tests
- docs/specs/view-studio.md
- docs/guides/ only if the visible pending-removal treatment changes Producer guidance

## Verify

Run the dedicated Vitest browser project for the DESIGN-015 matrix in its supported browser, focused pure suites for View Model geometry and Studio operations, bun run self:packages:build, and bun run self:check. The matrix must assert both rendered SVG geometry and the reviewable change set, include at least one zoomed and panned movement, and prove undo and cancellation leave no partial edit.

## Dependencies / blocks

All behaviours in scope are already specified and their current production paths exist. [Canonical view internals](INFOSCHEMATICS-TOOL-035-canonical-view-internals.md) will later extend the same matrix to Point and Overlay but is not required to harden the existing paths.

## Documentation impact

### Decision Records

No new decision record is expected because this work enforces existing ownership and editing decisions. Record one only if a fix requires changing those durable boundaries.

### Specifications

Update DESIGN-015 verification links and remove covered gaps. Preserve EDIT-009 pending-removal reviewability and EDIT-014 dependency ordering.

### Guides

Update Studio guidance only if the visible pending-removal state or a supported interaction changes for Producers.

### Roadmap

Capture newly discovered capabilities separately; defects inside the approved matrix remain part of this hardening item.

## Review

### Delivered

Delivered the approved hardening of existing Design interactions without adding a drawing tool, changing Direct mode, expanding canonical View migration, or introducing Point and Overlay capabilities. The immutable implementation baseline remains `6e2c957ac37f4349d3e70bc213d17ea777fde986`; the completed implementation is recorded by `253b5482c65ebbc4c10d5b6041231632fa3b578f`.

### Summary of changes

Canvas and Studio now have a shared Chromium regression surface for pointer, keyboard, property, viewport, history, route and change-set behaviour. Studio movement reads effective typed geometry so repeated keyboard and numeric placement compose, focused Canvas events no longer reach the Studio window shortcut twice, and repeated removal lifts the owner and its planned dependent Flow removals while leaving pending artefacts rendered and selectable.

`packages/view-canvas/src/InfoschematicDiagram.tsx` keeps removal operations out of the materialised preview and derives the visible pending state for every artefact kind. `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx` and `packages/view-studio/src/app/App.browser.test.tsx` cover the rendered matrix, while the Site-owned authoring guidance and EDIT-012 and DESIGN-015 specification evidence now describe the proven behaviour. There were no approved-scope deviations and no new Decision Record was required.

### Verification

`bunx vitest run packages/view-model/src/artefact-draft.test.ts packages/view-model/src/editable-capabilities.test.ts packages/view-studio/src/app/App.test.tsx packages/view-studio/src/app/editor/use-editor.test.ts packages/view-studio/src/app/editor/artefact-operations.test.ts packages/view-canvas/src/InfoschematicDiagram.editing.test.tsx packages/view-canvas/src/InfoschematicDiagram.preview.test.tsx` passed 78 tests in seven files.

`bunx vitest run --config vitest.browser.config.ts packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx packages/view-studio/src/app/App.browser.test.tsx` passed 10 tests in two Chromium projects. `bun run self:packages:build` passed for all eight publishable packages.

`bun run self:check` passed: package builds, generated visual tokens and schema, 587 tests in 79 files, 10 Chromium tests, every TypeScript workspace and example, dependency-cruiser across 348 modules and 1,059 dependencies, and the production Site build. `ki repo audit --skill ki-specs --repo .` completed cleanly. A rendered Studio capture was inspected for the pending-removal treatment; the Card and dependent Flow remained in place with distinct reduced-opacity, dashed and struck treatment, and the temporary capture was not retained.

### Outstanding concerns

No item-scoped concerns remain. The browser runner continues to emit the repository's existing Vite React-plugin deprecation warnings about `esbuild` and `optimizeDeps.esbuildOptions`; they do not fail this matrix and were not introduced or expanded by this work. The roadmap corpus audit reports six pre-existing ITEM-1 failures for retired `candidate` frontmatter on TOOL-046 through TOOL-050 and TOOL-052; TOOL-037 itself produced no finding.

### Post-change review

A fresh review against the Goal and Boundary found the interaction contract covered at rendered and pure altitudes, the geometry dependency order still owned by View Model, and no authored configuration or reusable behaviour moved into Site. Regression risk is concentrated in removal preview semantics and cumulative typed movement; the focused preview, browser, history and materialiser cases exercise those seams directly. The item is ready for an explicit acceptance decision.

### Mini recap

Design interactions now preserve attached presentation across pointer, keyboard and property surfaces, pending removals remain reviewable, and the rendered regression matrix is part of the repository-wide gate. Producer guidance and specification conformance match the delivered behaviour; acceptance is the only remaining lifecycle step.

## Done

Accepted 2026-09-14 by Kris Brown on review packet above.

## Discussion

### Contract matrix

Rows describe semantic operations and input surfaces. Columns describe authored, created, composed, routed, and viewport states. Each supported cell proves rendered geometry, one consolidated change, and reversal; unsupported cells prove the control is absent.

### Test altitude

Pure route tests remain useful for orthogonality and normalisation. Browser-rendered Canvas or Studio tests are required for pointer capture, event ordering, SVG coordinate conversion, selection, and interaction between draft layers.

### Projection order

The known defect is a dependency-order failure. Effective component and port geometry must precede endpoint attachment, interior route geometry, and label placement so a later draft layer cannot restore stale coordinates.

The first correction applies that order inside the typed draft materialiser and is protected by rendered Canvas and Studio regressions. Reviewable derived Flow changes now remain coherent across the tested interaction surfaces, so EDIT-012 is conforming.

### Removal semantics

EDIT-009 resolves the earlier ambiguity: pending authored removals remain visible and reviewable with a distinct treatment. Application performs the actual cascade; the draft names affected Flows and can be lifted before application.
