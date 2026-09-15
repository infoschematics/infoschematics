---
id: INFOSCHEMATICS-TOOL-054
area: TOOL
title: Copyable example packages
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:15:21Z
updated_at: 2026-09-15T07:25:00Z
---

# Copyable example packages

## Goal

Make each authored example a self-explanatory package that someone can inspect, copy out of the monorepo, install, render, and adapt without reconstructing hidden Site or workspace conventions.

## Context

The repository already contains three workspace packages: `@infoschematics/is-blank`, `@infoschematics/is-infoschematics`, and `@infoschematics/is-system`. Each has its own `package.json`, TypeScript configuration, source, and tests, and the root workspace includes `examples/*`.

They are not yet portable examples in practice. They are private, their canonical content is authored directly in TypeScript, their entry points export source files, and they have no package-local README or commands for validation and rendering. Site imports make them usable inside this monorepo, but a reader cannot treat one directory as a complete starter without learning the repository first.

## Boundary

This item does not publish example packages to npm, turn examples into reusable framework libraries, duplicate reusable View behaviour, make Site the source of example data, or require every downstream Infoschematic to copy the same host application.

## Current state

All three example directories are Bun workspace packages with private versioned manifests and direct `src/index.ts` exports. The blank and self-describing examples appear in Playground and documentation, while package-local discovery, YAML-first authoring, standalone commands, and copy verification are absent.

## Steps

- [x] Define a consistent example-package contract covering manifest metadata, primary YAML source, validated programmatic export, README, commands, tests, and optional rendered preview.
- [x] Move each example's canonical authored definition into a readable `infoschematic.yaml` while preserving a browser-compatible typed export for existing consumers.
- [x] Add package-local `check` and `render` commands that work both inside the workspace and after copying the directory into a clean location.
- [x] Add concise package READMEs explaining purpose, files, install, render, edit, and host integration, with direct links to the canonical YAML.
- [x] Keep example-specific assets and presentation data inside the owning package and remove undocumented dependencies on Site source.
- [x] Replace the hard-coded `renderableExamples` catalogue in `scripts/render-example.ts` so the repository and Site derive example discovery from package-owned metadata.
- [x] Extend the existing packed-tarball harness in `scripts/release/pack-smoke.ts` with a clean-copy case that installs and renders each example outside the monorepo, rather than adding a second temporary-project harness.
- [x] Decide separately whether any example package should become publishable; portability and copyability must not depend on npm publication.

## Files touched

- `examples/is-blank/`
- `examples/is-infoschematics/`
- `examples/is-system/`
- `scripts/render-example.ts` and `scripts/release/pack-smoke.ts` for discovery and clean-copy verification
- package-boundary and dependency-cruiser configuration where required
- Site example discovery consumers without moving ownership into Site
- `docs/design/architecture.md`
- affected authoring, getting-started, and integration guides

## Verify

Run each package's local checks, `bun run self:examples:render`, `bun run self:packages:pack-smoke`, and `bun run self:check`. Copy each example directory into a clean temporary project, install against packed repository packages, run its documented validation and render commands, and confirm the resulting canonical model and SVG match the in-repository example. Confirm Site and Playground still consume package exports rather than copied definitions.

## Dependencies / blocks

No hard dependency is known. The lossless YAML document model has already landed, so package sources can become YAML-first immediately; follow [the authored-YAML editing guide](../guides/editing-authored-yaml.md) for the round-trip expectations rather than inventing a package-local convention.

## Documentation impact

### Decision Records

Update the example-ownership decision if one exists. Add a focused decision only if the package contract introduces generated source or a new ownership boundary not covered by the architecture decision.

### Specifications

No product behaviour changes are required, but repository verification should specify the standalone-copy smoke-test contract if it becomes a maintained conformance gate.

### Guides

Update authoring and integration guidance to present each example package as a copyable starting point and explain its YAML, programmatic export, validation, and rendering workflow.

### Roadmap

Keep Studio-backed Playground work in `INFOSCHEMATICS-SITE-019`; this item owns example package portability and package-owned discovery metadata.

## Discussion

### Existing package shape

The missing step is not creating package directories—they already exist. The work is making each package independently understandable and executable, with the same visible entry points a downstream author would expect.

### YAML and programmatic exports

YAML should be the primary example authors copy and edit. A generated or build-time programmatic export may remain useful for browser consumers, but it must be derived from or checked against the YAML rather than becoming a second source of truth.

### Publication

An example can be a complete package without being published. Keeping publication separate avoids coupling copyable learning material to registry naming, versioning, and release authority.

## Review

### Delivered

Three example packages that a reader can copy out of the repository and use: each authors its Infoschematic as YAML, generates its typed export from that document, carries a README and its own `check` and `render` commands, and is proven outside the monorepo by a clean-copy case in the release smoke. Repository and Site example discovery now reads package-declared metadata instead of a catalogue held in a script.

### Summary of changes

Every example's canonical definition moved from TypeScript into YAML beside its manifest: `examples/is-blank/infoschematic.yaml`, `examples/is-infoschematics/infoschematic.yaml`, `examples/is-infoschematics/overview.yaml`, and `examples/is-system/infoschematic.yaml`. The former 1072-line `is-infoschematics/src/index.ts` is now a two-line re-export.

`scripts/examples.ts` is new. It reads each package's `infoschematics.examples` declaration, writes `src/<document>.ts` for each declared document, and verifies them under `--check`. A generated module embeds the exact bytes of its document and calls `parseInfoschematic` on them at import time, so it cannot serve a model the YAML does not describe. The alternative — generating a TypeScript object literal — would have needed a literal printer and would have left two readable copies of one diagram.

`scripts/render-example.ts` builds `renderableExamples` from that same metadata and resolves a registered example to its YAML pathname, so adding an example touches only its own package. `scripts/release/pack-smoke.ts` gains `exampleCopySmoke`: it copies each example directory into a clean temporary project, rewrites its `@infoschematics/*` ranges to packed tarballs, installs, runs the package's own `check` and `render`, compares the resulting SVG with what this repository renders from the same document, and imports the copied typed export to confirm it renders the same thing.

Root scripts gain `self:examples:generate` and `self:verify:examples`, the latter inside `self:check`. `examples/*/*.svg` is ignored, since `render` writes a preview beside the document.

Documentation: [ADR-INFOSCHEMATICS-022](../decisions/ADR-INFOSCHEMATICS-022-generate-example-exports-from-authored-yaml.md) records generated exports, [ADR-INFOSCHEMATICS-023](../decisions/ADR-INFOSCHEMATICS-023-keep-example-packages-copyable-not-published.md) answers the publication step, [the example package guide](../guides/authoring-example-packages.md) is new, `docs/design/architecture.md` gains the example package contract, and the authoring content, root README, and programmatic-examples guide were corrected where they described the old shape.

### Verification

`bun run self:check` passed: 87 test files and 648 tests, 8 browser files and 24 tests, thirteen typecheck projects, dependency boundaries, and the Site production build.

`bun run self:packages:pack-smoke` passed, including the new clean-copy case: `is-blank` 1, `is-infoschematics` 2, `is-system` 1 document rendered outside the monorepo. The case was mutation-tested — changing one word in a generated module's embedded YAML made the copy fail with `Generated export blankInfoschematic does not render what its document renders`, and regeneration restored it.

Rendered output is byte-identical to before the conversion. Each of the four documents was rendered from the committed pre-change TypeScript module and from the new YAML-derived export and compared: `blank`, `infoschematics`, `homepage`, and `system` all matched exactly, so the visual result is unchanged rather than merely still passing.

### Outstanding concerns

`bun run self:packages:pack-smoke` was already failing on `main` before this item, for an unrelated reason: its own CLI fixture authored `diagram` without `gridSize`, which the canonical schema requires, so all three render parity checks failed. The fixture was completed rather than the contract relaxed — `infoschematicSchema` requires `gridSize` deliberately and `packages/domain-core/src/schema.test.ts` asserts it. Worth noting for the walkthrough: the release smoke is not part of `self:check`, which is why a stale fixture sat there unnoticed.

`bun run render` now writes an SVG beside each document, and those previews are ignored rather than committed. A committed preview would be a fourth copy of the same diagram to keep current; the pack smoke renders one per example anyway.

Example packages remain `private: true` and out of `releasePackages`. That is the answer to the publication step, recorded in `ADR-INFOSCHEMATICS-023` rather than left implicit.

### Post-change review

The example tests needed one change beyond the move. `expectSerialisable` walked the exported model asserting every leaf was a boolean, number, or string; the canonical parser materialises absent optional fields as explicit `undefined`, which JSON serialisation drops, and fourteen `route.labelAt` fields tripped it. Treating `undefined` as absent is correct for a serialisability assertion and is commented as such. Changing the parser to omit rather than materialise those keys is a domain-core question outside this item's boundary.

`scripts/render-example.ts` keeps accepting a document pathname as well as a registered id, so `scripts/format-parity.test.ts` and ad-hoc rendering of an arbitrary document both still work.

`ADR-INFOSCHEMATICS-021` cited `scripts/render-example.ts` as evidence that TypeScript authors already have a four-line rendering path; that script no longer imports a typed example, so the sentence was corrected to describe what it does now. The decision itself is unaffected.

### Mini recap

Copy an example directory anywhere, `bun install`, `bun run render`, edit the YAML — and the release smoke proves that sequence works outside this repository. The typed export is generated from the document rather than maintained beside it, so the diagram a reader edits and the model a host imports cannot disagree.
