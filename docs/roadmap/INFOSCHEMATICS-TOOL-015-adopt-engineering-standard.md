---
id: INFOSCHEMATICS-TOOL-015
area: TOOL
title: Adopt the engineering standard
theme: tool
horizon: next
status: draft
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

`ki repo audit --skill ki-engineering` fails with roughly twenty findings across CI shape, script naming, per-workspace type-checking, Biome, knip, syncpack ordering, managed-surface exclusions and compiled-build configuration. The repository's own gates (`bun run check`, `bun run release:verify`) pass.

## Steps

- [ ] Fix CI to install via `jdx/mise-action` (adding `mise.toml`), run `ki repo audit --repo .`, then `bun run test`.
- [ ] Rename ungoverned scripts (`check`, `dev`, `generate:visual-tokens`, `packages:*`, `release:verify`) to `ki:`-prefixed or bare lifecycle idioms, updating CI, docs, guides and release guidance references.
- [ ] Resolve the root `tsconfig.build.json` naming collision so monorepo shape detection applies compiled-build expectations per workspace rather than at the root.
- [ ] Make per-workspace `tsc --noEmit -p <workspace>/tsconfig.json` pass for every workspace.
- [ ] Adopt `biome.json` and `knip.json` with the managed-surface exclusions and make their gates and syncpack ordering pass.
- [ ] Re-run the full repository audit to a clean pass and record the evidence.

## Files touched

- `.github/workflows/ci.yml`, `mise.toml`, `biome.json`, `knip.json` and root `package.json` scripts;
- root and per-workspace `tsconfig*.json`;
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
