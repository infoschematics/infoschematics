---
id: ADR-INFOSCHEMATICS-041
title: A link names a part and arriving centres and selects it
date: 2026-09-25
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-003, ADR-INFOSCHEMATICS-005, ADR-INFOSCHEMATICS-025, ADR-INFOSCHEMATICS-029, ADR-INFOSCHEMATICS-039]
---

# ADR-INFOSCHEMATICS-041: A link names a part and arriving centres and selects it

## Context

Prose that discusses one part of an [Infoschematic](../reference/vocabulary.md#infoschematic) wants to send a reader to that part rather than to the whole picture. A runbook says "the store is where retries accumulate" and the drawing it is talking about is a screenful away, with the store somewhere inside it. Until now the only thing a writer could link to was the document.

Three constraints already settled where such a mechanism may live. [`ADR-INFOSCHEMATICS-005`](ADR-INFOSCHEMATICS-005-host-owned-configuration.md) puts routing, URLs and page state in the host: a package that read `window.location` would make every host share one URL grammar it did not choose. [`ADR-INFOSCHEMATICS-003`](ADR-INFOSCHEMATICS-003-authored-identity-codes.md) gives authored elements stable codes, which is the only naming a writer outside the repository could reasonably be asked to type. And [`ADR-INFOSCHEMATICS-039`](ADR-INFOSCHEMATICS-039-detail-is-a-band-of-scale-and-the-view-holds-the-hysteresis.md) makes what a drawing reveals a pure function of its rendered scale, which means anything that changes magnification also changes what the document says.

The hard part is not the mechanism but its blast radius. An address written into someone else's prose outlives the document it points into: the paragraph stays published long after the Card it names has been renamed or removed. Whatever arriving does, a stale address must not be able to break the page that embeds the drawing.

## Decision

**The host owns the address; the Diagram takes a resolved destination.** A host reads its own query string, path segment or fragment — whichever grammar it already uses — and hands the Diagram a value naming an authored identity. No package parses a URL, and no routing moves into `view-model` or `view-canvas`. This is [`ADR-INFOSCHEMATICS-005`](ADR-INFOSCHEMATICS-005-host-owned-configuration.md) applied unchanged; the destination is configuration like any other prop.

**What is addressable is an artefact code or an [Architectural Scope](../reference/vocabulary.md#scope) id.** Regions, Fabrics, Cards, Points and Flows are named by the identity their author already wrote; a Scope names a set of them at once, which is how an author says "this part" when the part is several elements. [Graphics](../reference/vocabulary.md#graphic) are excluded because a Graphic may carry no bounds and then covers the whole drawing, so there is nothing particular to arrive at. [Scenes](../reference/vocabulary.md#scene) are excluded deliberately rather than by oversight: a Scene is a state of the whole Diagram, and Present already selects one by its own route, so making it addressable here would give one concept two competing addresses.

**Arriving means centring the viewport and selecting the named part — and nothing else.** The selection is the ordered set [`ADR-INFOSCHEMATICS-025`](ADR-INFOSCHEMATICS-025-one-ordered-selection-with-an-anchor.md) describes, anchor first, so a Scope arrival reads as one selection with a lead element rather than a pile. Two things arriving explicitly does not do. It does not magnify: under [`ADR-INFOSCHEMATICS-039`](ADR-INFOSCHEMATICS-039-detail-is-a-band-of-scale-and-the-view-holds-the-hysteresis.md) zooming to a part would move the detail band, so an address in a sentence would silently change how much every element in the drawing reveals — an address must not be able to edit the document's voice. And it does not emphasise: an arrival emphasis would collide with authored [Diagram Dynamics](../reference/vocabulary.md#diagram-dynamic), which are the author's own way of drawing attention, so arriving leaves every authored Dynamic untouched and starts none of its own.

**An unresolvable destination is a quiet no-op with a reported reason.** The Diagram still mounts, still draws the whole document, selects nothing and says nothing to the reader; the host is told which address failed and why, through the same callback that reports a successful arrival. A thrown error here would let a paragraph nobody in this repository controls take down a page, and a visible "not found" would put someone else's broken link in front of a reader who cannot fix it.

**A still ignores a destination entirely and renders the whole document.** An SVG has no viewport a reader controls, so arriving has no meaning in one; pre-framing a crop would make the same definition produce a different picture depending on an address the picture itself cannot show. Cropping a still is the caller's concern, not the address's.

## Consequences

A writer can now link into a drawing from prose they own, using only a code the document already publishes, and can check the link by looking at it rather than by reading source. The address is a plain authored identity, so it survives being copied into a wiki, an issue or a chat message.

Because arriving centres without magnifying, a reader whose viewport already shows the whole document sees no movement at all: the selection is the entire arrival. That is the honest outcome rather than a defect — there is nothing to centre when everything is already in frame — but it means a host demonstrating the feature on a small document should expect the selection to carry it, and a host that wants framing must magnify on its own behalf first.

The arrival selection behaves like an opening selection rather than a latch. A host that holds its own selection keeps it; otherwise the arrival's selection stands until the reader's next press replaces it, which is what a reader expects from something the page did on their behalf rather than something they chose.

One announcement region on the Diagram frame tells an assistive reader where they were moved to, what is now selected, and that the document has not changed. It sits beside the detail announcement for the reason [`ADR-INFOSCHEMATICS-029`](ADR-INFOSCHEMATICS-029-a-diagram-host-mounts-the-announcement-surface.md) and [`ADR-INFOSCHEMATICS-039`](ADR-INFOSCHEMATICS-039-detail-is-a-band-of-scale-and-the-view-holds-the-hysteresis.md) give for viewport state: the viewport is the Diagram's own, so no host can observe the movement and none could reconcile an announcement about it.

Resolution itself is a pure function in View Model over a runtime, reading no browser state, so a host, a test or a future outlet can ask where an address leads without mounting anything. `RUNTIME-008` in [the Runtime model specification](../specs/runtime-model.md) carries the resolution contract, `DIAGRAM-012` in [the Diagram elements specification](../specs/diagram-elements.md) carries what may be named, and `STATIC-022` in [the Static rendering specification](../specs/static-rendering.md) carries the still's indifference, so a later change to any of the three has to argue with a requirement rather than with a comment.
