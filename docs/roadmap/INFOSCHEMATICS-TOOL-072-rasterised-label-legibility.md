---
id: INFOSCHEMATICS-TOOL-072
area: TOOL
title: Rasterised label legibility
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-16T12:40:00Z
updated_at: 2026-09-16T16:49:00Z
---

# Rasterised label legibility

## Goal

Keep a Region label readable in rasterised output, rather than letting Flow routes run through the letters.

## Context

Found beside the arrowhead defect (`INFOSCHEMATICS-TOOL-071`) while rendering `examples/is-infoschematics/infoschematic.yaml` to PNG on 2026-09-16 and looking at it. The right-aligned Region label "VIEW AND RENDERER PACKAGES" reads as "IEW ND RENDERER PACKAGES": two Flow routes cross the glyphs and erase parts of them.

The cause is understood and is not a layout bug. resvg and a browser measure text differently, so a right-aligned label starts at a different x in each, and [ADR-INFOSCHEMATICS-024](../decisions/ADR-INFOSCHEMATICS-024-rasterise-with-resvg.md) already documents host-font-stack variance as an accepted cost of the engine. What the decision did not anticipate is that the variance moves a label into a Flow route rather than merely shifting it, so the accepted cost lands as unreadable output.

This is a separate concern from arrowhead orientation and must not be folded into it: one is a wrong attribute with a correct fix, this is a question about whether label placement may depend on measured text at all.

## Boundary

Diagnosis and a recommendation first. This item does not presume a fix, does not revisit the engine choice, and does not change arrowhead orientation.

## Steps

1. [ ] Measure the actual difference: render the same document through both engines, extract each Region label's resolved x, and record the deltas. Verifiable by the recorded numbers.
2. [ ] Establish whether any Flow route may legitimately occupy a Region label's band, or whether the label band should be reserved in layout regardless of measurement. Verifiable by a statement against the governing requirement in `docs/specs/`.
3. [ ] Recommend one of: reserving the band in the view model so no measurement can move a label into a route; pinning the font so both engines measure alike (`--font` already exists in the command line); or painting the label over an opaque backing. State the cost of each. Verifiable by the recommendation naming its consequence for existing rendered bytes.
4. [ ] Whatever is chosen, prove it by rendering and looking, and keep the before and after side by side.

## Files touched

To be determined by step 3. Candidates: `packages/view-model/src` for layout reservation, `packages/render-svg/src/index.ts` and `packages/view-canvas/src/InfoschematicDiagram.tsx` for painted backing, `docs/guides/` for a pinned-font instruction.

## Verify

Rendering and looking is the whole point of this item: every Region label legible in both engines at the widths the repository renders, with the two outputs kept side by side. Plus `bun run self:examples:verify` for any change to rendered bytes, and `bun run self:check`.

## Dependencies / blocks

None hard. Sequence after `INFOSCHEMATICS-TOOL-071` so the two visual findings are not diagnosed through the same broken render.

## Documentation impact

### Decision Records

Possible, if the answer is that label placement may not depend on measured text: that amends what `ADR-INFOSCHEMATICS-024` treats as an acceptable consequence of font variance.
