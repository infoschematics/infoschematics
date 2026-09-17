---
id: INFOSCHEMATICS-TOOL-083
area: TOOL
title: A Point is never labelled
theme: rendering
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 9176ca615a66de3d70cf72a48037c4bb74941aa3
created_at: 2026-09-16T15:30:00Z
updated_at: 2026-09-17T07:35:00Z
---

# A Point is never labelled

## Goal

Decide whether a Point's authored label should be drawn, so a reader of a still image can tell what the dot on the diagram is.

## Context

Every Point carries a required `label` — `packages/domain-core/src/schema.ts:336` makes it mandatory, not optional. Neither renderer draws it. `packages/render-svg/src/index.ts:851-876` emits a `<title>` and a circle; the interactive Canvas does the same through `aria-label` and `<title>`. A title is reachable by a screen reader and, in some viewers, by hovering; it is not in the image.

Rendering the media pipeline seed shows the cost. `CAPTIONS`, labelled "Caption feed", draws as an amber ring at the foot of a Flow running up into the Packager. The Flow reads correctly, the dot reads as a deliberate terminus, and nothing on the page says what enters there. A Card in the same rendering carries its code chip, its classification and its title.

This predates `INFOSCHEMATICS-TOOL-063` — it is how the static renderer has always drawn a Point — so it is a treatment decision rather than a regression. The decision is not obviously "draw it": a Point is often an entry arrow's tail where the label duplicates what the Flow already says, and a text run beside a six-unit mark competes with the Flow label a few units away. The alternative is that a Point is deliberately anonymous and the Flow carries the meaning, in which case a required `label` is the wrong shape and the schema should say so. That option is the more invasive of the two, which is worth knowing before choosing it: three places interpolate `point.label` unconditionally into an accessible name — `render-svg/src/index.ts:865`, `view-canvas/src/InfoschematicDiagram.tsx:1850` and `:1869` — and `docs/specs/diagram-dynamics.md:75` holds the static renderer to an accessible-description test, so relaxing the field means supplying a fallback name in all three and touching the corpus.

Delivered against `ROUTE-020` rather than STATIC-004 as planned. The rule binds both renderers to one resolution, which is what the routing and placement requirements already say about Card internals and Region labels; stating it under static rendering would have left Canvas's half of the parity unwritten. No appearance requirement was added for the two new tokens: APPEAR-006 and APPEAR-009 already hold every shared visual value to the one manifest and its generated projection.

## Boundary

`packages/render-svg` and `packages/view-canvas` treatment, or `packages/domain-core` if the answer is that the field should not be required. Both renderers change together or neither does — visual treatment parity is a root check.

## Steps

1. [x] Settle the question: drawn label, or deliberately anonymous with the schema corrected to match.
2. [x] If drawn, place it where it does not collide with the Flow label or the mark, and use the same type treatment a Card's label uses.
3. [x] Apply it to both renderers in one change, and keep `scripts/visual-treatment-parity.test.ts` honest.
4. [x] Render the media pipeline seed and look at it.

## Files touched

- `packages/view-model/src/point-layout.ts`
- `packages/view-model/src/tokens.ts`
- `packages/render-svg/src/index.ts`
- `packages/view-canvas/src/InfoschematicDiagram.tsx`
- `packages/view-canvas/src/styles.css`

## Verify

- `bun run self:check`.
- The rendered PNG of a document with a Point is legible without a pointer.

## Dependencies / blocks

None. Independent of `INFOSCHEMATICS-TOOL-082`.

## Documentation impact

### Specifications

Either answer touches the corpus, which is part of why this is a decision rather than a fix. If the label is drawn, STATIC-004 (`docs/specs/static-rendering.md:37`) is the requirement that owns label placement through the shared View Model resolvers, and it gains the Point's label and its placement rule; `docs/specs/appearance.md` gains the token if a new one appears. If a Point is deliberately anonymous, the required field is the wrong shape: `docs/specs/authoring.md` AUTHOR-001 (`:7`) governs authored identity, and DYNAMIC-004's evidence line (`docs/specs/diagram-dynamics.md:75`) holds the static renderer to an accessible-description test that today leans on the label being present.

### Decision Records

Likely, and more so for the anonymity answer than the drawn one. Drawing a label is treatment and belongs in the requirement; making a required field optional changes what a document must carry, which is the kind of contract change the decision records exist for.

### Guides

`apps/site/content/authoring.md` describes what a Point is for. If the label is drawn it gains a sentence; if the field becomes optional it gains a stronger one, because an author currently has no way to know the label they are obliged to write is never shown.

## Batch exclusion

Excluded from `INFOSCHEMATICS-BATCH-018` on 2026-09-16. Step 1's second option — a Point is deliberately anonymous and `label` stops being required — is a public contract change to the document schema, with three unconditional interpolations and a spec evidence line behind it. The drawn-label option is ordinary treatment. An autonomous run must not choose between a treatment change and a schema relaxation.

## Discussion

Seen in the PNG rendered while verifying `TOOL-063`, which is the only reason it was noticed at all.

## Review packet

### Delivered

A Point's authored label is drawn beside the mark in both renderers, on a side no Flow leaves by. The side, the position and the anchor are resolved once in `packages/view-model/src/point-layout.ts`; `ROUTE-020` states the rule.

### Summary of changes

`resolvePointLabel` takes the Point and the Flows that reach it and returns the line's visual centre, the anchor it is drawn with, and the side chosen. The side comes from each Flow's neighbouring route point rather than from the author, so a label never lies over the route its Point terminates; `below`, `above`, `right`, `left` is the preference order, and a Point boxed in on all four sides still takes `below` rather than losing its label. No text is measured, as `ROUTE-018` requires, which is why the anchor travels with the position instead of a width being estimated to turn an edge into a centre. `pointLabelGap` and `pointLabelHeight` join `visualTokens.canvas.geometry`, so the clearance and the line box are stated once for both renderers and projected into the generated stylesheet.

Step 1 was settled as "drawn" rather than relaxing the schema. The required field had no reader in a still image and no author could have known that; drawing it costs one resolver and two call sites, where relaxing the field removes information the document already carries and rewrites three accessible names and a corpus evidence line for it.

### Verification

`bun run self:check` — 45 of 45 tasks successful. `bun run self:scripts:test` — 15 files, 89 tests green, including the extended Point parity case, which now asserts the class, anchor, position and text in both renderings rather than only the mark.

Rendered and looked at, which is the only evidence that matters here: `apps/site/src/playground/seeds/media-pipeline.yaml` through `bun run self:examples:render … --png` puts "Caption feed" below the amber mark, clear of the Flow that runs up into the Packager — the omission this item was raised for. A hand-authored document with a Point reached from the left, the right and above put its label below, and a Point left upward by its only Flow put its label above.

### Outstanding concerns

Canvas's own paint was checked by rasterising its markup with the stylesheet inlined, which confirms the geometry and that the three custom properties the rule reads resolve, but `rsvg-convert` does not apply custom properties, so the label's colour on a blueprint surface is verified by var name rather than by eye in a browser. A browser case reading the resolved fill is the honest check and is test work.

The type treatment is a Card label's family and weight at the metadata size rather than the Card size, because a Point's label sits beside a six-unit mark and not inside a box. That is a judgement, not a measurement.

### Post-change review

The schema made the field required, three call sites read it for an accessible name, and every gate was green — so nothing in the repository could tell that the one reader who needed it, someone looking at the picture, never got it. A required field with no drawn consequence is the same shape of defect as a lifecycle line nothing reads.

### Mini recap

One resolver, two call sites, two tokens, one requirement; the label a Point was always obliged to carry is now in the image.
