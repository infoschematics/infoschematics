---
id: ADR-INFOSCHEMATICS-036
title: An Adapter Card is positioned by what it holds
date: 2026-09-18
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [PDR-INFOSCHEMATICS-002]
---

# ADR-INFOSCHEMATICS-036: An Adapter Card is positioned by what it holds

## Context

An [Adapter Card](../reference/vocabulary.md#adapter-card) names the Card it wraps in authored data, which `DIAGRAM-005` requires and no proximity rule substitutes for. Where it is drawn was never settled in the contract, and the two renderers answered it differently. The interactive Diagram derives the clasp box from the Card it holds wherever that Card has got to, and ignores the adapter's authored `bounds` entirely; the static renderer read those bounds and painted a rectangle at them.

They agreed only by coincidence. `ADPT-01` in `examples/is-showcase/` is authored at `860 220 260 120`, which is exactly the box derived from `CARD-03`, so the divergence was invisible in the one document in the repository that composes an adapter at all. Any other authored box and the same adapter appears in two places depending on which outlet drew it.

A Card carries `bounds` because every placed artefact does, so the field exists on an adapter whether or not anything reads it. Leaving the question open meant an author could move an adapter's numbers and see nothing change in the Playground, then see it move in a still rendering.

## Decision

**An Adapter Card's position is derived from the Card it holds. Its authored `bounds` do not position it, in any renderer, and the clasp outline is stated once in View Model for both.**

An adapter is a grip on the thing it holds rather than a thing with a position of its own: that is what the notation says, and [PDR-INFOSCHEMATICS-002](PDR-INFOSCHEMATICS-002-a-structured-editor-not-a-drawing-tool.md) is why a coordinate the structure already implies is not one an author maintains, and it is why taking hold of one in the editor moves the Card it clasps. Deriving the box makes that true of the data as well, so an adapter cannot be authored adrift from what it wraps, and a Card that moves carries its adapter with it without a second coordinate to keep in step by hand.

The alternative was to honour the authored box in both renderers, which would have made `bounds` mean one thing everywhere. It was rejected because it changes the delivered interactive treatment and asks an author to maintain a coordinate that is already derivable — and because a clasp authored away from the Card it holds is a notch around empty space, which the notation has nothing to say about.

`adapterClaspOutline` in `packages/view-model/src/assembly.ts` traces the clasp beside `adapterBoundsFor`, which derives the box, and `adapterLabelBaseline` states where the adapter's own label goes. Both renderers consume them. The shape is one string, not two implementations, because a still rendering that painted an opaque rectangle over the lower half of the held Card is what a second implementation looked like.

## Consequences

`bounds` on an Adapter Card is inert. That is a field that means nothing on one kind of Card, which is the cost of this decision, and `STATIC-018` states it so an author reads it in the contract rather than discovering it. The field is not removed: it is required on every Card by the domain model, and an adapter that later stops wrapping anything has a box to fall back on.

The static renderer now draws the notation, so `examples/is-showcase/` no longer needs `card.compact: true` to keep a held Card's label out from under the adapter's fill. The document shows the notation rather than working around the absence of it.

An element emphasis over an Adapter Card takes the derived box in both renderers, because the emphasis geometry is the box the element was drawn at, and there is now one answer to what that is.

An adapter whose held Card a rendering did not draw — filtered by [Scope](../reference/vocabulary.md#scope) or dropped by a [Scene](../reference/vocabulary.md#scene)'s focus — is not drawn at all. There is no box to derive, and a clasp with nothing in it states a relationship to something absent.
