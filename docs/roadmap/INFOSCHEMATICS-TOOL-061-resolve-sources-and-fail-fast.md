---
id: INFOSCHEMATICS-TOOL-061
area: TOOL
title: Resolve workspace sources and fail fast
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-15T08:55:00Z
updated_at: 2026-09-15T09:05:00Z
---

# Resolve workspace sources and fail fast

## Goal

Make a change to a shared package visible to every suite and typecheck without a build first, and make the verification gate report its cheapest and most likely failure first, so a feature is not paced by its tooling.

## Context

Raised directly while delivering [Diagram dynamics](INFOSCHEMATICS-TOOL-055-diagram-dynamics.md), in answer to why items take so long. Two causes were measured rather than guessed.

Vitest had no workspace aliases and each package publishes compiled `dist`, so a suite in one package imported the last build of its siblings. Every edit to Domain Model, Domain Core, or View Model needed `bun run self:packages:build` before a downstream suite or typecheck saw it — and a forgotten build did not fail, it passed against stale output. That is how the type errors fixed in `TOOL-055` stayed hidden through several green runs.

`self:check` also ran worst-first: packages build, three verifies, the node suite, the browser suite, then thirteen sequential `tsc --noEmit` invocations. A type error — the most common failure there is — surfaced only after the slowest stage had passed.

## Boundary

This item does not adopt a build orchestrator, a remote cache, or a new dependency. It does not change what the gate verifies, weaken any check, or remove the build: `self:packages:build` still proves the published shape, and `self:release:verify` still proves a clean consumer. It does not restructure the packages as composite TypeScript projects, and it does not change any package's `exports`.

## Steps

- [x] Resolve every published specifier to the source it is built from during tests, derived from each package's own `exports` rather than a hand-maintained list.
- [x] Mirror the same intent as `paths` for typechecking, and clear it in the build configuration so published declarations still resolve siblings through their entry points.
- [x] Replace the thirteen sequential typecheck invocations with one concurrent, incremental pass that reports every failing project rather than the first.
- [x] Reorder `self:check` so typechecking runs first and the browser suite runs late.
- [x] Guard both mappings with a test, so a new package cannot silently escape either.

## Files touched

- `scripts/workspace-sources.ts`, `scripts/workspace-sources.test.ts`, and `scripts/typecheck.ts`
- `vite.config.ts` and `vitest.browser.config.ts`
- `tsconfig.json`, `tsconfig.build-base.json`, and the three example project configurations
- `package.json`

## Verify

Run `bun run self:check` from a tree with no `dist` at all and confirm it passes, which is the evidence that no stage depends on a build having happened first. Run `bun run self:release:verify` to confirm published declarations are unchanged. Time the gate before and after.

## Dependencies / blocks

None. Landed after `TOOL-055` so it could not disturb an in-flight delivery.

## Documentation impact

### Decision Records

None. No product contract changes; this is repository tooling.

### Specifications

None.

### Guides

`AGENTS.md` gains the one fact a contributor needs: suites read source, so a build is not a prerequisite for running them.

### Roadmap

None.

## Review

### Delivered

`bun run self:check` passes from a tree with no `dist` directories at all, and takes 72 seconds where the previous order took roughly 112. A type error now surfaces in the first 7 to 18 seconds instead of after the browser suite. Editing a shared package and running a downstream suite needs no build step, and cannot silently test yesterday's build.

### Summary changes

`scripts/workspace-sources.ts` reads each package's `exports` and resolves every published specifier back to the source file the build compiles into it, then offers that mapping as Vite aliases to both `vite.config.ts` and `vitest.browser.config.ts`. The mapping is derived, not listed, and it comes from `exports` rather than from the file layout because a published subpath need not be named after its source: `@infoschematics/view-model/tokens.css` is built from `src/tokens.generated.css`, which a naive `name/* -> src/*` rule resolves to a file that does not exist.

`tsconfig.json` gains the same intent as `paths`, so a typecheck reads sibling sources instead of their last build, and `tsconfig.build-base.json` sets `paths: {}` so nothing that emits ever resolves that way. The three example projects drop `rootDir`, which existed only to assert containment that declaration files were exempt from and that source resolution now violates; dependency-cruiser remains the real ownership check.

`scripts/typecheck.ts` replaces thirteen sequential `tsc --noEmit` calls with one concurrent pass, bounded by `availableParallelism()`, each project reusing its own `--incremental` build information under `node_modules/.cache/`. It reports every failing project rather than stopping at the first, and it spawns the workspace `tsc` explicitly — the machine this ran on has TypeScript 7 on its path, which reported a page of errors that do not exist in this repository under the pinned 5.9.

`self:check` is now typecheck, packages build, tokens, schema, examples, node suite, dependency boundaries, browser suite, site build. `scripts/workspace-sources.test.ts` asserts every published specifier has exactly one alias pointing at a file that exists, that `paths` covers the same packages while the build configuration clears it, and that every project with a `tsconfig.json` is in the typecheck list.

### Verification

`bun run self:check` passed from a tree with every `dist` deleted and the typecheck cache cleared: 13/13 TypeScript projects, 91 node test files / 700 tests, 9 browser test files / 28 tests, dependency boundaries, and the site build.

Measured, single machine, same tree. Before: build 14.1s, node suite 6.2s, browser suite 60.7s, typecheck 19.3s, boundaries 1.4s, site build 10.6s. After: typecheck 18.2s cold and 7.0s warm, build 14.1s, node suite 6.2s, browser suite 4.8s to 5.7s, boundaries 1.4s, site build 10.6s. Whole gate 72s against roughly 112s.

The browser suite falling from 60.7s to about 5s was not the aim and is worth stating plainly: its `optimizeDeps` entries named Domain Core's transitive dependencies through the package (`'@infoschematics/domain-core > yaml'`), which no longer resolve now that Domain Core resolves to source. Removing them and letting Vite discover dependencies from source removed whatever that configuration was costing. Confirmed three times, including with the Vite dependency cache cleared, all 28 tests passing each time.

### Outstanding concerns

Two tests in `scripts/dependency-boundaries.test.ts` still need `dist`, because dependency-cruiser resolves workspace imports through `node_modules` and `exports`. The gate builds before the node suite, so this is covered, but a lone `bun run test` on a never-built tree will fail those two. Pointing dependency-cruiser at `tsconfig.json` would fix it and would also change the paths its rules match on, which is a boundary-semantics change and belongs in its own item rather than in this one.

Turborepo-style least-change detection is not adopted. `--incremental` gives per-project change detection for the expensive stage, and source resolution removes the build from the critical path of the two stages that ran most often. What remains uncached is the package build, the site build, and the three generators — all of which run once per gate. An orchestrator would pay for itself if this repository grew more build steps or a shared remote cache; today it would add a dependency and a cache to invalidate for about ten seconds.

`--incremental` build information lives under `node_modules/.cache/`, so `bun run clean` removes it along with dependencies. That is the right default: a fresh tree should not trust a stale cache.

### Post-change review

Deriving the aliases from `exports` rather than the file layout was not the first attempt. A `name/* -> src/*.ts` rule looked correct, typechecked, and broke three browser suites on `tokens.css`, which is exactly the failure mode this item exists to remove: a mapping that is nearly right resolves most things and lies about the rest.

Removing `rootDir` from the example projects is the one change here that gives something up. It was asserting that an example's program contains only its own sources, which stopped being true the moment a typecheck read a sibling's source instead of its declarations. The ownership rule it approximated is stated properly in `.dependency-cruiser.ts` and tested.

### Mini recap

Tests and typechecks now read the working tree, not the last build, and the gate fails on types in seconds rather than after a minute. The build still happens, still proves the published shape, and is no longer something a contributor has to remember.
