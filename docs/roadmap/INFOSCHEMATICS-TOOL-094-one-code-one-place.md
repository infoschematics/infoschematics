---
id: INFOSCHEMATICS-TOOL-094
area: TOOL
title: One code, one place
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: dd49faa45de805b112c01e39b264532ea6fb12b1
created_at: 2026-09-19T12:12:00Z
updated_at: 2026-09-19T12:40:00Z
---

# One code, one place

## Goal

Draw an element's code in one place, whoever turned it on. A code an author asked for and a code a reader asked for are the same string about the same element, so switching the reader's control should not move it, and should not stack a second copy beside the first.

## Context

Found by user-acceptance testing on 2026-09-19. The report, verbatim: _"when the tags are present on the cards like they are here… that looks really good. But if I then turn on the annotations or tags as it is… it's not displayed in the same place… and obviously if it already has one, we don't need to add another one either."_

The complaint as stated is placement, and the duplication is the form the placement disagreement takes on a Card. `tmp/uat-1134/zoom-card01-tags.png` shows it: the authored chip's pink rounded rect with the annotation badge's blue one over it, offset up and to the right, the chip's own `CARD-01` just visible behind the badge's.

Two independent renderings of `placeable.code` existed in `InfoschematicDiagram.tsx`, and neither knew about the other.

The first is the Card identity chip — `<g className="infoschematic-card-identity">` — placed in the Card's top band by `card-layout.ts` from `appearance.card.identity`, which the showcase authors. The second is the audit badge inside `<g aria-label="Infoschematic annotations">`, drawn when `annotated || editing`; `annotated` is the Show tags toggle bound at `TitleBar.tsx:80`. It ran over every placeable and put a badge at the top-right inset, except for an adapter, which is moved into the rim below the card it clasps.

The two rules differ by small amounts, which is what makes the result look like a mistake rather than a design. For `CARD-01`: the chip is `width 59.5` at `x = box.width − 59.5 − 8`, `y = 8`; the badge is `width 56` at `x = box.width − 56 − 4`, `y = 5`. The widths come from different estimates — `identityWidth` is `max(42, length × 6.5 + 14)` and `annotationLabelWidth` is `max(56, ceil(length × 9 × 0.62 + 9 × 1.75))` — so they diverge with the code: `MSF-SC-TM-ASSEMBLY` measures 131 as a chip and 117 as a badge.

Why this reads as intermittent: `resolveResponsiveCardTreatment` withholds the identity chip below a 0.6 render scale, so a fitted playground view of the 1680×1180 showcase draws no chips at all and the badge is the only code on the surface. The defect appears once a reader zooms in far enough for the chip to return — which is exactly the state the reporter was in.

## Boundary

This is about where the live Diagram draws a code and how many times. It does not change what a code says, the Show tags control itself, the authored `card.identity` treatment or its default, the responsive reduction, the scene narrowing that limits annotation to what a Scene lights, or the port dots drawn in the same layer. It does not give any kind a permanent code it cannot author today and does not touch `render-svg` — both are `INFOSCHEMATICS-TOOL-095`. It does not restate the Adapter's rim placement or move a Fabric's badge: neither was reported and neither is in disagreement with a second rendering.

## Current state

`ResolvedCardTreatment.identity` resolves in `packages/view-model/src/appearance.ts` from `appearance.card.identity`, defaulting to `false`, and is reduced out below a 0.6 render scale by `resolveResponsiveCardTreatment`. `card-layout.ts` turns it into a `CardIdentityPlacement` in the Card's top band, yielding to the stereotype where both cannot fit.

The Card loop resolved its own layout through `resolveCardLayout`. The audit layer had no access to that resolution: it read `placeable.box` and `placeable.code` and nothing about what the element was already drawing. It did know one thing about kind — `register.byCode(placeable.code)?.wraps` tells it an adapter is clasping something — which was its only per-kind branch.

Nothing in the suite asserted that a code appears once. The browser cases assert the badge exists when tags are on, which both renderings satisfy together.

## Steps

- [x] Resolve each drawn Card's internals once, above the Card loop, asking for the identity chip whether or not it was authored — the flag only adds the chip's slot to the result and changes nothing else about the layout, so the answer is free and tells the annotation layer where a Card's code belongs.
- [x] Have the audit badge take that slot where the element has one, so a code a reader turns on lands exactly where a code an author turns on would have.
- [x] Withhold the badge for any placeable already drawing its own code, so Show tags reveals a code where one is missing rather than adding one unconditionally.
- [x] Keep the Adapter's rim case as it is, and correct the comment whose premise — _"On everything else the top right is clear"_ — this change makes true rather than leaves false.
- [x] Assert, on a document that authors `card.identity`, that turning tags on leaves each Card's code drawn once and the uncoded elements annotated as before; and assert the badge's box against the chip's, so a future change to either rule cannot separate them again.
- [x] Render it at a zoom where the chips are drawn, with tags off and on, and look at it.

## Files touched

- `packages/view-canvas/src/InfoschematicDiagram.tsx` — `cardText` and `selfCoded` at `:779`, the Card loop's use of them, and the audit layer's slot at `:2725`
- `packages/view-canvas/src/InfoschematicDiagram.editing.test.tsx`
- `docs/specs/routing-and-placement.md` — ROUTE-021

## Verify

`bun run self:check`, then open the playground, zoom until the Card identity chips are drawn, and turn Show tags on and off: each Card carries `CARD-nn` exactly once in both states and in the same place in both, while a Flow and an uncoded element gain their tags as before.

## Dependencies / blocks

None. `INFOSCHEMATICS-TOOL-093` was raised in the same pass and touches the Present panels rather than the Diagram. `INFOSCHEMATICS-TOOL-095` builds on the per-placeable "is this element already drawing its code" resolution this item introduces, so landing this first makes that item smaller; it is a sequencing preference, not a build-order block.

## Documentation impact

### Decision Records

None. The rule this establishes is a placement requirement about one drawn thing, which the Specifications corpus already governs and states in the same terms as the neighbouring Card-layout requirements. A decision record would restate ROUTE-021 with less precision and no verification.

### Specifications

ROUTE-021 added to `docs/specs/routing-and-placement.md`, beside ROUTE-016's requirement that both renderers consume one Card resolution rather than placing Card text independently. It states that a viewer's tag takes the place the code is already drawn and is withheld where the element already carries it, and that an element whose chip is withheld is annotated as any uncoded element is.

### Guides

None. No guide or Site page mentions Show tags — the only occurrences of the phrase in the repository are in these roadmap records — so nothing written becomes untrue.

### Roadmap

`INFOSCHEMATICS-TOOL-095` carries the forward-looking half of the same report: permanent codes on kinds that cannot author one, and the static renderer agreeing with the live view about what a tag is.

## Review

### Delivered

Every Step, within the stated Boundary. Baseline `dd49faa45de805b112c01e39b264532ea6fb12b1`.

The record was rewritten before delivery. It was first filed as "Tags draw twice", built on the screenshot alone; reading the reporter's own words in `tmp/uat-1134/audio.txt` put the placement disagreement first and the duplication second, as a consequence. Two Steps filed under the old framing were dropped rather than done: a per-kind placement rule keyed on kind, and moving a Fabric's badge into its header band. Neither was reported, and the fix as delivered removes the disagreement without a placement vocabulary that nothing yet needs. They are not carried forward; if a Fabric's badge reads wrong, that is a finding to raise from looking at one.

### Summary of changes

`InfoschematicDiagram.tsx` resolves every drawn Card's layout once into `cardText`, above the layout effect, with `identity: true` forced so the chip's slot is always known. `resolveCardLayout`'s `identity` flag affects only the returned `identity` field — `usable` is `box.width − inset × 2` regardless, and label, stereotype and description placement never read it — so asking for the slot costs nothing and changes no other geometry. The Card loop reads its layout from that map and masks the chip back off where the treatment did not ask for it. `selfCoded` collects the codes whose Cards actually drew a chip, and the audit layer filters those out and places what remains at the chip's slot where the element has one.

An Adapter keeps the rim, unconditionally: `slot` is `null` where `held` is set, before the map is consulted.

### Verification

`bun run self:check` — see the run below. `packages/view-canvas` suite: 92 cases, green.

Live, against the playground at one zoom step, with 5 identity chips drawn: annotation badges fall from 9 to 4, and `tmp/tool-094/zoom-tags.png` shows `CARD-01` drawn once, in the authored chip's border, with `FLOW-01` still annotated. `tmp/uat-1134/zoom-card01-tags.png` is the same view before the change.

The dedup case was proved non-vacuous by its own construction: it asserts the annotated codes are exactly `['SYS-001']` with an authored chip and all three of `['SYS-001', 'SYS-002', 'SYS-003']` without one, so a fix that suppressed too much or too little fails it in opposite directions.

### Outstanding concerns

None blocking. One pre-existing case, `'sizes annotation badges so they contain long element Flow codes'`, asserts `width="117"` for `MSF-SC-TM-ASSEMBLY` and still passes: its Cards are 120 wide, and a 131-wide chip needs `131 + 8 × 2 ≤ 120` to be placed, so `identityPlaced` is false, there is no slot, and the badge keeps its own inset and its own width estimate. The assertion still measures what it was written to measure — that a badge contains its code — and the new rule is simply not reached on a box that small. That is the behaviour ROUTE-021 states for a withheld chip, not an escape from it.

### Post-change review

The Goal is met and the change is confined to one component. The risk is that the badge now inherits the chip's width estimate on any Card that places one, so two estimates that used to be independent now agree only because one is used: `annotationLabelWidth` is still the estimate for everything else, and a future change to either alone would show up as the two rules diverging again on some Cards and not others. ROUTE-021's verification asks a reader to switch the control and check the code does not move, which is what would catch that.

The responsive reduction remains the reason this is easy to miss: at a fitted view no chip is drawn, so every Card is annotated and the change is invisible. Acceptance needs the zoom the Verify line asks for.

### Mini recap

A code an author turned on and a code a reader turned on were placed by two different rules, a few pixels apart, so on a zoomed Card they overlapped and the code appeared to move when the control was switched. The Card's own layout is now resolved once and the annotation layer uses it: the tag takes the chip's slot, and is withheld where the Card already drew the chip. The record itself was rewritten first — the original framing was duplication, and the reporter's words put placement first.

## Discussion

### Why deduplication falls out rather than being the fix

The instinct on seeing the screenshot is to suppress one of the two rects. But suppression alone would leave the two rules in place, so a Card whose chip is withheld — a small box, a reduced scale — would still put its tag somewhere the chip would not have. Making the annotation take the chip's slot answers the reported complaint directly, and once the slot is known, the element already drawing there is obvious and the second copy has nowhere to be. One resolution, two consequences.

### Why the layer can know this without losing what it was kept clear of

The audit layer is deliberately geometric: it reads boxes and codes, which is why a dragged card's badge tracks the card correctly after an earlier bug where the drag was folded in twice. It still reads one thing per element — a resolved slot, already in the Card's local coordinates, looked up by code. It does not resolve treatment, ask the register what kind an element is beyond the `wraps` check it already made, or recompute anything the Card loop computes.

### Why the chip's slot is asked for even when it is not drawn

`resolveCardLayout` is called with `identity: true` unconditionally, and the Card loop masks the result off where the treatment did not ask for it. This is safe because the flag is inert for everything else in the layout — no other band's placement reads `identityPlaced`, and `usable` does not narrow. The alternative is resolving twice, or threading a second "where would the chip have gone" result through, both for an answer the one call already gives.

### Flows are a different mechanism, not an exception

A Flow's code is placed along its route by `infoschematicAnnotationLabelPositions`, because a Flow has no box to inset from. That is untouched and is not folded into the placeable rule — a Flow draws no code of its own, so it has nothing to agree with. It is recorded here only so a reader comparing the kinds does not conclude it was forgotten.

### What the first filing got wrong

The record was written from `tmp/uat-1134/zoom-card01-tags.png` and titled "Tags draw twice", and a later probe of the fitted playground found no identity chips at all and every code annotated exactly once, which looked like the premise being false. Both readings were partial. The chips are withheld below a 0.6 scale, so the fitted probe was measuring a state the reporter was never in; at the reporter's zoom, both renderings are present and the screenshot means what it appears to mean. The lesson is in the record because the measurement that looked like a refutation was taken under a different treatment from the one being reported on.
