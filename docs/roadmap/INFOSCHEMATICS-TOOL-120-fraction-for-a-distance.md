---
id: INFOSCHEMATICS-TOOL-120
area: TOOL
title: Fraction for a distance
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T11:40:00Z
updated_at: 2026-09-22T11:40:00Z
---

# Fraction for a distance

## Goal

Every published [Infoschematic](../reference/vocabulary.md#infoschematic) places its [Flow](../reference/vocabulary.md#flow) labels where their authors meant, and the authored form makes the wrong reading hard to write.

## Context

`labelAt` is a distance in diagram units along the [route](../reference/vocabulary.md#route): `pointAlongRoute` in `packages/view-model/src/geometry.ts:74` walks the path until it has travelled that far, clamped to the route's length. Four published documents author it as though it were a fraction of the route — `0.5` in `examples/is-system/infoschematic.yaml`, `examples/is-infoschematics/overview.yaml` and `examples/is-showcase/infoschematic.yaml`, `0.4` in the showcase, and `0.8286` in the authoring guide at `apps/site/content/authoring.md:251`. Every one of those pins the label under a unit from the source [port](../reference/vocabulary.md#port) rather than partway along the line.

Nothing catches it. The schema types `labelAt` as a plain number, so `0.5` is as valid as `180`; the renderers place the label exactly where the number says; and `INFOSCHEMATICS-TOOL-113`'s `flow-label-obstructed` rule only fires when the anchor lands on an artefact, which a label sitting against its own source port does not, because a route meets a port on the perimeter and the rule shrinks boxes by a unit before measuring. The drawings still read, which is why this survived: the labels are near a line end rather than absent.

Two things are worth separating. The documents are wrong and can be corrected by measurement. The authored form invites the mistake, and a fraction is the more natural thing to reach for when the property is named after a position rather than a distance — so the question is whether a fractional form should be accepted alongside the absolute one, whether the property should be renamed to say what it is, or whether the checker should observe a label pinned within a port's reach of its endpoint.

## Boundary

A defect in authored documents, plus an open question about the authored contract. Correcting the five values changes only where those labels are drawn. Anything that changes what `labelAt` accepts is a public contract change: it touches `packages/domain-model/src/model.ts:106`, the schema, both routes into the runtime model (`runtime.ts:358` and `compatibility.ts:262`), the authoring guide, and a specification requirement — and it would need a decision rather than an edit. It does not add a model concept, and it does not introduce automatic label placement.

## Discussion

Found on 2026-09-22 while delivering `INFOSCHEMATICS-TOOL-113`, looking for a document the new label rule ought to have caught and finding one it structurally cannot. Captured rather than folded into that item: the rule set there is correct about what it measures, and this is a separate question about what the authored form means.

The correction needs the same treatment as any visual change, per `AGENTS.md`: the numbers have to be derived from each route's length and then the result has to be looked at, because a label moved to the geometric middle of a route can land on a bend, on another label, or on a Card, and a green suite will not say so. `INFOSCHEMATICS-TOOL-113`'s example walk asserts the published set reports no findings, so the corrected values must keep it clean — which is a useful check that the new positions are not obstructed, and not a substitute for rendering them.
