---
id: INFOSCHEMATICS-TOOL-054
area: TOOL
title: Copyable example packages
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:15:21Z
updated_at: 2026-09-15T04:44:26Z
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

- [ ] Define a consistent example-package contract covering manifest metadata, primary YAML source, validated programmatic export, README, commands, tests, and optional rendered preview.
- [ ] Move each example's canonical authored definition into a readable `infoschematic.yaml` while preserving a browser-compatible typed export for existing consumers.
- [ ] Add package-local `check` and `render` commands that work both inside the workspace and after copying the directory into a clean location.
- [ ] Add concise package READMEs explaining purpose, files, install, render, edit, and host integration, with direct links to the canonical YAML.
- [ ] Keep example-specific assets and presentation data inside the owning package and remove undocumented dependencies on Site source.
- [ ] Replace the hard-coded `renderableExamples` catalogue in `scripts/render-example.ts` so the repository and Site derive example discovery from package-owned metadata.
- [ ] Extend the existing packed-tarball harness in `scripts/release/pack-smoke.ts` with a clean-copy case that installs and renders each example outside the monorepo, rather than adding a second temporary-project harness.
- [ ] Decide separately whether any example package should become publishable; portability and copyability must not depend on npm publication.

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
