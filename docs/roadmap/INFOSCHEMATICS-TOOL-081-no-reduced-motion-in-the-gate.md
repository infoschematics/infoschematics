---
id: INFOSCHEMATICS-TOOL-081
area: TOOL
title: No reduced motion in the gate
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: 99d68b5fdeb2d645d4349dd8383eaef82aa294a7
created_at: 2026-09-16T16:10:00Z
updated_at: 2026-09-16T16:10:00Z
---

# No reduced motion in the gate

## Goal

Let a browser case assert what a treatment actually does under `prefers-reduced-motion: reduce`, so the repository's reduced-motion promises are held by a running page rather than by reading its stylesheet.

## Context

Raised by the delivery of travelling element emphasis (`INFOSCHEMATICS-TOOL-060`) and true of every animated treatment in the repository. No browser suite emulates reduced motion — `scripts/vitest-workspace.ts` configures Chromium for all three browser suites and sets no media emulation, and no `.browser.test.tsx` calls `emulateMedia`. Every reduced-motion assertion in the tree is therefore a string assertion against the stylesheet text: it proves a rule was written, never that it wins.

Which is exactly the distinction that bit twice in one afternoon. `INFOSCHEMATICS-TOOL-059` found that `@media (prefers-reduced-motion: reduce)` adds no specificity, so a sustained rule carrying a class and an attribute keeps animating inside the media query unless the held case is restated there; a stylesheet-text assertion catches the restatement's absence only because someone knew to assert it. `INFOSCHEMATICS-TOOL-060` then found that `animation: none` cannot still an `animateMotion` element at all, because declarative SVG motion is not a CSS animation, so the travelling mark had to be removed with `display: none` instead. Both are cascade and platform questions, and both were settled by hand-driven screenshots rather than by the gate.

`TOOL-060` deliberately did not add the emulation, because it would have meant changing the shared `scripts/vitest-workspace.ts` mid-batch — the right call, and the reason this is a record.

## Boundary

The capability and one real case that uses it. Not a reduced-motion audit of every treatment, which would be its own item once the capability exists.

## Steps

1. [ ] Establish how reduced motion is emulated for these suites, and prove the emulation takes effect before writing any assertion on it: a case that reads `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and expects `true`. Verifiable by that case failing without the emulation and passing with it. `scripts/vitest-workspace.ts` generates all three browser configurations from one shared shape for a documented reason — extend that shape rather than diverging one workspace.
2. [ ] Decide how a suite opts in. A whole-suite setting makes the ordinary cases run under reduced motion too, which changes what they measure; a per-case switch keeps that local. Record which, and why. Verifiable by the ordinary browser cases' behaviour being unchanged.
3. [ ] Convert the two assertions that motivated this into real browser cases: the held emphasis staying steady rather than animating, and the travelling mark being absent rather than parked. Verifiable by each failing when its stylesheet rule is removed — the same inverse edit that proved them at the node level.
4. [ ] Keep the node assertions. They catch a deleted rule cheaply; the browser cases catch a rule that loses. Say that in a comment so a later reader does not treat one as redundant.
5. [ ] Note in `AGENTS.md`, beside the existing line about rendering and looking, that a reduced-motion promise is now gateable — so the next treatment is expected to bring one.

## Files touched

- `scripts/vitest-workspace.ts`
- `packages/view-canvas/src/Canvas.dynamics.browser.test.tsx`
- possibly `packages/view-canvas/package.json` and `turbo.json`, if a new suite or input appears
- `AGENTS.md`

## Verify

- The `matchMedia` probe from step 1 fails without the emulation.
- Each converted case fails when its rule is removed.
- `bun run self:check` — 44 tasks, forced once.

## Dependencies / blocks

None. Wants a quiet tree, because it edits the shared test configuration every browser suite reads.

## Discussion

The generalisation worth keeping: an assertion on stylesheet text and an assertion on a rendered page answer different questions, and the repository currently only asks the cheap one. "The rule is present" and "the rule applies" diverge precisely where the cascade is interesting — media queries, attribute selectors, and anything the platform does not treat as a CSS animation. Those are also the only places a reduced-motion rule is ever hard to get right.
