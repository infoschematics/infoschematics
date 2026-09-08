---
id: INFOSCHEMATICS-SITE-006
area: SITE
title: Diagram dynamics
theme: site-experience
horizon: future
status: draft
candidate: true
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Define a declarative vocabulary for named diagram dynamics so an Infoschematic can state how it may change and a host can bind runtime occurrences to those dynamics without embedding runtime machinery in the authored definition.

## Context

The product currently has one narrow dynamic behaviour: a transient Flow signal. `ADR-INFOSCHEMATICS-012` defines it as a framework-neutral occurrence containing a Flow ID and a host-owned occurrence key; Canvas renders finite motion or reduced-motion emphasis, while static SVG renders deterministic still emphasis when explicitly requested. Scenes separately define presentation focus and Stories sequence Scenes.

Calling the broader concept “animation” would make a rendering technique the product abstraction. A dynamic instead names a semantic behaviour that may be expressed through motion, a still treatment, an accessible announcement, or another renderer-appropriate presentation. The user requested that dynamics be predefined by the diagram so external events can bind to stable semantic names rather than knowing low-level rendering details.

## Boundary

This item does not introduce arbitrary JavaScript, callbacks, CSS selectors, timers, event sources, or runtime state into `InfoschematicConfig`. It does not make motion the only carrier of meaning, replace Scenes or Stories, or require static output to animate. It does not yet choose a complete dynamics vocabulary or implementation sequence.

## Discussion

### Dynamics, not animations

A dynamic describes what semantic change or occurrence the audience should perceive; animation is one possible Canvas treatment. Every dynamic therefore needs an equivalent reduced-motion interpretation, and any dynamic meaningful in static output needs a deterministic still representation or an explicit declaration that it has no static occurrence.

### Contract layers

The intended separation has three layers:

1. The authored Infoschematic declares named dynamics using product-owned kinds and explicit targets.
2. A host-owned binding maps an application, data, or Scene event to one declared dynamic without putting the external event source in the authored record.
3. A framework-neutral runtime occurrence identifies the dynamic and carries an occurrence key so replay, cancellation, and concurrency remain intentional.

An illustrative authored shape is:

```yaml
dynamics:
  - id: order-placed
    kind: signal-flow
    targets:
      flows: [submit-order]
```

The exact field names and allowed kinds remain to be shaped. Stable kinds belong to the product contract; renderer components, callbacks, mutable stores, browser state, and host event schemas do not.

### Relationship to existing concepts

Flow signalling is the first concrete behaviour to test the abstraction rather than a feature to discard. A general dynamics contract should preserve its occurrence-key, cancellation, accessibility, reduced-motion, and static-fallback guarantees. Scenes continue to describe a presentation state; entering a Scene may activate a dynamic, but a Scene is not itself a dynamic.

### Initial scope question

The recommended first slice covers finite semantic occurrences such as signalling or briefly emphasising an artefact. Persistent reveal, conceal, movement, and arbitrary timelines remain open because they overlap Scene state and risk creating a declarative animation language before a concrete binding case requires one.

### Rendered identity

`INFOSCHEMATICS-TOOL-028` captures the stable SVG artefact-identity contract that dynamics and external integrations can address. That output contract enables implementation but does not block shaping the dynamics vocabulary.
