---
id: INFOSCHEMATICS-TOOL-114
area: TOOL
title: Detail follows magnification
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-21T19:30:00Z
updated_at: 2026-09-22T19:40:00Z
---

# Detail follows magnification

## Goal

Zooming into part of an [Infoschematic](../reference/vocabulary.md#infoschematic) reveals more about that part rather than only drawing the same thing larger.

## Context

The Canvas already moves. `packages/view-canvas/src/viewport.ts:49` zooms around a diagram coordinate while keeping the viewport inside the authored bounds, an overview map selects where to centre it, and `InfoschematicDiagram.tsx` wires pan and zoom to pointer and keyboard. What magnification does not do is change what is drawn: at any scale the same artefacts are painted at the same level of detail, so zooming in enlarges and nothing appears.

The separation this would need is already decided. `ADR-INFOSCHEMATICS-011` keeps semantic authored identity apart from output-detail policy, so detail is already a policy question rather than an authored property. What that policy speaks does not exist yet; Current state says what is actually there.

The nearest comparison is Structurizr's hierarchical zoom and Ilograph's levels of detail, both recorded in [the related-tools reference](../decisions/references/related-tools.md). Both treat detail as a step between named views rather than a continuous function of scale, which is a materially different product feel and worth choosing deliberately.

## Boundary

A decision item about what an existing interaction reveals. It does not add a model concept and does not make magnification an authored value: what a document says stays the same at every scale. It says nothing about Present, where a Scene already chooses what an Audience sees, and it does not commit to a second rendering pipeline for static output.

## Current state

Magnification changes size and nothing else. `packages/view-canvas/src/viewport.ts:49` zooms around a diagram coordinate while keeping the viewport inside the authored bounds, the overview map chooses where to centre, and `InfoschematicDiagram.tsx` wires pan and zoom to pointer and keyboard. Every artefact is painted the same way at every scale.

There is no detail vocabulary to reuse, which this record's capture assumed there was. `ArtefactIdentity.detail` in `packages/domain-model/src/artefact.ts` is a descriptive string — it reaches the accessible description and the SVG `<title>` in `packages/render-svg/src/index.ts:1187` — not a level. `Fabric.appearance.detail` is the same kind of string. So the policy this item needs is new, and `ADR-INFOSCHEMATICS-011` is the reason it may exist as policy at all: it already keeps authored identity apart from output-detail policy, so nothing authored has to change.

## Steps

- [ ] Take the decision between continuous and stepped detail and record it, including what is deliberately rejected: entering a named view of a part is addressing, which belongs to [INFOSCHEMATICS-TOOL-115](INFOSCHEMATICS-TOOL-115-linking-to-one-part.md), not magnification.
- [ ] Define the detail bands and what each reveals, in the View Model, as a pure function of scale so both a View and a static outlet can resolve the same band.
- [ ] Apply the band in the Canvas so crossing a threshold reveals or withdraws detail, with hysteresis at the boundary: a drawing that flickers as a reader's hand moves is worse than one that never changes.
- [ ] Give the static renderer the same resolved band as an input, so an SVG of a magnified part matches what the Canvas shows at that scale.
- [ ] Announce a detail change to an assistive reader without implying the document changed, per the announcement surface `ADR-INFOSCHEMATICS-029` mounts.
- [ ] State the bands and their contents as requirements, so a later change to what a band reveals is a visible contract change.

## Files touched

`packages/view-model` for the band function and its test; `packages/view-canvas/src/viewport.ts` and `InfoschematicDiagram.tsx`; `packages/render-svg` and `packages/cli` for the static band input; `docs/specs/` for the requirements; a new Decision Record; the visual guide in `apps/site`.

## Verify

`bun run self:check`, with the band function held by unit tests at every threshold and on both sides of the hysteresis margin.

The reveal is proved in a browser rather than read out of the source: the browser suite zooms past a threshold and asserts what is drawn before and after, and the announcement is asserted on the announcement surface.

Both extremes are rendered and looked at, per `AGENTS.md`. A threshold that reveals detail into a drawing that then overlaps is a TOOL-113 finding, and the two schemes of that check are worth running here.

## Dependencies / blocks

Nothing blocks it. It is independent of TOOL-115, though both touch what it means to arrive at part of a document, and the decision here deliberately leaves named views to that record.

## Documentation impact

### Decision Records

A new record deciding that detail is a continuous policy resolved in bands rather than a step between named views, that no authored property expresses it, and that a static outlet may be given a band.

### Specifications

`docs/specs/diagram-elements.md` or a section of `docs/specs/appearance.md` states each band and what it reveals; `docs/specs/static-rendering.md` states that a band may be supplied and what the default is.

### Guides

The consumer guide explains that zooming reveals more and what that means for a still export; the visual guide shows the same document at each band.

### Roadmap

Nothing follows necessarily. If a band turns out to want authored control, that is a model change and its own record.

## Discussion

Captured on 2026-09-21 alongside the positioning work, from the owner's interest in zooming into parts of an embedded document.

The choice that shapes everything else is whether detail is continuous or stepped. Continuous detail — progressively revealing Ports, labels, or nested content as scale crosses thresholds — feels like an instrument and is the harder thing to keep readable, because every threshold is a place where the drawing changes under the reader's hand. Stepped detail, where magnification past a bound enters a named view of that part, is closer to what the comparable products do and reuses whatever [INFOSCHEMATICS-TOOL-115](INFOSCHEMATICS-TOOL-115-linking-to-one-part.md) settles about naming a part.

Two further questions follow: whether static renderers honour the same policy, so an SVG of a Scope matches what the Canvas shows at that scale, and what an assistive reader is told when detail changes without any content changing.

### Adoption

Adopted for immediate work on 2026-09-21. The continuous-or-stepped question is taken as part of delivery, with the named-view option deliberately excluded — it is addressing, and it belongs to TOOL-115 rather than to magnification.
