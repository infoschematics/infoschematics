---
id: INFOSCHEMATICS-SITE-030
area: SITE
title: Specimen previews do not say what they depict
theme: site
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-19T11:30:00Z
updated_at: 2026-09-19T11:30:00Z
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

- [ ] Tighten the binding between caption and drawing so proximity resolves it: close the gap the contain-fit leaves, and stop the caption reading as a cell divider.
- [ ] Confirm the result on the Fabrics and Regions grids at the widths where the grid reflows, including the single-column case where figures stack and a caption gains a figure directly beneath it.
- [ ] Compare Rendered against Design on the same specimen and record what differs, then close whichever part is Site-owned presentation.
- [ ] Put the Fabric shape comparison back to the owner with the current drawings rendered, since no IBC reference art exists in this repository to judge against.
- [ ] Assert the caption binding in the Site cases, and render the pages and look at them — a passing assertion is not evidence the grid reads correctly.

## Files touched

- `apps/site/src/visual-guide/DemoFrame.css`, possibly `apps/site/src/visual-guide/DemoFrame.tsx`
- `apps/site/src/visual-guide/DemoFrame.test.tsx`, `apps/site/src/visual-guide/DemoFrame.browser.test.tsx`

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

Possible. A renderer-level shape defect found by step 4 becomes its own record against the owning package.

## Discussion

### What is determinable now and what is not

The caption binding is a layout defect with a visible cause and a testable fix, and it is the whole of the reported symptom. The other two are weaker: "Design reads closer to intended" is reproducible but does not by itself say which mode should change, and the Fabric shape judgment rests on a comparison this repository cannot perform, because the IBC baseline is a hash manifest rather than art. Steps 3 and 4 are therefore shaped to produce evidence and a question rather than to promise a change.

### Why not simply move the caption above the figure

It would resolve the ambiguity and is tempting for that reason. It is rejected because a caption under its figure is the convention every other figure on the site follows, and inverting it on one component's grid trades one confusion for a smaller, subtler one. The cause here is dead space inside the figure, not the caption's side of it.
