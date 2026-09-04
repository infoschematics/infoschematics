---
id: INFOSCHEMATICS-TOOL-017
area: TOOL
title: Region extents derived for matrix geographies
theme: tool
horizon: later
status: draft
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Let a Region optionally take part of its extent from another Region — a column clipped to its row, a row clipped to its column — so matrix geographies can be authored without hand-duplicating coordinates, while the model keeps no containment hierarchy.

## Context

The region model deliberately has no row/column notion and no containment: a Region is a panel with an explicit box, and nesting is read from the geometry. That simplicity has an authoring cost the 5G-EMERGE IBC 2026 migration made concrete: each of its eight column regions repeats its row's `y` and `height` by hand (`y: 20, height: 610` five times, `y: 640, height: 490` three times), and resizing a row means re-authoring every column inside it. The original IBC2026-DBD-020 shaping sketched "a region may be declared within another region's extent (clipping to it) or independently" and increment B landed without it, resolving the model more simply; the idea remains worth its own decision.

## Boundary

Whatever mechanism is chosen must stay serialisable and must not reintroduce lane/zone-style kinds, mandatory nesting, or a containment hierarchy the renderer walks. A Region with a fully explicit box remains the primary form; derivation is an authoring convenience over it.

## Shaping

- Decide the mechanism as a design question first: a reference field (`within: 'media-streaming'` supplying the cross-axis extent), authoring-time helpers in the definition package that expand to explicit boxes, or true render-time clipping.
- Decide what the editor does when a referenced region moves or resizes — whether dependent extents follow live or are re-derived on save.
- Weigh whether the two authored consumers (the IBC definition and `examples/is-infoschematics`) actually earn the mechanism, or whether a documented authoring idiom (shared constants in the definition source) is enough; that answer can close this item without code.
