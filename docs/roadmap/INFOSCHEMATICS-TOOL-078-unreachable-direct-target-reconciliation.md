---
id: INFOSCHEMATICS-TOOL-078
area: TOOL
title: Unreachable direct-target reconciliation
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: 8c2a8c359ec0512820fe5b2bb2f7f0aeec879e4f
created_at: 2026-09-16T14:55:00Z
updated_at: 2026-09-16T20:30:00Z
---

# Unreachable direct-target reconciliation

## Goal

Either make a Direct target that has left the document actually get cleared, or remove the reducer case and the tests that assert it does — so the corpus stops asserting behaviour the product cannot perform.

## Context

Found on 2026-09-16 while surveying unused code across the tree. `packages/view-present/src/production.ts:142-148` handles a `reconcile-direct-target` action: when the mode is `direct` and the held target is no longer among the available targets, it clears the target. The logic is sound and it has unit coverage in `packages/view-present/src/production.test.ts:145,158,165`, which passes.

Nothing dispatches it. The only sender is `reconcileDirectTargets` at `packages/view-studio/src/app/hooks/use-presentation.ts:128`, and that function has no caller anywhere in the repository — `grep` across every workspace source finds the declaration, its own dispatch, and a comment in `packages/view-studio/src/app/App.browser.test.tsx:1065` noting it is declared and never called. So the reducer's behaviour never happens in the running product, and a Direct presentation whose target is deleted keeps pointing at something that no longer exists.

The interesting part is not the dead function, it is which check passed. `production.test.ts` exercises the reducer directly, so it is green and always has been; it proves the transition computes correctly, and says nothing about whether anything can reach it. That is the fourth member of one family found in a single day, after a lockfile no task validated, a raster comparison that proved agreement rather than correctness, and a dependency-boundary gate examining zero modules (`INFOSCHEMATICS-TOOL-074`).

`bun run self:unused:verify` exists — `INFOSCHEMATICS-TOOL-065` added it as the invoker `knip.json` never had — and it currently exits non-zero with three findings of its own: `packages/view-studio/src/app/panels/ThemeStrip.tsx` has no importer, and `isComponentsPath` (`apps/site/src/routes.ts:318`) and `componentsGuideContents` (`apps/site/src/VisualGuide.tsx:10`) are exported and unused. It is **not** part of `bun run self:check`, which is why a red analysis sits beside a green gate. Note that knip would not have found this item's defect either: `reconcileDirectTargets` is a property of an object the application does use, so it reads as live.

## Boundary

The reconciliation path, the three knip findings, and whether the analysis joins the gate. Not a redesign of Direct mode, and not the Direct target chooser's own content — that belongs to whichever item owns the panel.

## Steps

1. [ ] Settle the product question first, because it decides everything after: should a Direct presentation whose target leaves the document fall back to no target, or is holding the stale target the intended behaviour? The reducer and its tests assume the former. Verifiable by the answer being written down where a reader of `docs/specs/directing.md` will find it.
2. [ ] If reconciliation is wanted, find the place that knows the available targets changed and dispatch from there, then assert the behaviour through the application rather than through the reducer: delete a target from a document while Direct holds it, and watch the held target clear. Verifiable by that case failing against today's tree.
3. [ ] If it is not wanted, remove the action case, its union member, `reconcileDirectTargets`, and the three reducer tests, and say in the record why the behaviour was declined. Verifiable by the type-check passing with the union member gone.
4. [ ] Resolve the three knip findings — each is a real orphan or a real unused export, so each gets an importer or a deletion. `ThemeStrip.tsx` needs a decision rather than a reflex: check whether it is a panel someone meant to mount. Verifiable by `bun run self:unused:verify` exiting zero.
5. [ ] Clear the six `knip.json` configuration hints about redundant entry patterns under `scripts/`, which are the residue of the `entry: ["scripts/**/*.ts"]` pattern `TOOL-065` narrowed. Verifiable by the hints not printing.
6. [ ] Decide whether `self:unused:verify` joins `self:check`. It is a real check with real findings sitting outside the gate, which is the same argument this item is about. Verifiable by the task list `self:check` names.
7. [ ] Remove the explanatory comment at `App.browser.test.tsx:1065` once it is no longer true.

## Files touched

- `packages/view-present/src/production.ts` and `production.test.ts`
- `packages/view-studio/src/app/hooks/use-presentation.ts`
- `packages/view-studio/src/app/App.browser.test.tsx`
- `packages/view-studio/src/app/panels/ThemeStrip.tsx`, `apps/site/src/routes.ts`, `apps/site/src/VisualGuide.tsx`
- `knip.json`, and `package.json` if step 6 says yes
- `docs/specs/directing.md`

## Verify

- The behaviour step 1 settles is asserted through the application, not through the reducer, and that assertion fails on the tree where the dispatch is missing.
- `bun run self:unused:verify` exits zero with no configuration hints.
- `bun run self:check` passes.

## Dependencies / blocks

None. Step 1 is a product question and may need the owner.

## Documentation impact

### Specifications

`docs/specs/directing.md` owns Direct mode — not `presentation.md`, whose twelve PRESENT requirements are all about Present. It carries only two requirements, and DIRECT-001 (`docs/specs/directing.md:7`) is the one in play: its `_Verify:_` line already names `reduceProduction` in `packages/view-present/src/production.ts`, and its `_Evidence:_` line already claims the reducer "clears targets when another mode takes ownership" — a different transition from the one this item found unreachable. So step 1 most likely amends DIRECT-001 rather than adding DIRECT-003, and if reconciliation is declined, the amendment has to say so explicitly or the requirement keeps implying it.

### Guides

None.

## Batch exclusion

Excluded from `INFOSCHEMATICS-BATCH-018` on 2026-09-16. Step 1 is an owner question, and the two answers give the item different shapes: "clear it" adds a dispatch and an application-level assertion, "hold it" deletes an action case, a union member and three reducer tests. An autonomous run cannot pick between those without changing the item's boundary.

## Discussion

Step 2's framing is the part to keep. A unit test on a reducer is cheap and it is the right tool for the transition arithmetic — but on its own it cannot distinguish "this transition is correct" from "this transition is correct and unreachable". The assertion that would have caught this has to start where a user starts. That generalises past Direct mode: every reducer in `packages/view-present` deserves the same question asked once, and asking it is probably worth its own record.
