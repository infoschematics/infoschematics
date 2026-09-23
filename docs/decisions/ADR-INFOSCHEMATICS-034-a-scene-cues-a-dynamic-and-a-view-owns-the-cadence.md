---
id: ADR-INFOSCHEMATICS-034
title: A Scene cues a Dynamic, and a View owns the cadence
date: 2026-09-18
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-024]
---

# ADR-INFOSCHEMATICS-034: A Scene cues a Dynamic, and a View owns the cadence

## Context

`ADR-INFOSCHEMATICS-024` put [Diagram Dynamics](../reference/vocabulary.md#diagram-dynamic) in the document and left every occurrence of one to a host: `DYNAMIC-002` recognises a `DynamicOccurrence` carrying a `dynamicId` and a host-owned `occurrenceKey`, and nothing else can originate one. A [Scene](../reference/vocabulary.md#scene) could already signal the Flows it focuses — `SIGNAL-003` — but that is focus read as movement, not the document naming what it wants shown.

So an authored [Sequence](../reference/vocabulary.md#sequence) could not say "play this Dynamic here". A Producer who declared `record-delivered` and wanted it to play as a Scene arrives had to wire the host to the Sequence's position, which puts the choreography of a presentation outside the document that is the presentation.

`INFOSCHEMATICS-TOOL-023` asked for four playback statements — once, repeatedly, continuously, and in an ordered cascade — and the three delivered contracts disagreed about whether a document may carry any of them. `DYNAMIC-001` keeps the Dynamic vocabulary finite and refuses a second way of saying how something is drawn; `DYNAMIC-002` gives a sustained statement its shape already, as an occurrence of a Dynamic whose `depicts` is `state`; `SIGNAL-003` requires Scene signal derivation to stay pure, framework-neutral and independent of timers.

## Decision

**A Scene MAY cue named Dynamics with a bounded playback policy of `once` or `repeat`, and the document carries no timing at all. Every timer belongs to the View that plays the cue.**

The three consequences of that, in the order they were argued:

A cue is an id and a policy. No duration, no easing, no delay, no ordering field. This keeps `DYNAMIC-001`'s refusal intact: a cue says _which_ Dynamic and _how often_, never how it is drawn or how long it takes, so the document gains no parallel animation contract.

**A statement that lasts is not a policy.** `continuous` is not a third value here, because the product already expresses it: an `emphasise-elements` Dynamic declaring `depicts: state` is a condition that holds, and `DYNAMIC-002` already makes such an occurrence last as long as it is held. A `continuous` policy would have been a second way to say the same thing, disagreeing with the first.

**An ordered cascade is out of scope.** Dividing a Scene's hold between several cues requires a measured duration in the document, which is exactly the timing this decision keeps out, and `INFOSCHEMATICS-TOOL-023`'s own shaping could not say what a cascade divides when a Scene declares no duration.

## Consequences

`SIGNAL-003` stays true as written. Derivation remains pure: a cue's occurrence key is derived from the Scene occurrence and a cue cycle already held in presentation state, so deriving twice from the same state gives the same occurrences and no derivation reads a clock. What advances the cycle is a View — `Present` holds one interval while a focused Scene cues anything that repeats, and the interval's length is View state because nothing authored says it.

`DYNAMIC-002` gains a second recognised origin. A Scene-originated occurrence is indistinguishable from a host's at the renderer boundary, and neither suppresses the other: a host occurrence says something outside the presentation happened, a cue says the document asked for something while this Scene is on screen, and both can be live at once.

`SCENE-006`'s bound now covers a repeat as well as a Sequence's own stepping. A repeating cue is one interval and one advancing key rather than a timer per cue, and the cleanup that a Scene change performs is the same cleanup an interrupted repeat needs, so the previously unexercised half of that requirement has a case.

A document that declares no cue is unchanged, byte for byte, through canonicalisation and both renderers. The static renderer is untouched: it emits only the occurrences a caller supplies explicitly, so a cue does not make a still picture depend on whether a Dynamic happened to fire.

## Amendments

`ADR-INFOSCHEMATICS-035` admits the ordered cascade this record placed out of scope, on the ground that resolved the objection: a cascade divides a Sequence's stepping rather than a Scene's declared duration, so it needs no measurement in the document. Everything else here stands, including the reasoning that keeps `continuous` out of the policy vocabulary.
