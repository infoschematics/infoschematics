---
id: INFOSCHEMATICS-TOOL-038
area: TOOL
title: Inline SVG integration
theme: tool
horizon: soon
status: draft
blocks: []
blocked_by: []
baseline_ref: null
---

# Inline SVG integration

## Goal

Let a host place deterministic SVG output inline, inspect rendered artefacts by stable authored identity, and bind accessible host-owned interactions around them without putting browser callbacks into authored definitions.

## Context

`renderInfoschematicSvg` returns a serialised SVG string whose outer artefact groups expose `data-artefact-id` and `data-artefact-kind` under the contract delivered by `INFOSCHEMATICS-TOOL-028`. The homepage wraps that output in an image data URI, which is suitable for inert display but makes SVG descendants unavailable to the parent document for inspection or event delegation.

## Boundary

This item does not make renderer child markup stable, copy authored IDs into native SVG `id`, add callbacks or browser state to `InfoschematicConfig`, treat DOM mutation as model editing, or replace Canvas, Present, and Studio as the interactive and authoring surfaces.

## Shaping

Define the supported delivery choices between inert image output and inline same-document SVG. Decide whether hosts need documented insertion and event-delegation guidance, a reusable framework-neutral helper, a React integration component, or a deliberately small combination. Specify click, pointer, focus, and keyboard semantics against outer artefact metadata; review safe insertion, multiple-Infoschematic identity, accessibility, and cleanup. Decide whether the homepage should become a reference consumer or remain separate follow-on work. Promote to Next once the public surface, trust boundary, specification impact, and verification strategy are agreed.

## Discussion

### Identity contract

`INFOSCHEMATICS-TOOL-028` provides collision-safe stable hooks on the six outer artefact groups. This work should consume that contract rather than expose internal child nodes or introduce a parallel selector scheme.

### Interaction ownership

The host owns listeners, transient UI state, and any surrounding details or navigation. Authored product data remains serialisable and renderer output remains deterministic.

### Editing boundary

Inline DOM access can support inspection and host interaction, but direct movement of SVG nodes would not update the authored model. Persistent geometry changes continue through configuration, Canvas, or Studio followed by rerendering.

### Open integration choices

A documentation-only pattern is smallest. A helper or component can improve safety and typing but creates a new public API. Keyboard parity and safe generated-markup insertion must be resolved before selecting either route.
