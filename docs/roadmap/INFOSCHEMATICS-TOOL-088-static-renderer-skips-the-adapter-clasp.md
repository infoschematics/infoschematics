---
id: INFOSCHEMATICS-TOOL-088
area: TOOL
title: The static renderer does not draw the Adapter Card clasp
theme: rendering
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-17T10:55:00Z
updated_at: 2026-09-17T11:05:00Z
---

# The static renderer does not draw the Adapter Card clasp

## Goal

Draw an [Adapter Card](../reference/vocabulary.md#adapter-card) in `packages/render-svg` the way the interactive Canvas draws it, so a still rendering of a document that composes one shows a clasp rather than one Card sitting on top of another.

## Context

Found by hand while authoring `examples/is-showcase/` for `INFOSCHEMATICS-TOOL-087`, which is the first authored document in the repository to carry `adapts:` or `wraps:` at all.

Nothing is missing from the data, and no new notation has to be designed. `wraps` is already resolved onto every runtime card (`packages/view-model/src/runtime.ts:262`, where `adapts` and `wraps` collapse into one field), `adapterBoundsFor` derives the clasp box from the held Card (`packages/view-model/src/assembly.ts:8`), and `roundedOutline` is already a shared View Model primitive. The interactive Canvas assembles the clasp from exactly those three: eight corners — out along the left arm, down into the notch, up the right arm, round the bottom — traced as one outline at `packages/view-canvas/src/InfoschematicDiagram.tsx:2398`, so nothing the adapter paints passes under the Card it holds.

What the static renderer lacks is the consumption. `packages/render-svg/src/index.ts:748` loops every card and emits a `<rect>`, with no branch on `wraps`; the string `adapt` does not appear in the file. So an Adapter Card is drawn as an ordinary opaque rectangle over the lower half of the Card it holds. Three things are wanted, and the first is where the duplication would otherwise be:

1. The eight-corner list belongs beside `adapterBoundsFor` in View Model, not inside a Canvas component, so both renderers trace one shape.
2. `render-svg` branches on `card.wraps` and emits that outline as a `<path>` rather than a `<rect>`.
3. The adapter's own label goes in the footer band below the notch — Canvas puts it at `held.y + held.height + adapterFloor / 2 + 5` (`InfoschematicDiagram.tsx:2458`) — instead of centred in the box.

The third is what makes the defect visible. A non-compact Card centres its label at very nearly the y the clasp's top sits on, so the held Card's label is painted over by the adapter's fill, and no per-Card override or transparent adapter fill is authorable. `examples/is-showcase/infoschematic.yaml` sets `diagram.appearance.card.compact: true` for that reason alone, which means the document is working around the defect rather than showing the notation.

A second divergence is in the same place and should be settled with it: the two renderers do not agree on where an Adapter Card is. Canvas reads the derived clasp box from the placeables and ignores the adapter's authored `bounds` entirely; `render-svg` reads `runtime.infoschematicCards[].bounds`, which is the authored box (`runtime.ts:253`). They agree in the showcase only because `ADPT-01` is authored as `860 220 260 120`, which is exactly `adapterBoundsFor(CARD-03)`; any other authored box and the two renderers place the same Adapter Card in two different positions. Either the authored bounds are ignored by both — in which case the field is misleading on an Adapter Card and the contract should say so — or they are honoured by both.

## Boundary

`packages/render-svg` treatment, and whatever it needs from `packages/view-model` to resolve the notched outline once for both renderers rather than twice. Visual treatment parity is a root check, so the shape both renderers draw has to be the same shape. This does not change `adapterBoundsFor`, the composition semantics, or which Card a Flow attaches to.

## Steps

1. [ ] Move Canvas's eight-corner clasp outline into View Model beside `adapterBoundsFor`, and have Canvas consume it, so the shape is stated once.
2. [ ] Branch on `card.wraps` in `packages/render-svg/src/index.ts:748` and emit that outline as a `<path>` instead of a `<rect>`.
3. [ ] Place the adapter's label in the footer band below the notch, as Canvas does, rather than centred in the clasp box.
4. [ ] Settle which box an Adapter Card actually has — derived in both renderers, or authored in both — and make the losing reader agree.
5. [ ] Extend `scripts/visual-treatment-parity.test.ts` to hold both renderers to the clasp, as it does for a Point's label.
6. [ ] Render a document with a held non-compact Card and read its label, then drop `card.compact` from the showcase if it is only there for this.

## Files touched

- `packages/render-svg/src/index.ts:748` — the card loop, which emits a `<rect>` with no branch on `wraps`
- `packages/view-model/src/assembly.ts` — where the shared clasp outline belongs, beside `adapterBoundsFor`
- `packages/view-canvas/src/InfoschematicDiagram.tsx:2398` — the reference treatment, consuming the shared outline instead of assembling it
- `scripts/visual-treatment-parity.test.ts` — parity for the clasp
- `examples/is-showcase/infoschematic.yaml`, `examples/is-showcase/README.md` — if the `compact` workaround can be dropped

## Verify

`bun run self:examples:render examples/is-showcase/infoschematic.yaml --png` with `card.compact` removed, and read the held Card's label; `bun run self:scripts:test` for parity; both renderers side by side.

## Dependencies / blocks

None. Independent of `INFOSCHEMATICS-TOOL-089`.

## Documentation impact

### Specifications

`docs/specs/composition.md` owns the composition rules and `docs/specs/static-rendering.md` the static renderer's obligations; one of them has to say that an Adapter Card is drawn as a clasp in both renderers, because today nothing requires the static renderer to draw the notation at all.

### Decision Records

Only for step 4. Tracing one shared outline in both renderers is treatment parity with a settled Canvas treatment. Deciding that an Adapter Card's authored `bounds` are ignored — or that they are honoured and the clasp stops being derived — changes what a document's field means.

### Guides

`apps/site/content/authoring.md` describes composing an Adapter Card; it may be worth saying that a held Card's detail is drawn above the clasp.

## Discussion

The showcase was authored to make capabilities visible, and the first thing it made visible was a capability one renderer does not draw — which is the argument for `AUTHOR-017` rather than against it.

Reviewed on 2026-09-17 against the expectation that `render-svg` would simply use the same data. It nearly does: the field, the derived box and the outline primitive are all shared already, and this is the static renderer failing to consume them rather than a notation needing to be designed twice. The record was reworded to say so, and the authored-versus-derived position divergence was found while checking it.
