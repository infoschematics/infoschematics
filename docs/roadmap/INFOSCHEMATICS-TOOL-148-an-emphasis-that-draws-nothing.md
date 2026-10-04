---
id: INFOSCHEMATICS-TOOL-148
area: TOOL
title: An emphasis drawing nothing
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-10-04T12:34:00Z
updated_at: 2026-10-04T12:34:00Z
---

# An emphasis drawing nothing

## Goal

An emphasised Overlay Graphic in the interactive Canvas shows the finite outline still output already draws for it, rather than nothing.

## Context

Validation accepts an `emphasise-elements` Dynamic naming an Overlay Graphic, because Overlays are among the Diagram's addressable elements in `packages/domain-core/src/model.ts`. Still output outlines a Graphic that states its bounds: `packages/render-svg/src/index.ts` gives it the shared box perimeter in its emphasis shapes. The interactive Canvas draws Overlay Graphics, but its emphasis geometry in `packages/view-canvas/src/InfoschematicDiagram.tsx` holds entries for Regions, Cards, Points and Flows only, so the same occurrence draws nothing there.

[ADR-INFOSCHEMATICS-027](../decisions/ADR-INFOSCHEMATICS-027-author-what-an-emphasis-means-not-how-it-is-played.md) says every geometry not offered a travelling mark falls back to the finite outline rather than drawing nothing, and that a Graphic is offered no mark. The Canvas therefore falls short of the record's fallback rule, and the two renderers disagree about an element both of them draw.

## Boundary

The Canvas emphasis of an Overlay Graphic. It does not offer a Graphic a travelling mark: the record declines one, and changing that is a decision of its own. It does not change what still output draws, and it does not decide what a Graphic without stated bounds should be outlined by in still output, where none is drawn today; the Canvas places such a Graphic at default bounds, so whether its outline follows those bounds is part of shaping this.

## Discussion

Found on 2026-10-04 while delivering [INFOSCHEMATICS-TOOL-137](INFOSCHEMATICS-TOOL-137-a-stale-decision-record.md), which corrected `ADR-INFOSCHEMATICS-027`'s claim that the Canvas draws no Graphic. That premise was the record's only stated reason for declining a Graphic the mark; with it gone, a reviewer may also want to ask whether a bounded Graphic, which the Canvas draws as a box, should be offered one. That question is noted here rather than decided, and belongs to a decision rather than to this repair.

Captured rather than fixed under TOOL-137 because the fix is a renderer change outside that record's boundary, in a file under concurrent change at the time.
