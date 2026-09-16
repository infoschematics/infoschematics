---
id: INFOSCHEMATICS-TOOL-058
area: TOOL
title: Scoped renderer definition identity
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-15T07:05:00Z
updated_at: 2026-09-16T10:45:00Z
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

1. [ ] Settle the stylesheet first, because it decides whether the grid can be scoped at all: move the `fill` declaration from `packages/view-canvas/src/styles.css:920` onto the `edit-grid` rect at `InfoschematicDiagram.tsx:2072`, leaving `pointer-events: none` in the rule. Verifiable: `grep -n 'url(#' packages/view-canvas/src/styles.css` returns nothing, and `bun run self:verify:repo` still passes `scripts/stylesheet-shadowing.test.ts`.
2. [ ] Put the prefix validator somewhere both renderers can reach. `packages/view-canvas` and `packages/render-svg` both depend on `@infoschematics/view-model` and neither may depend on the other, so it belongs in `packages/view-model/src/` with a matching export subpath. Verifiable: `bun run self:verify:depcruise` passes and `bun run --cwd packages/render-svg test` still rejects `'unsafe prefix'`.
3. [ ] Add an optional `resourceIdPrefix` prop to `InfoschematicDiagram`, defaulting to `useId()` and validated by that shared validator. `Canvas` needs no change of its own: `CanvasProps` is derived from `ComponentProps<typeof InfoschematicDiagram>` at `packages/view-canvas/src/Canvas.tsx:32,39`. Verifiable: a unit case mounts two Canvases in one tree and asserts the two `pattern` identifier sets are disjoint and each value satisfies the validator.
4. [ ] Apply the prefix to every identifier and every reference named in Current state — `InfoschematicDiagram.tsx` lines 1561, 1562, 1882, 1895, 1908, 1914, 1926, 1942, 1966 and 2072. Verifiable: `grep -n 'infoschematic-grid-\|infoschematic-arrow-' packages/view-canvas/src/InfoschematicDiagram.tsx` leaves no occurrence that is not read through the prefix value.
5. [ ] Move the literal-identifier assertions onto the rendered prefix in `tokens.test.tsx:45,47`, `InfoschematicDiagram.treatments.test.tsx:83,84,96,199,209` and `App.browser.test.tsx:384,390`. Verifiable: `bun run --cwd packages/view-canvas test` and `bun run --cwd packages/view-studio test:browser`.
6. [ ] Change `scripts/visual-treatment-parity.test.ts:392,406,407` to compare the pattern each renderer references against the pattern that renderer defines, instead of a shared literal. Verifiable: `bun run self:verify:repo` passes, and the case still fails if either renderer's reference is pointed at a pattern it never defines.
7. [ ] Extend `InfoschematicDiagram.host.browser.test.tsx` with two appearance cases: two instances with different family colours each draw their own arrowhead, read as the computed fill of the `marker` path inside each instance root rather than as an identifier; and two instances with different authored `gridSize` each paint their own pattern, read as the `height` of the `pattern` inside each instance root. Verifiable: `bun run --cwd packages/view-canvas test:browser`, and both cases fail when the prefix is removed — prove that rather than asserting it passes today.
8. [ ] Return `DESIGN-017` (`docs/specs/design-session.md:219-229`) to `conforming`, restate its `_Verify:_` and `_Evidence:_` lines to name the appearance cases, and state in `docs/specs/renderer-extensions.md` that identifiers inside a host-supplied `Definitions` component are the host's own namespace. Verifiable: `bun run self:verify:repo` — `scripts/specification-evidence.test.ts` checks both the conformance value and that every cited path resolves.
9. [ ] Render two Infoschematics with different family colours and different grid sizes into one page and look at the result. Shortest route: `bun run self:dev`, open the Card component page of the visual guide, and give one comparison variant a different grid treatment locally. Verifiable by eye, which is the point — a fully green suite did not notice this.

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

## Discussion

### What "unique by default" can actually promise

`useId` is unique per mount within one React root, and deterministic per render call. It is not unique per document. `packages/view-canvas/src/Canvas.dynamics.test.tsx:94` asserts two independent `renderToStaticMarkup` calls produce byte-identical markup, which is a property worth keeping and which a per-mount default preserves — but it is the same fact that makes two independently server-rendered Canvases pasted into one page collide exactly as they do today. So the open question is what the default is promising. If it is "unique per mount", an unconfigured client host is correct and an unconfigured server host that renders in two passes is not, and the contract has to say which hosts it covers. If it must be "unique per document", `useId` is the wrong instrument and something document-scoped is needed, which brings back the mount-order fragility this item is trying to remove. Settle this before step 3, because it decides whether the appearance cases in step 7 are the whole proof or only the client half of it.

### The stylesheet rule after the fill moves

`scripts/stylesheet-shadowing.test.ts` compares selectors with combinators flattened and one at a time, so it catches a downstream stylesheet redeclaring `.edit-grid rect`. It does not catch a downstream stylesheet declaring `.infoschematic-svg .edit-grid rect`, which flattens to a different string and would still override an inline presentation attribute. Moving the fill inline therefore trades a rule that cannot be shadowed for a value that any new, differently-spelled selector can quietly beat. Whether that is acceptable, or whether the fill should be set through a custom property that the stylesheet reads, is open and affects step 1.

### Why a green suite missed it

Every existing Canvas unit test mounts one instance, and document-order collision needs two. The host fixture that found this is the shape the suite was missing rather than a one-off, and the same reasoning applies to anything else Canvas emits into a shared document.
