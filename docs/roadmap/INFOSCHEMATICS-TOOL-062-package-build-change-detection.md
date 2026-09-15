---
id: INFOSCHEMATICS-TOOL-062
area: TOOL
title: Detect change in the package build
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-15T10:20:00Z
updated_at: 2026-09-15T11:45:00Z
---

# Detect change in the package build

## Goal

Rebuild a package only when something it is built from has moved, so the stage that every other stage waits on costs nothing on the runs where nothing changed.

## Context

[Resolving workspace sources](INFOSCHEMATICS-TOOL-061-resolve-sources-and-fail-fast.md) left the package build as the one stage with no change detection at all: eight `tsc` invocations, in a fixed sequence, on every gate run and every `self:dev`. Its own outstanding-concerns section named this and deferred it, on the reasoning that an orchestrator would add a dependency for about ten seconds.

Asked directly whether to adopt Turborepo — whose change detection this repository does not otherwise have — the answer was to extend the local pattern instead, and to write the choice down where the next repository will meet it rather than only here.

## Boundary

This item adds no dependency, no orchestrator, and no remote cache. It does not change what any package's build produces, how the build is configured, or what the gate verifies. It does not cache the website build or the three generators, and it does not make any stage trust a recorded result over the evidence on disk.

## Steps

- [x] Derive the workspace dependency graph from each package's own manifest, and build in levels that respect it.
- [x] Fingerprint each package's build inputs, folding in its dependencies' fingerprints so a change reaches everything downstream.
- [x] Skip a package whose fingerprint matches its recorded value and whose `dist` is present; offer `--force` for the rest.
- [x] Guard the fingerprint with tests that make a real edit and check that the packages downstream of it stop matching.

## Files touched

- `scripts/build-packages.ts` and `scripts/build-packages.test.ts`
- `scripts/workspace-sources.ts`
- `package.json` and `AGENTS.md`

## Verify

Run `bun run self:check` twice and compare. Run it once from a tree with no `dist` and no caches at all, to confirm nothing depends on a cache existing. Edit a shared package and confirm every package downstream of it rebuilds.

## Dependencies / blocks

Builds on `TOOL-061`, which supplied the workspace discovery this reads.

## Documentation impact

### Decision Records

None. No product contract changes; repository tooling.

### Specifications

None.

### Guides

`AGENTS.md` gains the one fact a contributor needs: the build detects change, a missing `dist` rebuilds regardless, and `--force` proves a build from nothing.

The portable form of the choice — local input fingerprinting by default, an orchestrator when a repository has enough packages and build steps to earn one — belongs to the Knowledge Islands engineering standard rather than to this repository, and is recorded there.

### Roadmap

None.

## Review

### Delivered

`bun run self:packages:build` costs 0.08 seconds when nothing has changed, against 12 seconds before. The whole gate is 32 seconds warm and 50 seconds cold, against 72 seconds after `TOOL-061` and roughly 112 before it. Editing a shared package rebuilds it and the six packages downstream of it, and nothing else.

### Summary changes

`scripts/build-packages.ts` reads the workspace packages, orders them into levels where every package follows what it depends on, and builds each level concurrently. A package's fingerprint is a digest of its source files less the tests its build configuration excludes, its manifest, its build configuration and helper, the shared inputs every build reads, and the fingerprints of its dependencies. That last term is the whole of the change detection: an edit to Domain Model changes the fingerprint of everything downstream of it, so none of them can match and skip.

The shared inputs are `bun.lock`, `tsconfig.build-base.json`, and `LICENSE`. The lockfile stands in for the installed dependency set, the compiler among them — a different TypeScript emits different declarations from identical sources, so an upgrade must invalidate every package whether or not anyone touched its files.

A recorded fingerprint is never taken as evidence on its own: the package is rebuilt unless its `dist` is also present, because deleting output touches no input. The record is cleared before a build rather than written after a failure, so an interrupted build leaves nothing behind that claims output it never produced. A failing level stops the run, because nothing downstream can be built against output that was never produced.

`scripts/workspace-sources.ts` now reports each package's sibling dependencies alongside its entry points, filtered to what the workspace itself owns, so the graph comes from the manifests rather than from a list to maintain.

### Verification

`bun run self:check` passed from a tree with every `dist` and both caches deleted: 13/13 TypeScript projects, 92 node test files / 703 tests, 9 browser test files / 28 tests, dependency boundaries, and the site build. Cold 50.1s; immediately again, warm, 32.2s.

Warm stages, single machine, same tree: typecheck 6.8s, packages build 0.08s, visual tokens 0.02s, schema 0.05s, examples 0.11s, node suite 4.7s, dependency boundaries 1.1s, browser suite 5.7s, site build 11.2s. `bun run self:packages:build -- --force` rebuilds all eight; the next run reports all eight current.

### Outstanding concerns

The website build is now the largest stage in the gate at 11.2 seconds, and it is deliberately not cached. Caching it would only ever pay on a run where nothing at all had changed: edit a package and its inputs have moved, edit the site and its own sources have moved. Against that, its input set is large and implicit — content, public assets, routes, every package's `dist`, the Vite configuration and its plugins — and an input list that is nearly right is how a stale site gets published. The gate's job there is to prove the published artifact builds.

The three generators total 0.18 seconds between them. There is nothing to detect.

Concurrency within a level is bounded by `availableParallelism()`, which is the whole machine. Two agents running the gate in one checkout would contend, but they already share `dist` and would corrupt each other regardless.

### Post-change review

The first version of the fingerprint test wrote its control file into View Model's source and asserted that no other package's fingerprint moved. It passed alone and failed in the suite, because `dependency-boundaries.test.ts` writes its own control file into that same package and the two suites read as each other's edit. The tests now use Domain Core and name the packages they care about rather than expecting the whole set to hold still — a suite that asserts global stillness is asserting something about its neighbours.

Fingerprinting content rather than modification time was not a refinement. `touch` on a source file leaves every fingerprint alone, which is what should happen; the same `touch` against a pathname that did not exist created a file, moved six fingerprints, and rebuilt exactly the right six.

### Mini recap

The build now skips what has not changed and rebuilds everything downstream of what has, from fingerprints derived out of the manifests rather than a list. No orchestrator, no new dependency, and no cache that is believed over the state of the disk.
