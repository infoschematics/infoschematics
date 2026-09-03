---
id: INFOSCHEMATICS-SITE-001
area: SITE
title: Explain Infoschematics visually
theme: site-experience
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 33000f301728f5b2669cb559fc38e5a87a71eb24
transferred_from: INFOSCHEMATICS-WEB-SITE-001
---

## Goal

Deliver a self-describing Infoschematic as a reusable authored example, make it fully explorable through Studio, and render the same configuration as deterministic SVG so the homepage can compare its bespoke preview with the reusable renderer before replacement.

## Context

The website is the public outlet for the packages, guidance and examples. Its designed homepage already uses a small schematic-like sequence to explain the idea, while `@infoschematics/is-blank` proves Studio accepts a valid title-only configuration. The substantial example must preserve both roles while demonstrating the real Domain Model, additive Views and static renderer from one serialisable source.

The comparison is intentionally temporary. It provides concrete visual evidence of which homepage treatments the reusable renderer already supports and which belong in follow-on capability work.

## Boundary

This item does not reintroduce 5G-EMERGE content, add domain-specific renderers to reusable packages, or make website source part of the product types. It does not hide the editorial controls on the substantial example.

It does not add general visual-treatment configuration merely to imitate the homepage, and it does not design Flow animation or signalling. Those concerns belong to `INFOSCHEMATICS-TOOL-012` and `INFOSCHEMATICS-TOOL-013`. The bespoke homepage preview remains available during comparison and is removed only after explicit visual-parity approval.

## Current state

`examples/is-blank` is the only authored example and proves the minimum title-only contract. `apps/site` exposes it through Studio at `/examples/blank/`, while the homepage explains the idea with a bespoke composition.

Canvas, Present, Studio and `renderInfoschematicSvg` now exist as additive public surfaces. No complete authored Infoschematic currently explains package architecture, dependency direction, View choices or the host boundary, and the homepage has no generated static rendering to compare with its bespoke treatment.

## Steps

- [x] Define a self-describing narrative around Domain Model, Domain Core, View Model, Canvas, Present, Studio, renderers, authored examples and hosts without introducing repository mechanics as product concepts.
- [x] Create an `examples/is-infoschematics` framework-neutral workspace depending only on Domain Core and exporting one complete serialisable definition.
- [x] Use Lanes and Zones for ownership boundaries, Cards for packages and hosts, Flows for allowed dependency direction, and Scenes plus one concise Story to explain the architecture progressively.
- [x] Add model-level tests for stable identifiers, valid references, serialisability, complete Scene focus and the absence of React, browser state, callbacks or renderer implementations from the definition.
- [x] Add a Site route at `/examples/infoschematics/`; let the host own document metadata and retain navigation to the homepage and blank example.
- [x] Mount the substantial example through Studio with its Producer-facing Design, Direct and Present controls available for exploration and editing.
- [x] Render the same exported definition through `renderInfoschematicSvg` for the homepage without importing Studio, React or application state into the authored workspace.
- [x] Show the existing homepage preview and generated SVG side by side as a temporary visual-parity review surface, clearly labelling which is bespoke and which is renderer output.
- [x] Record reusable visual gaps against `INFOSCHEMATICS-TOOL-012` rather than patching page-specific presentation into the generated SVG.
- [x] Add Site tests for direct routing, document titles, editorial controls, representative rendered content, deterministic static SVG and production-build inclusion.
- [x] Update public guidance to distinguish the homepage introduction, blank contract example and substantial editable self-describing example.

## Files touched

- New `examples/is-infoschematics/package.json`, `tsconfig.json` and `src/**` definition and tests.
- Root `package.json` and `bun.lock` only for workspace verification wiring.
- `apps/site/src/routes.ts`, `main.tsx`, the new example host, homepage comparison and focused tests.
- `docs/guides/authoring.md`, `docs/guides/react-integration.md` and `docs/design/architecture.md` where they link representative examples.

## Verify

Authored-example tests must prove `JSON.stringify` succeeds, every referenced artefact and Scene exists, and the workspace imports no View or Site module. Site tests must prove both slash variants route directly, the host derives the document title from the definition, Studio exposes the editorial controls, and representative package labels and dependency Flows render.

A deterministic snapshot must prove the homepage SVG and editable Studio example consume the same exported configuration. Browser review must show the bespoke and generated homepage treatments side by side at representative desktop and narrow widths. `bun run check` is the final pass/fail gate.

## Dependencies / blocks

`INFOSCHEMATICS-TOOL-008` and `INFOSCHEMATICS-TOOL-007` are complete, so the example can use the public Studio and SVG surfaces without a compatibility fallback. The initial side-by-side comparison does not wait for every visual refinement. Its reusable gaps inform `INFOSCHEMATICS-TOOL-012`; animation remains independently shaped by `INFOSCHEMATICS-TOOL-013`.

## Documentation impact

### Decision Records

No new decision is expected. ADR-INFOSCHEMATICS-005, ADR-INFOSCHEMATICS-006 and ADR-INFOSCHEMATICS-007 already govern host-owned configuration, additive Views and the Site outlet.

### Specifications

No behaviour-level specification change is expected. Tests exercise the existing Domain, Studio and static SVG contracts through a substantial example.

### Guides

Link the example from authoring and React integration guidance, explaining the three distinct public-example roles and the shared configuration behind editable and static renderings.

### Roadmap

Keep visual-treatment parity in `INFOSCHEMATICS-TOOL-012` and Flow signalling in `INFOSCHEMATICS-TOOL-013`. Replace the bespoke homepage preview only after the temporary comparison receives explicit visual approval.

## Review

### Delivered

The self-describing `@infoschematics/is-infoschematics` authored package is available through Studio at `/examples/infoschematics/` and through deterministic SVG on the homepage. The original bespoke homepage preview remains beside the shared-renderer output for explicit visual review.

### Summary of changes

- Added a framework-neutral definition with four Lanes, seven Zones, nine package or host Cards, seventeen dependency Flows, four Standalone Scenes, and one three-step Story.
- Added stable-reference, dependency-direction, serialisability, Scene-focus, and authored-boundary tests.
- Added the Site route, host-owned title metadata, Studio mounting, homepage navigation, and side-by-side shared SVG comparison.
- Added workspace dependency and verification wiring and updated public authoring, React integration, architecture, and root orientation guidance.

### Verification

- `bun run check` passed: 40 test files and 248 tests, every TypeScript workspace, dependency boundaries across 176 modules and 414 dependencies, visual-token drift check, and the production Site build.
- Focused authored-example tests, Site route and homepage tests, package and Site typechecks, and production build passed before their implementation commits.
- The production build includes a lazy `InfoschematicsExample` route chunk and the homepage shared-renderer output.

### Outstanding concerns

- The build retains existing non-fatal CSS `@import` ordering and large-chunk warnings.
- Browser-control setup was unavailable for the final local screenshot pass. Responsive behaviour is covered by authored CSS and production build, but the side-by-side visual decision still needs human browser review.
- Reusable parity gaps are recorded on `INFOSCHEMATICS-TOOL-012`; Flow motion remains owned by `INFOSCHEMATICS-TOOL-013`.

### Post-change review

The authored workspace depends only on Domain Core and contains no React, browser state, callbacks, View imports, or renderer implementations. Site owns routing, metadata, interactive mounting, static rendering, and comparison presentation. The generated SVG is encoded as an image source rather than patched with page-specific SVG DOM or CSS.

### Mini recap

Implementation commits are `df5aea63`, `cb3f14f9`, `608cb9de`, `cecb106c`, and `61b0c0fa`, from baseline `33000f301728f5b2669cb559fc38e5a87a71eb24`. The item is ready for human review of the substantial Studio example and the desktop and narrow homepage comparison; accepting it must not remove the bespoke preview without explicit visual-parity approval.

## Done

Accepted by the user on 2026-09-03 after impartial review and a fresh canonical gate. Deferred browser parity and homepage default-switch work is retained in `INFOSCHEMATICS-TOOL-014`.

## Discussion

### Three public surfaces

The homepage introduces the idea quickly, the blank example establishes the minimum valid contract, and `is-infoschematics` demonstrates a substantial authored product. The substantial route uses Studio because its purpose includes hands-on editorial exploration; the homepage consumes only deterministic static SVG from that same definition.

### Comparison before replacement

The existing homepage treatment is a visual reference, not reusable implementation. Keeping it beside renderer output for one review cycle makes missing capabilities visible without contaminating the authored example or static renderer with site-only CSS. Replacement follows explicit approval rather than being inferred from technical completeness.
