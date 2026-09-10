---
id: INFOSCHEMATICS-TOOL-023
area: TOOL
title: Scene signal treatments
theme: tool
horizon: future
status: draft
candidate: true
blocks: []
blocked_by: [INFOSCHEMATICS-SITE-006]
baseline_ref: null
---

## Goal

A scene can author how activity is animated while it holds: pulses travelling its focused flows (once, repeated through the scene's duration, or continuously), the receiving component pulsing as a signal arrives, and sequenced cascades where arrivals trigger onward signals — so a story step shows traffic moving through the system rather than a static highlight.

## Context

The signal machinery half exists. `view-model/signals.ts` resolves one occurrence per focused flow for a scene, and `view-canvas` renders it as a one-shot 900ms dot travelling the flow path (`animateMotion`, with a reduced-motion still fallback). But only `view-present` wires the `signals` prop; `view-studio` never passes it, so a studio-hosted dashboard has never shown a signal at all. There is one policy (`focused-flows`), one occurrence per flow per scene, no repetition, no component-side response, and no ordering.

The motivating example is the 5G-EMERGE IBC 2026 full walkthrough. Its telemetry step wants multiple pulses running from the edge cache and the player down into the telemetry plane for as long as the scene holds; the next step wants those arrivals passed visibly into prediction and popularity — with the receiving component itself pulsing on receipt, not just the arrow; the decision step wants catalogue, prediction and popularity signals converging to pulse demand control, which in turn sends signals onward to the supply adapters; and the closing feedback-loop scene wants continuous circulation around the whole cycle.

## Boundary

The treatments, model vocabulary, studio wiring and worked examples land here. Authoring them onto the 5G-EMERGE scenes stays in that repository, and happens only after the treatments are demonstrated in the visual guide. No changes to flow routing, families, or the focus/highlight model.

## Discussion

### Treatment options, not one behaviour

These are different rhetorical effects and should be separately authorable, most likely as scene-based treatment keys (serialisable primitives, per the definition/host boundary): a one-shot pulse (today's behaviour), repeated pulses fitted to the scene's duration, continuous circulation for cycle scenes, component receipt pulses, and sequenced cascade (source flows, then receiving component, then onward flows). A scene might combine several; a story should be able to default them.

### Component receipt pulse

Pulsing the receiving card is half the storytelling — the arrival must be seen to land. Needs a card-level animation idiom in `view-canvas` (the signal-emphasis keyframe pattern and the reduced-motion fallback already set the idiom) keyed off the same occurrence identity the flow pulse uses, so arrow and card read as one event.

### Sequencing and cascades

The cascade (telemetry → prediction/popularity → demand control → supply adapters) needs staged delays derived from authored order rather than a hand-tuned timeline. Worth deciding whether stage timing is derived (equal shares of scene duration) or authored (explicit offsets); derived is likely enough for the walkthrough and far cheaper to keep coherent.

### Studio wiring

Whatever lands, `view-studio` must pass `signals` through to the diagram (present mode at minimum) or none of it is visible in the dashboard host that motivated the work.

### Visual guide first

Deliver the treatments into the visual guide / examples before any consumer authors them, so the vocabulary is demonstrated and reviewable on its own terms.
