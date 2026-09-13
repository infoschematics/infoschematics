---
id: INFOSCHEMATICS-TOOL-037
area: TOOL
title: Harden Design interactions
theme: tool
horizon: soon
status: draft
blocks: []
blocked_by: []
baseline_ref: null
---

# Harden Design interactions

## Goal

Make every existing Design interaction preserve the same valid Infoschematic relationships regardless of whether the Producer uses the Canvas, keyboard or property controls, and prove those behaviours through rendered regression tests.

## Context

The Studio specification already says component movement carries attached Flow ends (`EDIT-071`) and typed operations compose with established drafts (`EDIT-083`). A current failure shows a moved Card while its connected Flow remains at the old port. The behaviour was specified, but the integration seam was not protected by a rendered interaction test.

Design currently composes two editing generations. Typed artefact operations materialise Card, Fabric, Region, Flow and Graphic values, while established draft fields still carry component offsets, route points, attachments, port counts, labels, text, creations and removals. Canvas receives both callback families. Static-markup tests cover capability exposure and pure View Model tests cover individual geometry functions, but no complete test drives the user interaction through Studio and asserts the resulting Card, ports, Flow route, undo state and change set together.

The audit identified these regression surfaces:

- moving or resizing an authored Card or Fabric while a connected Flow has no route draft, has interior Waypoints, has an existing route draft or has a reattached end;
- moving a wrapped Card through either its own Card surface or its Adapter or Wrapper interaction, including Flows attached to either constituent;
- changing port counts while existing and newly created Flows name affected ports;
- mixing typed geometry operations with established route, attachment, label and component-offset drafts, where render order can restore stale coordinates;
- pointer dragging, keyboard movement and numeric placement entering different draft paths;
- coordinate conversion while zoomed, panned, fitted or displayed beside different panel layouts;
- moving newly created endpoint artefacts whose identities are absent from an authored-only register;
- undo, redo, individual change removal and whole-draft discard after a dependent geometry update;
- selection changes during a pointer gesture, pointer release outside Canvas and unmount during a gesture;
- removal preview and dependency cascades disagreeing about whether pending artefacts remain visible and selectable;
- persistence migration loading an older partial draft into the current combined envelope;
- Point and canonical Overlay capabilities entering a five-kind compatibility editor without the same interaction coverage.

## Boundary

This item hardens behaviour already promised by the Studio specification. It does not add a free-form drawing tool, redesign Direct mode, implement lossless YAML patching, remove established input compatibility or complete the canonical View-internals migration. It may add a reusable DOM interaction harness, but it does not introduce browser-only production dependencies merely to test pure geometry.

## Shaping

Start with a contract matrix whose rows are operations and whose columns are authored Card, created Card, Fabric, composed Card, Flow, Point and Overlay as applicable. For each supported cell, name the input surfaces, expected Canvas geometry, expected draft or change-set representation and undo result. Unsupported cells must be asserted unavailable rather than left untested.

Implement the smallest rendered interaction harness capable of pointer movement and release, keyboard commands, numeric property changes and viewport transforms. Add failing tests before changing projection order. Keep route calculations in View Model; Canvas should translate interaction events and render the effective result, while Studio should consolidate one semantic edit.

Promote this item to Next when the matrix is reviewed, pending-removal visibility is reconciled between `EDIT-067` and materialised removal preview, and the test environment for SVG coordinate transforms is selected.

## Discussion

### Known first defect

Card movement and Flow routing are not one atomic preview when a later route draft restores coordinates from before the Card moved. The first repair should establish dependency order rather than special-case one IBC Flow: component geometry, port geometry, endpoint attachment, interior route geometry, then label placement.

### Test altitude

Pure route tests remain valuable for orthogonality and normalisation, and static markup remains valuable for capability exposure. Neither can prove the real pointer handler selected the right artefact, used the current viewport transform, updated the correct draft layer and closed one undo gesture. Those behaviours require a rendered interaction test at Canvas or Studio altitude.

### Compatibility seam

The regression suite should protect the current mixed editor while `INFOSCHEMATICS-TOOL-035` removes compatibility-shaped internals. The same assertions then become migration gates: replacing a legacy draft path is safe only when its supported matrix cells remain green.

### Removal semantics

`EDIT-067` requires an authored artefact marked for removal to remain reviewable, while typed materialisation can remove it from the Design preview immediately. Before implementation, choose one visible contract and state whether reviewability lives on Canvas, in the change set or both. Tests should then lock that decision rather than preserving accidental behaviour.
