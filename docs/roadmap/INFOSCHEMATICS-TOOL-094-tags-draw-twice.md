---
id: INFOSCHEMATICS-TOOL-094
area: TOOL
title: Tags draw twice
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-19T12:12:00Z
updated_at: 2026-09-19T12:12:00Z
---

# Tags draw twice

## Goal

Show an element's code once. Turning Show tags on should reveal a code where there is not one already, not stack a second copy a few pixels from the first, and where it does appear it should land in the same place on every kind of element rather than somewhere different on each.

## Context

Found by user-acceptance testing on 2026-09-19 and reproduced live against the playground. The evidence is a zoom on `CARD-01` with tags on: two code chips overlap, the lower one visible behind the upper as a sliver of its own background.

There are two independent code renderings in `InfoschematicDiagram.tsx`, and nothing tells either about the other.

The first is the Card identity chip at `:2576` — `<g className="infoschematic-card-identity">`, a rounded rect and the code, placed in the Card's top band by `card-layout.ts`. It is an **authored** treatment: `appearance.card.identity` defaults to `false`, and the showcase turns it on along with `stereotype` and `description`. It is drawn whenever it is authored, with no reference to any viewer control.

The second is the audit badge at `:2661`, inside `<g aria-label="Infoschematic annotations" className="infoschematic-audit">`, drawn when `annotated || editing`. `annotated` is the Show tags toggle bound at `TitleBar.tsx:80`. It runs over every placeable and puts a badge at `layout.x + layout.width - badgeWidth - 4`, `layout.y + 5` — the top-right inset — except for an adapter, which is moved down into the rim below the card it clasps.

On any diagram that authors `card.identity`, those two land within a few pixels of each other on every Card, both saying the same thing.

Placement also disagrees by kind, and the disagreement is incidental rather than designed. A Card gets the top-right inset, which is exactly where its authored identity chip already is. An Adapter gets the bottom rim, for a stated and good reason: its top corners are beside the card it clasps. A Fabric gets the top-right inset too, which for a Fabric is outside its header band rather than inside it. A Flow gets neither — its code is placed mid-edge by `infoschematicAnnotationLabelPositions`, which is a different mechanism for a different geometry and is fine, but means "where the tag goes" has four answers and only one of them was decided.

The comment above the badge states the premise the placement rests on: _"On everything else the top right is clear and is where a reader looks."_ For a Card that authors its identity, the top right is not clear.

## Boundary

This is about the live Diagram's annotation layer: whether a code is drawn twice, and where each kind's code sits. It does not change what a code says, the Show tags control itself, the authored `card.identity` treatment or its default, the scene narrowing that already limits annotation to what a Scene lights, or the port dots drawn in the same layer. It does not extend always-on codes to kinds that cannot author one today, and it does not touch `render-svg` — both are `INFOSCHEMATICS-TOOL-095`.

## Current state

`ResolvedCardTreatment.identity` is resolved in `packages/view-model/src/appearance.ts:55` from `appearance.card.identity`, defaulting to `false`, and reduced out below a 0.6 render scale by `resolveResponsiveCardTreatment`. `card-layout.ts` turns it into a `CardIdentityPlacement` in the Card's top band, yielding to the stereotype where both cannot fit.

The audit layer has no access to that resolution. It reads `placeable.box` and `placeable.code` and nothing about what the element is already drawing. It does know one thing about kind — `register.byCode(placeable.code)?.wraps` tells it an adapter is clasping something — which is the only per-kind branch it makes.

Nothing in the suite asserts that a code appears once. The browser cases assert the badge exists when tags are on, which both renderings satisfy together.

## Steps

- [ ] Resolve, per placeable, whether that element is already drawing its own code, and carry that alongside the placeable rather than recomputing it in the annotation layer.
- [ ] Skip the audit badge for any placeable already drawing its code, so Show tags adds a code only where one is missing.
- [ ] Give the badge a single deliberate placement rule keyed on kind, with the Adapter's rim case expressed inside it rather than as a special case bolted onto a Card's rule, and correct the comment whose premise this change falsifies.
- [ ] Place a Fabric's badge against its header band rather than at the bare top-right inset, so it reads as belonging to the Fabric.
- [ ] Assert, in a browser case on a diagram that authors `card.identity`, that turning tags on leaves exactly one element bearing each code, and that turning them on for a diagram that does not author identity adds one.
- [ ] Assert the per-kind placement for Card, Adapter and Fabric so a future change to one cannot silently move the others.
- [ ] Render it with tags on and off and look at it: no overlap, no code twice, each kind's tag where the rule says.

## Files touched

- `packages/view-canvas/src/InfoschematicDiagram.tsx` — the identity group at `:2576` and the audit layer at `:2661`
- `packages/view-model/src/runtime.ts` — what a placeable reports about its own drawn code
- `packages/view-model/src/appearance.ts` or `card-layout.ts`, if the resolution is better read there
- `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx`
- `packages/view-model/src/runtime.test.ts`

## Verify

`bun run self:check`, then open the playground, turn Show tags on and off, and zoom a Card, an Adapter and a Fabric: each carries its code exactly once in both states, in the position its kind's rule states.

## Dependencies / blocks

None. `INFOSCHEMATICS-TOOL-093` was raised in the same pass and touches the Present panels rather than the Diagram. `INFOSCHEMATICS-TOOL-095` builds on the per-placeable "already drawing its code" resolution this item introduces, so landing this first makes that item smaller; it is a sequencing preference, not a build-order block, since `095` could introduce the same resolution itself.

## Documentation impact

### Decision Records

Likely one, small. "A viewer's tag toggle reveals a code that is not already drawn, rather than adding one unconditionally" is the rule this item establishes, and it is the rule `INFOSCHEMATICS-TOOL-095` will build on and that any future annotation surface will need to know. Decide during implementation whether it earns a record or belongs in the specification below; do not leave it only in a comment.

### Specifications

The routing-and-placement corpus governs where drawn things sit. A deliberate per-kind annotation placement is the kind of thing it states, and the current placement is stated nowhere, so this adds a requirement rather than changing one. Confirm the right document during implementation and give the new requirement a case rather than only prose.

### Guides

Check the Present-mode guidance for any sentence promising that Show tags adds a code to everything. If one exists it becomes untrue for elements that already carry theirs and must be reworded; if none does, no guide changes.

### Roadmap

`INFOSCHEMATICS-TOOL-095` is filed for the forward-looking half of the same report — permanent codes on every kind, and the static renderer agreeing with the live view about what a tag is.

## Discussion

### Why deduplication rather than moving one of the two

Moving the badge so both are visible would be a worse answer to the actual complaint: the code is not more useful twice, and a reader who authored an identity chip has already said where they want it. Suppressing the redundant one is also the rule the reporter stated — _"if there's already one, we don't need to add another one either."_

### Why the layer cannot currently know

The audit layer is deliberately geometric: it reads boxes and codes, and that independence is why a dragged card's badge tracks the card correctly after an earlier bug where the drag was folded in twice. Giving it a treatment lookup would reintroduce a dependency on resolution it was kept clear of. Carrying the answer on the placeable keeps the layer reading one thing per element, as it does now.

### The Adapter's rim is right and should survive

The adapter case is the one placement in the current code that was reasoned about: an adapter's top corners are beside the card it clasps, so its code goes in the rim along the bottom. That reasoning stays true. What changes is that it stops being an exception to a Card rule and becomes one entry in a rule that has an entry per kind.

### Flows are a different mechanism, not a fourth exception

A Flow's code is placed along its route by `infoschematicAnnotationLabelPositions`, because a Flow has no box to inset from. That is correct and is not folded into the placeable rule. It is recorded here only so a reader comparing the four kinds does not conclude the Flow was forgotten.
