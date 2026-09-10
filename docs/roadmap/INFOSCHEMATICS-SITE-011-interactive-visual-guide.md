---
id: INFOSCHEMATICS-SITE-011
area: SITE
title: Interactive visual guide
theme: site-experience
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: 532cdbfcb4d1a762b70500f65ed11b06ac6ddfe2
---

## Goal

Turn the visual guide from a wall of specimens into a reader-facing guide to what appears in an Infoschematic, what each visible element means, and which authored treatments change its presentation.

## Context

`apps/site/src/VisualGuide.tsx` currently gives Surface, Grid, Card detail, and Region label placement a screenshot-like gallery. It shows outcomes but does not explain the visual model, the distinction between artefacts and groupings, or how related treatments work together.

The guide should be comparable in structure to a mature component-library guide: orientation first, then anatomy, then focused references with live examples. It documents the diagram output. Studio panels, editorial modes, and producer workflows belong elsewhere.

## Boundary

This item owns the public visual-guide structure, explanatory copy, live output specimens, and controls for the authored appearance catalogue. It may improve the Getting Started overview where that orientation is required.

It does not document Studio or editorial interfaces, change renderer behaviour, add authored options, or introduce a second product vocabulary. Presentational states such as Scenes and Flow signals are explained only to distinguish them from authored appearance; their deeper interaction model remains in their own guides and roadmap work.

## Current state

The page renders four static SVG specimen groups from `apps/site/src/visual-guide/specimens.ts`. The runtime catalogue from `INFOSCHEMATICS-TOOL-026` now describes all twelve authored appearance options, but the page neither consumes it nor gives readers a conceptual sequence.

## Shaping decisions

- **Use a visual curriculum.** Start with the complete diagram and its constituent parts, distinguish primary artefacts from groupings and geometry, then cover Canvas, Region, and Card treatments.
- **Keep controls beside the output they change.** Each treatment section owns one local stateful specimen, derived controls, a concise explanation, and reset.
- **Render the deterministic product output.** The guide uses the public SVG renderer already available to Site. It demonstrates authored visual output without importing Studio or suggesting that documentation controls are product editing UI.
- **Keep controls catalogue-backed.** Site carries a small presentation projection because its dependency boundary forbids importing Domain Model directly. A repository-level parity test checks its choice, flag, colour, and number descriptors against the canonical catalogue, while a curriculum test prevents an authored option shipping without a guide home.
- **Keep anatomy broader than the treatment catalogue.** Region, Fabric, Card, Flow, Point, and Graphic all receive an explanation even where no authored appearance option exists. Scope, Domain, and Flow Family are explained as independent groupings, not artefacts.

## Steps

- [x] Restructure `apps/site/src/VisualGuide.tsx` into introduction, anatomy, grouping, treatment, and presentation-state sections.
- [x] Add curriculum data and a complete anatomy specimen covering all six primary artefact kinds.
- [x] Add a Site-local generic appearance control and stateful specimen section derived from `appearanceOptions`.
- [x] Cover every catalogue option across Canvas, Region, and Card sections and provide reset for each section.
- [x] Add tests for curriculum identity, term links, primary-artefact coverage, and appearance-option coverage.
- [x] Update Site styles for readable specimens and controls across desktop and narrow viewports.
- [x] Improve `docs/overview.md` so Getting Started introduces the product, its visible constituent parts, and the path from definition to output.
- [x] Cross-link the visual-language guide and public documentation navigation.

## Files touched

- `apps/site/src/VisualGuide.tsx`
- `apps/site/src/visual-guide/curriculum.ts`, new
- `apps/site/src/visual-guide/AppearanceControl.tsx`, new
- `apps/site/src/visual-guide/InteractiveSpecimen.tsx`, new
- `apps/site/src/visual-guide/specimens.ts`
- `apps/site/src/visual-guide/curriculum.test.ts`, new
- `apps/site/src/visual-guide/specimens.test.ts`
- `scripts/visual-guide-catalogue.test.ts`, new
- `apps/site/src/styles.css`
- `docs/overview.md`
- `docs/design/visual-language.md`

## Verify

Run `bun run self:check`. The curriculum test proves that every primary artefact, catalogue option, and cited vocabulary term has one guide home. Inspect the rendered guide at desktop and narrow widths: controls change only their adjacent SVG, reset restores its initial state, diagrams remain legible, and the page contains no Studio or editorial-interface instruction.

## Dependencies / blocks

`INFOSCHEMATICS-TOOL-026` delivered the appearance catalogue and is awaiting review. Its implementation is present on the immutable baseline and this item consumes it without broadening its public contract.

`INFOSCHEMATICS-TOOL-027` follows this item so the documentation and decision-record sweep reviews the final guide language rather than a provisional page.

## Delegation

No delegation. The page structure, curriculum, prose, and tests are tightly coupled and the current outcome-authorised run does not grant delegated execution.

## Documentation impact

### Decision Records

None expected. This item explains existing product decisions and links to their durable sources.

### Specifications

No requirement changes.

### Guides

The Getting Started overview and visual-language guide gain complementary navigation. The interactive visual guide remains a Site-rendered page because its live specimens are not Markdown copies of canonical guidance.

### Roadmap

Record implementation and verification evidence here before review.

## Review

### Delivered

The visual guide is now a structured introduction to diagram output: anatomy, groupings, authored treatments, and the boundary with presentation states. It shows all six primary artefact kinds in one rendered specimen and gives every catalogued appearance option a live control beside its SVG output. The Getting Started overview now explains the same constituent parts and the path from definition to output.

The immutable delivery baseline is `532cdbfcb4d1a762b70500f65ed11b06ac6ddfe2`. During delivery, `4a59f0b3cec4b7827ee0015b9fe81b899451cae4` changed the global Site page inset in `styles.css`; that isolated user-owned change was revalidated and retained.

### Summary of changes

- `VisualGuide.tsx` now provides a reader journey and vocabulary-linked reference rather than a screenshot wall.
- `curriculum.ts`, `AppearanceControl.tsx`, and `InteractiveSpecimen.tsx` provide the visual curriculum and local documentation controls.
- `specimens.ts` supplies one complete six-artefact anatomy specimen and immutable appearance updates for twelve controls.
- Curriculum, specimen, and repository-level catalogue-parity tests prevent coverage and option drift.
- `styles.css` provides responsive reference cards, specimens, and control panels; desktop and 500-pixel viewport screenshots were reviewed.
- `docs/overview.md`, `docs/design/visual-language.md`, and the vocabulary reference now orient readers to the guide and include Point in the stated six artefacts.

The approved plan was refined after the dependency gate correctly rejected a direct Site-to-Domain-Model import. Site now owns a parity-tested UI projection of catalogue descriptors, preserving package ownership without widening a public package API.

### Verification

`bun run self:check` exits 0: 67 test files and 485 tests pass, TypeScript workspaces compile, dependency cruise reports no violations across 366 modules and 1,131 dependencies, generated artefacts are current, and the production Site builds.

Focused Site tests also pass: seven files and 73 tests. Desktop and narrow screenshots confirm readable structure, single-column responsive cards, generated SVG specimens, and adjacent controls.

### Outstanding concerns

The Browser control runtime was unavailable in this environment, so visual review used installed Chrome in headless mode. Controls are covered by state-transition tests and rendered correctly, but the human review should still try a selection, checkbox, colour, range, and reset in a normal browser.

The visual guide deliberately gives presentation states a boundary explanation rather than a full catalogue. Deeper Scene and diagram-dynamics guidance remains separate work.

### Post-change review

The goal and scope are met. The guide documents only visible diagram output and does not teach Studio panels or editorial workflows. Runtime rendering behaviour and authored configuration remain unchanged. The new parity test prevents the local documentation projection from becoming a second source of truth.

The page is ready for content and interaction review.

### Mini recap

Delivered a MUI-style visual-guide foundation with anatomy, grouping explanations, live treatment examples, complete option coverage, responsive styling, and a substantially clearer Getting Started overview. Verification is clean. The remaining reviewer action is qualitative: read the flow and exercise representative controls in a normal browser.

## Done

Accepted 2026-09-10 by Kris Brown on the review packet above.

## Discussion

### Why the controls are Site-local

These controls teach documentation readers how authored options affect output. They are not the Studio's Details panel and do not establish a reusable editing contract. Site owns this composition; the catalogue and rendering behaviour remain in lower packages. If another product View later needs a generic editing control, it can define that interaction against its own requirements rather than inheriting documentation UI.
