---
id: ADR-INFOSCHEMATICS-025
title: One ordered selection with an anchor
date: 2026-09-15
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-002, ADR-INFOSCHEMATICS-016, PDR-INFOSCHEMATICS-001]
---

# ADR-INFOSCHEMATICS-025: One ordered selection with an anchor

## Context

Design held exactly one element. Every typed operation took one target, the editor carried one `selection` field, and the renderers drew one selected thing. Group geometry needs several, and there are two ways to get there.

The first is a set beside the selection: keep `selectedArtefact` for the properties panel and add a separate collection for group operations. That is two pieces of state saying overlapping things, and every feature that touches selection — interaction layers, Scene authoring, the properties panel, the change set — then has to decide which one it believes, and stay right about it as the other moves.

The second is to make the selection itself ordered, and treat one element as the ordinary case of that order.

A group operation also needs somewhere to measure from. Aligning to the bounding box of the held elements moves every element, including the one the Producer picked first, so the result depends on what else happened to be held and pressing the same control twice keeps moving things.

## Decision

Design has one selection: an ordered set. Its first element is the **anchor** ([`selection-anchor`](../reference/vocabulary.md#selection-anchor)), and the anchor is published as the single selection as well, so a single-element selection is not a special case but the one-element instance of the general one. Holding a group is an ordering operation on that selection; nothing else keeps a parallel record of what is held.

Every align edge and both distribute axes are measured from the anchor. The anchor never moves, so a control is idempotent: pressing it again asks for an arrangement that already holds. The anchor keeps the existing selected treatment and the other held elements are drawn in the same colour but broken, because a Producer has to see which element the others will be brought onto before pressing anything.

Which kinds may participate comes from `artefactCapabilities` rather than a second list. A kind that cannot move cannot be aligned or distributed, so a Flow follows the ports it is attached to instead of being aligned in its own right, and a closed interaction layer removes its kind from the group exactly as it removes it from a single selection.

Group operations emit ordinary coordinate changes. No anchor, group, or alignment state reaches the authored document, so reopening a model needs no alignment engine to reproduce its geometry, and a later editor may move any element freely.

## Consequences

One selection means one thing to filter, one thing to render, one thing to persist as a Scene occurrence, and one thing for a later feature to read. Interaction layers needed no second notion of selectability, and the properties panel needed no notion of a group at all.

Measuring from the anchor makes the result depend on the Producer's first pick, which has to be visible to be usable — that is a rendering obligation this decision creates, in every renderer that offers a Design surface.

The cost is in review granularity. One group operation is one undo step, but it lists one row per changed element, because a row names the authored source a review has to read and a collapsed row would hide changed lines. A reviewer therefore sees six rows for a six-element align, and reverses them with one undo.
