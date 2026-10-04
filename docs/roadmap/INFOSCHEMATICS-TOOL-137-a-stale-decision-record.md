---
id: INFOSCHEMATICS-TOOL-137
area: TOOL
title: A stale decision record
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-10-04T12:10:00Z
---

# A stale decision record

## Goal

[ADR-INFOSCHEMATICS-027](../decisions/ADR-INFOSCHEMATICS-027-author-what-an-emphasis-means-not-how-it-is-played.md) stops asserting something the product no longer does, so a reader deciding what an emphasis reaches is not told the opposite of what the code now delivers.

## Context

ADR-INFOSCHEMATICS-027 explains which geometries a travelling mark is offered for, and reasons about what each element's shape can carry. In doing so it states that "the interactive Canvas draws no Point at all, so no emphasis reaches one there", and uses that as part of why declining a treatment is recorded rather than degraded silently.

`INFOSCHEMATICS-TOOL-126` made that false. The Canvas now draws a Point and an emphasis reaches it: a held ring at the shared `emphasisPointRadius`, with no travelling mark, because a mark travels along a perimeter and a Point has none. The record's _conclusion_ about the Point survives intact — it was always that a Point gets a ring and not a mark — but the premise it rests on is now wrong, and a reader checking why their Point shows no travelling mark is told the Canvas draws no Point at all.

## Boundary

A correction to one record's stated premise, not a re-opening of its decision. What an emphasis means and who chooses its treatment are settled and stay settled.

It is captured rather than applied because ADR-INFOSCHEMATICS-027 is an accepted Decision Record: amending one needs its own authority, which delivering `INFOSCHEMATICS-TOOL-126` did not carry. Whether the fix is an amendment in place, a superseding record, or a dated note depends on how far the premise change reaches, and that is the question this record exists to answer.

## Current state

Two sentences in the Decision paragraph that begins "A travelling mark is offered only where the element has a closed perimeter" describe what the interactive Canvas draws, and both have aged. The Canvas draws a Point and gives an emphasised one a steady ring at the shared `emphasisPointRadius` with nothing travelling round it (`packages/view-canvas/src/InfoschematicDiagram.tsx`, the Point entry in the emphasis geometry), as still output does. The Canvas also draws Overlay Graphics, so "the interactive Canvas draws none" is false too; its emphasis geometry, though, holds no entry for a Graphic, so an emphasis targeting one draws nothing there, while still output outlines a Graphic that states its bounds (`packages/render-svg/src/index.ts`, the emphasis shapes). No other sentence in the record makes a claim about what a renderer draws.

The answer to the Boundary's question is an amendment in place. The `ki-decision-records` standard makes a Decision Record a living present-state record kept true by editing it: it has no supersession chain, changelog or dated note, and a new record is reserved for an independent decision. Nothing here is a new decision. The outcomes the record states for a Point (a ring, no mark) and an Overlay Graphic (no mark) stay as they are; only the premises change, so the two sentences are rewritten to be true today and the paragraph's closing rule about reaching only what was drawn stands unchanged.

## Steps

- [ ] Rewrite the Point sentence so both renderers ring a Point at the shared radius and send nothing round it, keeping the reason a mark says nothing a ring did not.
- [ ] Rewrite the Overlay Graphic sentence to state that both renderers draw one and that it is offered no mark, that still output outlines one stating its bounds, and that the finite outline is what a renderer owes it under the fallback the paragraph already states. Do not supply a new rationale for declining the mark: the record never had one beyond the false premise.
- [ ] Capture the Canvas drawing nothing for an emphasised Overlay Graphic as its own Triage record: it is a renderer defect against the fallback rule, outside this record's boundary, and in a file under concurrent change.

## Files touched

`docs/decisions/ADR-INFOSCHEMATICS-027-author-what-an-emphasis-means-not-how-it-is-played.md`; a new Triage record in `docs/roadmap/`.

## Verify

`grep -nE "draws no Point at all|interactive Canvas draws none" docs/decisions/ADR-INFOSCHEMATICS-027-*.md` returns nothing, and the two rewritten sentences are checked against the emphasis geometry in `packages/view-canvas/src/InfoschematicDiagram.tsx` and `packages/render-svg/src/index.ts`. `ki repo audit --skill ki-decision-records` and `--skill ki-work-roadmap` pass, `bunx rumdl check` is clean on the touched files, and `bun run self:check` passes.

## Dependencies / blocks

None. The amendment does not depend on the captured defect being resolved: its wording describes what each renderer owes a Graphic, not a future change.

## Documentation impact

### Decision Records

`ADR-INFOSCHEMATICS-027` is amended in place; its index line in `docs/decisions/README.md` is unaffected.

### Specifications

None.

### Guides

None.

### Roadmap

One new Triage record for the Canvas emphasis of an Overlay Graphic.

## Discussion

Found on 2026-09-24 while delivering `INFOSCHEMATICS-TOOL-126`, which raised it in its own record rather than editing an accepted decision unilaterally. That was the right call and this is where the raised concern lands.

Worth checking when this is shaped: whether the same record makes any other claim about what the interactive Canvas draws. It says an Overlay Graphic is accepted by validation and drawn in the still output while the interactive Canvas draws none, which is a claim of the same kind and from the same era, and may have aged the same way.

Adopted 2026-10-04 under the owner's delegated estate-push authority, moved from Triage to Now and shaped to Ready in the same change.
