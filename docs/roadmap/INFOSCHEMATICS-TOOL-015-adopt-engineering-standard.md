---
id: INFOSCHEMATICS-TOOL-015
area: TOOL
title: Adopt the engineering standard
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
---

## Goal

Bring the repository into full conformance with the KI engineering standard so `ki repo audit` passes with `[skills.ki-engineering]` declared, without weakening the delivered package build, release verification, or documented verify contracts.

## Context

The repository now declares `[skills.ki-engineering]`, and the focused audit reports the adoption gaps: CI must install the toolchain via mise and run `ki repo audit --repo .` plus `bun run test` directly; every non-lifecycle script needs the `ki:` prefix; per-workspace `tsc --noEmit` fails for `view-canvas`, `view-model`, `view-studio` and `is-infoschematics`; Biome and knip are not yet adopted; and the root `tsconfig.build.json` (the shared package-build configuration from TOOL-004) collides with the standard's compiled-build filename convention, triggering flat-shape build expectations.

## Boundary

This item changes toolchain configuration, script names, CI and TypeScript configuration only. It does not change product behaviour, package public APIs, or the release contract delivered by TOOL-004; the renamed equivalents of `bun run check` and `bun run release:verify` must keep passing.

## Current state

`ki repo audit --skill ki-engineering --repo .` currently reports FAIL=20, WARN=13, confirmed live in this planning pass:

- **Toolchain**: `mise.toml` missing (WARN); CI doesn't install via `jdx/mise-action`, run `ki repo audit --repo .`, or run `bun run test` directly (CI-1 WARN, CI-2 FAIL ×2); missing toolchain devDependencies `@biomejs/biome`, `knip`, `rumdl`, `husky`, `lint-staged`, `syncpack` (PKG-5); no `lint-staged` block (PKG-6).
- **Scripts**: `check`, `dev`, `generate:visual-tokens`, `packages:build`, `packages:check-versions`, `packages:clean`, `packages:pack-smoke`, `release:verify` are ungoverned (SCR-1); several `ki:` scripts are unclaimed and `ki:deps:update` is missing (SCR-3); `clean` doesn't remove `node_modules` and `prepare` isn't `husky` (SCR-5).
- **TypeScript**: root `tsconfig.json` is missing (TSC-2); per-workspace `tsc --noEmit` fails for `view-canvas`, `view-model`, `view-studio`, `is-infoschematics` (TSC-1); `tsconfig.build.json` collides with the compiled-build shape check at the root (BUILD-1 FAIL ×2, BUILD-2/BUILD-3 WARN — target, verbatimModuleSyntax, noUnusedLocals, and the build-tsconfig fields).
- **Biome / knip / syncpack**: `biome.json` and `knip.json` are both missing (BIO-2, KNIP-1); the Biome and knip gates fail once configured (BIO-1, KNIP-2, run live during this pass); `syncpack format --check` fails on unsorted `package.json` properties in all seven packages (SYNC-1); managed-surface exclusions for `.claude/skills/` and `.agents/skills/` are missing from both Biome and knip config (GEN-1).

The repository's own gates (`bun run check`, `bun run release:verify`) pass throughout.

## Steps

- [ ] Add `mise.toml` (root toolchain pin: `[tools]` node + bun) and switch `.github/workflows/ci.yml` to install via `jdx/mise-action`, then run `ki repo audit --repo .` and `bun run test` directly.
- [ ] Rename ungoverned scripts (`check`, `dev`, `generate:visual-tokens`, `packages:*`, `release:verify`) to `ki:`-prefixed or bare lifecycle idioms; add the missing `ki:deps:update` capability; fix `clean` to remove `node_modules` and `prepare` to run `husky`; update CI, docs, guides, and release guidance references to the renamed scripts.
- [ ] Add the root `tsconfig.json` TSC-2 requires, and resolve the `tsconfig.build.json` naming collision so monorepo shape detection applies compiled-build expectations per workspace rather than at the root; bring `tsconfig.build.json` and the shared `tsconfig.json` base up to BUILD-2/BUILD-3 (target, verbatimModuleSyntax, noUnusedLocals, declarationMap, outDir, rootDir, allowImportingTsExtensions, noUncheckedIndexedAccess, test excludes).
- [ ] Make per-workspace `tsc --noEmit -p <workspace>/tsconfig.json` pass for `view-canvas`, `view-model`, `view-studio`, and `is-infoschematics`.
- [ ] Add `@biomejs/biome`, `knip`, `rumdl`, `husky`, `lint-staged`, and `syncpack` as toolchain devDependencies; adopt `biome.json` and `knip.json` with matching `.claude/skills/` and `.agents/skills/` exclusions (GEN-1); add the `lint-staged` block and husky `prepare` hook (PKG-6, SCR-5); make the Biome and knip gates pass.
- [ ] Sort `package.json` properties in all seven packages to satisfy `syncpack format --check` (SYNC-1).
- [ ] Re-run the full repository audit to a clean pass and record the evidence.

## Files touched

- `.github/workflows/ci.yml`, `mise.toml`, `biome.json`, `knip.json`, `.husky/`, root `package.json` (scripts, devDependencies, `lint-staged`);
- root `tsconfig.json` (new), root `tsconfig.build.json`, and per-workspace `tsconfig*.json`;
- every package's `package.json` (property ordering);
- documentation referencing the renamed scripts under `docs/` and `README.md`.

## Verify

`ki repo audit --repo .` passes with `[skills.ki-engineering]` declared; the renamed check and release-verification commands pass; the production Site build and package tarball verification are unchanged in substance.

## Dependencies / blocks

None. TOOL-004's release candidate defines the behaviour that must be preserved, not a blocker. TOOL-014's hardening pass is independent.

## Documentation impact

### Decision Records

Add a decision only if resolving the compiled-build naming collision establishes a durable repository-specific build rule.

### Specifications

No product behaviour changes.

### Guides

Update any guide or release documentation that names the renamed scripts.

### Roadmap

Keep registry publication and visual hardening in TOOL-014; this item owns only toolchain conformance.

## Discussion

### Why not conform in place

Engineering conformance was attempted during the repository conform pass and correctly failed closed: the script renames ripple through CI, guides and release documentation, and the type-check and build-configuration gaps need repo-shaped decisions. Adopting the standard deserves its own bounded delivery and review rather than a side effect of repository conformance.
