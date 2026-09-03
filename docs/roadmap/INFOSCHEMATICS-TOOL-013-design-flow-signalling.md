---
id: INFOSCHEMATICS-TOOL-013
area: TOOL
title: Design Flow signalling
theme: tool
horizon: soon
status: draft
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Define an accessible, deterministic model for meaningful signals travelling along Flows without turning motion into ambient decoration or executable authored configuration.

## Context

Earlier visual treatments used small pulses moving along Flows to communicate activity. The visual-language guidance now distinguishes a finite signalled state from idle, highlighted and filtered states, but the product has no settled authority for triggering, timing or replaying that state.

Animation needs separate shaping from static appearance because it introduces runtime state, reduced-motion behaviour, Scene semantics and coordination across multiple Flows. Static SVG must remain useful without motion.

## Boundary

This item does not add animation as part of `INFOSCHEMATICS-SITE-001` or mix timing callbacks into `InfoschematicConfig`. It does not treat every visible Flow as active, and it does not make motion necessary to understand the diagram.

## Shaping

Decide whether signalling is requested by a Scene, derived from presentation actions or supplied as transient host state; how a signal starts, completes and replays; how simultaneous Flows coordinate; and how Present and Studio expose the state without changing authored geometry.

Define reduced-motion and no-animation behaviour, keyboard and screen-reader meaning, and a deterministic still treatment that static SVG can select explicitly. Promotion to `next` requires an agreed state model, ownership boundary, accessibility contract and representative timing-independent tests.

## Discussion

### Semantic trigger

A signal should explain an event, transfer or narrative transition. Entering a Scene may request one, but merely focusing, filtering or hovering a Flow must not imply activity.

### Static fallback

Static renderers ignore motion safely and should expose an optional, deterministic signalled appearance. The authored product remains understandable when animation is disabled or unsupported.
