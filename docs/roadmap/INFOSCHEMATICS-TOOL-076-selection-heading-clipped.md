---
id: INFOSCHEMATICS-TOOL-076
area: TOOL
title: Selection heading clipped in Design
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-16T13:55:00Z
updated_at: 2026-09-16T13:55:00Z
---

# Selection heading clipped in Design

## Goal

Keep every panel heading in the Design dock fully legible at the viewport sizes the editor is used at.

## Context

Seen on 2026-09-16 in Chromium at 1440×900, in the Playground's Design mode, while reviewing docked panels following the mode (`INFOSCHEMATICS-TOOL-066`). The `SELECTION` heading is cut across the middle by the split-pane resizer: roughly the lower half of the letterforms is hidden, and the `CHANGES` heading sits immediately below it, so the panel reads as though a heading were half-deleted.

Pre-existing rather than introduced by that item — it was reported as a parked observation by its delivery and confirmed independently in a separate screenshot. It becomes visible more often now, because entering Design opens the dock instead of leaving an empty rail.

## Boundary

The clipped heading, and only in the docked panel column. Not a redesign of the split pane, the resizer, or the panel order.

## Steps

1. [ ] Establish the mechanism: whether the heading is clipped by the pane's own overflow, overlapped by the resizer's hit area, or pushed under a sticky sibling. Verifiable by the measured geometry of the heading and the resizer at 1440×900.
2. [ ] Fix it where the mechanism is, not where the symptom shows. Verifiable by the heading being fully visible with the same panel content and no change to the resizer's grab area.
3. [ ] Add the case to the Studio browser suite in the form that would have caught it: a heading whose box is intersected by the resizer, not merely a heading present in the tree. Verifiable by the case failing against today's tree.
4. [ ] Look at it, at more than one viewport height — including one short enough to force the pane to scroll — and record what was seen.

## Files touched

- `packages/view-studio/src/styles.css`
- possibly `packages/view-studio/src/app/panels/DetailsPanel.tsx`
- `packages/view-studio/src/app/App.browser.test.tsx`

## Verify

Rendering and looking is the evidence, at a minimum of two viewport heights, with the before and after kept side by side. Plus the Studio browser suite and `bun run self:check`.

## Dependencies / blocks

None. Sequenced naturally after `INFOSCHEMATICS-TOOL-066`, which is what made the dock routinely visible.

## Discussion

Step 3 is the part with lasting value. A presence assertion cannot see this: the heading is in the tree, is not `display: none`, and has a non-zero box — it is simply painted under something else. That is a third distinct way the suite has been satisfied by a control nobody could read, after a hidden ancestor and an unrotated marker.
