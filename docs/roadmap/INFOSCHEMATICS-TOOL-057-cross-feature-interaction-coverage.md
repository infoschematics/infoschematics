---
id: INFOSCHEMATICS-TOOL-057
area: TOOL
title: Cross-feature interaction coverage
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: fde24e650cf4d7c0d1fb96eaf50f4ca1b31168c9
created_at: 2026-09-15T05:19:55Z
updated_at: 2026-09-17T09:45:00Z
---

# Cross-feature interaction coverage

## Goal

Establish accepted requirements and coverage for what happens when two features are used together, so a feature that degrades another's usability fails a run rather than waiting to be noticed by hand.

## Context

The Specifications corpus verifies features in isolation. Every requirement can be individually conforming and the suite green, and nothing in that arrangement can observe two correct features combining into a worse experience.

It matters now because the features that share these surfaces have landed rather than being about to. Design interaction layers, multi-selection alignment, the authored grid size, Diagram Dynamics and the Studio-backed Playground were all accepted and pruned in the last few days, so the contention is live in the tree. What is still ahead on the same surfaces — Scene signal treatments, the held and travelling element emphases, Point interactivity and the docked panels — will be verified against its own feature area and nowhere against what it lands beside.

`INFOSCHEMATICS-TOOL-064` is the proof that this is not hypothetical. A held-group treatment was written in Canvas, reached the element, passed the whole suite, and was still not drawn, because Studio's own stylesheet shadowed it. That defect lived in the composition of two correct things and no requirement named the composition.

## Boundary

This item does not add end-to-end tests of whole user journeys as a substitute for feature coverage, re-verify individual requirements, define usability matters of taste, or block feature work behind a new gate before the collisions are understood.

It also does not repoint stale evidence or resolve non-conforming requirements. `INFOSCHEMATICS-TOOL-056` did that and is awaiting review; this item consumes its result rather than repeating it.

## Current state

The corpus holds 187 requirements across the 17 feature areas listed in `docs/specs/index.md`. Of those, 184 are `conforming` and 3 are `divergent`: `DESIGN-014` (`docs/specs/design-session.md:147`, Point neither pointed at nor reached, tracking `INFOSCHEMATICS-TOOL-063`), `DESIGN-017` (`docs/specs/design-session.md:223`, document-global `defs` identifiers, tracking `INFOSCHEMATICS-TOOL-058`) and `SCENE-006` (`docs/specs/scenes-and-callouts.md:71`, unreproduced playback memory growth, tracking `INFOSCHEMATICS-TOOL-069`). Nothing is `pending` any more — `8d3624ce` decided every one of them.

`INFOSCHEMATICS-TOOL-056` has already delivered the mechanical defence this item was going to need. `scripts/specification-evidence.test.ts` parses every requirement and asserts one recognised conformance state per requirement (lines 76-86), that every cited repository path resolves (88-101), and that every cited bare filename names a file somewhere (103-112). It runs under `bun run self:scripts:test`, which the root `package.json` defines as `vitest run --root .`. An evidence line added by this item is therefore checked, not trusted, and that step is done rather than outstanding.

The earlier reading that the corpus holds no cross-feature constraint at all is wrong, and the correction is what shapes the work. Three requirements already carry one, each written as a clause inside one owning requirement: `DESIGN-015` requires that at least one movement case run while zoomed and panned, inside a flat `MUST exercise` matrix (`docs/specs/design-session.md:201`); `DESIGN-018` requires a Card port to follow the Flow's interaction layer rather than its host's (`:157`); `DESIGN-020` requires an element whose interaction layer closes to leave a held group exactly as it leaves a single selection (`:183`). All three link the shared concept by vocabulary id and none references another requirement by id — a cross-area grep over `docs/specs/*.md` finds only Decision Record and roadmap links leaving an area file. So the siting question has a working precedent in one area and no rule for the corpus.

The code side of that last constraint is already implemented: `selectionSetWithinLayers` at `packages/view-model/src/editable.ts:213-216` filters a held selection set through the interaction-layer set, with a comment at 209-211 saying the group must not carry a second notion of selectability. What it does not have is a case that observes the composition on a rendered surface.

`INFOSCHEMATICS-TOOL-064` (`adc0d6b6`, awaiting review) landed the first instrument of the kind this item wants, and landed it without a requirement. `scripts/stylesheet-shadowing.test.ts` fails when a stylesheet redeclares a selector its import chain already gives it, comparing one selector at a time with combinators flattened; `packages/view-studio/src/app/App.treatments.browser.test.tsx` asserts Canvas-owned treatments through Studio's own stylesheet, which is the only place the original defect was visible. That is a composition defended by a check that nothing in the corpus names — this item's gap in one concrete, already-paid-for instance.

Ten browser test files exist: four under `apps/site/src/`, four under `packages/view-canvas/src/`, and `App.browser.test.tsx` and `App.treatments.browser.test.tsx` under `packages/view-studio/src/app/`. `packages/view-canvas`, `packages/view-studio` and `apps/site` each declare `test:browser` as `vitest run --config vitest.browser.config.ts`; the root `bun run test:browser` is `turbo run test:browser`. That is the right home for composition cases, because these behaviours depend on real layering, pointer capture and focus rather than a simulated DOM.

No `turbo.json` change is needed. `//#self:scripts:test` already hashes `scripts/**`, `docs/**` and `packages/*/src/**` (lines 88-102), and `test` and `test:browser` declare no `inputs` at all (lines 35-40), so they rerun on any package file.

## Steps

1. [x] Decide the instrument and record it as a Decision Record. Both candidates are already in the tree: extend a flat `MUST exercise` matrix inside the owning requirement, as `DESIGN-015` does, or give each composition its own requirement with its own conformance state and evidence line. The record must also say where a constraint is sited when neither feature is the newer one. Verifiable: `docs/decisions/ADR-INFOSCHEMATICS-034-a-composition-is-its-own-requirement.md` exists, is listed in `docs/decisions/README.md`, and answers both questions.
2. [x] Enumerate the contended resources and derive the pairs from them rather than from the feature list — the same pointer gesture, keyboard binding, selection, screen region, document order, or motion channel. Verifiable: the derived table lands in the Decision Record, one row per pair naming the shared resource, the two owning requirement ids, and the surface a case would run on. Restrict it to resources with two live claimants today.
3. [x] Retro-fit the composition that already has a check and no requirement: "a treatment written once in Canvas reaches the Studio surface", defended by `scripts/stylesheet-shadowing.test.ts` and `packages/view-studio/src/app/App.treatments.browser.test.tsx`. Doing this first proves the chosen instrument against evidence that already exists and costs nothing to produce. Verifiable: `bun run self:scripts:test` resolves the new requirement's evidence lines.
4. [ ] Explore the live surfaces by hand and record what is found before writing anything. `bun run self:dev` serves the site with the Studio-backed Playground; drive Design mode with interaction layers closed, a held group of three, a non-default authored grid size, and a Dynamic running. Verifiable: each observation is written into this record's Discussion, so the finding survives whether or not it becomes a requirement. Driven, and the observations are below; the pass is left open for the lead's own rendered walk, which is what step 6's cases are written against.
5. [x] Write one requirement per confirmed collision in the home step 1 chose, each carrying `_Conformance:_`, `_Verify:_` and `_Evidence:_` lines, and a vocabulary link on first use of each canonical concept. Verifiable: `bun run self:scripts:test` — `scripts/specification-evidence.test.ts` checks the conformance value and the evidence paths, and `scripts/vocabulary-citations.test.ts` checks every cited vocabulary id resolves.
6. [ ] Add one browser case per requirement to the suite that owns the surface, and prove each fails when the collision is reintroduced rather than only that it passes today. Verifiable: `bun run test:browser` green, plus a deliberate reintroduction per case with the failure observed. Reserved to the lead's test pass: each requirement's `_Verify:_` line states the case and its reintroduction proof, and the three divergences carry their own items.
7. [x] Where a collision turns out to be a regression rather than a defect, state the property that was lost as the requirement, so it cannot be traded away silently a second time. Verifiable: the requirement names the property, not the fix that restored it.
8. [x] Record what the pass did not reach as an unnumbered candidate in the `## Gaps` section of each touched area file, which is the corpus's existing convention for exactly that. Verifiable: each touched area file's `## Gaps` section names the pairs left unverified.

## Files touched

- `docs/decisions/ADR-INFOSCHEMATICS-034-a-composition-is-its-own-requirement.md` — new; the instrument, the siting rule, and the contended-resource table. `028` was taken by the time this landed
- `docs/decisions/README.md` — the index entry for it
- `docs/specs/composition.md` — new area, prefix `COMPOSE`, five requirements: `COMPOSE-001` conforming, `-002`, `-003` and `-004` divergent, `-005` conforming
- `docs/specs/index.md` — one new table row for the area
- `docs/specs/appearance.md`, `docs/specs/design-session.md`, `docs/specs/design-editing.md`, `docs/specs/presentation.md`, `docs/specs/diagram-dynamics.md`, `docs/specs/authoring.md`, `docs/specs/routing-and-placement.md`, `docs/specs/command-line-rendering.md`, `docs/specs/static-rendering.md` — each owning area's `## Gaps` names the compositions it takes part in and where they are recorded
- `docs/roadmap/INFOSCHEMATICS-TOOL-084-committed-move-unrenderable-route.md`, `-085-accepted-document-throws-geometry-error.md`, `-086-empty-announcement-when-everything-filtered.md` — new; one per divergence found in step 4, each carrying its measured reproduction
- Not touched: `turbo.json`, as predicted — `//#self:scripts:test` already hashes `docs/**`, and the test tasks declare no `inputs`
- Not touched: no new browser file, no package source. The three divergences are recorded as requirements and items rather than fixed here, which is this item's boundary

## Verify

`bun run test:browser` at the root runs every workspace's browser suite through Turborepo; `bun run --cwd packages/view-canvas test:browser` and `bun run --cwd packages/view-studio test:browser` run one at a time while iterating. `bun run self:scripts:test` runs the corpus checks this item's requirements have to satisfy — `scripts/specification-evidence.test.ts` and `scripts/vocabulary-citations.test.ts`. `bun run self:check` is the whole gate and belongs to whoever commits.

Two things must be proved rather than observed. Each new case must fail when its collision is reintroduced — assert that, because a composition case that only ever passes is indistinguishable from one that tests nothing. And step 4's exploration must be done on a rendered surface, not reasoned about from the source.

## Dependencies / blocks

Nothing blocks the work. `INFOSCHEMATICS-TOOL-056` is awaiting review and has already landed the evidence check that makes this item's new evidence lines mechanically defended, so there is no remaining ordering constraint against it.

`INFOSCHEMATICS-TOOL-058` shares this item's subject on the embedded-host surface, and there is a genuine ordering preference: landing 058 first supplies a worked composition with appearance cases already written, where landing this first only produces a requirement 058 then has to satisfy.

The ready items on the contended surfaces — `INFOSCHEMATICS-TOOL-023`, `-059`, `-060`, `-063` and `-066` — each gain a composition requirement from this item. That is scope added to those records rather than new work items, and it is more useful to them shaped before they land than after.

## Documentation impact

### Decision Records

One is needed. It landed as `ADR-INFOSCHEMATICS-034`; `028` had been taken by the panel-dock decision by the time this item was delivered. The corpus already sites composition constraints three slightly different ways — a matrix clause in `DESIGN-015`, an affordance clause in `DESIGN-018`, a selection clause in `DESIGN-020` — so the choice exists implicitly today and the sitings will keep drifting until it is written down.

### Specifications

This item is the specification change. Composition requirements land in the existing area files named above, or in a new area file with its own prefix and an `docs/specs/index.md` row if step 1 chooses that, and each touched area file's `## Gaps` section records what was left.

### Guides

None. There are no consumer-facing or contributor procedure changes, `docs/guides/` carries no specification-authoring guide to amend, and the new requirements are verified by the existing browser suites.

### Roadmap

Two changes. This record absorbs step 4's observations. And the five ready items sharing these surfaces each gain a composition requirement in their own `Documentation impact` — the lead owns whether any of that is also recorded as a `blocks` edge.

## Discussion

### Whether a composition can be addressed individually

`DESIGN-015` proves a matrix clause works and also shows its cost. Its second paragraph lists twenty-odd behaviours the rendered matrix must exercise, carries one `_Conformance:_` value for all of them, and cites two browser files as evidence for the lot. A pair that regresses inside that list is invisible: the requirement stays conforming, the evidence paths still resolve, and `scripts/specification-evidence.test.ts` has nothing to catch. A requirement per pair is individually addressable and individually defended, but it multiplies a 187-requirement corpus by however many pairs step 2 derives and forces the siting question for every one. This is the first decision and everything after it depends on the answer, so it is worth settling deliberately rather than by precedent.

### What a pair is owned by when neither feature is newer

Each of the three existing constraints sits in the newer of its two features — the layer filter went into the newer `DESIGN-020`, not into `DESIGN-018`. That rule works only while a pair has a clear newer member, and makes ownership an accident of delivery order. It has no answer at all for the case this item has to handle first: the Canvas-treatment-reaches-Studio property belongs to neither Canvas nor Studio, but to the stylesheet chain between them, and its evidence is a `scripts/` check rather than a package. Whether the corpus accepts delivery order as the tie-break, or accepts an area that owns nothing but compositions, is genuinely open.

### What driving the live surfaces found

Step 4 was run against `bun run self:dev` with a headless browser, on the Studio-backed Playground, across all three placement paths, grid sizes 0, 10 and 37, interaction layers open and closed, a held group of three, and a Dynamic rehearsing. Three of the eight enumerated resources turned out to be divergent rather than merely unverified, and none of the three was visible from any feature area.

The first is the worst. In Design, selecting the Player Card and pressing `ArrowDown` once throws `A route may not run diagonally: 960,240 to 1020,250` and replaces the whole page — Diagram, panel dock and site chrome — with nothing, taking the draft and its undo history with it. It reproduces through pointer drag, keyboard nudge and typed coordinate, at every grid size tried, and for more than one Card; horizontal movement of the same Card is fine, because the Flow it carries is horizontal. The draft overlay inserts the bend `ROUTE-002` requires, through `moveRouteEnd`; the committed document re-derives the route from the two ports in `createInfoschematicRuntime` and never reaches that calculation, so `routePath` throws inside a `useMemo` and the tree unmounts. `COMPOSE-002`, `INFOSCHEMATICS-TOOL-084`.

The second is the same root cause on the command line, in a different required shape. A document whose one Flow is authored `LEFT E1 -> RIGHT W1` between two Cards at different vertical positions parses with no issues, and `infoschematics render` exits non-zero having printed an interpreter stack trace whose innermost frame is the geometry module. The status and the stream are both right, which is why `CLI-003` stays conforming; what the author is handed is a stack rather than the issue `AUTHOR-005` promises. `COMPOSE-003`, `INFOSCHEMATICS-TOOL-085`.

The third is quieter and only audible. In Present with the `PACKAGE` Flow family switched off, rehearsing the Dynamic that signals a packaged segment draws no signal — correctly — and the polite live region reads `Signal update 1.` and nothing else. The revision prefix is composed before the drawn-set filter has any say, so it is emitted whether or not a sentence follows it: a reader is told something happened and denied what. With the family switched on, the same rehearsal reads the Flow's code and both endpoint labels. `COMPOSE-004`, `INFOSCHEMATICS-TOOL-086`.

Two enumerated pairs were driven and held. A held group of three released exactly as a single selection does when its interaction layer closed, which is `DESIGN-020`'s clause behaving as written. And with the pointer resting over the Diagram, typing a negative coordinate into a placement field left the `viewBox` untouched and the field holding what was typed, which is `COMPOSE-005` — the Diagram's window listener declines on both the text-entry test and the pointer test.

The exploration is also the answer to a question this record left open. Three divergences in the first pass, none of them findable from a feature area, is the evidence that the instrument had to be individually addressable: a matrix clause would have recorded all three as prose inside requirements that stayed conforming.

## Review packet

### What changed

A new Specifications area, `docs/specs/composition.md`, holding five `COMPOSE` requirements; `ADR-INFOSCHEMATICS-034` recording the instrument, the siting rule and the contended-resource table it derives from; a `## Gaps` line in each of the nine owning area files; and three new roadmap records for the divergences the exploration found.

### Why it is shaped this way

A composition is its own requirement rather than a clause in the newer feature, because delivery order has no answer for a pair whose property belongs to neither member — and because `DESIGN-015` shows what a clause costs: twenty-odd behaviours under one conformance value, where a regression inside the list leaves the requirement conforming and the evidence paths resolving. Pairs are derived from resources with two live claimants rather than from the feature list, which is what keeps the area from multiplying features that never meet.

### What was found

Three divergences, all recorded rather than fixed: a committed Card move that unmounts the host (`TOOL-084`), an accepted document that throws a geometry error at the command line (`TOOL-085`), and a revision prefix announced with no sentence after it (`TOOL-086`). Each is in the corpus as a stated property with an item against it.

### What was deliberately not done

No package source changed and no browser case was added. Fixing the three divergences is outside this item's boundary and belongs to the three new items; the browser cases are step 6, reserved to the lead's test pass, and each requirement's `_Verify:_` line states the case and the reintroduction that must make it fail. `DESIGN-018` and `DESIGN-020` were not re-sited, per the ADR's second rule.

### How to check it

`bunx rumdl check`, `bun run self:scripts:test` — `specification-evidence` resolves every new `_Evidence:_` path and reads each conformance value, `vocabulary-citations` resolves every new vocabulary id — and `bun run self:check` for the whole gate. To see the first divergence by hand: `bun run self:dev`, open the Playground, enter Design, select the Player Card, press `ArrowDown`.

### What is left open

Whether `ROUTE-002`'s bend belongs in the port-derived route or the edit is refused before commit is `TOOL-084` step 1, and `TOOL-085` depends on that answer. The `## Gaps` sections name three pairs with no requirement yet: the Callout region against the panel dock, playback keys against artefact activation, and `DESIGN-020`'s own rendered case.
