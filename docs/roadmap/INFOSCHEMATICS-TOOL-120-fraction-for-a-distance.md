---
id: INFOSCHEMATICS-TOOL-120
area: TOOL
title: Fraction for a distance
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: fe4c9b6e7f81c9b396fe2d6dd12c86844ff37850
created_at: 2026-09-22T11:40:00Z
updated_at: 2026-09-24T16:00:00Z
---

# Fraction for a distance

## Goal

Every published [Infoschematic](../reference/vocabulary.md#infoschematic) places its [Flow](../reference/vocabulary.md#flow) labels where their authors meant, and the authored form makes the wrong reading hard to write.

## Context

`labelAt` is a fraction of the [route](../reference/vocabulary.md#route)'s length. `placeLabels` in `packages/view-model/src/placement.ts:72` multiplies it by `routeLength` before asking for a point, and both renderers place every Flow label through it, so that is what a reader sees. The public schema says so too: `packages/domain-core/src/schema.ts:453` describes it to an author as running "from 0 at the source to 1 at the target".

The confusion is in the checker rather than in the documents. `packages/view-model/src/diagnostics.ts` read the same authored value as an absolute distance, so `flow-label-obstructed` measured a point no reader ever sees — on a route two hundred units long, a `0.5` was checked half a unit from the source port rather than at the midpoint. Two fixtures documented the wrong unit in the same breath, and nothing in the model or the guide stated it where an author or a maintainer would meet it.

This record was opened the other way round, on the belief that `labelAt` was a distance and that five authored values in four published documents were wrong. That belief was drawn from `pointAlongRoute`'s signature and the one call site that agreed with it, and it survives in the Discussion below. Correcting those values, as it proposed, would have broken four correct drawings.

## Boundary

A defect in authored documents, plus an open question about the authored contract. Correcting the five values changes only where those labels are drawn. Anything that changes what `labelAt` accepts is a public contract change: it touches `packages/domain-model/src/model.ts:106`, the schema, both routes into the runtime model (`runtime.ts:358` and `compatibility.ts:262`), the authoring guide, and a specification requirement — and it would need a decision rather than an edit. It does not add a model concept, and it does not introduce automatic label placement.

## Current state

Every labelled Flow in the published set is drawn where the fraction reading puts it and nowhere near where the distance reading would: nine values across three documents, nine agreements and no exceptions, measured by asking the runtime where it draws each chip. `ROUTE-013` already required a flow-label position to be held as a share of route length, so the contract existed; what was missing was a statement of the unit beside the type in `packages/domain-model/src/model.ts`, in the guide that shows the compact form, and a rule holding every consumer to it.

`packages/view-model/src/diagnostics.ts` was the consumer that disagreed. Nothing caught it, because the rule it feeds is an observation over documents that do not trip it: a label measured half a unit from a source port lands on no artefact, so a rule reading the wrong unit reported nothing and looked correct.

## Steps

- [x] Establish what `labelAt` means by measuring rather than by reading a signature: ask the runtime where it draws each published label and compare against both readings. It is a fraction, unanimously, and the schema already published it as one — so the unit needed stating rather than deciding, and no Decision Record follows.
- [x] Make `packages/view-model/src/diagnostics.ts` resolve the share the way `placeLabels` does, so the checker and the renderers answer about one drawing.
- [x] State the unit where each reader meets it: beside the type in `packages/domain-model/src/model.ts`, in `ROUTE-013` with its range and what happens outside it, and in `apps/site/content/authoring.md` beside the compact form that invites the mistake.
- [x] Correct the two fixtures that documented the wrong unit, choosing values that resolve to the same point so the assertions they were making are unchanged.
- [x] Add `flow-label-off-route`, which reports a value outside `0`–`1` together with the share it would have meant as a distance, so an author who writes `180` is told and given the number they meant.
- [x] Render the published documents and look at the labels, which is the evidence that the fraction reading is the one in force.

## Files touched

`packages/view-model/src/diagnostics.ts` and its tests; `packages/domain-model/src/model.ts`; `packages/cli/src/index.test.ts` and `packages/domain-core/src/authoring.test.ts`; `apps/site/content/authoring.md`; `docs/specs/routing-and-placement.md` and `docs/specs/diagnostics.md`. No authored value in a published document changed, and neither the schema nor either route into the runtime model needed touching, because the unit they already carry turned out to be the right one.

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

## Review

### Delivered

`labelAt` means one thing to every consumer that resolves it, and says so in the model, the specification and the authoring guide. The checker that disagreed now agrees, and an author who writes the number in the wrong unit is told which number they meant.

### Change Summary

The item was opened on an inverted premise and the first step disproved it. Every renderer places a Flow label through `placeLabels`, which multiplies the authored value by `routeLength` — so `labelAt` is a fraction, and the five authored values this record proposed to correct were already right. `packages/view-model/src/diagnostics.ts` was the one consumer reading it as an absolute distance, so `flow-label-obstructed` measured a point no reader sees. Correcting the documents would have broken four correct drawings.

The evidence is in `reports/TOOL-120-unit-probe.txt`: nine labelled Flows across three published documents, every one drawn exactly where the fraction reading predicts and none within eighty units of where the distance reading would put it.

So the fix is smaller and sharper than the plan. `diagnostics.ts` resolves the share as `placeLabels` does. `flow-label-off-route` is new, reporting a value outside `0`–`1` with the route's length and the share that value would have meant as a distance. The unit is stated beside the type in `packages/domain-model/src/model.ts`, in `ROUTE-013` with its range and the requirement that every consumer resolve it identically, in `DRAW-009` so the rule's anchor is tied to what the renderers draw, and in `apps/site/content/authoring.md` beside the compact form. Two fixtures that documented the wrong unit — `labelAt: 180` on a route 360 units long, in `packages/cli/src/index.test.ts` and `packages/view-model/src/diagnostics.test.ts` — now say `0.5`, which resolves to the same point, so what they assert is unchanged.

No Decision Record follows. The contract was already written in the public schema; nothing about what an authored document means changed.

### Verification

`bun run self:check` — 52 tasks, all successful.

`flow-label-off-route` is held in both directions, which is the part worth stating: a rule that fires on correct authored geometry costs every author who runs the checker, so `diagnostics.test.ts` asserts the finding for `labelAt: 180` and asserts an empty list for `labelAt: 0.5` on the same route. `scripts/example-drawings.test.ts` keeps the published set clean, which is the same assertion at corpus scale.

The corrected resolution is proved by the fixture it changed: with `labelAt: 0.5` the rule reports `x: 380, y: 90`, the same point the old fixture's `180` reported under the old reading, so the rule still measures what it measured and now measures it from the right number.

Looked at in a real browser rather than asserted. `reports/tool-120-labels/` shows the homepage overview's four chips partway along their routes; `reports/tool-120-showcase/` shows the showcase's `FLOW-01` at the midpoint between `Ingest` and `Transform`. Account in `reports/TOOL-120-fraction-for-a-distance.md`.

### Outstanding concerns

`flow-label-off-route` is an observation, so a document authoring `labelAt: 180` still passes `infoschematics check`. An error would be the stronger signal and there is no legitimate reason to author outside the range — but the value has always been clamped rather than rejected, and turning it into a gate failure is a contract change that belongs in its own record rather than being taken here as a side effect.

The schema still types `labelAt` as a plain number rather than constraining it to `0`–`1`, for the same reason. Constraining it would turn a drawing that reads into a document that will not parse.

### Post-change review

The generalisable thing is how the wrong premise got written down. It came from reading `pointAlongRoute(d, along)` — a signature that takes a distance — and the one call site that passed the authored value straight into it. The call site that mattered was one indirection away, in a different module, and multiplied first. A signature is not a contract; the contract was in `schema.ts`, published to authors, and neither the record nor the rule that disagreed with it had been read against it.

Which suggests the cheap check that would have caught it: before correcting authored data to match code, ask the running system where it actually draws the thing. That took one probe and nine lines of output, and it inverted the item.

The rule this leaves behind is the guard against the same class returning. A unit that lives in two consumers can diverge silently whenever one of them only reports — `flow-label-obstructed` read the wrong unit for as long as it existed and never once misfired, because a label measured half a unit from a port lands on nothing. A rule whose failure mode is silence is read as evidence, which is the repository's own standing warning, met here in an unusually literal form.

### Mini recap

`labelAt` is a fraction of route length, which is what both renderers already resolved and what the schema already published; the checker was the outlier and now agrees. The unit is stated in four places, a new observation catches the value written in the wrong unit, and no published document changed — the probe in `reports/` shows all nine authored labels were already drawn where they were meant to be.

## Done

Accepted 2026-09-24 by Kris Brown on the review packet above.

## Discussion

Found on 2026-09-22 while delivering `INFOSCHEMATICS-TOOL-113`, looking for a document the new label rule ought to have caught and finding one it structurally cannot. Captured rather than folded into that item: the rule set there is correct about what it measures, and this is a separate question about what the authored form means.

The correction needs the same treatment as any visual change, per `AGENTS.md`: the numbers have to be derived from each route's length and then the result has to be looked at, because a label moved to the geometric middle of a route can land on a bend, on another label, or on a Card, and a green suite will not say so. `INFOSCHEMATICS-TOOL-113`'s example walk asserts the published set reports no findings, so the corrected values must keep it clean — which is a useful check that the new positions are not obstructed, and not a substitute for rendering them.

### Adoption

Adopted into Now on 2026-09-22 while shaping the queue before a pause. The unit decision is taken as part of delivery, because correcting the five authored values without settling what the number means would put the same confusion back a different way.
