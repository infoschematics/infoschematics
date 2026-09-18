---
id: ADR-INFOSCHEMATICS-026
title: Name Dynamics in the document
date: 2026-09-15
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-005, ADR-INFOSCHEMATICS-006, ADR-INFOSCHEMATICS-012]
---

# ADR-INFOSCHEMATICS-026: Name Dynamics in the document

## Context

`ADR-INFOSCHEMATICS-012` made a Flow signal a transient runtime occurrence rather than authored state, and that has held. What it did not give a host was anything to bind to. A signal occurrence names a Flow id, so an external event — a deployment finishing, a queue backing up, a player stalling — could only reach the diagram by knowing which Flow depicts it. The knowledge that "segments were published" means "the `PUBLISHED` Flow" lived in the host, beside the event plumbing, where a rename of an authored id breaks it silently.

The obvious next step would be to call the general concept animation and let a document carry effects: a target, a technique, a duration, perhaps a selector. That makes a rendering technique the product abstraction, and it makes every renderer that cannot animate — static SVG, a print, a reduced-motion viewer — a degraded case of the authored intent rather than a first-class realisation of it.

## Decision

An authored Diagram declares named **Diagram Dynamics** under `diagram.dynamics`. A Dynamic has a stable `id`, a human `label`, an optional `description`, and one `kind` from a deliberately finite vocabulary: `signal-flow` names one or more Flows, `emphasise-elements` names one or more visual elements. Targets are authored ids the same document declares, validated like any other reference, and stored sorted.

A Dynamic says what a change _means_ and what it is _about_. It says nothing about how the change is depicted: no duration, easing, colour, selector, callback, timer, or renderer component enters the document.

A host supplies a framework-neutral `DynamicOccurrence` carrying a `dynamicId` and a host-owned `occurrenceKey`. View Model resolves an occurrence against the declaration into renderer-facing Flow signals or element emphasis; a resolved Flow signal is indistinguishable from one a host supplied directly, so a Dynamic cannot acquire a lifecycle that `ADR-INFOSCHEMATICS-012` does not already grant. Holding a key holds the occurrence, changing it replays, withdrawing it cancels, and an occurrence naming an undeclared Dynamic changes nothing.

Every kind owes a full-motion treatment, a reduced-motion still treatment, a deterministic static treatment, and an accessible announcement that states the Dynamic's own label rather than describing the graphic or naming the elements it happened to touch. Emphasis reaches only what the renderer actually drew, so an occurrence can never reveal filtered or out-of-scope content.

## Consequences

An integration binds `dynamicId`, which is the vocabulary the document's author chose, and stays correct when geometry, Flow ids, or Card layout change around it. The same binding drives Canvas, Present, Studio, and static output, and a document can be reviewed for what it is prepared to express before any wiring exists.

The finite vocabulary is the cost. Persistent reveal and conceal, movement, and arbitrary timelines are not expressible, and a host that wants them cannot smuggle them in through a Dynamic; a third kind is a decision with its own static and accessible obligations rather than a configuration value. Scene-authored choreography (`INFOSCHEMATICS-TOOL-023`) binds this vocabulary instead of defining a parallel animation contract.

Static output stays deterministic and quiet unless a caller asks for a named occurrence explicitly, so publishing a document never depends on whether a Dynamic happened to fire.

## Amendments

`ADR-INFOSCHEMATICS-038` adds a second origin for an occurrence: a Scene may cue a named Dynamic with a bounded `once` or `repeat` policy. The vocabulary, the occurrence shape, and the refusal to carry timing in the document are all unchanged — the cue names which Dynamic and how often, and the View that plays it owns every timer. Scene-authored choreography is therefore the binding this record anticipated rather than the parallel animation contract it refused.
