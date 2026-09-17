---
id: INFOSCHEMATICS-TOOL-081
area: TOOL
title: No reduced motion in the gate
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 8c2a8c359ec0512820fe5b2bb2f7f0aeec879e4f
created_at: 2026-09-16T16:10:00Z
updated_at: 2026-09-17T10:00:00Z
---

# No reduced motion in the gate

## Goal

Let a browser case assert what a treatment actually does under `prefers-reduced-motion: reduce`, so the repository's reduced-motion promises are held by a running page rather than by reading its stylesheet.

## Context

Raised by the delivery of travelling element emphasis (`INFOSCHEMATICS-TOOL-060`) and true of every animated treatment in the repository. No browser suite emulates reduced motion — `scripts/vitest-workspace.ts:50-59` configures Chromium (`:54`) for every browser suite and sets no media emulation, and no `.browser.test.tsx` calls `emulateMedia`; the token appears nowhere in the repository. Four workspaces consume `workspaceBrowserTests`, not three: `packages/view-canvas`, `packages/view-present`, `packages/view-studio` and `apps/site`. The doc comment at `scripts/vitest-workspace.ts:40` still says "the three that render into a real page" and is itself stale. Every reduced-motion assertion in the tree is therefore a string assertion against the stylesheet text — `packages/view-canvas/src/InfoschematicDiagram.signals.test.tsx:97`, `packages/view-canvas/src/Canvas.dynamics.test.tsx:138`, `:189`, `:260`, and `scripts/stylesheet-shadowing.test.ts:126`, all node suites: it proves a rule was written, never that it wins.

DYNAMIC-006 has already anticipated the objection and then not been held to it. `docs/specs/diagram-dynamics.md:99` requires that every reduced-motion rule be restated for each selector the full-motion treatment states "and MUST be held there by an assertion rather than by inspection", and the requirement reads `_Conformance:_ conforming` at `:107`. Whether a stylesheet-text assertion satisfies "an assertion rather than by inspection" is the substance of this item: it is an assertion, but it inspects the rule rather than the page.

Which is exactly the distinction that bit twice in one afternoon. `INFOSCHEMATICS-TOOL-059` found that `@media (prefers-reduced-motion: reduce)` adds no specificity, so a sustained rule carrying a class and an attribute keeps animating inside the media query unless the held case is restated there; a stylesheet-text assertion catches the restatement's absence only because someone knew to assert it. `INFOSCHEMATICS-TOOL-060` then found that `animation: none` cannot still an `animateMotion` element at all, because declarative SVG motion is not a CSS animation, so the travelling mark had to be removed with `display: none` instead. Both are cascade and platform questions, and both were settled by hand-driven screenshots rather than by the gate.

`TOOL-060` deliberately did not add the emulation, because it would have meant changing the shared `scripts/vitest-workspace.ts` mid-batch — the right call, and the reason this is a record.

## Boundary

The capability and one real case that uses it. Not a reduced-motion audit of every treatment, which would be its own item once the capability exists.

## Steps

1. [x] Establish how reduced motion is emulated for these suites, and prove the emulation takes effect before writing any assertion on it: a case that reads `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and expects `true`. Verifiable by that case failing without the emulation and passing with it. `scripts/vitest-workspace.ts` generates all four browser configurations from one shared shape for a documented reason — extend that shape rather than diverging one workspace, and correct the stale "three" in its comment at `:40` while there.
2. [x] Decide how a suite opts in. A whole-suite setting makes the ordinary cases run under reduced motion too, which changes what they measure; a per-case switch keeps that local. Record which, and why. Verifiable by the ordinary browser cases' behaviour being unchanged.
3. [x] Convert the two assertions that motivated this into real browser cases: the held emphasis staying steady rather than animating, and the travelling mark being absent rather than parked. Verifiable by each failing when its stylesheet rule is removed — the same inverse edit that proved them at the node level.
4. [x] Keep the node assertions. They catch a deleted rule cheaply; the browser cases catch a rule that loses. Say that in a comment so a later reader does not treat one as redundant.
5. [x] Note in `AGENTS.md`, beside the existing line about rendering and looking (`AGENTS.md:13`), that a reduced-motion promise is now gateable — so the next treatment is expected to bring one. If step 3 lands, say in DYNAMIC-006 which kind of assertion its restatement clause now means.

## Files touched

- `scripts/vitest-workspace.ts`
- `packages/view-canvas/src/Canvas.dynamics.browser.test.tsx`
- possibly `packages/view-canvas/package.json` and `turbo.json`, if a new suite or input appears
- `AGENTS.md`
- `packages/view-canvas/src/vitest-browser-commands.d.ts` — new; the per-workspace command type augmentation
- `packages/view-canvas/src/Canvas.dynamics.test.tsx` — comment only, step 4
- `docs/specs/diagram-dynamics.md` — DYNAMIC-006

## Verify

- The `matchMedia` probe from step 1 fails without the emulation.
- Each converted case fails when its rule is removed.
- `bun run self:check` — 44 tasks, forced once.

## Dependencies / blocks

None. Wants a quiet tree, because it edits the shared test configuration every browser suite reads.

## Documentation impact

### Specifications

DYNAMIC-006 (`docs/specs/diagram-dynamics.md:93`) already requires at `:99` that every restated reduced-motion rule "be held there by an assertion rather than by inspection", and it reads `_Conformance:_ conforming` at `:107` on the strength of stylesheet-text assertions. Whichever way this item lands, that clause gains the distinction it is currently silent about: whether asserting the rule's text satisfies it, or whether it takes a page under emulation. If the answer is the latter, the conformance state is wrong until step 3 lands.

### Decision Records

None. How a test harness emulates a media feature settles no product question.

### Guides

`AGENTS.md:13` carries the existing "render the result and look at it" line, and step 5 adds the sibling sentence beside it: a reduced-motion promise is now gateable, so the next treatment is expected to bring one. Nothing under `docs/guides/` moves.

## Review

### Delivered

A browser case can now put its page under `prefers-reduced-motion: reduce` and measure what the treatment actually does. `scripts/vitest-workspace.ts` defines one browser command, `emulateReducedMotion`, which calls `page.emulateMedia({ reducedMotion })` on the Playwright page the runner owns, and registers it for every workspace browser suite through the shared `browser.commands` block. A case asks for it with `await commands.emulateReducedMotion(true)` and hands it back with `false` when it is done.

Per case, not per suite, and the reason is written where the command is defined: one browser context serves a whole file, so a `contextOptions` setting would put every browser case in the repository under reduced motion — and most of them measure a treatment that animates. That would not fail; it would quietly change what the rest of the suite means.

The type augmentation lives in `packages/view-canvas/src/vitest-browser-commands.d.ts` rather than in one shared declaration, because a shared one would have to be imported by a package, and `nothing-imports-repository-scripts` in `.dependency-cruiser.ts` forbids shipped code from reaching `scripts/`. The declaration says that in a comment, so the next workspace that needs the command copies the file knowingly rather than hunting for the missing global.

Three cases in `packages/view-canvas/src/Canvas.dynamics.browser.test.tsx` use it. The first is the probe the record asked for: it reads `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before and after the command and expects `false` then `true`, so nothing below it asserts under an emulation that silently did not take. The second holds the sustained state emphasis to `animationName: 'none'` and `opacity: '0.9'` in a page that answers the query. The third asserts the travelling mark is removed rather than parked — `display: 'none'` and a zero bounding box — because no CSS animation property reaches declarative SVG motion. The second and third re-read the treatment later in the case, so a rule that applies only on first paint would not satisfy them.

The node assertions stay, and a comment above them says why they are not redundant: a stylesheet read asks whether the rule is present and catches a deleted one cheaply, while only a page can say whether the rule applies.

### Summary of changes

| File | Change |
| --- | --- |
| `scripts/vitest-workspace.ts` | `emulateReducedMotion` browser command defined and registered; the per-case rationale recorded beside it |
| `packages/view-canvas/src/vitest-browser-commands.d.ts` | New: the command's type augmentation, per workspace, with the boundary reason |
| `packages/view-canvas/src/Canvas.dynamics.browser.test.tsx` | Three cases: the emulation probe, the steady held emphasis, the removed travelling mark |
| `packages/view-canvas/src/Canvas.dynamics.test.tsx` | Comment: what a stylesheet assertion answers and what it cannot |
| `docs/specs/diagram-dynamics.md` | DYNAMIC-006 requires the assertion to be made of a page; `_Verify:_` and `_Evidence:_` follow |
| `AGENTS.md` | The sibling sentence beside "render the result and look at it" |

### Verification

`bun run self:check` — 45 of 45 tasks successful. The three new cases appear in the `@infoschematics/view-canvas:test:browser` output and the suite is 33 cases across 4 files.

The emulation was proven before anything was asserted on it, which is the whole point of step 1: the probe expects `false` before the command and `true` after, so an emulation that stopped working fails the case that establishes it rather than silently passing the two that depend on it.

### Outstanding concerns

`@vitest/browser-playwright`'s `BrowserCommandContext` is not exported from a package a test-facing file may import — the type lives behind `vitest/internal/browser`, which is what the `.d.ts` reaches for. That is a Vitest 4 surface and may change; the augmentation is four lines and local, so the cost of following it is small.

The record's boundary excluded a reduced-motion audit of every treatment, and that remains true: three cases exist where the capability now allows many. The Flow signal pulse, the Scene transitions, and the Studio's own motion are all still held by stylesheet reads alone.

### Post-change review

The interesting part is not the command but what it makes measurable. DYNAMIC-006 has required since it was written that every reduced-motion restatement "be held there by an assertion rather than by inspection", and read `_Conformance:_ conforming` on the strength of assertions that were inspection wearing a `toContain`. Two defects in one afternoon — `TOOL-059`'s sustained rule that kept animating inside the media query, and `TOOL-060`'s travelling mark that no CSS property could still — both had the shape of a rule present in the text and absent from the treatment. That is precisely the gap a stylesheet read cannot see, and it is now closed for the cases that found it.

### Mini recap

The runner now answers `prefers-reduced-motion` for a case that asks, per case rather than per suite. Three browser cases use it, the cheap stylesheet reads stay with a comment explaining the division of labour, and DYNAMIC-006 and `AGENTS.md` both now say that a reduced-motion promise is gateable.

## Discussion

The generalisation worth keeping: an assertion on stylesheet text and an assertion on a rendered page answer different questions, and the repository currently only asks the cheap one. "The rule is present" and "the rule applies" diverge precisely where the cascade is interesting — media queries, attribute selectors, and anything the platform does not treat as a CSS animation. Those are also the only places a reduced-motion rule is ever hard to get right.
