---
id: INFOSCHEMATICS-TOOL-004
area: TOOL
title: Publish consumable packages
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: c4849f2825bd4f79512b66de1e9bf05fc6e10207
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

- [x] Establish a fixed-version public release set and run a no-token preflight for npm scope ownership, package-name visibility, and explicit release authority; record every unavailable external gate as a mandatory stop.
- [x] Add shared package-build configuration that emits unbundled ESM JavaScript, source maps and declarations to `dist/`, rewrites relative TypeScript extensions, and leaves package dependencies external.
- [x] Replace source export maps with explicit `types` and `import` targets, preserve every supported Domain Model subpath, add `files` allow-lists and mark CSS side effects where required.
- [x] Add per-package clean and build scripts plus root commands that build in dependency order and reject mismatched public versions or internal dependency ranges.
- [x] Pack every public package and inspect the complete tarball file set, metadata, licence, declaration targets and absence of source-only or repository-private files.
- [x] Install the tarballs into isolated Node and browser-oriented consumers, import every public entry point, normalise a title-only definition and render Studio through React server rendering.
- [x] Extend CI to build, pack and run the isolated consumer smoke tests before any release can start.
- [x] Add a protected GitHub release workflow using npm trusted publishing, OIDC `id-token: write`, automatic provenance and dependency-order publication from an immutable version tag.
- [x] Document the version, tag, changelog, dry-run, rollback and post-publication verification procedure.
- [x] Stop before registry work and record the separate gates for release authority, scope control, trusted publishing, an immutable coordinated tag, publication, registry verification, and post-publication clean-room installation.

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

## Review

### Delivered

The repository now produces and verifies a dependency-closed seven-package npm release candidate. Public packages expose compiled ESM, source maps, declarations, CSS assets, package metadata, and licences from explicit `dist/` export maps; CI and the protected release workflow use the same local verification contract.

### Summary of changes

- Added shared and package-local build configuration, dependency-ordered root commands, clean-check integration, exact coordinated versions, public metadata, Node 22 support, explicit exports, CSS side-effect declarations, and ignored build output.
- Added fixed-set version and internal-range validation, tarball inspection, and a temporary clean consumer that installs local tarballs, imports every public JavaScript and CSS entry, normalises a title-only configuration, renders SVG, and server-renders Studio.
- Extended CI and added a manually dispatched, tag-verified, protected-`npm`-environment workflow using OIDC trusted publishing and provenance without a stored registry token.
- Added ADR-INFOSCHEMATICS-010 and release guidance covering preparation, changelog, dry run, tagging, publication, verification, deprecation, and fix-forward recovery.

### Verification

- From generated-output-free state, `bun run clean && bun run check && bun run release:verify` passed.
- Repository verification passed 41 test files and 253 tests, all source TypeScript workspaces, 176-module dependency boundaries, visual-token drift, and the production Site build.
- Release verification built seven packages in dependency order, inspected seven tarballs, required `dist/LICENSE`, imported 39 public entries in a clean production-only consumer, bundled every CSS entry, rendered static SVG, and server-rendered Studio.
- Workflow validation passed `actionlint`, YAML parsing, formatting, and the KI authoring audit in the delegated workflow lane.

### Outstanding concerns

- `npm whoami` reports that this machine is unauthenticated. All seven public registry lookups return `404`, but that does not prove control of the `@infoschematics` scope or private-name availability. Scope ownership, trusted-publisher records, the protected GitHub environment, and release authority remain mandatory external gates.
- The dependency-closed release set contains Canvas, Present, and SVG in addition to the four packages named in the original boundary. Those packages existed before the approved release boundary, and Studio cannot be published unbundled without Canvas and Present; human review should explicitly confirm this seven-package interpretation.
- The production Site build retains non-fatal third-party annotation and large-chunk warnings.

### Post-change review

No package was published, no tag or GitHub Release was created, no token was stored, and nothing was pushed. Generated `dist/` directories remain ignored. Release automation refuses malformed or mismatched tags, coordinated-version drift, already-published versions, invalid tarballs, and failed clean-consumer checks before dependency-order publication can begin.

### Mini recap

Implementation commits are `0a9d91f8`, `a3b9912b`, `eddfc275`, and `c4cc7d57`, from baseline `c4849f2825bd4f79512b66de1e9bf05fc6e10207`. The local release candidate is ready for human review. Registry publication remains deliberately incomplete until a separately authorised owner proves scope control, configures trusted publishing and the protected environment, confirms the seven-package set, and supplies an immutable coordinated release tag.

## Done

Pending human acceptance of the local release candidate. Registry publication requires separate explicit authority.

## Discussion

### Release contract

The initial release contract uses unbundled compiled ESM with declarations and explicit export maps, one coordinated version across the public package set, and React as a peer where required. Packed clean-room consumption is the release candidate; registry publication is a separately authorised operation through trusted publishing and provenance.
