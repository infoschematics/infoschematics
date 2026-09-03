---
id: INFOSCHEMATICS-TOOL-008
area: TOOL
title: Establish additive views
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 17eff4ff097240d5bce74ec79bec0e455a5e84a1
---

## Goal

Deliver the agreed package direction so consumers can select an interactive Canvas, Audience-facing Present view, Producer-facing Studio view, or deterministic static SVG renderer without importing capabilities they do not need.

## Context

The Domain Model, Domain Core, and View Model boundaries exist, but `@infoschematics/view-studio` still contains Canvas, Present, and Studio behaviour together. `@infoschematics/view-canvas`, `@infoschematics/view-present`, and `@infoschematics/render-svg` are documented architectural destinations but do not yet exist as packages.

[ADR-INFOSCHEMATICS-006](../decisions/ADR-INFOSCHEMATICS-006-additive-views-and-renderers.md) governs the additive dependency direction. TOOL-004 owns publication after the package surfaces are consumable; TOOL-007 owns the extensible renderer-key registry rather than the initial static SVG output.

## Boundary

This item does not publish packages, add domain-specific renderers, redesign the Domain Model, or complete every Design and Direct editing capability. It preserves the current public Studio behaviour while moving ownership downward.

## Current state

`packages/view-studio` owns the public `App`, the React runtime context, `InfoschematicDiagram`, host-provided Fabric and Graphic renderer bindings, Audience presentation state and controls, Producer controls, editing state, and one aggregate stylesheet. `apps/site` mounts that combined package around the framework-neutral `examples/is-blank` definition. `packages/view-model` already owns geometry, routing, placement and the first shared visual token, but the reusable runtime derivation remains trapped in the React context module.

The ownership roots and package direction are settled. IBC residue removal delivered the host-owned renderer seam and reusable-package neutrality that this extraction needs; its retained residue guard is now an implementation precondition check rather than an unfinished source dependency. The remaining work is a behaviour-preserving extraction with one new non-React output, not another naming or repository-layout decision.

## Steps

- [x] Move `createInfoschematicRuntime` and its output types into a framework-neutral View Model module, leaving a thin React provider and hook at the Canvas boundary.
- [x] Create `packages/view-canvas` with a public `Canvas` component, the interactive Infoschematic renderer, built-in renderer bindings, Canvas-owned styles and focused component tests.
- [x] Create `packages/view-present` with a public `Present` component over Canvas, moving Audience visibility, Scene focus, Story playback, Callouts, Details and presentation controls with their existing tests.
- [x] Refactor `packages/view-studio` into a public `Studio` component over Present, retain `App` as a compatibility alias, and leave Producer Design and Direct state, panels and editing tests with Studio.
- [x] Create `packages/render-svg` with a framework-neutral `renderInfoschematicSvg` API over Domain Model and View Model, deterministic render options, escaped serialisation and no React dependency.
- [x] Split the aggregate stylesheet by ownership while keeping `@infoschematics/view-studio/styles.css` as the compatibility aggregate over Present and Canvas styles.
- [x] Update root workspace scripts, package manifests, dependency rules and TypeScript checks for all four View and renderer packages.
- [x] Keep `examples/is-blank` dependent only on Domain Core, update `apps/site` to mount the compatibility Studio surface, and add public-import tests that prohibit package-internal imports.
- [x] Update architecture, View specifications and React consumer guidance to name the delivered package surfaces and remove the single-package gap.

## Files touched

- `package.json`, `bun.lock`, `.dependency-cruiser.mjs` and the root TypeScript/check scripts;
- `packages/view-model/src/runtime.ts` and focused runtime tests;
- new `packages/view-canvas/**`, `packages/view-present/**` and `packages/render-svg/**` package roots;
- `packages/view-studio/src/**` only to move lower-owned code, establish `Studio`, retain the `App` alias and aggregate styles;
- `apps/site/src/BlankInfoschematic.tsx` and its public-composition tests;
- `docs/design/architecture.md`, `docs/specs/view-model.md`, `docs/specs/view-present.md`, `docs/specs/view-studio.md`, a new static-renderer specification, and `docs/guides/react-integration.md`.

## Verify

Focused tests must prove the framework-neutral runtime produces the same register, visibility and routed geometry as the current React-owned derivation; Canvas renders a title-only and representative configuration; Present preserves filtering, Scene and Story behaviour; and Studio preserves the existing editing interactions and `App` compatibility export.

Static SVG tests must prove byte-for-byte deterministic, escaped markup for a blank Infoschematic and a representative configured Infoschematic, including explicit Scene and visibility options. Dependency Cruiser must enforce Canvas → Present → Studio without reverse imports and must prove `render-svg` has no React or interactive-view dependency. `bun run check` is the final pass/fail gate, including every package type check and the production Site build.

## Dependencies / blocks

The public vocabulary, package ownership and physical monorepo roots are settled by ADR-INFOSCHEMATICS-006 and ADR-INFOSCHEMATICS-008. `INFOSCHEMATICS-TOOL-010` established `packages/`, `apps/` and `examples/`; those roots are present in the current tree, so this item does not reopen that migration. `INFOSCHEMATICS-TOOL-011` has delivered the required host-neutral renderer seam and residue guard and is awaiting acceptance, but no unfinished source change blocks this plan. Implementation preflight must confirm both results remain present and stop if another source move is changing them.

No other roadmap item is a hard prerequisite. Publication, production-mode, editing, registry, token and authored-example work can each be planned independently against the owning contracts and may choose additive-view delivery order during implementation.

## Documentation impact

### Decision Records

ADR-INFOSCHEMATICS-006 owns the package direction and ADR-INFOSCHEMATICS-008 owns physical roots. No new decision record is expected unless delivery uncovers a materially different ownership rule.

### Specifications

Split Present and Studio requirements by their final package owner, and add deterministic SVG output requirements without duplicating Domain or View Model contracts.

### Guides

Update consumer imports and explain how to choose Canvas, Present, Studio, or SVG output.

### Roadmap

Keep TOOL-004 focused on publication and TOOL-007 focused on the renderer registry. Record newly discovered capability gaps separately rather than expanding this extraction.

## Review

### Delivered

From immutable baseline `17eff4ff097240d5bce74ec79bec0e455a5e84a1`, delivered independently consumable Canvas, Present and static SVG packages, moved shared runtime derivation below React, and retained the public Studio compatibility surface. The implementation is recorded in `a93196df`, `99d0a3f0` and `b3d27383`.

### Summary of changes

`packages/view-model/src/runtime.ts` now owns deterministic registers, visibility, routing, Scene and Story derivation. `packages/view-canvas` owns the interactive diagram, runtime and renderer contexts, interaction contract and Canvas styles. `packages/view-present` owns an Audience-only component, pure presentation reducer, filters, mutually exclusive Scene and Story focus, playback, Callouts and details. `packages/render-svg` provides deterministic escaped SVG with explicit visibility and Scene options and no React dependency.

Studio now exports `Studio` while retaining `App`, consumes the lower Canvas and Present public contracts, and keeps its compatibility stylesheet as the aggregate entry. Root type checks and Dependency Cruiser include every new package, and architecture, View specifications, static-renderer requirements and React integration guidance describe the delivered surfaces.

### Verification

`bun run check` passed after integration: 18 test files and 111 tests passed, every TypeScript workspace passed, Dependency Cruiser reported no violations across 134 modules and 252 dependencies, and the production Site build completed. Focused runtime, Canvas, Present, Studio and SVG tests also passed. `ki repo audit --skill ki-authoring --repo .` passed before the integration commit.

### Outstanding concerns

Studio retains its integrated presentation composition to preserve existing editing behaviour rather than rendering the standalone `Present` component internally. It consumes Canvas directly and shares Present's public host contract; `INFOSCHEMATICS-TOOL-005` owns consolidation of the duplicated presentation state while completing production modes. The build also retains existing Vite deprecation and bundle-size advisory output; neither is a verification failure.

### Post-change review

The goal is met: consumers can import Canvas, Present, Studio or a framework-neutral SVG renderer without importing higher capabilities. Shared runtime derivation no longer depends on React, Studio compatibility remains intact, and executable dependency rules prevent reverse imports. The item is ready for human acceptance.

### Mini recap

Additive Views are now physical public packages rather an architectural destination. Delegation isolated Canvas/runtime, Present and SVG work before coordinator integration; separate commits kept those lanes reviewable and avoided absorbing concurrent Site changes.

## Done

Pending human acceptance.

## Discussion

### Extraction order

Canvas should move first because both Present and Studio depend on it. Present follows because Studio is its additive Producer wrapper. Static SVG can proceed beside that chain once shared derivation has a framework-neutral home.

### Compatibility

Studio remains the compatibility surface during extraction. `@infoschematics/view-studio` exports the new `Studio` name and retains `App` as an alias; its stylesheet remains an aggregate entry point. Existing Site composition therefore remains valid while narrower consumers gain direct Canvas and Present imports.

### Static rendering

The SVG renderer shares framework-neutral runtime derivation, not React components. Its options make Scene, visibility, overlays and motion-free defaults explicit, and its string output must be stable enough for snapshots, files and server-side use without a DOM.
