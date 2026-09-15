---
id: INFOSCHEMATICS-TOOL-023
area: TOOL
title: Scene signal treatments
theme: tool
horizon: next
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-08T02:09:11Z
updated_at: 2026-09-14T08:38:20Z
---

# Scene signal treatments

## Goal

Let a Scene declaratively play named Diagram Dynamics once, repeatedly, continuously, or in an ordered cascade so a presentation can show activity arriving and progressing through an Infoschematic.

## Context

The current Scene signal path emits one transient occurrence for every focused Flow and Canvas renders a single 900 millisecond travelling marker. Present wires that path, Studio does not, and the authored model cannot express repetition, component receipt, or ordered propagation. The 5G-EMERGE walkthrough needs telemetry pulses during a long hold, visible receipt by prediction Cards, convergence into demand control, and a closing circulation loop.

## Boundary

This item composes the named Dynamics delivered by Diagram dynamics (`INFOSCHEMATICS-TOOL-055`, delivered). It does not create a parallel animation vocabulary, expose arbitrary timelines or offsets, change Flow routing, make motion the only carrier of meaning, infer activity from focus, or add callbacks and timers to authored data.

## Current state

View Model can resolve one FlowSignal occurrence from focused Flow IDs. Canvas has full-motion and reduced-motion treatments, while Present creates occurrences from an active Scene. There is no Scene field referencing a named Dynamic, no playback policy, no component receipt convention, and no Studio pass-through.

## Steps

- [ ] Add a Scene dynamics list whose entries reference a stable Diagram Dynamic ID and choose once, repeat, or continuous playback plus an optional non-negative cascade stage.
- [ ] Validate Dynamic references and stage values in Domain Core, preserve compact stable serialisation, and reject wrong-kind or duplicate cue identities.
- [ ] Derive stage timing from Scene duration and ordered stage groups, with no authored millisecond offsets; use the existing Scene hold fallback when duration is absent.
- [ ] Make Present create host-owned occurrence keys for initial play, repeats, replay, cancellation, Scene changes, and ordered cascade stages.
- [ ] Route resolved occurrences through Studio and Canvas so signal-flow and emphasise-elements Dynamics provide travelling pulses, receiving-component emphasis, reduced-motion still treatment, and accessible announcements.
- [ ] Keep static SVG deterministic and motionless, rendering a Dynamic treatment only when its caller explicitly selects an occurrence rather than inferring an active timeline.
- [ ] Add visual-guide and repository examples for once, repeated, continuous, receipt, and cascade treatments before applying them to a consumer walkthrough.
- [ ] Update the model, runtime, presentation, Studio, accessibility, and authoring contracts.

## Files touched

- packages/domain-model/src/
- packages/domain-core/src/ and packages/domain-core/schema/
- packages/view-model/src/
- packages/view-canvas/src/
- packages/view-present/src/
- packages/view-studio/src/
- packages/render-svg/src/
- examples/ and apps/site/src/visual-guide/
- docs/decisions/, docs/specs/, docs/reference/, and affected guides

## Verify

After Diagram dynamics (`INFOSCHEMATICS-TOOL-055`, delivered) lands, run bun run self:verify:schema, focused bunx vitest run suites for Scene parsing, cue scheduling, Present replay and cancellation, Canvas treatments, Studio pass-through, reduced motion, accessibility, and static SVG explicit occurrences, then bun run self:packages:build and bun run self:check. Inspect all five visual-guide treatments in full and reduced motion and confirm a Scene change cancels the prior schedule.

## Dependencies / blocks

Diagram dynamics (`INFOSCHEMATICS-TOOL-055`, delivered) must first deliver named Diagram Dynamics, DynamicOccurrence resolution, and renderer interpretations. Until that contract exists this plan is complete but cannot truthfully enter Ready.

## Documentation impact

### Decision Records

Update the transient Dynamics decision with Scene-owned cue composition, derived cascade timing, and host-owned occurrence scheduling.

### Specifications

Add Scene cue, validation, runtime scheduling, renderer treatment, reduced-motion, static-output, and accessibility requirements.

### Guides

Add authored examples for playback policies and explain that focus and Dynamics remain separate concepts.

### Roadmap

Remove the dependency and transition this item to Ready only after Diagram dynamics (`INFOSCHEMATICS-TOOL-055`, delivered) has landed.

## Discussion

### Cue vocabulary

Scenes reference product-owned Dynamic IDs. Playback policy describes when an occurrence is created; it does not restate target geometry or renderer technique.

### Cascade timing

Cascade stages are ordered integers. Present divides the available Scene duration across the ordered stages, avoiding a general-purpose timeline and keeping authored YAML reviewable.

### Receipt semantics

Receiving-component pulses use an emphasise-elements Dynamic rather than a Flow-specific special case. This lets the same semantic event retain full-motion, reduced-motion, static, and accessible interpretations.

### Studio wiring

Studio must pass the same occurrence state through its Present surface. Design mode may inspect authored cues, but it does not run a separate scheduling engine.
