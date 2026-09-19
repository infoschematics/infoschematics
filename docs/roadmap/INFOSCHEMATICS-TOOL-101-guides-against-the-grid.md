---
id: INFOSCHEMATICS-TOOL-101
area: TOOL
title: Guides against the grid
theme: tool
horizon: soon
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-19T13:06:00Z
updated_at: 2026-09-19T13:06:00Z
---

# Guides against the grid

## Goal

Decide whether alignment-guide snapping still earns its place now that the grid is strict, and either remove it or say what it does that the grid does not.

## Context

Raised by user-acceptance testing on 2026-09-19, sixth item of the 12:10 recording, verbatim: _"Yeah, I think we maybe want to get rid of the guides as well. I'm not sure that they're useful anymore, the snap to guides feature. Now that we're rigid on there, on the grid, I think it's useful to have things go to one part of the grid or another."_

The reporter's reasoning is that the grid already produces the alignment guides were for. When every drop lands on a multiple of `gridSize`, two Cards of the same size dropped near each other are aligned by the grid alone, and the guide is doing work nobody asked for.

The code already anticipates the tension. `snapBoxToGuides` in `packages/view-model/src/guides.ts` takes a `grid` option whose comment says the grid is strict when it is set: the box origin always lands on a multiple of it, and _"a guide may only choose between the grid lines either side of where the drop wanted to be - never pull the box off the grid to align."_ So a guide is already subordinate to the grid; the question is whether a subordinate guide changes enough to be worth a control.

The control is `'snapping'`, labelled `Snap to guides` in `EditorTools.tsx`, described as _"Pull a drop onto the nearest edge, centre, or label"_.

## Boundary

This is about guide snapping as a placement policy and its control. It does not change grid rounding, `gridSize` authoring, or the `gridSize: 0` case. It does not change keyboard nudging, which `EDIT-002` already exempts from guide snapping, or numeric placement, which is exact. It does not remove the guide calculation itself if the visible alignment lines are worth keeping as feedback while the snapping goes — those are separable and the decision should say which is meant.

## Shaping

Three questions.

**What does a guide add when the grid is strict?** Concretely: the case where two artefacts have different sizes, so their centres or far edges do not fall on the same grid line as their origins. A guide can align a wide Region's centre with a narrow Card's centre where the grid cannot. If that case matters, guides stay and the reporter's premise is narrower than it sounds; if it does not, they go.

**Snapping, or the lines, or both?** The guides serve two purposes: they move the drop, and they show why it moved. Removing the movement while keeping the lines as a during-drag alignment display is a coherent middle answer and is probably the smallest change that answers the complaint.

**What happens to `gridSize: 0`?** `DESIGN-006` requires that an authored `gridSize: 0` suppress the overlay and grid rounding _"while leaving alignment-guide snapping independently controllable"_. A document with no grid has nothing else to align to, so removing guides outright removes the only placement aid that document has. Either that requirement changes with this, or guides survive for the no-grid case and the control becomes conditional — which is a worse affordance than either extreme.

Known dependencies: none in build order. `INFOSCHEMATICS-TOOL-100` changed where a drag reports its destination, which is upstream of both grid rounding and guide snapping and does not constrain this.

Promotion condition: the third question answered, because it decides whether this is a removal or a narrowing. The first two can be settled while implementing.

## Discussion

### Why "get rid of" may not mean delete

The complaint is that guides do something the grid already does, which is a complaint about redundancy in the common case. A guide that only fires where the grid cannot help — mismatched sizes, centre alignment, an unset grid — is not redundant. It is worth checking whether the reporter's irritation is with guide snapping existing, or with it firing where the grid was about to give the same answer, because those have different fixes and the second is cheaper.

### What removal buys

One fewer toggle in the toolbar, one fewer policy in the placement path, and a drop whose outcome a Producer can predict from the grid alone. Predictability is the real argument here: the reporter's phrase _"go to one part of the grid or another"_ describes wanting placement to be a choice between discrete positions, and a guide that can override that choice within the same threshold makes the outcome depend on what else happens to be nearby.
