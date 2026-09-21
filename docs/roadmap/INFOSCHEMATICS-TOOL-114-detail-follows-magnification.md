---
id: INFOSCHEMATICS-TOOL-114
area: TOOL
title: Detail follows magnification
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-21T19:30:00Z
updated_at: 2026-09-21T19:30:00Z
---

# Detail follows magnification

## Goal

Settle whether zooming into part of an [Infoschematic](../reference/vocabulary.md#infoschematic) reveals more about that part, rather than only drawing the same thing larger.

## Context

The Canvas already moves. `packages/view-canvas/src/viewport.ts:49` zooms around a diagram coordinate while keeping the viewport inside the authored bounds, an overview map selects where to centre it, and `InfoschematicDiagram.tsx` wires pan and zoom to pointer and keyboard. What magnification does not do is change what is drawn: at any scale the same artefacts are painted at the same level of detail, so zooming in enlarges and nothing appears.

The separation this would need is already decided. `ADR-INFOSCHEMATICS-011` keeps semantic authored identity apart from output-detail policy, so detail is already a policy question rather than an authored property, and `packages/domain-model/src/artefact.ts` carries the level-of-detail vocabulary that policy speaks.

The nearest comparison is Structurizr's hierarchical zoom and Ilograph's levels of detail, both recorded in [the related-tools reference](../reference/related-tools.md). Both treat detail as a step between named views rather than a continuous function of scale, which is a materially different product feel and worth choosing deliberately.

## Boundary

A decision item about what an existing interaction reveals. It does not add a model concept and does not make magnification an authored value: what a document says stays the same at every scale. It says nothing about Present, where a Scene already chooses what an Audience sees, and it does not commit to a second rendering pipeline for static output.

## Discussion

Captured on 2026-09-21 alongside the positioning work, from the owner's interest in zooming into parts of an embedded document.

The choice that shapes everything else is whether detail is continuous or stepped. Continuous detail — progressively revealing Ports, labels, or nested content as scale crosses thresholds — feels like an instrument and is the harder thing to keep readable, because every threshold is a place where the drawing changes under the reader's hand. Stepped detail, where magnification past a bound enters a named view of that part, is closer to what the comparable products do and reuses whatever [INFOSCHEMATICS-TOOL-115](INFOSCHEMATICS-TOOL-115-linking-to-one-part.md) settles about naming a part.

Two further questions follow: whether static renderers honour the same policy, so an SVG of a Scope matches what the Canvas shows at that scale, and what an assistive reader is told when detail changes without any content changing.
