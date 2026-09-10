---
id: INFOSCHEMATICS-SITE-006
area: SITE
title: Diagram dynamics
theme: site-experience
horizon: next
status: ready
blocks: [INFOSCHEMATICS-TOOL-023]
blocked_by: []
baseline_ref: null
---

## Goal

Define a small declarative vocabulary for named Diagram Dynamics so a host can bind runtime occurrences to stable semantic behaviour without embedding runtime machinery in an authored Infoschematic.

## Context

The product currently has one narrow dynamic behaviour: a transient Flow signal. `ADR-INFOSCHEMATICS-012` defines it as a framework-neutral occurrence containing a Flow ID and host-owned occurrence key; Canvas renders finite motion with a reduced-motion emphasis, while static SVG renders a deterministic still emphasis when explicitly requested.

Calling the broader concept “animation” would make a rendering technique the product abstraction. A Dynamic instead names a semantic change an audience should perceive through motion, a still treatment, an accessible announcement, or another renderer-appropriate presentation. External events can bind a stable Dynamic ID rather than knowing renderer details or authored element geometry.

## Boundary

This item does not introduce arbitrary JavaScript, callbacks, CSS selectors, timers, event-source schemas, or mutable runtime state into the authored model. It does not replace Scenes or Sequences, make motion the only carrier of meaning, animate static output by default, or define persistent reveal, conceal, movement, and arbitrary timelines. Scene-authored signal choreography remains `INFOSCHEMATICS-TOOL-023`.

## Current state

`FlowSignal` and Scene signal resolution are framework-neutral, but they address Flow IDs directly and have no authored named behaviour to which a host can bind. Present passes signals to Canvas; Studio support is incomplete; static SVG accepts direct signalled Flow IDs. Canonical Diagram validation already has a complete element-ID set, and static SVG now exposes stable authored artefact identity.

The initial vocabulary is deliberately finite: `signal-flow` targets one or more Flows, and `emphasise-elements` targets one or more visual elements. Both are occurrence-based and end without creating persistent presentation state.

## Steps

- [ ] Add canonical `DiagramDynamic` types under `diagram.dynamics`, with identity and description fields plus discriminated `signal-flow` and `emphasise-elements` target shapes using sorted, stable authored IDs.
- [ ] Mirror the union in Domain Core schema, validation, generated schema, field ordering, compact YAML serialisation, and definition defaults; reject unknown, duplicate, or wrong-kind targets.
- [ ] Add a framework-neutral `DynamicOccurrence` carrying `dynamicId` and a host-owned `occurrenceKey`, and resolve occurrences into renderer-facing Flow signals or element emphasis without exposing authored shorthand.
- [ ] Extend Canvas, Present, Studio, and static SVG boundaries to consume resolved occurrences while retaining the existing direct Flow-signal input as a compatibility path.
- [ ] Give both kinds deterministic full-motion, reduced-motion, static, and accessible interpretations; absence of an occurrence must leave output unchanged.
- [ ] Add an authored example and visual-guide treatment showing external binding by Dynamic ID, replay through a changed occurrence key, cancellation, reduced motion, and static fallback.
- [ ] Record the Dynamics contract and update model, core, vocabulary, and host-integration guidance.

## Files touched

- `packages/domain-model/src/`
- `packages/domain-core/src/` and `packages/domain-core/schema/`
- `packages/view-model/src/`
- `packages/view-canvas/src/`
- `packages/view-present/src/`
- `packages/view-studio/src/`
- `packages/render-svg/src/`
- `examples/` and visual-guide content
- `docs/decisions/`, `docs/specs/`, `docs/reference/`, and affected guides

## Verify

Run `bun run self:packages:build`, focused `bunx vitest run` suites for canonical parsing, validation, serialisation, dynamic resolution, Canvas, Present, Studio, and static SVG, then `bun run self:check`. Render the example in normal and reduced-motion modes, replay an occurrence by changing only its key, and compare static SVG with no occurrence and with each explicit Dynamic kind.

## Dependencies / blocks

Stable SVG artefact identity from `INFOSCHEMATICS-TOOL-028` has landed, so no build prerequisite remains. This item blocks `INFOSCHEMATICS-TOOL-023`, whose Scene signal treatments should bind the shared Dynamic vocabulary rather than create a parallel animation contract.

## Documentation impact

### Decision Records

Extend or supersede the narrow Flow-signal decision with a record defining authored Dynamics, host-owned occurrences, and renderer obligations.

### Specifications

Add Domain Model, Domain Core, View Model, Canvas, and static-renderer requirements for Dynamic declarations, reference validation, occurrence resolution, and accessible fallbacks.

### Guides

Add host-binding guidance and a visual-guide example that distinguishes semantic Dynamics from animation techniques.

### Roadmap

Once the implementation lands, clear the build-order dependency from `INFOSCHEMATICS-TOOL-023`; persistent choreography remains outside this item.

## Discussion

### Initial vocabulary

`signal-flow` carries a finite signal over authored Flow targets. `emphasise-elements` briefly emphasises any of the six visual element types. Each declaration uses product-owned fields and stable IDs; renderer components and host event payloads never enter the document.

### Contract layers

The authored Infoschematic declares named Dynamics, a host submits occurrences by Dynamic ID and occurrence key, View Model resolves the declaration, and each renderer chooses an appropriate treatment. Keeping those layers separate makes replay and cancellation testable without making browser state part of the model.

### Static and accessible meaning

Every Dynamic must have a non-motion interpretation. Static output changes only when a caller explicitly supplies an occurrence, and accessibility text describes the semantic event rather than the animation used to depict it.
