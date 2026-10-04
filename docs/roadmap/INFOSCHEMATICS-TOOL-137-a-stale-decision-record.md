---
id: INFOSCHEMATICS-TOOL-137
area: TOOL
title: A stale decision record
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 73d2622dba360c7920922d3151e50bf3b0a7c5ea
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-10-04T12:50:00Z
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

- [x] Rewrite the Point sentence so both renderers ring a Point at the shared radius and send nothing round it, keeping the reason a mark says nothing a ring did not.
- [x] Rewrite the Overlay Graphic sentence to state that both renderers draw one and that it is offered no mark, that still output outlines one stating its bounds, and that the finite outline is what a renderer owes it under the fallback the paragraph already states. Do not supply a new rationale for declining the mark: the record never had one beyond the false premise.
- [x] Capture the Canvas drawing nothing for an emphasised Overlay Graphic as its own Triage record: it is a renderer defect against the fallback rule, outside this record's boundary, and in a file under concurrent change.

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

## Review

### Delivered

`ADR-INFOSCHEMATICS-027` no longer rests on two claims about the interactive Canvas that stopped being true: it says both renderers ring a Point at the shared Point radius and send nothing round it, and that both renderers draw an Overlay Graphic, which is offered no mark and is owed the finite outline. The record was amended in place, because a Decision Record is a living present-state record and the decision itself - which geometries a travelling mark is offered on - is unchanged; only its description of the renderers was stale, so neither supersession nor a new record applies. The Canvas falling short of the outline it owes an Overlay Graphic is captured as [INFOSCHEMATICS-TOOL-148](INFOSCHEMATICS-TOOL-148-an-emphasis-that-draws-nothing.md) rather than fixed here. Baseline `73d2622dba360c7920922d3151e50bf3b0a7c5ea`; the change is the commit carrying this packet.

### Change Summary

- `docs/decisions/ADR-INFOSCHEMATICS-027-author-what-an-emphasis-means-not-how-it-is-played.md` - the Point sentence keeps its reason (a mark round a disc says nothing its ring did not) and replaces "the interactive Canvas draws no Point at all" with both renderers ringing it at `emphasisPointRadius`; the Overlay Graphic sentence replaces "the interactive Canvas draws none" with both renderers drawing one, no mark offered, still output outlining a Graphic that states its bounds, and the finite outline owed by any renderer that draws one. No new rationale for declining a Graphic the mark was supplied: the record had none beyond the false premise, and TOOL-148 records that question for a decision rather than inventing an answer.
- `docs/roadmap/INFOSCHEMATICS-TOOL-148-an-emphasis-that-draws-nothing.md` - new Triage capture: the Canvas emphasis geometry map (`InfoschematicDiagram.tsx`, Regions, placeables, Points and Flows) has no Overlay entry, so an emphasised Overlay Graphic draws nothing there although `render-svg` outlines a bounded one (`index.ts`, `graphic.bounds` -> `boxEmphasis`).
- `docs/roadmap/_ISSUES.md` - `TOOL` high-water mark raised to `148`. Number `147` was skipped because another concurrent agent holds an uncommitted `INFOSCHEMATICS-TOOL-147`; only the `TOOL` hunk was staged, leaving that agent's working-tree changes untouched.

### Verification

- `grep -nE "draws no Point at all|interactive Canvas draws none" docs/decisions/ADR-INFOSCHEMATICS-027-*.md` - no output (exit 1).
- The rewritten sentences were checked against the emphasis geometry: `packages/view-canvas/src/InfoschematicDiagram.tsx` sets a Point entry `{ at, travels: false }` drawn as a circle of `emphasisPointRadius`, and has no Overlay entry; `packages/render-svg/src/index.ts` sets `pointEmphasis(point.at)` with the same radius and `boxEmphasis(graphic.bounds)` only where a Graphic states bounds.
- `ki repo audit --skill ki-decision-records` - PASS.
- `ki repo audit --skill ki-work-roadmap` - the only FAIL is ITEM-1 on another agent's uncommitted `INFOSCHEMATICS-TOOL-147-a-filter-design-no-longer-ignores.md`; this item's records pass.
- `bunx rumdl check` on the touched files - no issues.
- `bun run self:check` - red for the unrelated causes recorded on `INFOSCHEMATICS-TOOL-136` (`ROUTE-011` without a conformance state from `638e2818`, and another agent's uncommitted `view-canvas` work); not attributable to this change, which touches only Markdown.

### Outstanding concerns

- With the false premise gone, the record states no reason for declining a bounded Graphic a travelling mark, though the Canvas draws one as a box. That is noted on TOOL-148 for a decision and deliberately not answered here.
- Repository-wide `bun run self:check` is red for unrelated causes.

### Post-change review

The goal is met: no sentence in the record describes either renderer contrary to the code, and the decision's substance - Region, Card and Fabric offered the mark; Point, Flow and Graphic declined with the finite outline as fallback - is unchanged. Amending in place is the conventions' prescribed route for a living record whose decision holds. The scope held to the two sentences; the renderer gap it exposed was captured, not fixed. Fable was consulted on the amend-in-place reading before editing. Ready for acceptance.

### Mini recap

`ADR-INFOSCHEMATICS-027`'s Point and Overlay Graphic sentences now match both renderers, amended in place, and the Canvas's missing Graphic outline is captured as TOOL-148. Learning route (not promoted): a premise of the form "renderer X draws none" ages silently as renderers grow; stating what each renderer owes rather than what it currently lacks keeps a record true.

## Discussion

Found on 2026-09-24 while delivering `INFOSCHEMATICS-TOOL-126`, which raised it in its own record rather than editing an accepted decision unilaterally. That was the right call and this is where the raised concern lands.

Worth checking when this is shaped: whether the same record makes any other claim about what the interactive Canvas draws. It says an Overlay Graphic is accepted by validation and drawn in the still output while the interactive Canvas draws none, which is a claim of the same kind and from the same era, and may have aged the same way.

Adopted 2026-10-04 under the owner's delegated estate-push authority, moved from Triage to Now and shaped to Ready in the same change.
