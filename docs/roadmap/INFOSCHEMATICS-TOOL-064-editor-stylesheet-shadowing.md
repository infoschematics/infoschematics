---
id: INFOSCHEMATICS-TOOL-064
area: TOOL
title: Editor stylesheet shadows the Canvas one
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-15T13:30:00Z
updated_at: 2026-09-15T13:30:00Z
---

# Editor stylesheet shadows the Canvas one

## Goal

Let the editor surface read the Canvas stylesheet, so a Canvas treatment reaches Studio once it is written rather than only after someone copies it, and so Canvas affordances that Studio never copied stop rendering unstyled.

## Context

Found while delivering Multi-selection alignment (`INFOSCHEMATICS-TOOL-046`). Its held-group treatment was written in `packages/view-canvas/src/styles.css`, the class reached the element, the whole suite was green — and the editor drew held elements exactly like unheld ones. `packages/view-studio/src/styles.css` never loads the Canvas stylesheet: its last line is `@import "@infoschematics/view-present/styles.css"`, and an `@import` that follows other statements is dead. PostCSS warns on every build, the browser ignores it, and the editor runs entirely on this stylesheet's own hand-maintained copies of the Canvas rules — copies written with literal colours rather than the generated visual tokens.

Two consequences are visible today. A treatment has to be written twice, which is how a green suite can report a feature that is not there. And a Canvas affordance Studio never copied has no rules at all: `.artefact-action` and `.artefact-resize-handle` style the selected element's reorder, remove and resize controls in Canvas, and in Studio those controls render as unstyled black shapes over the Card.

## Boundary

This item makes one stylesheet read another and removes the duplication that stands in for it. It does not redesign the editor's appearance, change the visual tokens, or move Studio's own application chrome into Canvas.

## Current state

- `packages/view-studio/src/styles.css` is about 81 KB and carries its own copies of the Canvas selection, hover, layer and handle treatments, in hex rather than `var(--infoschematic-canvas-*)`.
- Its `@import` of the Present stylesheet sits at the end of the file, so neither Present nor the Canvas stylesheet Present imports is applied.
- `apps/site/src/Playground.tsx` imports `@infoschematics/view-studio/styles.css` alone, so the deployed editor has the same gap.
- `packages/view-canvas/src/styles.css` imports the generated tokens and is the only stylesheet the Canvas browser suites load, which is why those suites cannot see this.

## Steps

- [ ] Move the `@import` to the head of the Studio stylesheet and record what the cascade then does: the imported rules come first, so Studio's own copies still win where they disagree.
- [ ] Render the editor before and after and compare, because this changes the appearance of every selection treatment at once.
- [ ] Remove each Studio copy that the Canvas stylesheet now supplies, keeping only rules that are genuinely about the editor rather than the diagram.
- [ ] Confirm `.artefact-action` and `.artefact-resize-handle` are styled in Studio, which is the defect a reader can see today.
- [ ] Decide whether the remaining Studio copies should read the visual tokens rather than literal hex, and either convert them or state why not.
- [ ] Give the browser suite a case that would have caught the original defect: a Canvas treatment asserted on the Studio surface, not only on a Canvas fixture.

## Files touched

- `packages/view-studio/src/styles.css`
- `packages/view-studio/src/app/App.browser.test.tsx` for the Studio-surface treatment case
- possibly `packages/view-present/src/styles.css`, if the import chain is better made explicit

## Verify

Run `bun run self:check`, and confirm the PostCSS `@import` warning is gone from the site build. Render the editor in a browser at a realistic size and look at a selected Card, a held group, a selected Region, a selected Flow and a closed interaction layer, before and after, because the only honest check on a cascade change is the rendered surface.

## Dependencies / blocks

None. Multi-selection alignment (`INFOSCHEMATICS-TOOL-046`) declares its held-group treatment in both stylesheets; this item removes the second copy.

## Documentation impact

### Decision Records

One is possible if the answer is that the editor deliberately keeps its own copy of diagram treatments. That would be a durable boundary claim and should be written down rather than left as an accident of a misplaced `@import`.

### Specifications

None expected. This is how a stated treatment reaches a surface, not a change to what is stated.

### Guides

None.

### Roadmap

None.
