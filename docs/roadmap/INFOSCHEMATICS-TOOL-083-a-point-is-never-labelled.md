---
id: INFOSCHEMATICS-TOOL-083
area: TOOL
title: A Point is never labelled
theme: rendering
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: 83fa1a84dafec4a67c99425501d74f3684741252
created_at: 2026-09-16T15:30:00Z
updated_at: 2026-09-16T16:49:00Z
---

# A Point is never labelled

## Goal

Decide whether a Point's authored label should be drawn, so a reader of a still image can tell what the dot on the diagram is.

## Context

Every Point carries a required `label` — `packages/domain-core/src/schema.ts:336` makes it mandatory, not optional. Neither renderer draws it. `packages/render-svg/src/index.ts:851-869` emits a `<title>` and a circle; the interactive Canvas does the same through `aria-label` and `<title>`. A title is reachable by a screen reader and, in some viewers, by hovering; it is not in the image.

Rendering the media pipeline seed shows the cost. `CAPTIONS`, labelled "Caption feed", draws as an amber ring at the foot of a Flow running up into the Packager. The Flow reads correctly, the dot reads as a deliberate terminus, and nothing on the page says what enters there. A Card in the same rendering carries its code chip, its classification and its title.

This predates `INFOSCHEMATICS-TOOL-063` — it is how the static renderer has always drawn a Point — so it is a treatment decision rather than a regression. The decision is not obviously "draw it": a Point is often an entry arrow's tail where the label duplicates what the Flow already says, and a text run beside a six-unit mark competes with the Flow label a few units away. The alternative is that a Point is deliberately anonymous and the Flow carries the meaning, in which case a required `label` is the wrong shape and the schema should say so.

## Boundary

`packages/render-svg` and `packages/view-canvas` treatment, or `packages/domain-core` if the answer is that the field should not be required. Both renderers change together or neither does — visual treatment parity is a root check.

## Steps

1. [ ] Settle the question: drawn label, or deliberately anonymous with the schema corrected to match.
2. [ ] If drawn, place it where it does not collide with the Flow label or the mark, and use the same type treatment a Card's label uses.
3. [ ] Apply it to both renderers in one change, and keep `scripts/visual-treatment-parity.test.ts` honest.
4. [ ] Render the media pipeline seed and look at it.

## Files touched

- `packages/render-svg/src/index.ts`
- `packages/view-canvas/src/InfoschematicDiagram.tsx`

## Verify

- `bun run self:check`.
- The rendered PNG of a document with a Point is legible without a pointer.

## Dependencies / blocks

None. Independent of `INFOSCHEMATICS-TOOL-082`.

## Discussion

Seen in the PNG rendered while verifying `TOOL-063`, which is the only reason it was noticed at all.
