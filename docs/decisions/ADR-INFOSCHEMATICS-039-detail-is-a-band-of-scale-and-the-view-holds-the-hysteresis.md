---
id: ADR-INFOSCHEMATICS-039
title: Detail is a band of scale and the view holds the hysteresis
date: 2026-09-24
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-011, ADR-INFOSCHEMATICS-029]
---

# ADR-INFOSCHEMATICS-039: Detail is a band of scale and the view holds the hysteresis

## Context

Magnifying an [Infoschematic](../reference/vocabulary.md#infoschematic) enlarged it and revealed nothing. The Canvas viewport zooms around a diagram coordinate and stays inside the authored bounds, but every artefact was painted the same way at every scale, so a reader who zoomed in got the same drawing bigger.

The separation that makes a remedy possible was already taken. [`ADR-INFOSCHEMATICS-011`](ADR-INFOSCHEMATICS-011-separate-authored-appearance-from-output-detail.md) keeps authored appearance apart from output-detail policy, and fixes the thresholds at which a responsive rendering withholds a Card's description, its code, then its stereotype. What did not exist was anything that spoke that policy from magnification: `resolveResponsiveCardTreatment` measured the authored view box against the frame, which does not move when a reader zooms, so the answer was constant for the life of the drawing.

The comparable products answer the question differently. Structurizr's hierarchical zoom and Ilograph's levels of detail, both surveyed in [the related-tools reference](references/related-tools.md), treat detail as a step between named views: past a bound, the reader is taken into a view of the part. That is a materially different product feel and had to be chosen rather than fallen into.

## Decision

**Detail is continuous: a policy resolved in bands as a pure function of rendered scale, never a step into a named view.** Four bands — `minimal`, `outline`, `identified`, `full` — sit on the thresholds `ADR-INFOSCHEMATICS-011` already fixed, so a small rendering and a magnified one reach the same answer from the same numbers, and no second threshold vocabulary exists to drift from the first. Each band names what it may reveal and nothing else: names alone, then stereotypes, then codes, then descriptions. A band remains a ceiling in the sense `APPEAR-016` requires — it may withhold a row the request offered, and may never restore one the request withheld.

Three things decided it.

- **An Infoschematic is embedded inside someone else's document.** [`PDR-INFOSCHEMATICS-001`](PDR-INFOSCHEMATICS-001-an-infoschematic-is-an-authored-definition-not-a-drawing.md) says the definition is embedded wherever it is read, and [`PDR-INFOSCHEMATICS-002`](PDR-INFOSCHEMATICS-002-product-messaging.md) positions the product as a live instrument rather than a stale diagram. Stepping into a named view navigates the reader out of the host document and into the tool. That is the behaviour of a diagram tool, and an embedded artefact that takes the page away from its host has stopped being embedded.
- **Named views are addressing, and addressing belongs elsewhere.** Entering a view of a part means the part has a name that can be arrived at, which is [`INFOSCHEMATICS-TOOL-115`](../roadmap/INFOSCHEMATICS-TOOL-115-linking-to-one-part.md)'s subject. It is recorded here as the deliberately rejected alternative rather than as a thing the product does not want: if it arrives, it arrives from TOOL-115 as a way of addressing a part, not from magnification as a side effect of the reader's hand.
- **Only a pure function of scale can be handed to a still.** A static outlet has no viewport and no gesture; it can be told which band to draw, and that is the whole of what it needs. A stepped named-view model has no equivalent for a static render — there is no "step" to hand an SVG — so the static half of this item could not have been delivered on it at all.

**The hysteresis lives in the Canvas, not in View Model.** This is the non-obvious half. `APPEAR-017` forbids the appearance resolver inspecting ambient viewport state, and remembering the band the reader was previously in is exactly that: a memory of where a viewport has been. So the View Model function is `scale -> band` and nothing more — no history, no margin, the same answer for the same number forever — while the Canvas holds the previous band and decides whether to act on a new one. The margin is asymmetric on purpose: revealing is immediate, because a reader who magnified past a line asked for more and should not have to overshoot to get it; withdrawing is reluctant, and only happens once the scale has fallen a clear margin below the floor of the band being held.

The split is what keeps both properties. A drawing that flickers as a reader's hand moves is worse than one that never changes, and a resolver that consults ambient state is untestable from a number and unusable by a still. Putting the memory in the view gets the steadiness without giving the resolver a past.

## Consequences

Zooming in now reveals. The reveal is graded rather than all-or-nothing: one step of magnification can bring back a Card's code while its description stays withheld, because the bands are crossed one at a time.

The static renderer takes a band and the command line takes `--detail`. An SVG asked for the band a Canvas settled at draws what that Canvas draws, which is the property the item wanted and could not have had from a stepped model. Omitting it draws `full`, so every existing still is byte-identical to what it was.

Nothing authored changed. No document says which band it is read at, no model concept was added, and a document read at any band says the same thing — `ADR-INFOSCHEMATICS-011`'s separation is what made that free.

The reader who is not looking is told. A detail change is announced politely and says the document has not changed, per the surface [`ADR-INFOSCHEMATICS-029`](ADR-INFOSCHEMATICS-029-a-diagram-host-mounts-the-announcement-surface.md) establishes. That one region lives on the Diagram rather than on the host's announcement surface, because the viewport is the Diagram's own state: no host can observe a reader's magnification, so no host could reconcile an announcement about it.

`APPEAR-020` and `APPEAR-021` in [the Appearance specification](../specs/appearance.md) carry the bands and the split, and `STATIC-021` in [the Static rendering specification](../specs/static-rendering.md) carries the supplied band and its default, so a later change to what a band reveals is a visible contract change rather than a quiet one.
