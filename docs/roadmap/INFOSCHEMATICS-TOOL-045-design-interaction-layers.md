---
id: INFOSCHEMATICS-TOOL-045
area: TOOL
title: Design interaction layers
theme: tool
horizon: next
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:03:15Z
updated_at: 2026-09-13T20:03:15Z
---

# Design interaction layers

## Goal

Let Producers choose which visual element types are interactive during Design work, and temporarily bring the selected element above competing content, so overlapping elements do not intercept or obstruct the intended edit.

## Context

An Infoschematic can place [Cards](../reference/vocabulary.md#standard-card), [Flows](../reference/vocabulary.md#flow), [Fabrics](../reference/vocabulary.md#fabric), [Points](../reference/vocabulary.md#point), [Regions](../reference/vocabulary.md#region), and [Graphics](../reference/vocabulary.md#graphic) on the same canvas. When their geometry overlaps, a Graphic or another incidental element can currently win hit testing or obscure the Card, Flow, or other element a Producer is trying to select and move.

The interaction model needs two related capabilities: a Design-session filter that determines which element types can be selected, and a temporary editing layer that presents the active selection and its handles above the rest of the diagram.

## Boundary

This item does not add authored z-index properties, reorder canonical model collections, change static SVG stacking, hide inactive element types by default, or define general-purpose layer composition. It does not make presentation callouts or runtime focus treatments editable diagram elements.

## Current state

Design mode can select and manipulate supported element types, but SVG paint order and pointer hit testing can make overlapping content compete for the same gesture. The Producer cannot restrict selection to a particular element type, and selection does not consistently establish a temporary foreground editing surface across every supported kind.

## Steps

- [ ] Define Design-session interaction layers for Cards, Flows, Fabrics, Points, Regions, and Graphics, using canonical visual element terminology throughout the controls.
- [ ] Add controls that let a Producer enable or disable selection and manipulation by element type while leaving disabled types visible.
- [ ] Remove disabled element types from pointer and keyboard hit testing without changing their authored data or rendered appearance.
- [ ] Render the selected element and its editing affordances in a temporary foreground layer until selection changes, clears, or Design mode ends.
- [ ] Preserve the selected element's semantic relationships, including composition and connected port geometry, without promoting unrelated elements or changing canonical array order.
- [ ] Cover overlapping-element selection, drag initiation, keyboard selection, layer toggles, selection changes, deselection, and Design-mode exit in browser interaction tests.
- [ ] Update the Design interaction specification and Producer guidance with the layer and temporary-foreground behaviours.

## Files touched

- `packages/view-model/src/` for transient interaction-layer and selection projection state
- `packages/view-canvas/src/` for SVG hit testing and temporary foreground rendering
- `packages/view-studio/src/app/` for Producer controls and Design-session state
- focused browser-rendered interaction tests
- `docs/specs/view-studio.md`
- affected Producer guides under `docs/guides/`

## Verify

Run focused View Model, Canvas, and Studio tests plus `bun run self:check`. In a browser fixture with a Graphic crossing a Card and Flow, verify each element can be selected when its type is enabled, disabled types do not intercept pointer or keyboard interaction, the active selection appears above competing content during editing, and clearing selection restores the normal authored rendering order without a model change.

## Dependencies / blocks

No hard dependency is known. Coordinate the browser matrix with the `INFOSCHEMATICS-TOOL-037` design-editing regression contract so layer controls reuse its gesture, selection, viewport, and undo assertions rather than creating a parallel interaction harness.

## Documentation impact

### Decision Records

No new decision record is expected if interaction layers remain transient View state. Record a decision only if implementation introduces an authored stacking contract or changes renderer ownership.

### Specifications

Specify observable layer filtering, hit-testing, temporary foreground, keyboard parity, selection lifetime, and no-authored-mutation requirements in the Design editing feature area.

### Guides

Explain how Producers isolate an element type while editing dense diagrams and how to return all types to an interactive state.

### Roadmap

Keep fixes to existing editing operations within `INFOSCHEMATICS-TOOL-037`; this item owns the new interaction-layer controls and generalized foreground-selection behaviour.

## Discussion

### Interaction layers

A layer is a transient Design filter over canonical visual element types, not another domain concept. Turning a layer off should make its elements inert while retaining enough visual context to edit the enabled layers accurately.

### Temporary foreground

Selection should change presentation order only for the duration of the edit. The selected element, its handles, and necessary editing chrome need to sit above competing diagram content so the Producer can see and manipulate the active target reliably.

### Authored order

Temporary promotion must not rewrite YAML ordering or create a persistent stacking field. Deselecting the element or leaving Design mode restores the renderer's ordinary deterministic order.
