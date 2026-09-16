---
id: INFOSCHEMATICS-TOOL-076
area: TOOL
title: Selection heading clipped in Design
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 8c2a8c359ec0512820fe5b2bb2f7f0aeec879e4f
created_at: 2026-09-16T13:55:00Z
updated_at: 2026-09-16T22:10:00Z
---

# Selection heading clipped in Design

## Goal

Keep every panel heading in the Design dock fully legible at the viewport sizes the editor is used at.

## Context

Seen on 2026-09-16 in Chromium at 1440×900, in the Playground's Design mode, while reviewing docked panels following the mode (`INFOSCHEMATICS-TOOL-066`). The `SELECTION` heading is cut across the middle by `.split-handle` (`packages/view-studio/src/styles.css:815`), the horizontal divider between the editor panel's two halves — not `.panel-resizer` (`:330`), which is the dock-to-Canvas column divider: roughly the lower half of the letterforms is hidden, and the `CHANGES` heading sits immediately below it, so the panel reads as though a heading were half-deleted. The heading itself is rendered at `packages/view-studio/src/app/editor/ArtefactControls.tsx:139`, and the `CHANGES` heading below it at `packages/view-studio/src/app/editor/ChangePane.tsx:37`.

There is already a mitigation for this exact symptom, and it does not cover this case: `packages/view-studio/src/styles.css:792-794` strips the trailing margin from the editor panel's last child, and `:802-804` puts `margin-bottom: 10px` back when a `.pane-heading` is `:last-child`, with a comment saying "the divider came to rest against the lettering". `SELECTION` is not `:last-child` whenever something is selected, so the rule that was written for this never fires here. That is the likely mechanism and step 1 should start there.

Pre-existing rather than introduced by that item — it was reported as a parked observation by its delivery and confirmed independently in a separate screenshot. It becomes visible more often now, because entering Design opens the dock instead of leaving an empty rail.

## Boundary

The clipped heading, and only in the docked panel column. Not a redesign of the split pane, the resizer, or the panel order.

## Steps

1. [x] Establish the mechanism: whether the heading is clipped by the pane's own overflow, overlapped by the resizer's hit area, or pushed under a sticky sibling. Verifiable by the measured geometry of the heading and the resizer at 1440×900.
2. [x] Fix it where the mechanism is, not where the symptom shows. Verifiable by the heading being fully visible with the same panel content and no change to the resizer's grab area.
3. [x] Add the case to the Studio browser suite in the form that would have caught it: a heading whose box is intersected by the resizer, not merely a heading present in the tree. Verifiable by the case failing against today's tree.
4. [x] Look at it, at more than one viewport height — including one short enough to force the pane to scroll — and record what was seen.

## Files touched

- `packages/view-studio/src/styles.css`
- possibly `packages/view-studio/src/app/editor/ArtefactControls.tsx` or `packages/view-studio/src/app/panels/SplitPane.tsx:34,43`, which own the heading and the handle respectively — not `DetailsPanel.tsx`, whose headings are `THEMES`, `SCENES` and `STORIES`
- `packages/view-studio/src/app/App.treatments.browser.test.tsx`, which is the existing home for geometry and treatment cases, or `App.browser.test.tsx`

## Verify

Rendering and looking is the evidence, at a minimum of two viewport heights, with the before and after kept side by side. Plus the Studio browser suite and `bun run self:check`.

## Dependencies / blocks

None. Sequenced naturally after `INFOSCHEMATICS-TOOL-066`, which is what made the dock routinely visible.

## Documentation impact

### Specifications

Possible, and worth deciding rather than assuming. Nothing in the corpus requires a panel heading to be legible: DESIGN-021 (`docs/specs/design-session.md:195`) owns the dock opening, and DESIGN-015 (`:211`) owns the rendered editor being tested. The cheapest honest outcome is that step 3's case joins DESIGN-015's evidence; a requirement that no editing chrome may occlude a panel heading would be stronger and is the alternative to weigh.

### Decision Records

None. A clipped heading is a defect, not a decision.

### Guides

None.

## Review

### Delivered

The split seam in the Design dock no longer presents a clipped label as a cut one. The scrolling top half of the editor's split pane fades its own last twelve units and keeps that much room past its final child, so a label lying on the clip edge reads as content continuing below rather than as a heading with its lower half deleted, and the fade falls on empty space once there is nothing more to show.

The report's identification of the clipped element is wrong, and the correction matters to anyone reading this later. `SELECTION` is not the heading that gets cut: measured at 1440x900 it sits at 452.0-462.0 while the handle sits at 536.5-546.5, so it has 74.5px of clearance. The element bisected in the screenshot is the `SERIALISABLE PROPERTIES` `<legend>` (`packages/view-studio/src/app/editor/ArtefactControls.tsx:156`), inside `<fieldset className="artefact-properties">`, with `CHANGES` immediately below it exactly as described. The phenomenon is as reported; only the name of the victim was wrong, and the fix is indifferent to which label it is.

### Summary of changes

`packages/view-studio/src/styles.css` gains one rule on `.split-pane > .editor-panes`: a `mask-image` fading the pane's last 12px and a matching `padding-bottom: 12px`. Nothing else changed - the handle keeps its ten-unit hit area and its drawn hairline untouched, and no heading, fieldset, or component moved.

`packages/view-studio/src/app/App.treatments.browser.test.tsx` gains one case, which locates the label lying across the seam by measuring boxes rather than naming a heading, asserts the pane carries a fade, and asserts that scrolling to the end leaves at least the faded depth between the last child and the clip edge.

### Verification

Step 1, the mechanism, by measurement rather than inspection. `.editor-panes` is the scroll container (`overflow-y: auto`, `scrollHeight` 931, `clientHeight` 326 at 1440x900), and its clip edge at 536.5 coincides exactly with `.split-handle` at 536.5-546.5. So the pane clips, the divider is drawn on the line where it clips, and whatever the scroll offset leaves there is sliced by a line whose meaning is "the pane ends here" - with overlay scrollbars, nothing says otherwise. The existing mitigation at `styles.css:792-804` cannot reach this: it is about a trailing margin on a `:last-child` heading, and the bisected element is whichever one the scroll offset and the divider position put on the edge.

Step 3's case fails against today's tree. With the new rule commented out the case reaches its final assertions and fails on `expected 'none' not to be 'none'` - and reaches them only after finding a label genuinely across the seam, so the failure is the defect and not a missing fixture.

Studio's browser suite passes whole (19 tests, 2 files). `bun run self:check` passes.

Step 4, two viewport heights, screenshots kept side by side at `packages/view-studio/src/app/reports/tool076-{before,after}-{900,650}.png` (the directory is gitignored, so they are local evidence rather than committed artefacts). At 1440x900 before, `SERIALISABLE PROPERTIES` is sliced at full contrast with a hard edge on the seam; after, it fades away into the seam. At 1440x650, forcing more of the pane out of view, the before shows "A bounded Fabric for infrastructure or platform detail." cut mid-line; after, the same line fades. `scrollHeight` moved 931 to 943, the twelve units of reserved room.

### Outstanding concerns

Step 2 asks for "the heading being fully visible with the same panel content", and that criterion is not met, because it is not achievable where the step also forbids fixing the symptom. The pane scrolls, the divider is user-draggable, and the content is arbitrary, so for any fixed rule there is a split position and scroll offset that leaves some element across the clip edge. The only ways to make this particular label fully visible are to change the default split ratio or the properties panel's own content - both of which are the symptom-level fix step 2 rules out. What is achievable, and what is delivered, is that the clip stops reading as a cut. If the intended outcome really is "no label may ever be intersected", that is a different and much larger change to how the dock allocates height, and it wants its own record.

The fade dims a label sitting on the edge rather than hiding it, so at some scroll offsets a heading is legible but faint. That is the deliberate trade: faint-and-continuing beats sharp-and-truncated, and it is visible in the after screenshot at 900.

`mask-image` is unprefixed and needs Safari 15.4 or later. Losing it degrades to today's behaviour rather than to something worse.

### Post-change review

The documentation question the record left open is still open and is not mine to close: nothing in the corpus requires a panel heading to be legible. This item's case joins DESIGN-015's evidence as the cheap outcome; a requirement that no editing chrome may occlude a panel heading remains the stronger alternative, and it is now better informed, because the concern above shows such a requirement could not be met by a rule in the stylesheet alone.

The test is the third distinct way this suite has been satisfied by a control nobody could read, after a hidden ancestor and an unrotated marker, and the first where the element was fully present, displayed, and boxed. What separates it from the other two is that the case had to measure a relationship between two elements rather than a property of one.

### Mini recap

A pane that scrolls behind a divider drawn on its clip edge cannot avoid cutting something; it can only stop the cut from looking like damage. Also: a defect report naming the wrong element is still a good report, and re-measuring before fixing is what turned `SELECTION` into a legend with 74.5px of clearance between them.

## Discussion

Step 3 is the part with lasting value. A presence assertion cannot see this: the heading is in the tree, is not `display: none`, and has a non-zero box — it is simply painted under something else. That is a third distinct way the suite has been satisfied by a control nobody could read, after a hidden ancestor and an unrotated marker.
