---
id: INFOSCHEMATICS-TOOL-004
area: TOOL
title: Publish consumable packages
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Publish Domain Model, View Model and Studio View as independently consumable packages with stable build artefacts, export maps and release guidance.

## Context

The monorepo currently exposes TypeScript source and resolves matching package versions through Bun workspaces. That is enough for local hosts, examples and the public site, but external consumers still need path overrides. Publication should make the existing package boundary usable without copying source or depending on this repository's layout.

## Boundary

This item does not change the product model, add renderers, publish the site as a library, or introduce application-specific content. The initial publication targets are `@infoschematics/domain-model`, `@infoschematics/domain-core`, `@infoschematics/view-model` and `@infoschematics/view-studio`; later view and renderer packages join through their own delivery work.

## Current state

The four public packages are versioned `0.1.0` and expose TypeScript source through their export maps. They have no `dist/` output, declaration build, `files` allow-list, package build or pack scripts, isolated consumer test, coordinated release check or publishing workflow. The root CI verifies the monorepo only. None of the four scoped names currently resolves from the public npm registry.

## Steps

- [ ] Establish a fixed-version public release set and a preflight that verifies npm scope ownership, package-name availability and explicit release authority without storing a registry token in the repository.
- [ ] Add shared package-build configuration that emits unbundled ESM JavaScript, source maps and declarations to `dist/`, rewrites relative TypeScript extensions, and leaves package dependencies external.
- [ ] Replace source export maps with explicit `types` and `import` targets, preserve every supported Domain Model subpath, add `files` allow-lists and mark CSS side effects where required.
- [ ] Add per-package clean and build scripts plus root commands that build in dependency order and reject mismatched public versions or internal dependency ranges.
- [ ] Pack every public package and inspect the complete tarball file set, metadata, licence, declaration targets and absence of source-only or repository-private files.
- [ ] Install the tarballs into isolated Node and browser-oriented consumers, import every public entry point, normalise a title-only definition and render Studio through React server rendering.
- [ ] Extend CI to build, pack and run the isolated consumer smoke tests before any release can start.
- [ ] Add a protected GitHub release workflow using npm trusted publishing, OIDC `id-token: write`, automatic provenance and dependency-order publication from an immutable version tag.
- [ ] Document the version, tag, changelog, dry-run, rollback and post-publication verification procedure.
- [ ] Stop for separate explicit release authority, then publish the first coordinated version and verify registry metadata plus clean-room installation.

## Files touched

- root `package.json`, shared TypeScript build configuration, `bun.lock` and package-build or version-check scripts;
- `packages/*/package.json` and package-specific build configuration;
- generated `dist/` directories only as ignored build output, never committed;
- isolated pack-consumer fixtures under the repository's test tooling;
- `.github/workflows/ci.yml` and a new protected release workflow;
- `README.md`, `docs/guides/react-integration.md` and release guidance under `docs/`.

## Verify

`bun run check`, the package build, tarball inspection and isolated-consumer commands must all pass from a clean checkout. Each tarball must contain only intended runtime, type, style, metadata and licence files; Node must resolve every declared export; and the React consumer must render a title-only Infoschematic. After separately authorised publication, `npm view` and a fresh registry install must report the intended version, provenance and dependency ranges.

## Dependencies / blocks

The current four packages can be built and published independently of `INFOSCHEMATICS-TOOL-008`; later Canvas, Present and SVG packages adopt the same release contract when they exist. External publication requires control of the `@infoschematics` npm scope, a configured trusted publisher and explicit release authority. Implementation must stop before the release step if any of those is unavailable.

## Documentation impact

### Decision Records

Add a release-engineering decision only if implementation introduces a durable versioning or distribution rule not already expressed by package metadata and guidance.

### Specifications

No product behaviour changes. Package entry-point and runtime-support guarantees become testable distribution requirements in the relevant package specifications.

### Guides

Update installation and React integration guidance to use registry packages and document supported public entry points and CSS imports.

### Roadmap

Future public packages inherit this release path; they do not expand this item unless present before its approved release boundary.

## Discussion

### Release contract

The initial release contract uses unbundled compiled ESM with declarations and explicit export maps, one coordinated version across the public package set, and React as a peer where required. Packed clean-room consumption is the release candidate; registry publication is a separately authorised operation through trusted publishing and provenance.
