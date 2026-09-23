---
id: ADR-INFOSCHEMATICS-035
title: A Sequence paces a cascade, and a declaration never does
date: 2026-09-21
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-024, ADR-INFOSCHEMATICS-034]
---

# ADR-INFOSCHEMATICS-035: A Sequence paces a cascade, and a declaration never does

## Context

[ADR-INFOSCHEMATICS-034](ADR-INFOSCHEMATICS-034-a-scene-cues-a-dynamic-and-a-view-owns-the-cadence.md) let a [Scene](../reference/vocabulary.md#scene) cue a named [Diagram Dynamic](../reference/vocabulary.md#diagram-dynamic) under a bounded `once` or `repeat` policy, and deliberately left the fourth playback statement `INFOSCHEMATICS-TOOL-023` had asked for — an ordered cascade, one Dynamic playing after another in an authored order — out of scope. Its reason was precise rather than provisional: dividing a Scene's hold between several cues needs a measured duration in the document, which is exactly the timing `DYNAMIC-001` refuses to let a declaration carry, and nothing then said what a cascade divides when a Scene declares no duration.

The difficulty is real. `packages/view-model/src/runtime.ts` gives every runtime Scene a `hold`, defaulted from `defaultSceneDuration`, so a number always exists. In an untimed [Sequence](../reference/vocabulary.md#sequence) — `SCENE-005` lets a Sequence choose manual advance — that number is a fiction: the Scene stays on screen until the presenter steps, which may be a second or ten minutes. Stages that divide a fictional hold either finish while the presenter is still speaking or wait on a step that never comes.

So any answer had to name a pacing source that is not authored time. Three were available: the presenter's own steps, a receipt from the previous stage, or admitting a cascade only where a Sequence is timed.

## Decision

A cascade is admissible wherever a Scene may cue at all, and **the Sequence paces it**. A declaration still never does.

In a timed Sequence the cascade's stages divide the Scene's own `hold`, which is a real measurement there. In an untimed Sequence each stage is one presenter step: the Scene advances to the next stage where it would otherwise have advanced to the next Scene, and moves on to the next Scene once the last stage has played. The pacing source in both cases is the Sequence the Scene already sits in, so no clock is invented and no completion signal is required from a renderer.

`DYNAMIC-001` is unchanged and unamended: a cascade is authored as an order, never as a duration, an easing, or a delay, and no cue field carries a measurement. A cascade is ordering over cues that ADR-INFOSCHEMATICS-034 already recognises, so `DYNAMIC-002`'s occurrence shape and its two origins are unchanged too. `SIGNAL-003` governs it as it governs every cue: leaving the Scene ends the whole cascade, played out or not, and a cascade originates nothing under a `none` signal policy.

A receipt-driven cascade is rejected. It would need a completion report the View Model does not have, and a renderer that draws a Dynamic statically — print, reduced motion, a still export — has no completion to give, so a cascade there would either stall or be declared finished at once, which is two behaviours wearing one name. Confining a cascade to a timed Sequence is rejected as the narrower answer to a question that has a general one.

## Consequences

An untimed Sequence gains a step that advances within a Scene rather than past it. That is the cost of this decision and the thing to hold a test to: a presenter stepping through a cascading Scene must reach the same place as before, having passed through the cascade's stages, and a Scene with no cascade must step exactly as it does today. `SCENE-006`'s bound covers the Sequence's own stepping already, so a cascade adds stages to that stepping rather than a second mechanism beside it.

Reduced motion and static output stay where `ADR-INFOSCHEMATICS-024` put them. A cascade orders occurrences; each kind still owes a full-motion treatment, a reduced-motion still treatment, and a deterministic static one, and the static renderer continues to emit only the occurrences its caller supplies, so a cascade never makes a still picture depend on having been played.

A Producer can now say "this, then this, then this" in the document, in either kind of Sequence, without the document learning to count.
