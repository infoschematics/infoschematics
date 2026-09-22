---
id: INFOSCHEMATICS-TOOL-120
area: TOOL
title: Fraction for a distance
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T11:40:00Z
updated_at: 2026-09-22T19:40:00Z
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

## Current state

`labelAt` is a distance in diagram units. `pointAlongRoute` in `packages/view-model/src/geometry.ts:74` walks the route accumulating segment lengths until it has travelled that far, clamping at the route's total length; `packages/domain-model/src/model.ts:106` types it as a plain number with no unit, no range and no documentation of which it is. Both routes into the runtime model pass it through unchanged (`runtime.ts:358`, `compatibility.ts:262`), and `packages/domain-core/schema/infoschematic.schema.json` accepts any number.

Five authored values in four published documents read as fractions and are therefore drawn a fraction of a unit from the route's start: `labelAt: 0.5` at `examples/is-system/infoschematic.yaml:94`, `:98` and `:102`, `labelAt: 0.5` at `examples/is-infoschematics/overview.yaml:130`, `:135`, `:140` and `:145`, `labelAt: 0.5` and `0.4` at `examples/is-showcase/infoschematic.yaml:210` and `:221`, and `labelAt: 0.8286` in the authoring guide at `apps/site/content/authoring.md:251`. Every one pins the label against its source Port. The delivered drawing diagnostics do not catch it: `flow-label-obstructed` fires when a label anchor lands on an artefact, and a label pressed against the perimeter of its own source Port is not inside one.

## Steps

- [ ] Decide what `labelAt` means, and record it: a distance as today with the authored documents corrected, a fraction of route length with the model changed and a compatibility path for existing distances, or both units distinguished in the authored form. The third is a public-contract enlargement and is the option most in need of an explicit rejection if it is not taken.
- [ ] Apply the decision to `packages/domain-model/src/model.ts:106`, the generated schema, and both routes into the runtime model, so one meaning reaches every outlet.
- [ ] Correct the five authored values and the authoring guide example, deriving each replacement from its own route's computed length rather than by eye.
- [ ] Add a drawing-diagnostics rule that catches the confusion structurally — a label position implausible for the unit in force — so the next author writing `0.5` is told rather than left with a drawing that happens to read.
- [ ] State the meaning as a requirement, so a later change to the unit is a visible contract change rather than a silent one.
- [ ] Render the four corrected documents and look at them: a label moved to the geometric middle of a route can land on a bend, on another label, or on a Card, and none of that fails a suite.

## Files touched

`packages/domain-model/src/model.ts` and its tests; `packages/domain-core/schema/infoschematic.schema.json` via `scripts/generate-schema.ts`; `packages/view-model/src/runtime.ts` and `compatibility.ts`; `packages/view-model/src/geometry.ts` if the unit changes; the new rule in `packages/view-model/src/diagnostics.ts`; `examples/is-system/infoschematic.yaml`, `examples/is-infoschematics/overview.yaml`, `examples/is-showcase/infoschematic.yaml`; `apps/site/content/authoring.md`; `docs/specs/routing-and-placement.md` and `docs/specs/diagnostics.md`; a Decision Record if the unit changes.

## Verify

`bun run self:check`. The example walk in `scripts/example-drawings.test.ts` asserts the published set reports no findings, so the corrected values must keep it clean — a useful check that the new positions are not obstructed, and not a substitute for rendering them. Per `AGENTS.md`, capture the four corrected documents from a real browser into `reports/` and look at each label.

## Dependencies / blocks

Nothing blocks it and it blocks nothing. It is independent of `INFOSCHEMATICS-TOOL-121`, which is also a published-output correction but about treatment rather than authored meaning.

## Documentation impact

### Decision Records

A record only if the unit changes or both units become expressible — either is a change to what an authored document means, which is the class `docs/decisions/` exists for. Correcting five values under an unchanged meaning needs no record.

### Specifications

`docs/specs/routing-and-placement.md` states the unit of `labelAt`, its range, and what happens beyond the route's length. `docs/specs/diagnostics.md` gains the new rule's requirement with its code, subject and evidence.

### Guides

`apps/site/content/authoring.md:251` carries a worked value that is currently wrong under either reading; it must show the unit explicitly rather than leave a bare number for a reader to infer from.

### Roadmap

Nothing follows necessarily. If the decision is to express both units, the compatibility path for existing authored documents is part of this item, not a successor.

## Discussion

Found on 2026-09-22 while delivering `INFOSCHEMATICS-TOOL-113`, looking for a document the new label rule ought to have caught and finding one it structurally cannot. Captured rather than folded into that item: the rule set there is correct about what it measures, and this is a separate question about what the authored form means.

The correction needs the same treatment as any visual change, per `AGENTS.md`: the numbers have to be derived from each route's length and then the result has to be looked at, because a label moved to the geometric middle of a route can land on a bend, on another label, or on a Card, and a green suite will not say so. `INFOSCHEMATICS-TOOL-113`'s example walk asserts the published set reports no findings, so the corrected values must keep it clean — which is a useful check that the new positions are not obstructed, and not a substitute for rendering them.

### Adoption

Adopted into Now on 2026-09-22 while shaping the queue before a pause. The unit decision is taken as part of delivery, because correcting the five authored values without settling what the number means would put the same confusion back a different way.
