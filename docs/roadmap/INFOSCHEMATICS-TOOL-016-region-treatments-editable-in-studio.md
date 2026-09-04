---
id: INFOSCHEMATICS-TOOL-016
area: TOOL
title: Edit region treatments
theme: tool
horizon: soon
status: draft
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Let the Studio's Details panel edit everything a Region can author — frame style and opacity, fill, label placement, label mount and label offset — so a Region's treatments can be designed in the editor rather than only in source.

## Context

The region unification (IBC2026-DBD-020) collapsed lanes and zones into one `RegionConfig` (`packages/domain-model/src/region.ts`): an explicit box with an optional frame (`solid`/`dashed`/`dotted` at opacity), an optional fill, and a label that is internal or boundary-mounted, placed by one of nine compass bearings with an along-edge offset. The Studio already creates, selects, moves, resizes, reorders, renames and removes Regions, but the Details panel exposes none of the treatment fields: `createDefaultRegion` seeds a solid frame and the rest is source-only. Every visual decision the record carries — a fill-only column, a dashed frame, a boundary title pulled along its edge — currently requires editing the authored file.

## Boundary

This item adds editing surface for the existing `RegionConfig` fields only; it does not extend the treatment vocabulary (that is INFOSCHEMATICS-TOOL-018). It does not change the serialisable record or either renderer.

## Shaping

- Decide the control shapes: frame style as a choice including none, opacity as a number, fill as a colour (alpha in the hex, matching the authored convention), label placement as `none` plus the nine bearings, mount as boundary/internal, offset as a number.
- Keep the round trip serialisable: the panel edits produce the same replace operations the editing stack already orders (`packages/view-studio/src/app/editor/artefact-operations.ts`).
- Extend `DetailsPanel.artefacts` tests to cover a treatment edit per field, mirroring the existing label-rename coverage.

## Discussion

Confirm the control shapes and round-trip expectations before selecting implementation.
