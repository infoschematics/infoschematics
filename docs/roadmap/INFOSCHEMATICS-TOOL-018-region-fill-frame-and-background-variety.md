---
id: INFOSCHEMATICS-TOOL-018
area: TOOL
title: Region fill, frame and background variety
theme: tool
horizon: later
status: draft
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Widen what a Region's surfaces can say — fills beyond a flat colour, frames beyond three stroke patterns, and a stated relationship between Region fills and the canvas background — without disturbing the one-record model the unification just landed.

## Context

`RegionConfig` today authors a fill as one colour with alpha in the hex, and a frame as `solid`/`dashed`/`dotted` at an opacity. The IBC diagram uses translucent fills over the blueprint surface as its de facto background system, which works but is undesigned: the canvas background is `appearance.surface`, Region fills tint over it, and nothing states how the two compose or what else a background could be. Label geometry likewise runs on code constants (`packages/view-model/src/region-geometry.ts`: character-width estimate 9.4, label inset 16, notch padding 10) rather than named, themable tokens — the along-edge default already produced a small accepted shift against the pre-region rendering, with authored `labelOffset` as the only escape hatch.

## Boundary

Anything added must keep the record serialisable (primitive properties only), keep Canvas and static-SVG output byte-comparable through `scripts/visual-treatment-parity.test.ts`, and keep absence meaning none. This item is treatment vocabulary; the Studio controls for whatever lands belong with INFOSCHEMATICS-TOOL-016's surface.

## Shaping

Candidate ideas to triage, each a design decision before any code:

- Fill variety: gradients or patterns as named, serialisable treatments rather than raw SVG.
- Frame variety: double strokes, per-side frames (a rule under a header region), corner treatments beyond one radius.
- Background as a first-class idea: whether a canvas-level background record subsumes the "fill-only region as backdrop" idiom, and how surface, background and Region fills layer.
- Label metrics as tokens: promote the geometry constants to named tokens the visual-tokens gate owns, and decide whether notch sizing should use real text measurement rather than the character-width estimate.
