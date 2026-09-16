---
id: INFOSCHEMATICS-TOOL-058
area: TOOL
title: Scoped renderer definition identity
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: dbd57e2f5abf88681c0f4a2f68917b32fca38d28
created_at: 2026-09-15T07:05:00Z
updated_at: 2026-09-16T16:49:00Z
---

# Scoped renderer definition identity

## Goal

Make each rendered Infoschematic resolve its own SVG definitions, so two Infoschematics sharing one document cannot borrow each other's arrowheads or grid patterns.

## Context

Found while completing Inline browser verification (`INFOSCHEMATICS-TOOL-051`, delivered and pruned at `2ea83ea2`). Two inline Canvases mounted in one host document emit `defs` children with fixed, document-global identifiers: one `marker` per Flow family, and four grid patterns. Every instance emits the same identifiers, and every Flow references its arrowhead by that identifier.

SVG resolves such a reference to the first matching element in document order. A browser fixture mounting a purple `request` family above a red one confirmed the consequence directly: both documents emit their own correct `marker`, and both render with the first one. Authored appearance is correct, definitions are correct, and output is still wrong.

Grid patterns carry the same defect with a wider blast radius, because grid size and treatment are authored per Diagram: a second Diagram declaring a different `gridSize` paints the first Diagram's grid.

The corpus has since accepted the defect rather than only observed it. `3b9aef9b` moved `DESIGN-017` to `divergent` and named this record as what clears it, so the divergence is now a standing statement that the product renders the same document safely through one renderer and unsafely through the other.

## Boundary

This item does not change authored appearance, the artefact identity contract in `STATIC-010`, or any interaction behaviour. A host may supply a prefix as the static renderer already allows, but it must never have to: an unconfigured host that mounts two Canvases is correct by default, because a contract that requires hosts to name their instances would be a worse outcome than the bug.

Identifiers inside a host-supplied `Definitions` component are out of scope. Canvas renders that component into its own `defs` and cannot rewrite identifiers it did not author; the most this item does about them is say so.

## Current state

`packages/view-canvas/src/InfoschematicDiagram.tsx` opens its `defs` at line 1879 and closes it at 1961. Inside it, four `pattern` elements carry fixed identifiers — `infoschematic-grid-minor` (1882), `infoschematic-grid-major` (1895), `infoschematic-grid-major-plus-minor` (1908) and `infoschematic-grid-dots` (1926) — and one `marker` per Flow family is emitted as `infoschematic-arrow-${family.id}` (1942). Five places reference them: the composite pattern fills itself from the minor one (1914), the authored grid rect reads `url(#infoschematic-grid-${visualTreatment.grid})` (1966), a Flow sets `markerEnd` and `markerStart` (1561 and 1562), and the Design edit-grid rect states `fill="url(#infoschematic-grid-major-plus-minor)"` (2072).

`packages/view-canvas/src/styles.css:919` holds the only rule in the entire view stylesheet chain that names a `defs` identifier: `.edit-grid rect` declares `fill: url(#infoschematic-grid-major-plus-minor)` (920) and `pointer-events: none` (921). The same fill is also stated inline at `InfoschematicDiagram.tsx:2072` as a presentation attribute, which any stylesheet declaration outranks — so the inline route already exists, the rule is what currently wins, and moving the fill inline means leaving `pointer-events` behind rather than deleting the rule. `adc0d6b6` is what reduced this to one place: Studio's shadowing copy pointed at `url(#edit-grid-major)`, an identifier no renderer in the repository defines, and `scripts/stylesheet-shadowing.test.ts` now fails if a downstream stylesheet redeclares the same selector.

The static renderer already solved its half. `packages/render-svg/src/index.ts:74-82` validates a resource prefix against `/^[A-Za-z_][A-Za-z0-9_.-]*$/`, defaulting to `infoschematic`; line 267 resolves it and lines 351, 372, 401, 426 and 596 apply it to every marker and pattern identifier and reference. `STATIC-015` (`docs/specs/static-rendering.md:159-167`) records that as conforming. The two renderers do not emit identical identifiers even so: the static one names an arrowhead by the family's index (line 351), Canvas by the family's id (line 1942).

Five suites assert the literal identifiers and move with them: `packages/view-canvas/src/tokens.test.tsx:45,47`; `packages/view-canvas/src/InfoschematicDiagram.treatments.test.tsx:83,84,96,199,209`; `packages/view-studio/src/app/App.browser.test.tsx:384,390`, which reads the authored grid size off `pattern#infoschematic-grid-minor` and `pattern#infoschematic-grid-major-plus-minor`; and `scripts/visual-treatment-parity.test.ts:392,406,407`, which requires both renderers to contain the same literal `fill="url(#infoschematic-grid-dots)"`. `packages/render-svg/src/index.test.ts:166,167,387,516-520` asserts the unprefixed static default and stays valid, as does its rejection of `'unsafe prefix'` at line 261.

`packages/view-canvas/src/InfoschematicDiagram.host.browser.test.tsx` (191 lines) mounts two deliberately code-colliding documents with different family colours — `#7c3aed` for orders, `#b91c1c` for billing — and covers per-instance naming, hover, selection, unmount and remount. It asserts nothing about rendered appearance, which is exactly the gap. A live two-Canvas surface already exists outside the fixture: the Card component page passes two comparisons to `InteractiveSpecimen` (`apps/site/src/VisualGuide.tsx:143-151`), and `apps/site/src/visual-guide/DemoFrame.tsx:107` renders each as its own `<Canvas mode="design">`. Both variants share one appearance, so the collision is latent there rather than visible.

`InfoschematicDiagram.tsx:491` reads `renderers.definitions` and renders the host's component inside the same `defs` at 1939. `docs/specs/renderer-extensions.md:23,55` keeps shared SVG definitions unversioned host-level support, and no requirement says whose namespace those identifiers are in.

`useId` is not called anywhere in `packages/`, `apps/` or `examples/` today. React 19.2.8 composes its value as `"_" + identifierPrefix + "R_" + treeId` and `"_" + identifierPrefix + "r_" + treeId.toString(32) + "_"` (`node_modules/react-dom/cjs/react-dom-client.development.js:9055,9062`), so a default derived from it begins with an underscore and carries only letters, digits and underscores, which the existing validator already accepts. That is a React implementation detail, so assert it rather than rely on it.

## Steps

1. [x] Settle the stylesheet first, because it decides whether the grid can be scoped at all: move the `fill` declaration from `packages/view-canvas/src/styles.css:920` onto the `edit-grid` rect at `InfoschematicDiagram.tsx:2072`, leaving `pointer-events: none` in the rule. Verifiable: `grep -n 'url(#' packages/view-canvas/src/styles.css` returns nothing, and `bun run self:verify:repo` still passes `scripts/stylesheet-shadowing.test.ts`.
2. [x] Put the prefix validator somewhere both renderers can reach. `packages/view-canvas` and `packages/render-svg` both depend on `@infoschematics/view-model` and neither may depend on the other, so it belongs in `packages/view-model/src/` with a matching export subpath. Verifiable: `bun run self:verify:depcruise` passes and `bun run --cwd packages/render-svg test` still rejects `'unsafe prefix'`.
3. [x] Add an optional `resourceIdPrefix` prop to `InfoschematicDiagram`, defaulting to `useId()` and validated by that shared validator. `Canvas` needs no change of its own: `CanvasProps` is derived from `ComponentProps<typeof InfoschematicDiagram>` at `packages/view-canvas/src/Canvas.tsx:32,39`. Verifiable: a unit case mounts two Canvases in one tree and asserts the two `pattern` identifier sets are disjoint and each value satisfies the validator.
4. [x] Apply the prefix to every identifier and every reference named in Current state — `InfoschematicDiagram.tsx` lines 1561, 1562, 1882, 1895, 1908, 1914, 1926, 1942, 1966 and 2072. Verifiable: `grep -n 'infoschematic-grid-\|infoschematic-arrow-' packages/view-canvas/src/InfoschematicDiagram.tsx` leaves no occurrence that is not read through the prefix value.
5. [x] Move the literal-identifier assertions onto the rendered prefix in `tokens.test.tsx:45,47`, `InfoschematicDiagram.treatments.test.tsx:83,84,96,199,209` and `App.browser.test.tsx:384,390`. Verifiable: `bun run --cwd packages/view-canvas test` and `bun run --cwd packages/view-studio test:browser`.
6. [x] Change `scripts/visual-treatment-parity.test.ts:392,406,407` to compare the pattern each renderer references against the pattern that renderer defines, instead of a shared literal. Verifiable: `bun run self:verify:repo` passes, and the case still fails if either renderer's reference is pointed at a pattern it never defines.
7. [x] Extend `InfoschematicDiagram.host.browser.test.tsx` with two appearance cases: two instances with different family colours each draw their own arrowhead, read as the computed fill of the `marker` path inside each instance root rather than as an identifier; and two instances with different authored `gridSize` each paint their own pattern, read as the `height` of the `pattern` inside each instance root. Verifiable: `bun run --cwd packages/view-canvas test:browser`, and both cases fail when the prefix is removed — prove that rather than asserting it passes today.
8. [x] Return `DESIGN-017` (`docs/specs/design-session.md:219-229`) to `conforming`, restate its `_Verify:_` and `_Evidence:_` lines to name the appearance cases, and state in `docs/specs/renderer-extensions.md` that identifiers inside a host-supplied `Definitions` component are the host's own namespace. Verifiable: `bun run self:verify:repo` — `scripts/specification-evidence.test.ts` checks both the conformance value and that every cited path resolves.
9. [x] Render two Infoschematics with different family colours and different grid sizes into one page and look at the result. Shortest route: `bun run self:dev`, open the Card component page of the visual guide, and give one comparison variant a different grid treatment locally. Verifiable by eye, which is the point — a fully green suite did not notice this.

## Files touched

- `packages/view-canvas/src/InfoschematicDiagram.tsx` — the `defs` block and every reference to it
- `packages/view-canvas/src/styles.css` — the `.edit-grid rect` fill leaves, `pointer-events` stays
- `packages/view-model/src/resources.ts` — new, the shared prefix validator, with its export subpath added to the existing `packages/view-model/package.json`
- `packages/render-svg/src/index.ts` — its local `svgResourcePrefix` (lines 74-82) becomes the shared one; behaviour unchanged
- `packages/view-canvas/src/tokens.test.tsx`, `packages/view-canvas/src/InfoschematicDiagram.treatments.test.tsx`, `packages/view-canvas/src/InfoschematicDiagram.host.browser.test.tsx`
- `packages/view-studio/src/app/App.browser.test.tsx`
- `scripts/visual-treatment-parity.test.ts`
- `docs/specs/design-session.md` for `DESIGN-017`, and `docs/specs/renderer-extensions.md` for the host-`Definitions` namespace
- `docs/specs/static-rendering.md` only if step 2 restates `STATIC-015` to cite the shared validator
- Checked and not touched: `apps/site/content/static-rendering.md` and `apps/site/content/react-integration.md` teach the static renderer's `resourceIdPrefix`, whose default and meaning are unchanged

## Verify

`bun run --cwd packages/view-canvas test`, `bun run --cwd packages/view-canvas test:browser`, `bun run --cwd packages/view-studio test:browser` and `bun run --cwd packages/render-svg test` cover the renderer and its suites. `bun run self:verify:repo` runs the three repository checks this touches — `scripts/visual-treatment-parity.test.ts`, `scripts/specification-evidence.test.ts` and `scripts/stylesheet-shadowing.test.ts` — and `bun run self:verify:depcruise` holds the boundary the shared validator has to respect. `bun run self:check` is the whole gate and belongs to whoever commits.

Two things must be proved rather than observed: the appearance cases from step 7 must fail when the prefix is removed, and step 9's rendered page must be looked at.

## Dependencies / blocks

Nothing blocks this. `DESIGN-017` is the divergence it clears, and `INFOSCHEMATICS-TOOL-064` (`adc0d6b6`, awaiting review) is a de facto prerequisite already satisfied: removing Studio's shadowing copy is what left `packages/view-canvas/src/styles.css:920` as the single stylesheet declaration to move.

This shares its subject with `INFOSCHEMATICS-TOOL-057`. Two Canvases in one document is a composition, and 057 would want a requirement naming it. Landing this first gives 057 a worked example; landing 057 first only produces a requirement this item then has to satisfy.

## Documentation impact

### Decision Records

None expected. `STATIC-015` already settled the mechanism and this item applies it to the renderer that lacks it, and moving the validator into View Model follows the documented dependency direction rather than changing it. If step 2 turns out to need a new package boundary instead, stop and write one.

### Specifications

Two changes, both in existing files. `docs/specs/design-session.md` returns `DESIGN-017` to `conforming` with restated `_Verify:_` and `_Evidence:_` lines. `docs/specs/renderer-extensions.md` gains the statement that a host-supplied `Definitions` component owns its own identifiers. `docs/specs/static-rendering.md` changes only if `STATIC-015` is restated to cite the shared validator.

### Guides

None. `docs/guides/integrating-renderers.md` gains a line only if step 8's statement changes what a renderer author must do; naming an existing responsibility explicitly does not.

### Roadmap

This record only. Once delivered, `INFOSCHEMATICS-TOOL-057` should cite it as a worked composition — a change to that record, and the lead owns whether it is also recorded as a dependency.

## Review

### Delivered

Each rendered Infoschematic now resolves its own SVG definitions. Canvas prefixes every `marker` and `pattern` it defines, and every reference to one, with a value unique per mount within a React root, so two Canvases embedded in one host document can no longer borrow each other's arrowheads or grid patterns. The prefix validator the static renderer already owned is now shared by both renderers from View Model.

Inside the approved boundary: authored appearance, the `STATIC-010` artefact identity contract, and interaction behaviour are unchanged; an unconfigured host is correct by default; identifiers inside a host-supplied `Definitions` component remain the host's own namespace and are documented rather than rewritten.

Immutable baseline: `dbd57e2f5abf88681c0f4a2f68917b32fca38d28`, whose `bun run self:check` was verified clean before any edit.

Two exclusions held deliberately. `packages/render-svg/src/index.ts`'s `orient="auto-start-reverse"` was left byte-for-byte untouched, because the raster engine's failure to honour it is a separate confirmed defect sequenced after this item. And `docs/specs/static-rendering.md` was left unchanged, which this record permits: `STATIC-015`'s requirement, conformance, and cited evidence all remain exactly true after the validator moved packages.

### Summary of changes

- `packages/view-model/src/resources.ts` — new. `svgResourcePrefix(value, fallback)` carries the rule both renderers need, with the caller supplying the default. Its export subpath was added to `packages/view-model/package.json`.
- `packages/render-svg/src/index.ts` — its local validator was deleted in favour of the shared one. The single call site is untouched and the `'infoschematic'` default is now the shared function's default parameter, which is why behaviour is unchanged.
- `packages/view-canvas/src/InfoschematicDiagram.tsx` — an optional `resourceIdPrefix` prop, defaulting to `useId()` and validated by that shared validator, applied to all ten identifier and reference sites. `Canvas` needed no change, as `CanvasProps` derives from the component's props.
- `packages/view-canvas/src/styles.css` — the `fill` declaration on `.edit-grid rect` is gone; `pointer-events: none` stays. `grep -n 'url(#' packages/view-canvas/src/styles.css` now returns nothing.
- Suites moved off literal identifiers onto the rendered prefix: `tokens.test.tsx`, `InfoschematicDiagram.treatments.test.tsx`, and `App.browser.test.tsx`, which now selects `pattern[id$="-grid-minor"]`.
- `scripts/visual-treatment-parity.test.ts` — a shared literal identifier is replaced by a closed-loop check: every `url(#…)` reference in a rendering must resolve to a `marker` or `pattern` that same rendering defines, and both renderers must reach a dots pattern by treatment suffix.
- `packages/view-canvas/src/InfoschematicDiagram.host.browser.test.tsx` — two appearance cases, resolving references the way a browser does and asserting each instance draws its own arrowhead colour and its own grid pitch.
- `docs/specs/design-session.md` — `DESIGN-017` returns to `conforming`, with rendered appearance named in the requirement and the per-mount scope of the default stated.
- `docs/specs/renderer-extensions.md` — `EXTEND-002` gains the statement that a host-supplied `Definitions` component owns its own identifiers.

Two material decisions, both open questions this record left to be settled during delivery.

**What the default promises**, the question the record required settling before step 3. It promises uniqueness _per mount within a React root_, not per document. That covers the reported defect and every ordinary embedding host, and it preserves the byte-identical-markup property `Canvas.dynamics.test.tsx` asserts — measured directly: two independent `renderToStaticMarkup` calls still produce identical output. The same fact means a host that assembles one document from separate render passes still collides, because no pass can see another's identifiers; `resourceIdPrefix` is that host's escape hatch, exactly as `STATIC-015` already obliges static-renderer hosts. So the step 7 appearance cases are the whole proof of what the default claims rather than half of it, and `DESIGN-017` now states the scope rather than implying it.

**The stylesheet rule**, the question affecting step 1. The fill moved inline as the step directed, rather than going through a custom property. The custom-property alternative does not actually close the shadowing hole it was proposed for: a differently-spelled, higher-specificity selector such as `.infoschematic-svg .edit-grid rect` beats `fill: var(--…)` exactly as it beats an inline presentation attribute, because specificity is settled before the variable is substituted. It would add a mechanism for no gain in protection, and the authored grid rect already carries its fill as a presentation attribute with identical exposure — so the inline route makes the Design edit grid consistent with the authored grid instead of introducing an asymmetry.

One deviation from `Files touched`: the step 3 unit case went into a new `packages/view-canvas/src/InfoschematicDiagram.resources.test.tsx` rather than into an existing suite, because renderer definition identity is its own concern and none of the listed files is about it.

### Verification

| Gate | Outcome |
| --- | --- |
| `bun run self:check` at baseline, before any edit | passed, exit 0 |
| Full gate, all 43 tasks, `--concurrency=1 --force` | 43 successful, 43 total |
| `bun run --cwd packages/view-canvas test` | 11 files, 74 tests passed |
| `bun run --cwd packages/view-canvas test:browser` | 4 files, 26 tests passed |
| `bun run self:verify:repo` | 13 files, 50 tests passed |
| `bun run self:verify:depcruise` | no dependency violations |
| `bun run self:verify:examples` | `Generated example exports current: 4`, no regenerated diff |

The record required two things be proved rather than observed, and a third followed from the item's own boundary.

**The appearance cases fail when the prefix is removed.** With the per-mount default replaced by the old document-global `'infoschematic'`, both new cases fail, and on the _second_ instance in each pair — which is the defect. Suspending the containment assertions to reach the appearance reads underneath showed the rendered consequence directly: the billing instance reported `fill: '#7c3aed'` where `'#b91c1c'` was authored, and the fine-gridded Diagram reported `pitch: '60'` where `'20'` was authored. Both files were restored from copies taken before the experiment.

**The parity case still fails when a reference points at a pattern its renderer never defines.** Proved three ways, each naming the dangling reference in the failure: the static renderer referencing `infoschematic-grid-major` under the dots treatment, Canvas referencing `_R_1_-grid-elsewhere`, and Canvas referencing `_R_1_-arrow-absent`. The first attempt at this proof tripped a length assertion rather than the resolution assertion, so the check was sharpened to filter references by `-grid-` and test resolution, which is the claim worth making.

**The static renderer's output is byte-identical.** Not merely asserted by its suite: all four examples were rendered with the working tree, then re-rendered with `packages/render-svg/src/index.ts` restored from the baseline commit, and compared. `diff -r` reported no difference and all four SHA-1 hashes match — `blank` `e7c8f846…`, `homepage` `d558c537…`, `infoschematics` `e78fb1d7…`, `system` `c5546554…`.

**Rendered and looked at.** Two Infoschematics were server-rendered into one page — a purple family on a `gridSize` 16 lattice above a red family on a `gridSize` 4 lattice — with the Canvas stylesheet chain inlined, and photographed in Chromium through Playwright. Fixed, each panel shows its own family colour on its own grid pitch. With the prefix removed, the same page shows the fine-gridded lower panel painting the _coarse_ lattice of the panel above it — the defect, visible as a Producer would see it. The throwaway script was deleted rather than committed.

### Outstanding concerns

One finding refines this record's own account of the defect, and belongs with the item rather than outside it. The record's step 7 proposed reading the arrowhead as "the computed fill of the `marker` path". That read cannot see this bug. `.infoschematic-svg .arrow-head` declares `fill: context-stroke`, so wherever `context-stroke` is understood the head takes the colour of the _referencing_ line's stroke, and a wrongly-resolved marker still comes out the right colour — confirmed in the rendered page, where the arrowheads stayed correct in the broken build while the grid was visibly wrong. The `fill` attribute underneath is the per-family value, and it is what gets drawn wherever `context-stroke` is not understood, which includes the raster engine the command line renders PNGs through. The appearance case therefore asserts the attribute, and additionally asserts that the resolved `marker` element is inside its own instance, which is the defect stated directly. The test says so in a comment, so the next reader is not misled the same way.

Nothing else is unresolved, failing, or unchecked within this item's boundary.

### Post-change review

The goal is met at the level the boundary asked for. An unconfigured host that mounts two Canvases is correct, with no new obligation on hosts; the one residual collision — separately rendered passes pasted into one document — is now named in `DESIGN-017` and has a prop that answers it, rather than being an unstated gap.

Regression risk is low and concentrated where it can be seen. The static renderer's output is proved byte-identical, so nothing published changes. Canvas's rendered identifiers do change, which is the point, and the risk that carries is a host or suite that depended on the old literal names: the repository's own five such sites were moved, and no committed SVG artefact or site content named a Canvas identifier. The `useId` default rests on a React implementation detail, so `InfoschematicDiagram.resources.test.tsx` asserts the shape of its output rather than relying on it — a React release that reintroduced the colons of its 18 series fails in the suite instead of in a host, and the validator would throw rather than emit an unusable identifier.

The weakest remaining point is the one the stylesheet decision names: the Design edit grid's fill is now a presentation attribute that any sufficiently specific downstream selector can beat, and `scripts/stylesheet-shadowing.test.ts` compares flattened selectors so it would not catch a differently-spelled one. That exposure is not new — the authored grid rect has always had it — but it is now shared by both grids, and it is the thing to revisit if a downstream stylesheet ever starts styling grid rects.

Acceptance readiness: ready for review. Every step is complete, every stated gate passes on a quiet serial run, and the two proofs the record demanded were produced as failures rather than as assertions that things pass.

### Mini recap

Delivered per-rendering SVG definition identity for Canvas, with the prefix validator shared from View Model, the Design grid fill moved off the stylesheet, five literal-identifier assertion sites moved onto the rendered prefix, the cross-renderer parity check converted from a shared literal to a closed reference loop, `DESIGN-017` returned to `conforming`, and the host-`Definitions` namespace stated in `EXTEND-002`.

Verified by the full 43-task gate run serially, by three negative proofs that each reproduce the defect or catch a dangling reference, by a byte-for-byte comparison of the static renderer's four example renders against the baseline commit, and by photographing two Infoschematics in one page before and after.

Concerns: one, recorded above — the computed arrowhead fill cannot observe this defect because `context-stroke` masks it, which changed how step 7 had to be written.

Proposed learning routes, none promoted automatically. The durable lesson is that a visual-treatment check comparing two renderers against a shared literal string was asserting a coincidence of naming rather than a property, and that the closed-loop form — a reference must resolve within the rendering that made it — is the shape that would have caught both this defect and the undrawn-arrowhead defect that shipped before it; that belongs in whatever guidance owns renderer parity testing. A second, smaller route: `context-stroke` means a marker's _computed_ fill is not evidence about which marker resolved, which is worth knowing before the next appearance test is written against a marker.

## Discussion

### What "unique by default" can actually promise

`useId` is unique per mount within one React root, and deterministic per render call. It is not unique per document. `packages/view-canvas/src/Canvas.dynamics.test.tsx:94` asserts two independent `renderToStaticMarkup` calls produce byte-identical markup, which is a property worth keeping and which a per-mount default preserves — but it is the same fact that makes two independently server-rendered Canvases pasted into one page collide exactly as they do today. So the open question is what the default is promising. If it is "unique per mount", an unconfigured client host is correct and an unconfigured server host that renders in two passes is not, and the contract has to say which hosts it covers. If it must be "unique per document", `useId` is the wrong instrument and something document-scoped is needed, which brings back the mount-order fragility this item is trying to remove. Settle this before step 3, because it decides whether the appearance cases in step 7 are the whole proof or only the client half of it.

### The stylesheet rule after the fill moves

`scripts/stylesheet-shadowing.test.ts` compares selectors with combinators flattened and one at a time, so it catches a downstream stylesheet redeclaring `.edit-grid rect`. It does not catch a downstream stylesheet declaring `.infoschematic-svg .edit-grid rect`, which flattens to a different string and would still override an inline presentation attribute. Moving the fill inline therefore trades a rule that cannot be shadowed for a value that any new, differently-spelled selector can quietly beat. Whether that is acceptable, or whether the fill should be set through a custom property that the stylesheet reads, is open and affects step 1.

### Why a green suite missed it

Every existing Canvas unit test mounts one instance, and document-order collision needs two. The host fixture that found this is the shape the suite was missing rather than a one-off, and the same reasoning applies to anything else Canvas emits into a shared document.
