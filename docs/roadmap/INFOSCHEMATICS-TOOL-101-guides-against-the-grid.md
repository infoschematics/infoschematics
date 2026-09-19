---
id: INFOSCHEMATICS-TOOL-101
area: TOOL
title: Guides against the grid
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: e6fb47de32670214af1c4c4c0ab861106a1d6e82
created_at: 2026-09-19T13:06:00Z
updated_at: 2026-09-19T13:32:00Z
---

# Guides against the grid

## Goal

Leave the grid as the only thing a placement is drawn towards, so where an artefact lands is a choice between grid lines and nothing else.

## Context

Raised by user-acceptance testing on 2026-09-19, sixth item of the 12:10 recording, verbatim: _"Yeah, I think we maybe want to get rid of the guides as well. I'm not sure that they're useful anymore, the snap to guides feature. Now that we're rigid on there, on the grid, I think it's useful to have things go to one part of the grid or another."_

The reporter's reasoning is that the grid already produces what alignment guides were for. When every drop lands on a multiple of `gridSize`, two Cards of the same size dropped near each other are aligned by the grid alone, and the guide is doing work nobody asked for.

The code already anticipated the tension. `snapBoxToGuides` took a `grid` option whose comment said the grid is strict when it is set: the box origin always lands on a multiple of it, and _"a guide may only choose between the grid lines either side of where the drop wanted to be - never pull the box off the grid to align."_ So a guide was already subordinate to the grid, and the question was whether a subordinate guide changes enough to be worth a control.

The control was `'snapping'`, labelled `Snap to guides` in `EditorTools.tsx`, described as _"Pull a drop onto the nearest edge, centre, or label"_.

## Boundary

This is about guide snapping as a placement policy, the lines that displayed it, and the control that switched it. It does not change grid rounding, `gridSize` authoring, or the editing grid overlay. It does not change keyboard nudging, which was already exact, or numeric placement, which was already exact. It does not touch port calculation, which happened to live in the same module and is unaffected by the removal.

## Current state

`packages/view-model/src/guides.ts` exported `guidesFor`, `snapBoxToGuides`, `snapPointToGuides` and `guideThreshold`, published as the `./guides` subpath. `EditableDiagram` carried a `guidesFor(key)` member that `infoschematic-editable.ts` implemented. `use-editor.ts` held a `view` state of one field, `snapping`, a `toggleView` setter, a `guides` state, and a `place()` whose snapping branch consulted the guides and whose other branch rounded to the grid. `InfoschematicDiagram` accepted a `guides` prop and drew an `infoschematic-guides` layer. `EditorTools` rendered the toggle; `DetailsPanel` threaded `view` and `toggleView` through to it.

Five requirements referred to the behaviour: `EDIT-001` listed guides among what a diagram supplies, `EDIT-002` exempted nudging from guide snapping, `EDIT-018` allowed pointer placement to use guides, `DESIGN-006` required `gridSize: 0` to leave guide snapping independently controllable, and `ROUTE-011` and `ROUTE-012` specified the guides themselves. `EDIT-004` and four `ROUTE` requirements cited `guides.test.ts` as evidence — for its port cases, not its guide cases, because port calculation shared the module.

## Steps

- [x] Delete `guides.ts` and its `./guides` export, keeping the port work that shared the file — the test file moves to `ports.test.ts` with the guide describes dropped and the port describes untouched.
- [x] Remove `guidesFor` from `EditableDiagram` and its implementation, and the dead `cards` binding the implementation left behind.
- [x] Remove the `guides` prop and the `infoschematic-guides` layer from `InfoschematicDiagram`, and the rule that painted it.
- [x] Collapse `place()` to the grid branch it already had, and remove `view`, `toggleView`, `guides` and their threading through `EditorTools` and `DetailsPanel`.
- [x] Rename `releaseGuides` to `releaseDrag`: the callback still closes the gesture and clears the group drag, and only its name was about guides.
- [x] Amend the five requirements that named guides, and retire `ROUTE-011` and `ROUTE-012`.
- [x] Repoint the port-case citations from `guides.test.ts` to `ports.test.ts`.

## Files touched

- `packages/view-model/src/guides.ts` — deleted; `packages/view-model/src/guides.test.ts` → `ports.test.ts`
- `packages/view-model/package.json` — `./guides` export removed
- `packages/view-model/src/editable.ts` — `guidesFor` removed from `EditableDiagram`
- `packages/view-canvas/src/InfoschematicDiagram.tsx`, `packages/view-canvas/src/styles.css`
- `packages/view-studio/src/app/editor/use-editor.ts`, `EditorTools.tsx`, `infoschematic-editable.ts`, `packages/view-studio/src/app/panels/DetailsPanel.tsx`, `packages/view-studio/src/app/App.tsx`
- `packages/view-studio/src/app/editor/use-editor.test.ts`, `packages/view-studio/src/app/App.test.tsx`, `packages/view-studio/src/app/panels/DetailsPanel.artefacts.test.tsx`
- `docs/specs/design-editing.md`, `docs/specs/design-session.md`, `docs/specs/routing-and-placement.md`, `docs/specs/index.md`, `docs/design/view-studio.md`

## Verify

`bun run self:check`, then open the playground in Design and drag a Card past the edge and centre of another: it lands on the nearest grid line and nowhere else, no lines appear during the drag, and the toolbar carries a grid control and no snapping control.

## Dependencies / blocks

None. `INFOSCHEMATICS-TOOL-100` changed where a drag reports its destination, which is upstream of both grid rounding and guide snapping; it landed first and does not constrain this.

## Documentation impact

### Decision Records

None. Removing a placement policy withdraws requirements rather than establishing a decision, and the requirements themselves record what the placement path now promises.

### Specifications

`EDIT-001` no longer lists guides among what a diagram supplies. `EDIT-002` now contrasts exact nudging with grid rounding rather than with guide snapping. `EDIT-018` now allows pointer placement to round to the authored `gridSize`. `DESIGN-006` now says `gridSize: 0` leaves placement exact rather than leaving guide snapping independently controllable. `ROUTE-011` and `ROUTE-012` are removed; their ids are not reused. The corpus blurb for `ROUTE` reads "grid rounding" in place of "snapping", in `docs/specs/index.md` and in the file's own header.

### Guides

`docs/design/view-studio.md` described the grid and guides as complementary; it now says the grid is the only alignment aid and why that is the point. No Site page or user guide mentioned guides.

### Roadmap

None raised. The removal closes the item outright.

## Review

### Delivered

Every Step, within the stated Boundary. Baseline `e6fb47de32670214af1c4c4c0ab861106a1d6e82`.

The Shaping left three questions open for the user. Under the instruction to progress every `now` item to `done`, they were decided here rather than deferred, and each is flagged for the next testing pass:

**What does a guide add when the grid is strict?** The mismatched-sizes case is real — a wide Region's centre and a narrow Card's centre need not fall on the same grid line. It was judged not to outweigh the cost, because a guide that fires only in that case still fires in every case where the grid was about to give the same answer, and the Producer cannot tell which one they got. If centre alignment turns out to be wanted, the answer is an explicit alignment command over a selection, which says what it did, not a proximity rule that guesses.

**Snapping, or the lines, or both?** Both. Lines that display a rule no longer in force are decoration, and lines that display a rule a Producer cannot act on are worse than none.

**What happens to `gridSize: 0`?** `DESIGN-006` changed. A document authoring `gridSize: 0` is asking for exact placement, and giving it a guide rule instead of the grid it declined is the conditional affordance the Shaping already called worse than either extreme.

### Summary of changes

480 lines removed against 73 added. `guides.ts` is gone and the `./guides` subpath with it. Port calculation kept its cases: `guides.test.ts` became `ports.test.ts` with only the two guide describes dropped, so the four `ROUTE` requirements and `EDIT-004` that cited it for port coverage still cite live cases.

`place()` in `use-editor.ts` is now `if (exact || gridSize <= 0) return wanted` followed by a grid rounding — the branch that already existed for "snapping off", which every call site already reached whenever the toggle was down. No new placement logic was written; the false branch was deleted.

`releaseGuides` became `releaseDrag`. The callback never only released guides — it closes the gesture and clears the group drag — and dropping only the `setGuides([])` line left the name lying about the other two.

### Verification

`bun run self:check` — 48 tasks, all successful. `scripts/specification-evidence.test.ts` green, which is the check that would have failed silently on the four stale `guides.test.ts` citations: it caught them on the first run after the rename and is the reason they were found rather than left.

The removal is proven by absence, which is weak evidence on its own, so it was measured two ways: a grep for `guides|snapping|EditorView` across `packages/view-model/src`, `packages/view-canvas/src`, `packages/view-studio/src` and `apps/site/src` returns nothing about alignment, and the typecheck of every workspace passes with `guides.ts` deleted, which it could not if any consumer still reached for it.

### Outstanding concerns

None blocking. One judgement is open rather than wrong: the mismatched-sizes alignment case has no replacement. Nothing in Studio aligns a wide element's centre with a narrow one's, and until an explicit alignment command exists a Producer who wants that must place both by typed coordinate. That is a smaller surface than the guides were, and it is honest about what it does.

`ROUTE-011` and `ROUTE-012` are withdrawn ids in a corpus that has not withdrawn one before. They are left as gaps rather than renumbered, because every other requirement's id is a stable reference and the historical mapping in `docs/reference/specification-id-migration.md` still names them by their pre-migration ids. A reader who follows that table to a requirement that no longer exists finds this record.

### Post-change review

The Goal is met. The risk in a removal of this shape is that something else was quietly depending on the removed path — here the exposure was `guidesFor` on `EditableDiagram`, which is a published contract member, and the `./guides` subpath, which is a published entry point. Both are internal to this repository today: no example, app or test outside `view-studio` implemented or called either. A consumer outside the repository would break, and there is none.

The second risk is the one the Verify line targets: `place()`'s surviving branch is the one that was previously only reached with the toggle down, so a Producer who habitually worked with snapping on has not used it. It is the branch every keyboard nudge and typed coordinate already went through, which is why the suite covers it, but a drag is the gesture nobody tested it under.

### Mini recap

The grid already did what alignment guides were for, and a guide could still override the grid line a Producer was aiming at, so where a drop landed depended on what happened to be nearby. Guides are gone entirely — the calculation, the lines, the toggle and the two requirements that specified them — and a placement now rounds to the grid or is exact, with nothing in between. Three questions the record had left for the user were decided here to close it; the mismatched-sizes alignment case is the one worth arguing about, and it has no replacement yet.

## Done

Accepted 2026-09-19 by Kris Brown on the review packet above.

## Discussion

### Why "get rid of" did not mean narrow

The complaint was that guides do something the grid already does, which is a complaint about redundancy in the common case. A guide that only fires where the grid cannot help — mismatched sizes, centre alignment, an unset grid — is not redundant, and narrowing to those cases was the cheaper answer available. It was rejected because a narrowed guide is still invisible in the moment that matters: a Producer dragging a Card cannot see whether this particular drop is one the grid would have handled, so the outcome stays unpredictable while the code gets a condition it did not have.

### What removal bought

One fewer toggle, one fewer policy in the placement path, one fewer published entry point, and 480 lines. The real argument is predictability: the reporter's phrase _"go to one part of the grid or another"_ describes wanting placement to be a choice between discrete positions, and any rule that can override that choice within the same threshold makes the outcome depend on context the Producer is not looking at.

### The test file was the trap

`guides.ts` held guide calculation and port calculation, and `guides.test.ts` held cases for both. Deleting the file by name would have taken five requirements' cited evidence with it — `EDIT-004` and four `ROUTE` requirements, none of which is about guides. The evidence gate caught the citations after the rename, but only because the port cases survived to be cited; had they been deleted with the module, the gate would have reported exactly the same failure and the fix would have been to write them again.
