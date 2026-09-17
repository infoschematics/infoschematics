---
id: INFOSCHEMATICS-TOOL-078
area: TOOL
title: Unreachable direct-target reconciliation
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 2289978ff11cb88a744a6b5de5c4f69ee2b95da5
created_at: 2026-09-16T14:55:00Z
updated_at: 2026-09-17T10:00:00Z
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

1. [x] Settle the product question first, because it decides everything after: should a Direct presentation whose target leaves the document fall back to no target, or is holding the stale target the intended behaviour? The reducer and its tests assume the former. Verifiable by the answer being written down where a reader of `docs/specs/directing.md` will find it.
2. [x] If reconciliation is wanted, find the place that knows the available targets changed and dispatch from there, then assert the behaviour through the application rather than through the reducer: delete a target from a document while Direct holds it, and watch the held target clear. Verifiable by that case failing against today's tree.
3. [ ] If it is not wanted, remove the action case, its union member, `reconcileDirectTargets`, and the three reducer tests, and say in the record why the behaviour was declined. Verifiable by the type-check passing with the union member gone. Retired by step 1's answer.
4. [x] Resolve the three knip findings — each is a real orphan or a real unused export, so each gets an importer or a deletion. `ThemeStrip.tsx` needs a decision rather than a reflex: check whether it is a panel someone meant to mount. Verifiable by `bun run self:unused:verify` exiting zero.
5. [x] Clear the six `knip.json` configuration hints about redundant entry patterns under `scripts/`, which are the residue of the `entry: ["scripts/**/*.ts"]` pattern `TOOL-065` narrowed. Verifiable by the hints not printing.
6. [x] Decide whether `self:unused:verify` joins `self:check`. It is a real check with real findings sitting outside the gate, which is the same argument this item is about. Verifiable by the task list `self:check` names.
7. [x] Remove the explanatory comment at `App.browser.test.tsx:1065` once it is no longer true.

## Files touched

- `packages/view-studio/src/app/direct-targets.ts` — new
- `packages/view-studio/src/app/App.tsx` and `packages/view-studio/src/app/panels/DetailsPanel.tsx`
- `packages/view-studio/src/app/App.browser.test.tsx`
- `packages/view-studio/src/app/panels/ThemeStrip.tsx` — deleted, with its styles in `packages/view-studio/src/styles.css`
- `apps/site/src/routes.ts` and `apps/site/src/VisualGuide.tsx`
- `knip.json`, `package.json`, `turbo.json`
- `docs/specs/directing.md`, `README.md`, `AGENTS.md`

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

## Review packet

### Delivered

A Direct target whose subject leaves the document is released, through one mechanism: `App` derives the available targets and dispatches them to the production reducer whenever they change. `DIRECT-003` states the behaviour and the host obligation. `self:unused:verify` joins `self:check`, with its configuration hints treated as errors, and the three findings it was carrying are resolved.

### Summary of changes

Step 1 was answered "release it", which is what the reducer and its three cases already assumed. The reason the answer was not arbitrary: a held-but-absent target is not merely stale, it is unreadable — the chooser matches its value against its options, so a target pointing at a removed Scene displays as no selection while the Diagram stays in its Scene-focusing treatment. A Producer sees a mode with nothing selected that is nevertheless focused on something.

Step 2 turned out to be two problems, not one. The dispatch was the easy half: `packages/view-studio/src/app/direct-targets.ts` now derives the option list once, `DetailsPanel` reads it for its chooser and `App` hands the same list to `reconcileDirectTargets`, so the list the Producer chooses from and the list the reducer reconciles against cannot drift. The hard half was that no application-level case could be made to fail, and the reason was a second release path nobody had named: `DetailsPanel` cleared a target with no matching option in an effect of its own. So the product behaviour partly existed while the reducer's path stayed unreachable, and any case written against the panel proved the panel. That effect now syncs only the kind tab, and `DIRECT-003` requires the single mechanism in as many words, because two paths are exactly how the unreachable one stayed unnoticed.

The case that discriminates removes a Scene from the Scene library in Direct — the list the chooser offers is the library the panel edits, so that is how a directed Scene leaves the document from inside Direct. It removes a Scene the target does not name first, and the target holds; then the directed one, and the focusing treatment goes while Direct stays the mode. With the `App` dispatch removed it fails, which is the vacuity check `DIRECT-003` records.

Step 4's three findings resolved as two deletions and one decision. `ThemeStrip.tsx` was a panel someone did mean to mount, and then stopped: `76843484 feat(presentation): unify themes and stories as sequences` gave `PanelRail` the same job through `activateSequence`, and the strip was left behind rendering `toggleThematicScene` over the older thematic-scene API. It goes, and so do the five `.theme-button` and `.rail-theme` rules and the rail image rule that only its logo mark ever used. `isComponentsPath` was a route predicate `getComponentRoute` already covers, and `componentsGuideContents` an outline `VisualGuide` builds inline where it needs it; both go.

Step 6 is yes, and the reason it could be yes is that knip has its own coverage assertion available. `--treat-config-hints-as-errors` turns "pattern matched nothing" into a failure, which is the silence `AGENTS.md` requires a new gate check to rule out — proven by pointing `packages/*` at `src/**/*.nothing`, which exits 1 with sixteen refine hints where the same run without the flag exits 0. The task's `inputs` were proven by editing one file under each of `packages/*/src/**` and `apps/site/src/**` and watching the cache miss.

### Verification

`bun run self:check` — 46 of 46 tasks successful, the forty-sixth being the newly gated `self:unused:verify`. `bun run self:unused:verify` exits zero with no findings and no configuration hints. Studio's browser suite is 21 cases; the new one fails with `presentation.reconcileDirectTargets(directTargets)` removed and passed with the panel's own clearing still in place, which is why that clearing had to go.

### Outstanding concerns

Deleting `ThemeStrip` leaves `toggleThematicScene` on the presentation facade with no caller, and `toggle-theme-scene` in `packages/view-present/src/presentation.ts` reachable from nothing in Studio. That is this item's own defect one level down, and it is deliberately not fixed here: removing it is a `PresentationAction` union change in a published package and a product question about whether Present should offer a direct thematic-scene toggle at all. It is a candidate for its own record.

Knip still cannot see a defect of this shape. `reconcileDirectTargets` is a property of an object the application uses, so it read as live then and `toggleThematicScene` reads as live now. The gate gained a real check, not this check.

No decision record was written. The reasoning that matters — release rather than hold, one mechanism rather than two — is a requirement's to state, and `DIRECT-003` states both with the vacuity check attached; nothing about the document contract changed.

### Post-change review

The item was filed as an unreachable reducer case, and it was one, but the more useful finding was underneath it: a panel had quietly grown the same behaviour, so the product looked correct, the reducer test was green, and an application-level case could pass while proving nothing. A second implementation of a behaviour is how the first one becomes unreachable without anybody noticing — and it defeats the vacuity check too, which is why `DIRECT-003` names the single mechanism rather than only the outcome.

### Mini recap

One option list, one dispatch, one requirement; a stale Direct target now goes, and the check that finds dead code is inside the gate.
