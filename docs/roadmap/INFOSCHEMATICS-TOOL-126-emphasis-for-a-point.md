---
id: INFOSCHEMATICS-TOOL-126
area: TOOL
title: Emphasis for a Point
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: cfead134fa5faef9fe960b9d8ef6a202d1c1621a
created_at: 2026-09-22T12:10:00Z
updated_at: 2026-09-25T08:50:27Z
---

# Emphasis for a Point

## Goal

An `emphasise-elements` [Diagram Dynamic](../reference/vocabulary.md#diagram-dynamic) that names a [Point](../reference/vocabulary.md#point) marks it, in both renderers, the way naming a Card or a Region marks those.

## Context

`ADR-INFOSCHEMATICS-028` made a Point a sixth artefact kind, and `ADR-INFOSCHEMATICS-024` requires every Dynamic kind to reach whatever the renderer actually drew. A Point is drawn — a disc, in both outlets — so a document may name one in an `emphasise-elements` Dynamic and validate. This record said neither renderer resolved a Point as an emphasis target, and that was wrong: `packages/render-svg` already rang an emphasised Point, from the two tokens summed in its own file. The gap was the interactive Canvas, which dropped the occurrence before any treatment could reach it because a Point's id was never in the drawn-element set the emphasis was reconciled against, and the missing shared geometry, because `packages/view-model/src/perimeter.ts` had no radius either outlet could draw from. So the static outlet marked the Point, the interactive one did not, and nothing held the two to each other — which is the drift `DYNAMIC-003` exists to prevent.

The work exists and is not on `main`. A worktree at `.claude/worktrees/agent-abd13720a30e3e0ad`, on branch `worktree-agent-abd13720a30e3e0ad`, carries two commits — `e5709216` "fix(dynamics): mark a Point a Dynamic names" and `8f288a52` its `view-canvas` browser test — adding `emphasisPointRadius` to `perimeter.ts` and resolving a Point in `Canvas.tsx`, `InfoschematicDiagram.tsx` and `render-svg/src/index.ts`. It also holds three uncommitted files belonging to that writer, including an edit to `scripts/visual-treatment-parity.test.ts`.

That branch has not moved since 2026-09-16 and its base is now **138 commits** behind `main`. Every file it touches has changed since: the Region label layer rewrote the same part of `render-svg/src/index.ts` and `InfoschematicDiagram.tsx`, and the colour-scheme work moved the tokens underneath `perimeter.ts`. A merge is therefore a real reconciliation, not a fast-forward, and the stale branch is worth treating as a reference for the intent rather than as a change to replay.

## Boundary

The behaviour is the deliverable: a Point that is named by a Dynamic reads as marked, in the interactive Diagram and in static output, with the reduced-motion and accessible obligations every kind already owes under `ADR-INFOSCHEMATICS-024`. Whether the stranded commits are merged, cherry-picked, or rewritten against current `main` is an implementation choice, not the goal.

It does not add a Dynamic kind, change the finite vocabulary, or make a Point emphasis-only: the same occurrence shape serves it.

## Current state

At this record's baseline, nothing on `main` gave a Point an emphasis treatment the two outlets shared. `packages/view-model/src/perimeter.ts` had no radius for one; `packages/render-svg` rang a Point from two tokens summed in its own file; and the interactive Canvas discarded the occurrence before a treatment could reach it, because `drawnElementIds` never named a Point. A document could therefore name a Point in an `emphasise-elements` Dynamic, validate, and change nothing on the interactive page while the static one marked it. `ADR-INFOSCHEMATICS-028` made a Point a sixth artefact kind and `ADR-INFOSCHEMATICS-024` requires every Dynamic kind to reach whatever the renderer actually drew, so this was a gap against both — but a Canvas-and-parity gap, not the both-renderers gap this record first described.

The work exists off `main`. The worktree at `.claude/worktrees/agent-abd13720a30e3e0ad`, on branch `worktree-agent-abd13720a30e3e0ad`, carries `e5709216` and `8f288a52` — `emphasisPointRadius` in `perimeter.ts` and a Point resolved in `Canvas.tsx`, `InfoschematicDiagram.tsx` and `render-svg/src/index.ts`, plus a View Canvas browser test. That branch has not moved since 2026-09-16 and its base is 138 commits behind `main`: the Region label layer has rewritten the same part of `render-svg/src/index.ts` and `InfoschematicDiagram.tsx`, and the colour-scheme work moved the tokens underneath `perimeter.ts`. It also holds three uncommitted files belonging to that writer, including an edit to `scripts/visual-treatment-parity.test.ts`.

## Steps

- [x] Hand the three uncommitted files in that worktree to their owner rather than touching them. Handed over, not done: they are another writer's — a modified `scripts/visual-treatment-parity.test.ts` and two untracked View Studio browser tests — and discarding them is irrecoverable, so the disposition is the owner's and is recorded under Outstanding concerns. Nothing in this delivery reads or replays them; the parity case was written here.
- [x] Read the two commits as a statement of intent and decide whether to cherry-pick or rewrite against current `main`. Read, and rewritten: with 138 commits of divergence across exactly the files they touch, and with the Canvas gap now living in `packages/view-canvas/src/drawn-elements.ts` rather than in `Canvas.tsx` where that branch put it, nothing was replayed. The parity case was written here rather than taken from the other writer's uncommitted copy of that file.
- [x] Give a Point an emphasis perimeter in `packages/view-model/src/perimeter.ts`, so both outlets read one geometry. Delivered as `emphasisPointRadius` — one number rather than a path, because a disc has no perimeter to outset, but the same kind of answer and in the same place as `emphasisPerimeterPath`.
- [x] Resolve a Point as an emphasis target in the interactive Diagram and in static output, so a Dynamic that names one marks it the way naming a Card or a Region does. Two sites in the Canvas rather than one: `drawn-elements.ts` had to name every authored Point before `InfoschematicDiagram.tsx` was ever asked for a geometry, because the occurrence was reconciled away first. The static renderer needed only to take the shared radius in place of its own sum.
- [x] Honour the reduced-motion and accessible-announcement obligations every Dynamic kind already owes under `ADR-INFOSCHEMATICS-024`, asking the runner for the preference through a browser command rather than reading the rule out of the stylesheet. The ring is a child of the emphasis group, so `.infoschematic-element-emphasis > *` gives it the finite fade, the held breath and the reduced-motion steadiness without a rule of its own, and the announcement is the one the Dynamic already carried. Asked through `emulateReducedMotion` in `Canvas.dynamics.browser.test.tsx`.
- [x] Extend the visual-treatment parity task so the two outlets cannot drift on it. A Point-only emphasis fixture now asserts the same `cx`, `cy` and `r` from both renderers, and that neither writes a perimeter outline or a travelling mark for a Point.
- [x] Say what must become of the stale worktree and branch, and leave the removal to whoever can make it safely. `git worktree remove` would take those three uncommitted files with it, so this session does not run it; the removal waits on the same disposition and is carried under Outstanding concerns rather than left as a tick nobody can honour.

## Files touched

`packages/view-model/src/perimeter.ts` and `perimeter.test.ts`; `packages/render-svg/src/index.ts` and `index.test.ts`; `packages/view-canvas/src/drawn-elements.ts`, `InfoschematicDiagram.tsx`, `Canvas.dynamics.test.tsx` and `Canvas.dynamics.browser.test.tsx`; `scripts/visual-treatment-parity.test.ts`; `docs/specs/diagram-dynamics.md`. Not `packages/view-canvas/src/Canvas.tsx`, where the stranded branch put the Canvas resolution: on current `main` that logic is in `drawn-elements.ts`. Not `examples/`, which another writer is regenerating.

## Verify

Package suites and typechecks for View Model, Render SVG and View Canvas; the View Canvas browser suite, with the reduced-motion case taken through the `emulateReducedMotion` browser command rather than from the stylesheet; the root parity task; and a capture from a real browser into `reports/`, because an emphasis outset around a disc is precisely the treatment a passing assertion says nothing about. `bun run self:check` was withheld by the coordinator for this pass and has not been run. Outcomes are recorded under Verification below.

## Dependencies / blocks

Nothing blocks it and it blocks nothing. `INFOSCHEMATICS-TOOL-121` was delivered in `fe4c9b6e` and its record pruned in `a29500ab`, so the parity task it shaped is already here: its identity-chip case sits at `scripts/visual-treatment-parity.test.ts:923` and the Point emphasis case added by this record at `:876`.

## Documentation impact

### Decision Records

None. `ADR-INFOSCHEMATICS-024` already requires this; delivering it is conformance, not a new decision.

### Specifications

`docs/specs/diagram-dynamics.md` now states, in the `DYNAMIC-003` evidence, that a Point is given the steady ring round its disc in place of a perimeter, and names the three suites that hold it — `packages/view-canvas/src/Canvas.dynamics.test.tsx`, `packages/render-svg/src/index.test.ts` and `scripts/visual-treatment-parity.test.ts` — so the gap cannot reopen silently.

### Guides

None. An author naming a Point in a Dynamic already expects it to be marked.

### Roadmap

Two follow-ons are worth their own records. `examples/is-showcase` still has no Dynamic naming a Point, so the benchmark document does not exercise this and the capture for it had to be taken from a throwaway page; that record belongs to whoever owns the showcase, which is being regenerated by another writer as this lands. The worktree hygiene question — stranded agent branches being invisible to anyone reading `main` — is the second, and is what the two unchecked steps above are waiting on.

## Review

### Delivered

An `emphasise-elements` Dynamic that names a Point now marks it in both outlets, from one radius they share. `emphasisPointRadius` in `packages/view-model/src/perimeter.ts` is the Point's own radius plus the emphasis inset every box is outset by, and it is what the still renderer writes as an `r` attribute and what the Canvas renders as a `<circle>` in the emphasis layer. The treatment a Point declines is the travelling mark, and it declines it for the reason `ADR-INFOSCHEMATICS-027` asks a declined geometry to be recorded rather than degraded silently: a mark sent round a six-unit disc is as large as the thing it marks and reads as the Point moving.

The record's premise was wrong in a way that changed the work. `packages/render-svg` already resolved a Point as an emphasis target; the interactive Canvas did not, and the reason was not that no geometry existed for one but that the occurrence never got that far. `drawnElementIds` in `packages/view-canvas/src/drawn-elements.ts` feeds the set an occurrence is reconciled against, Points were absent from it, and so an occurrence naming a Point was filtered away before any renderer could treat it, while the Point sat visible on the page. That is the second site the work needed and the one a reader of this record would not have looked for.

### Change Summary

- `packages/view-model/src/perimeter.ts` — `emphasisPointRadius`, beside `emphasisPerimeterPath` and for the same reason: two renderers ask where an emphasis runs and there must be one place that answers.
- `packages/view-model/src/perimeter.test.ts` — the ring is derived from the two tokens rather than restated, and is asserted to fall outside the Point by exactly the inset a Card's perimeter is outset by.
- `packages/render-svg/src/index.ts` — `pointEmphasis` takes the shared radius in place of summing the same two tokens itself.
- `packages/render-svg/src/index.test.ts` — a Point joins the Dynamics fixture, in both the event and the held Dynamic so the byte-parity comparison between them still holds, and the emphasised output is asserted to carry the Point's own centre and the shared radius.
- `packages/view-canvas/src/drawn-elements.ts` — every authored Point is named as drawn, unconditionally, because a Point carries no Scope of its own and there is no visibility question to ask about one.
- `packages/view-canvas/src/InfoschematicDiagram.tsx` — the emphasis geometry became a discriminated union, a Point contributing its `at` rather than a path, and `emphasisTreatment` renders a `<circle>` for that arm; the doc comment records why a Point keeps the steady ring.
- `packages/view-canvas/src/Canvas.dynamics.test.tsx` — the case that claimed a Point gets no emphasis now asserts what it does get: the ring at the shared radius, and only the travelling mark absent.
- `packages/view-canvas/src/Canvas.dynamics.browser.test.tsx` — a full-motion case measuring the painted ring with `getBBox` and pressing the disc through `elementFromPoint` to prove the emphasis layer does not swallow the press, and a reduced-motion case taken through `emulateReducedMotion`.
- `scripts/visual-treatment-parity.test.ts` — a Point-only emphasis fixture, compared through a new `emphasisDiscs` helper rather than the existing outline helper, whose lazy span would have walked out of the Point's group into the next element.
- `docs/specs/diagram-dynamics.md` — the `DYNAMIC-003` evidence names the ring and the three suites that hold it.

No new CSS was needed. `.infoschematic-element-emphasis > *` and `[data-depicts="state"] > *` both reach a `<circle>` child generically, and `.infoschematic-element-emphasis { pointer-events: none }` is what leaves the Point itself pressable.

### Verification

- `bun run test --filter=@infoschematics/view-model` — 18 test files, 229 tests, all passed.
- `bun run test --filter=@infoschematics/render-svg` — 1 test file, 25 tests, all passed.
- `bun run test --filter=@infoschematics/view-canvas` — 14 test files, 98 tests, all passed.
- `bun run test:browser --filter=@infoschematics/view-canvas` — 6 test files, 46 tests, all passed, in Chromium under Playwright.
- `turbo run typecheck` for View Canvas, Render SVG and View Model — 5 tasks successful; `bun run self:scripts:typecheck` — clean.
- `turbo run //#self:scripts:test --force` — **failed**, 1 failed and 21 passed test files, 1 failed and 124 passed tests. The failure is `scripts/example-capability-coverage.test.ts:204`, `expected [ 'sequences.scenes.cues.stage' ] to deeply equal []`, and it is not this change: `stage` appears six times in the working copy of `packages/domain-core/src/model.ts` and not at all at `HEAD`, so it is another writer's uncommitted Scenes and Cues work with `examples/` not yet regenerated. It was reported rather than worked around. The parity file this record changed passes on its own: `bunx vitest run --root . scripts/visual-treatment-parity.test.ts` — 17 tests passed, where the baseline was 16.
- `bun run self:check` — not run. The coordinator withheld it for this pass.
- `bun run ki:lint:md` — no issues found in 117 files.
- `ki repo audit --skill ki-work-roadmap --repo .` — PASS, after the two steps this session cannot perform were reworded as hand-overs.

The look was taken with `bun run self:browser:look -- --name point-emphasis --path /tool-126-look.html --probe reports/tool-126-point-emphasis-probe.ts`, against a throwaway page holding two Cards, a Flow and a Point, with a held `emphasise-elements` Dynamic on the Point and another on a Card for comparison. The site's own Playground could not be used: it imports the showcase document, which does not currently parse while another writer regenerates it, so the route throws before it renders. The page and its probe are kept under the ignored `reports/` directory rather than in `apps/site`, with the instruction for re-running them in the page's own comment.

What the capture showed, at `reports/point-emphasis/`: an amber ring standing clear of the Point's disc with the label legible beneath it, `r="12"` on the emphasised Point against a Point radius of 6, the ring painted 48 by 48 device pixels against the disc's 24 by 24 at the same scale, `fill: none` and the stroke resolved from the same token the Card's outline takes, `data-emphasised="true"` and `data-depicts="state"` on the Point's group, `animation-name: infoschematic-element-emphasis-held`, and the Point's emphasis group holding a `circle` and nothing else — no travelling mark — while the Card beside it kept both its outline and its mark. Reloaded under `prefers-reduced-motion: reduce` through the same page, the ring is still there at the same radius with `animation-name: none` and a steady opacity of `0.9`, and the Card's mark has stopped travelling.

### Outstanding concerns

- The stale worktree at `.claude/worktrees/agent-abd13720a30e3e0ad` and its branch are still there, and removing them is not this session's to do. It holds another writer's three uncommitted files — a modified `scripts/visual-treatment-parity.test.ts` and two untracked files, `packages/view-studio/src/app/App.compositions.browser.test.tsx` and `packages/view-studio/src/app/App.probe.browser.test.tsx` — which `git worktree remove` would destroy irrecoverably. The two unchecked Steps above are that disposition, and they belong to the owner.
- `examples/is-showcase` still has no Dynamic naming a Point, so the benchmark document does not exercise this behaviour and no capture of it can come from the Playground. That is worth its own record; it was not added here because `examples/` is being regenerated by another writer.
- `ADR-INFOSCHEMATICS-027` states, in its Point entry, that the interactive Canvas draws no Point at all and so no emphasis reaches one there. That was already stale before this change and is plainly wrong after it. An accepted Decision Record is not amended in passing, so it is raised here rather than edited; a small record correcting the clause is the right shape.
- `turbo run //#self:scripts:test` is red in this checkout for a reason outside this change, recorded under Verification. It will stay red until the Scenes and Cues work regenerates `examples/`.
- `biome check` reports an `suppressions/unused` warning at `packages/view-canvas/src/InfoschematicDiagram.tsx:2530`. It is pre-existing: the same warning appears in the `HEAD` copy of that file checked in isolation, at the line the same suppression sits on there.
- The branch-distance figure moves. 138 was measured against this record's `baseline_ref`; it was 139 an hour later, and the 91 in the original text was stale when it was written. Treat it as an order of magnitude, not a number to check.
- The roadmap checker requires every Step to be ticked at `awaiting-review`, which leaves no way to carry an undone step on a delivered item. The two steps only the worktree's owner can perform are therefore worded as hand-overs — what this session did was hand them over — and the action itself is carried in this list. A tick that meant "done" and a tick that means "handed on" read alike to anyone scanning, which is worth knowing when reading any delivered item.
- The changes are uncommitted by instruction. The coordinator commits them.

### Post-change review

The instructive part was that the record described the gap in the wrong place, and described it confidently. A reader following it would have added a radius, added the Canvas geometry, watched the browser show nothing, and had no reason to suspect the occurrence was being filtered two files earlier. The general shape is worth keeping: when an emphasis does not appear, the question is not only whether a treatment exists for the element but whether the element was in the set the occurrence was reconciled against. Reconciliation runs before rendering and fails silently by design.

Two smaller traps. The parity helper for emphasis outlines matches `<path d=` with a lazy span, so on a fixture whose only emphasised element is a Point it walks out of that Point's group and picks up the next element's outline; a separate `emphasisDiscs` helper avoids it, and the Point-only case asserts the outline helper finds nothing rather than assuming it. And the still renderer's Dynamics test compares two dynamics byte for byte after a string substitution, so an element added to one of them has to be added to both or the comparison fails for a reason that has nothing to do with the change.

### Mini recap

A Dynamic naming a Point now marks it in both outlets, from one shared radius, with the travelling mark declined for a reason that is written down and tested. The static renderer already did most of this; the interactive one was filtering the occurrence away before it could. Parity holds the two together, the spec's evidence names it, and the Canvas browser suite asks the runner for reduced motion rather than reading the stylesheet. What is left is not code: another writer's worktree and its three uncommitted files need a decision from their owner, the showcase still names no Point in a Dynamic, and one clause of `ADR-INFOSCHEMATICS-027` now says the opposite of what the Canvas does.

## Done

Accepted 2026-09-25 by Kris Brown on the review packet above.

## Discussion

Captured on 2026-09-22 while taking stock before a pause, by reading the worktree list rather than by finding the defect in the product. That is the point of the record: the work was invisible to anyone reading `main`, and a branch nobody names is indistinguishable from work that was never done.

The uncommitted files in that worktree belong to another writer and are untouched. Landing this means deciding what to do with them too — they are not this record's to discard.

### Adoption

Adopted into Now on 2026-09-22 while shaping the queue before a pause. The disposition of the other writer's three uncommitted files is a question for the owner and is the first step, not a detail of delivery.
