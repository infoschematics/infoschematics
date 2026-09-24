---
id: INFOSCHEMATICS-TOOL-114
area: TOOL
title: Detail follows magnification
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 1319bd1e18fe2f6600eb4b5484fa8b10255e7fe7
created_at: 2026-09-21T19:30:00Z
updated_at: 2026-09-24T23:55:00Z
---

# Detail follows magnification

## Goal

Zooming into part of an [Infoschematic](../reference/vocabulary.md#infoschematic) reveals more about that part rather than only drawing the same thing larger.

## Context

The Canvas already moves. `packages/view-canvas/src/viewport.ts:49` zooms around a diagram coordinate while keeping the viewport inside the authored bounds, an overview map selects where to centre it, and `InfoschematicDiagram.tsx` wires pan and zoom to pointer and keyboard. What magnification does not do is change what is drawn: at any scale the same artefacts are painted at the same level of detail, so zooming in enlarges and nothing appears.

The separation this would need is already decided. `ADR-INFOSCHEMATICS-011` keeps semantic authored identity apart from output-detail policy, so detail is already a policy question rather than an authored property. What that policy speaks does not exist yet; Current state says what is actually there.

The nearest comparison is Structurizr's hierarchical zoom and Ilograph's levels of detail, both recorded in [the related-tools reference](../decisions/references/related-tools.md). Both treat detail as a step between named views rather than a continuous function of scale, which is a materially different product feel and worth choosing deliberately.

## Boundary

A decision item about what an existing interaction reveals. It does not add a model concept and does not make magnification an authored value: what a document says stays the same at every scale. It says nothing about Present, where a Scene already chooses what an Audience sees, and it does not commit to a second rendering pipeline for static output.

## Current state

Magnification changes size and nothing else. `packages/view-canvas/src/viewport.ts:49` zooms around a diagram coordinate while keeping the viewport inside the authored bounds, the overview map chooses where to centre, and `InfoschematicDiagram.tsx` wires pan and zoom to pointer and keyboard. Every artefact is painted the same way at every scale.

There is no detail vocabulary to reuse, which this record's capture assumed there was. `ArtefactIdentity.detail` in `packages/domain-model/src/artefact.ts` is a descriptive string — it reaches the accessible description and the SVG `<title>` in `packages/render-svg/src/index.ts:1187` — not a level. `Fabric.appearance.detail` is the same kind of string. So the policy this item needs is new, and `ADR-INFOSCHEMATICS-011` is the reason it may exist as policy at all: it already keeps authored identity apart from output-detail policy, so nothing authored has to change.

## Steps

- [x] Take the decision between continuous and stepped detail and record it, including what is deliberately rejected: entering a named view of a part is addressing, which belongs to [INFOSCHEMATICS-TOOL-115](INFOSCHEMATICS-TOOL-115-linking-to-one-part.md), not magnification.
- [x] Define the detail bands and what each reveals, in the View Model, as a pure function of scale so both a View and a static outlet can resolve the same band.
- [x] Apply the band in the Canvas so crossing a threshold reveals or withdraws detail, with hysteresis at the boundary: a drawing that flickers as a reader's hand moves is worse than one that never changes.
- [x] Give the static renderer the same resolved band as an input, so an SVG of a magnified part matches what the Canvas shows at that scale.
- [x] Announce a detail change to an assistive reader without implying the document changed, per the announcement surface `ADR-INFOSCHEMATICS-029` mounts.
- [x] State the bands and their contents as requirements, so a later change to what a band reveals is a visible contract change.
- [x] Hand the visual guide showing the same document at each band to whoever owns `apps/site/src/visual-guide/`: the guide is generated from a catalogue in Site's own source rather than authored under `apps/site/content/guides/`, which this session's boundary excludes. The undone action is carried under Outstanding concerns.

## Files touched

`packages/view-model` for the band function and its test; `packages/view-canvas/src/viewport.ts` and `InfoschematicDiagram.tsx`; `packages/render-svg` and `packages/cli` for the static band input; `docs/specs/` for the requirements; a new Decision Record; the visual guide in `apps/site`.

## Verify

`bun run self:check`, with the band function held by unit tests at every threshold and on both sides of the hysteresis margin.

The reveal is proved in a browser rather than read out of the source: the browser suite zooms past a threshold and asserts what is drawn before and after, and the announcement is asserted on the announcement surface.

Both extremes are rendered and looked at, per `AGENTS.md`. A threshold that reveals detail into a drawing that then overlaps is a TOOL-113 finding, and the two schemes of that check are worth running here.

## Dependencies / blocks

Nothing blocks it. It is independent of TOOL-115, though both touch what it means to arrive at part of a document, and the decision here deliberately leaves named views to that record.

## Documentation impact

### Decision Records

A new record deciding that detail is a continuous policy resolved in bands rather than a step between named views, that no authored property expresses it, and that a static outlet may be given a band.

### Specifications

`docs/specs/diagram-elements.md` or a section of `docs/specs/appearance.md` states each band and what it reveals; `docs/specs/static-rendering.md` states that a band may be supplied and what the default is.

### Guides

The consumer guide explains that zooming reveals more and what that means for a still export; the visual guide shows the same document at each band.

### Roadmap

Nothing follows necessarily. If a band turns out to want authored control, that is a model change and its own record.

## Review

### Delivered

Magnification now reveals. The band a drawing is read at is resolved from the scale the Canvas actually paints at, so zooming into a part brings back rows a small rendering withheld, and zooming out takes them away again. Four bands — `minimal`, `outline`, `identified`, `full` — sit on the thresholds `ADR-INFOSCHEMATICS-011` had already fixed, so nothing about a small static rendering changed and no second threshold vocabulary exists to drift from the first.

The defect turned out to be narrower and more specific than the record's Current state suggested. A responsive resolver already existed and was already wired into the Diagram; what it measured was the authored view box against the frame, and the authored view box does not move when a reader zooms. So the answer was constant for the life of the drawing, and would have stayed constant however many bands were defined. `renderedViewportScale` in `packages/view-canvas/src/viewport.ts` is the one line of arithmetic that was missing, and it is the reason the browser case in the Verify section is not optional: every unit case passes against the old measurement too.

The boundary held. No model concept was added, no authored property expresses a band, and a document says the same thing at every scale. The two decisions the coordinator had already taken are recorded as taken: detail is continuous rather than a step into a named view, with named views recorded as the deliberately rejected alternative and named as `INFOSCHEMATICS-TOOL-115`'s territory; and the hysteresis lives in the Canvas rather than in View Model, because `APPEAR-017` forbids the resolver reading ambient viewport state and a memory of the previous band is exactly that.

### Change Summary

- `packages/view-model/src/detail.ts` — new. `resolveDetailBand` maps a scale to a band and has no memory of anything; `resolveDetailTreatment` applies the band to a requested Card treatment as a reduction only; `detailBandAnnouncement` supplies the sentence the live region speaks. The doc comment cites the decision it implements and the requirement that keeps it pure.
- `packages/view-model/src/detail.test.ts` — new. Every floor from both sides, magnified scales, non-positive and non-finite input, the withholding table per band, the "cannot restore what the caller withheld" property, compactness passing through, and the announcement sentences being distinguishable from one another.
- `packages/view-model/package.json` — a `./detail` export subpath. This package has no `src/index.ts`; each module is exported individually, so this is the equivalent of the brief's "export it from the index" and the reason a shared manifest was touched.
- `packages/view-canvas/src/viewport.ts` — `renderedViewportScale` reads the live viewport against the frame rather than the authored view box; `settleDetailBand` and `detailBandMargin` hold the previous band and the asymmetric margin. The comments say why the memory is here and not in the resolver.
- `packages/view-canvas/src/viewport.test.ts` — the scale reading, and a `detail band hysteresis` group holding the band inside the margin, dropping it outside, holding it at the far edge and dropping it one ulp past, settling rather than oscillating, and dropping more than one band at once.
- `packages/view-canvas/src/InfoschematicDiagram.tsx` — the Diagram resolves its band from the settled scale and applies it through `resolveDetailTreatment`, and carries its own polite live region announcing a change with a revision prefix. The region is tagged `data-detail-announcement` so it is distinguishable from the two `ADR-INFOSCHEMATICS-029` announcements it now sits beside.
- `packages/view-canvas/src/InfoschematicDiagram.magnification.browser.test.tsx` — new. Three cases in Chromium: a graded reveal across two thresholds and a withdrawal on fit, the announcement text and its revision, and a Diagram that did not opt in staying exactly as it was drawn at every magnification.
- `packages/view-canvas/src/Canvas.dynamics.test.tsx` and `Canvas.dynamics.browser.test.tsx` — both counted or indexed `[role="status"]` regions. The node case keeps its count of two and adds an assertion about the third by name; the browser case scopes its four selectors with `:not([data-detail-announcement])` rather than renumbering indices, so the next region to arrive does not shift them again.
- `packages/render-svg/src/index.ts` — an optional `detail` band on `RenderInfoschematicSvgOptions`, taking precedence over `responsiveCardDetails`, with omission drawing `full` so every existing still is byte-identical.
- `packages/render-svg/src/index.test.ts` — the band cases, including `detail: 'full'` being byte-identical to no options at all and a `cardDetails` withholding that a band cannot undo. Four existing fixtures also gained `promises: []`; see Outstanding concerns.
- `packages/cli/src/options.ts` and `packages/cli/src/index.ts` — a `--detail <band>` render option, defaulting to `full` and rejecting anything that is not one of the four bands by name.
- `docs/decisions/ADR-INFOSCHEMATICS-039-detail-is-a-band-of-scale-and-the-view-holds-the-hysteresis.md` — new, unindexed by instruction.
- `docs/specs/appearance.md` — `APPEAR-020` states the bands and what each reveals; `APPEAR-021` states that the resolver is pure and the view holds the margin.
- `docs/specs/static-rendering.md` — `STATIC-021` states the supplied band, its `full` default, its precedence over an explicit target size, and the command-line option.

### Verification

- `bunx turbo run typecheck test --filter=@infoschematics/view-model --filter=@infoschematics/view-canvas --filter=@infoschematics/render-svg --filter=@infoschematics/cli --force` — 10 tasks successful, 10 total.
- `bun run test` in each package — View Model 19 files and 245 tests passed; View Canvas 14 files and 105 tests passed; Render SVG 1 file and 26 tests passed; command line 1 file and 43 tests passed.
- `bun run test:browser --filter=@infoschematics/view-canvas` — 7 test files, 49 tests, all passed, in Chromium under Playwright.
- `bunx vitest run --root .` — 22 test files, 125 tests, all passed, which includes `scripts/specification-evidence.test.ts` over the three new requirements and `scripts/cli.test.ts` over the new option.
- `bun run ki:lint:md` — no issues found in 119 files.
- `bunx biome check --write` over every file this change touches — clean, apart from one pre-existing `suppressions/unused` warning at `packages/view-canvas/src/InfoschematicDiagram.tsx`, which is present in the `HEAD` copy of that file at the line the same suppression sits on there.
- `bun run self:check` — **not run**. It is repo-wide, and a second writer is live in this checkout; it would have measured their half-finished state rather than this change.
- An earlier run of the scoped gate **failed**, and is recorded rather than smoothed over: `@infoschematics/render-svg#typecheck` reported four `TS2322` errors of the form `Property 'promises' is missing in type … but required in type 'DefinedInfoschematic'`, at `src/index.test.ts` lines 148, 299, 708 and 814. That was the other writer's change to `packages/domain-model/src/model.ts` making `promises` a required field, surfacing in a test file inside this session's boundary and outside theirs. The four fixtures gained `promises: []` and the gate is green; the field itself was not touched.
- `ki repo audit --skill ki-work-roadmap --repo .` — recorded below.

The look was taken with `bun run self:browser:look -- --name tool-114-magnification --path /tool-114-look.html --probe reports/TOOL-114-zoom-probe.mjs`. The site's own Playground could not be used: it imports the showcase document, which does not parse while another writer regenerates it, so the route throws before it renders. A throwaway page with three Cards in a 600 by 400 frame over a 1200 by 800 view box was used instead, and is kept under the ignored `reports/` directory with its re-run instructions in its own comment rather than left in `apps/site`.

What the captures showed, at `reports/tool-114-magnification/`. Fitted, at a drawn scale of 0.5: three Cards on the blueprint surface, each with its stereotype in small caps at the top left and its name centred, and no code and no description anywhere — three `[data-card-detail]` rows in total, all stereotype, and the announcement region present and empty. One step of magnification: a dark code chip reading `SVC-001` and `SVC-003` appears at each Card's top right, six rows in total, descriptions still absent, and the region reading `Detail update 1. Card names, stereotypes and codes. The document has not changed.` Three steps: `Answers questions about what is stored` is now set beneath the Query Card's name, which has itself grown to a heading weight, nine rows in total, and `Detail update 2. Card names, stereotypes, codes and descriptions.` Five steps: unchanged at nine rows and still revision 2, which is the point — the band had already saturated and no further announcement was made. Fitted again: back to three stereotype rows with the codes and descriptions gone, `Detail update 3. Card names and stereotypes.`, and a capture byte-identical in size to the first. The overview map in the corner tracks the viewport through all of it, so the reveal is visibly a consequence of where the reader is rather than a latch.

One thing the look caught that no suite would have. The first run showed nothing changing at any magnification and no announcement region at all, because `apps/site` resolves the `@infoschematics` packages through their `exports` to `dist`, not to source. The suites resolve to source and were green throughout. A `turbo run build` for View Canvas and its dependencies was needed before the browser could see the change, which is worth knowing before reading a flat look as a defect.

### Outstanding concerns

- The visual guide showing the same document at each band was not written. `apps/site/content/guides/` does not exist; the visual guide is generated from a catalogue under `apps/site/src/visual-guide/`, which is outside this session's boundary, and `scripts/visual-guide-catalogue.test.ts` holds that catalogue. It belongs to whoever owns Site, as its own record.
- The consumer guide explaining that zooming reveals more, and what that means for a still export, was likewise not written: `apps/site/content/authoring.md` is another writer's file this pass and the rest of `apps/site/content/` is outside the boundary.
- `docs/specs/command-line-rendering.md` is where per-option command-line requirements such as `CLI-013` live, and it is outside this session's boundary. `--detail` is therefore stated in `STATIC-021` under Static rendering rather than beside its sibling options, which is the right meaning in the wrong place. A one-requirement follow-up in that document would put it right.
- Four fixtures in `packages/render-svg/src/index.test.ts` gained `promises: []` to satisfy a field the other writer's in-flight `packages/domain-model/src/model.ts` made required. The file is inside this session's boundary and outside theirs, so nobody else would have fixed it, but it is an adaptation to half-landed work and should be re-read when that work lands.
- `packages/view-model/package.json` was edited to add the `./detail` export subpath. It is a shared manifest rather than one of the source files named in the boundary, and is flagged because the brief named `packages/view-model/src/index.ts`, which does not exist in this package.
- `resolveResponsiveCardTreatment` in `packages/view-model/src/appearance.ts` is still exported and still used by the still renderer's `responsiveCardDetails` path. Two ways of answering the same question now exist, one of them measuring something a magnified view cannot use. Retiring it in favour of a caller-computed scale is a tidy follow-up and was deliberately not done here, because `APPEAR-016` and `STATIC-016` both name it.
- The six per cent hysteresis margin is a judgement, not a measurement. It is stated as `detailBandMargin` in one place and asserted from both sides, so changing it is a one-line change with a test that moves with it, but no reader study says it is the right number.
- The changes are uncommitted by instruction. The coordinator commits them.

### Post-change review

The goal is met and the boundary held: zooming reveals, the still renderer can be handed the same band, nothing authored changed, and the announcement says the document has not.

The instructive part is that the feature looked implemented. A responsive resolver existed, the Diagram called it, the specification described it, and the suites were green — and magnification revealed nothing, because the resolver was measuring a quantity that magnification does not change. A reader of the old Current state would have concluded the work was to build a policy from nothing; the actual work was one arithmetic change plus a vocabulary to hang it on. The general lesson is that a resolver whose inputs are all constants is indistinguishable, from inside a unit test, from one whose inputs move.

The regression surface is the live regions. Two suites counted or indexed `[role="status"]` nodes and both broke on a third arriving, in one case silently shifting every index so four assertions failed with messages about Flow signals. Naming the new region and scoping the old selectors is more durable than renumbering, and the node case's count of two survives only because Biome sorts JSX attributes alphabetically and so separates `role` from `aria-live` in the rendered markup — which is worth knowing before anyone trusts an adjacency regex over rendered HTML.

Acceptance readiness: ready, with the three documentation hand-overs above understood as not delivered rather than as details.

### Mini recap

Detail now follows magnification, continuously, in four bands over thresholds that already existed. The View Model function is pure and has no memory; the Canvas holds the previous band and a margin, so revealing is immediate and withdrawing is reluctant. The still renderer and the command line take a band, defaulting to `full` so nothing that never asks for one changes. `ADR-INFOSCHEMATICS-039` records both decisions including the named-view alternative that belongs to TOOL-115, and `APPEAR-020`, `APPEAR-021` and `STATIC-021` make the bands a contract. A browser look proved the reveal and, in the process, caught that the site reads the built packages rather than their source. What is left is documentation someone else owns: the visual guide, the consumer guide, and a home for `--detail` beside its sibling command-line options.

## Discussion

Captured on 2026-09-21 alongside the positioning work, from the owner's interest in zooming into parts of an embedded document.

The choice that shapes everything else is whether detail is continuous or stepped. Continuous detail — progressively revealing Ports, labels, or nested content as scale crosses thresholds — feels like an instrument and is the harder thing to keep readable, because every threshold is a place where the drawing changes under the reader's hand. Stepped detail, where magnification past a bound enters a named view of that part, is closer to what the comparable products do and reuses whatever [INFOSCHEMATICS-TOOL-115](INFOSCHEMATICS-TOOL-115-linking-to-one-part.md) settles about naming a part.

Two further questions follow: whether static renderers honour the same policy, so an SVG of a Scope matches what the Canvas shows at that scale, and what an assistive reader is told when detail changes without any content changing.

### Adoption

Adopted for immediate work on 2026-09-21. The continuous-or-stepped question is taken as part of delivery, with the named-view option deliberately excluded — it is addressing, and it belongs to TOOL-115 rather than to magnification.
