---
id: INFOSCHEMATICS-SITE-030
area: SITE
title: Specimen previews do not say what they depict
theme: site
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: c4acb5452e6ddeeeb1f549b34a3270e39d80571d
created_at: 2026-09-19T11:30:00Z
updated_at: 2026-09-19T11:55:00Z
---

# Specimen previews do not say what they depict

## Goal

Bind every specimen caption to the specimen it names, so a reader comparing a grid of variants can tell which label belongs to which drawing without counting.

## Context

Found by user-acceptance testing on 2026-09-19, on the docs component pages for Regions and Fabrics. The reported symptom was that "it's not clear which ones these are talking about" when reading a grid of labelled variants.

The frames say why, and it is spacing rather than wording. In the Fabrics grid each caption sits roughly 115px below its own drawing and roughly 115px above the next row's, so a caption is equidistant between the thing it describes and the thing it does not. A reader has no proximity cue to resolve it, and the only remaining cue — that a caption belongs to the figure above rather than below — is a convention the layout does nothing to reinforce.

Two further observations were made in the same pass and are carried here because they are about the same previews. The Fabric shapes were judged worse than the equivalents prepared for IBC. And switching a specimen to Design was judged closer to the intended reading than Rendered, which is the mode a reader meets first.

## Boundary

This changes how a preview binds its caption to its drawing, and pursues the two reported treatment gaps only as far as evidence supports. It does not change the property controls, the snippet, or where the specimen's own controls sit — that is `INFOSCHEMATICS-SITE-029`. It does not change the authored specimens' content, add or remove variants, or alter any renderer: a treatment defect traced into `render-svg` or `view-canvas` earns its own record against the owning package rather than being fixed from Site.

## Current state

`DemoFrame` draws each variant as a `figure` with a `figcaption`, in a `demo-frame__preview--variants` grid. The drawing is sized by `height: clamp(180px, 32vw, 360px)` and is `object-fit: contain`, so a wide, short specimen floats in the middle of a tall box and leaves most of that height as empty space above and below it. The caption is then separated from it by a full-width top border, which reads as a divider between cells rather than as an attachment to the figure above.

The shapes claim is not yet evidenced. `scripts/fixtures/ibc-2026-visual-baseline.json` holds hashes, not reference art, so nothing in this repository can be rendered and put beside the current Fabric drawings for comparison. The Rendered versus Design claim is reproducible from the pages themselves.

## Steps

- [x] Tighten the binding between caption and drawing so proximity resolves it: close the gap the contain-fit leaves, and stop the caption reading as a cell divider.
- [x] Confirm the result on the Fabrics and Regions grids at the widths where the grid reflows, including the single-column case where figures stack and a caption gains a figure directly beneath it.
- [x] Compare Rendered against Design on the same specimen and record what differs, then close whichever part is Site-owned presentation.
- [x] Put the Fabric shape comparison back to the owner with the current drawings rendered, since no IBC reference art exists in this repository to judge against.
- [x] Assert the caption binding in the Site cases, and render the pages and look at them — a passing assertion is not evidence the grid reads correctly.

## Files touched

- `apps/site/src/visual-guide/DemoFrame.css`
- `apps/site/src/visual-guide/DemoFrame.browser.test.tsx`

## Verify

`bun run self:check`, and read the Fabrics and Regions pages in a browser at a wide and a narrow width: each caption must sit unambiguously with its own drawing, including where the grid has reflowed to one column.

## Dependencies / blocks

None. `INFOSCHEMATICS-SITE-029` touches the same pages but not these elements.

## Documentation impact

### Decision Records

None expected. If the Rendered and Design comparison turns up a deliberate difference worth preserving, it belongs in the existing visual language guidance rather than a new record.

### Specifications

None expected. Caption proximity is Site-owned presentation of a preview. If the shape comparison traces a defect into a renderer, that record carries its own specification impact rather than this one.

### Guides

Possible. `docs/design/visual-language.md` is the home for anything the Rendered and Design comparison settles about how a specimen should read.

### Roadmap

`INFOSCHEMATICS-SITE-031` is filed for what step 3 turned up: Rendered and Design differ because the static preview is a fixed-size drawing scaled into a smaller box, which is Site-owned but outside this Boundary. The Fabric shape comparison of step 4 is back with the owner and has produced no record, because the judgement it needs cannot be made here.

## Review

### Delivered

Every Step. A caption now sits inside a bordered enclosure with the drawing it names, and each variant is only as tall as its own drawing. Steps 3 and 4 delivered the evidence and the question they were shaped to produce rather than a change.

### Summary of changes

Three rules in `DemoFrame.css`. A variant's drawing keeps its own aspect instead of being letterboxed inside a fixed `clamp(180px, 32vw, 360px)` box, which removes the dead band that put a caption as far from its own drawing as from the next one. Each variant is drawn as a bordered, rounded enclosure separated by a 10px gap, so the caption is bound to its drawing by containment rather than by proximity alone — proximity could not carry it, because the slack inside a specimen's own authored canvas is not Site's to remove. Images also anchor to the foot of their box, which still matters for a single captioned preview that keeps the fixed height.

The content-sizing rule covers the live `Canvas` as well as the static image, so the Dynamics page — which mounts the same grid class with its own markup — loses the same dead band. That page was not in the reported symptom but shares the rule, and leaving it half-treated would have meant one grid reading two ways.

### Verification

`bun run self:check` — 48 of 48 tasks successful. Fabrics at 1280px and 560px, Graphics, Dynamics, Cards in both modes, and Regions were rendered from a dev server and read; the frames are in `tmp/site-030/`.

### Outstanding concerns

`object-position: center bottom` is no longer the mechanism for a variant grid, because a content-sized box has no slack to anchor within. It is kept for the single-preview path, which still carries a fixed height, and no case exercises it there — a reader should not take it for a guarded rule.

The Regions page turned out to have no variant grid at all: one uncaptioned preview. The reported symptom is reproducible on Fabrics and Graphics, and the Regions half of the report is presumed to be the same grid met on a neighbouring page.

### Post-change review

Both assertions were proved to bite by removing the rule each one guards and watching the case fail — the aspect assertion reported 180 against an expected 142. This mattered: an earlier version of the same assertion passed with the rule removed, because the narrow test container made the fixed height coincide with the content height.

### Mini recap

Proximity alone could not bind the caption, because the empty margin belongs to the specimen's authored canvas rather than to Site's box. Containment does, and content-sizing removes most of the distance anyway.

## Discussion

### What is determinable now and what is not

The caption binding is a layout defect with a visible cause and a testable fix, and it is the whole of the reported symptom. The other two are weaker: "Design reads closer to intended" is reproducible but does not by itself say which mode should change, and the Fabric shape judgment rests on a comparison this repository cannot perform, because the IBC baseline is a hash manifest rather than art. Steps 3 and 4 are therefore shaped to produce evidence and a question rather than to promise a change.

### Why not simply move the caption above the figure

It would resolve the ambiguity and is tempting for that reason. It is rejected because a caption under its figure is the convention every other figure on the site follows, and inverting it on one component's grid trades one confusion for a smaller, subtler one. The cause here is dead space inside the figure, not the caption's side of it.

### What Rendered and Design actually differ by

Put side by side on the Cards specimen, three differences show. Design draws the canvas boundary as a visible edge and Rendered does not, so the blueprint field bleeds to the enclosure in one and is framed in the other. Design carries the viewport controls. And Design's grid is crisper: the static preview is a fixed-size drawing scaled down to fit, so its strokes scale with it and a one-unit grid line arrives below a device pixel, while the live view is laid out at the size it is shown. The third is the whole of "Design reads closer to intended", and it is a consequence of how the preview is produced rather than a treatment choice — which is why it left this record as `INFOSCHEMATICS-SITE-031` rather than being fixed here.

### Why containment rather than proximity alone

The first attempt anchored each drawing to the foot of its box so all the slack fell above it. It measured correctly and still read wrong: a specimen's authored canvas carries its own margin around the artefact, so the ink stayed about as far from its caption as from the next drawing down even with the box slack removed. That margin is authored content this record's Boundary refuses to touch. Containment resolves the binding without reaching into the specimen, which is why the figure gained a border rather than the caption gaining a tighter gap.
