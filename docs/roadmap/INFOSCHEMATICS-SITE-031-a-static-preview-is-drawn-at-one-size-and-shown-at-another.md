---
id: INFOSCHEMATICS-SITE-031
area: SITE
title: A static preview is drawn at one size and shown at another
theme: site
horizon: soon
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-19T11:58:00Z
updated_at: 2026-09-19T11:58:00Z
---

# A static preview is drawn at one size and shown at another

## Goal

Make a docs specimen read the same whether a reader meets it in Rendered or in Design, so the mode a reader arrives on is not the weaker drawing.

## Context

Found by user-acceptance testing on 2026-09-19, and carried out of `INFOSCHEMATICS-SITE-030` where the comparison was made. The reported judgement was that switching a specimen to Design looked closer to the intended reading than Rendered, which is the mode a page opens on.

Put side by side on the Cards specimen, the two modes differ in three ways. Design draws the canvas boundary as a visible edge and Rendered does not. Design carries the viewport controls, which is correct and not at issue. And Design's grid is crisper: Rendered is a fixed-size drawing produced by `renderInfoschematicSvg` and handed to an `img`, which scales it to whatever width the preview box has, so a one-unit grid line arrives below a device pixel and a stroke thins with it. The live view is laid out at the size it is shown and keeps its strokes.

The third is the substance of the report. It is Site-owned — Site chooses the size it renders at and the box it shows the result in — but it is not a treatment defect in any renderer, and no authored specimen is wrong.

## Boundary

This is about how Site produces and presents a static preview, not about what either renderer draws. It does not change the authored specimens, the visual language, the Design mode's editing affordances, or the viewport controls. It does not propose removing the Rendered mode: the static drawing is what `infoschematics render` produces and a reader should be able to see it.

## Shaping

The approach most likely to settle it is to render the static preview at the size it will be displayed rather than at the specimen's authored bounds, which means Site measuring the preview box and passing that through — a resize observer or a fixed set of breakpoint widths, rather than one drawing reused at every width.

The cheaper alternative is to accept the scaling and compensate for it: ask the renderer for a grid and stroke weight expressed in output pixels rather than canvas units. That is a renderer-level request and would land against `render-svg` instead, so the choice between the two decides which package owns the work.

Known dependency: none. The decision still needed is which of those two the product wants, and that turns on whether a static drawing is expected to hold up at arbitrary display sizes at all. Promotion condition: that question answered, since the two answers do not share an implementation.

## Discussion

### Why this is not simply a Site stylesheet fix

`INFOSCHEMATICS-SITE-030` removed the letterboxing that made previews look wrong, and the two modes now occupy the same box at the same height. What remains is entirely about resolution: the same vector drawing, scaled. No arrangement of the box changes it, which is why it left that record rather than being absorbed into it.

### The canvas edge

Design's visible canvas boundary is a smaller difference and may be deliberate — an editing surface has an edge the reader can drag against, a published drawing does not. It is recorded here so the comparison is complete, not because it is presumed wrong.
