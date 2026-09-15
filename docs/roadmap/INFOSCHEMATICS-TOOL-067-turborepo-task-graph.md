---
id: INFOSCHEMATICS-TOOL-067
area: TOOL
title: Cache every gate stage
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: b8e5ec5bcd313ddb26f42aed519867d244199d3b
created_at: 2026-09-15T11:55:00Z
updated_at: 2026-09-15T12:55:00Z
---

# Cache every gate stage

## Goal

Make every stage of the gate a task in a graph, so a run that changes nothing costs nothing and a run that changes one package pays for that package and what is downstream of it.

## Context

`TOOL-061` stopped suites and typechecks reading stale `dist`, and `TOOL-062` gave the package build change detection of its own. Together they took the gate from roughly 112 seconds to 50 cold and 32 warm.

What they left is a hand-written task runner that caches exactly one stage. The build was already down to 0.08 seconds warm; the stages that still cost real time were the typecheck at 6.8s, the node suite at 4.7s, the browser suite at 5.7s, and the website build at 11.2s. Extending the local pattern to those meant writing more of the same by hand, against a tool that already does it, is package-manager agnostic over Bun workspaces, and is in use in three sibling repositories.

`TOOL-062` recorded the portable form of the earlier choice — local fingerprinting by default, an orchestrator above a threshold of build steps — in the Knowledge Islands engineering standard. That threshold framing was the wrong axis and is withdrawn there in favour of naming Turborepo the default for any repository with a `workspaces` array. The input set and the correctness rules `TOOL-062` established are not wasted: they are exactly what `turbo.json`'s `inputs` have to get right.

## Boundary

No remote cache. The hosted cache is a separate decision with an external service attached, and this repository's CI is GitHub Actions plus Cloudflare Workers Builds; `remoteCache` is explicitly disabled. This item changes no package's build output, no published shape, and nothing the gate verifies — the same checks run over the same files, scheduled differently.

## Current state

The gate before this change: one root `build` chain through `scripts/build-packages.ts`, one root `scripts/typecheck.ts` over thirteen projects, one root Vitest run of 92 files, one root browser run of 9 files, and the generators, dependency-boundary check, and website build as root scripts in a fixed sequence. Exactly one of those — the package build — had change detection, and it was the cheapest stage in the gate.

Only `build` was package-shaped; nothing else could be cached per workspace because nothing else was declared per workspace. There is no coverage configuration anywhere in the repository, so splitting the suites costs no coverage re-scoping.

## Steps

- [x] Add Turborepo and write `turbo.json`, confirming it reads the text `bun.lock` and the declared package manager.
- [x] Push `build` and `typecheck` down into all twelve workspaces, with `dependsOn: ["^…"]` for the hash chaining that correctness requires.
- [x] Split the single root suite into a `test` task per workspace, from one shared configuration factory, and a repository-level suite for the checks that span workspaces.
- [x] Delete `scripts/build-packages.ts` and `scripts/typecheck.ts`, and rework the guard that no workspace escapes the graph.
- [x] Make the root scripts and `self:check` thin `turbo run` wrappers, and cache the task directory in CI.

## Files touched

- `turbo.json`, `package.json`, `.gitignore`, `.github/workflows/ci.yml`, `knip.json`
- `scripts/vitest-workspace.ts`, `scripts/workspace-sources.ts`, `scripts/workspace-sources.test.ts`, `vite.config.ts`
- Every workspace's `package.json`, `tsconfig.json`, and new `vitest.config.ts`
- Deleted: `scripts/build-packages.ts`, `scripts/build-packages.test.ts`, `scripts/typecheck.ts`, root `vitest.browser.config.ts`

## Verify

Run `bun run self:check` from a tree with no `dist` and no caches, then immediately again. Edit a file in Domain Core and confirm the packages downstream of it miss and the ones upstream hit. Edit a file under `docs/` that a repository-level test reads and confirm that task, and only that task, misses.

## Dependencies / blocks

Builds on `TOOL-061`, whose source resolution is what lets a workspace's suite and typecheck run without its siblings being built first. Supersedes the fingerprint mechanism delivered in `TOOL-062`.

## Documentation impact

### Decision Records

None. No product contract changes; repository tooling.

### Specifications

None.

### Guides

`AGENTS.md` replaces the fingerprint paragraph with the task-graph one, and says the thing a contributor has to know: `inputs` are load-bearing, a task whose `inputs` miss a file it reads will report a green it did not earn, and the file goes into `inputs` in the same change that makes the task read it.

### Roadmap

None.

## Review

### Delivered

Forty-three tasks. The gate is **0.14 seconds warm**, against 32.2 before, and 50 to 55 seconds cold, against 50.1. Editing Domain Core's schema misses 37 tasks and replays 6. Editing the vocabulary reference misses exactly one.

### Summary of changes

Turbo's cache unit is a task in a package, so the work was mostly pushing stages down to where they could be cached. Each of the twelve workspaces now declares `build` where it publishes one, `typecheck`, and `test`; three of them declare `test:browser`. `dependsOn: ["^typecheck"]` is there for correctness rather than ordering — since `TOOL-061` a typecheck reads its siblings' source through `tsconfig` `paths`, so a change in Domain Model has to move View Model's hash, and only a dependency edge does that.

Twelve near-identical Vitest configurations would have been twelve chances to drift, so `scripts/vitest-workspace.ts` is a shared factory and each workspace's config is two lines. It is also the file that keeps the `TOOL-061` guarantee: every generated configuration resolves siblings to source, so no workspace can quietly go back to reading `dist`. Because it governs every workspace while living outside all of them, it is a `globalDependency` alongside `scripts/workspace-sources.ts` and the shared `tsconfig`s.

The eleven files under `scripts/` that check things spanning workspaces — vocabulary, dependency boundaries, visual treatment parity, the generators, command-line conventions — stay in the root Vite configuration as a repository-level suite, run as `//#self:verify:repo`. The root `test` script is `turbo run test` and could not also name it.

`self:check` is now a single `turbo run` over the task list; Turbo schedules it rather than the previous fixed worst-first sequence. CI caches `node_modules/.cache/turbo` keyed by commit with a prefix restore, so a pull request pays for what it changed.

### Verification

Old configuration on the current tree: 91 files / 726 tests. Split: 80 files / 681 tests across twelve workspaces, plus 11 files / 45 tests at repository level. Identical totals, so nothing fell out of the suite in the split. Browser: 9 files / 37 tests across three workspaces. `bun run self:check` exits 0 cold and warm, 43/43.

A cache hit had to be shown to be a real hit rather than a replayed green. Editing `packages/domain-core/src/schema.ts` produced 6 hits — all three Domain Model tasks, which are genuinely upstream, and three unrelated root tasks — and 37 misses. Editing `docs/reference/vocabulary.md` produced exactly one miss, `//#self:verify:repo`, which is the only task that reads it.

Build prerequisites turned out to be unnecessary rather than merely unrecorded. With every `packages/*/dist` moved aside, `self:verify:depcruise`, the repository suite, and `self:verify:examples` all still pass, because dependency-cruiser resolves through the root `tsconfig` `paths` like everything else since `TOOL-061`. The hand-written `dependsOn: ["build"]` lists those three tasks were given came off. The website build keeps a `dependsOn: ["^build"]`, because it genuinely consumes the packages' published output.

### Outstanding concerns

`@infoschematics/site#build` overrides `inputs` with `$TURBO_DEFAULT$` rather than a list. The first attempt gave it the same explicit globs as a package build and missed `index.html`, `vite.config.ts`, `content/**`, and `public/**` — an input list that is nearly right is how a stale site gets published, which is the concern `TOOL-062` raised about caching the site build at all. Hashing everything the workspace owns is the conservative answer, and the site build is the one place the difference is worth paying for.

Workspace packages must stay out of the root manifest's dependencies. Turbo attributes the root package's dependencies to the workspace, so a single entry would make the root appear to depend on that package: editing any package would invalidate every root task, and the graph would stop saying anything. Repository scripts therefore import packages from source, exactly as the generators already did. `scripts/workspace-sources.test.ts` asserts it, because the failure is silent — everything still passes, just never from cache.

Knip cannot read the include globs out of `export default workspaceTests(import.meta.url)`, so it reported all forty-two test files as unused. The test entry globs are declared per workspace group in `knip.json`; the result matches the pre-change baseline exactly.

The root Vite configuration has to keep the name `vite.config.ts`. Naming it `vitest.config.ts` wakes three `ki-engineering` rubric rules that are dormant while no root `vitest.config.*` exists, including a 100% coverage threshold this repository does not configure anywhere.

### Post-change review

Two Vite copies in the tree broke the typecheck the moment the root configuration entered a typechecked project for the first time: `import type { Alias } from 'vite'` resolved to one major while `vitest/config` pulled the other, and the two `Alias` types are not assignable. The alias shape is now declared locally, with the reason recorded beside it — a shared type from a package installed twice is not shared.

A cache probe that appends fixed text to a file and reruns is not a probe. Appending to Domain Core's schema missed 43 tasks; repeating it hit 43, which read as Turbo ignoring the file. It was not — the second run recreated byte-identical state the first run had already cached. Probes since use random content.

### Mini recap

Every stage of the gate is now a cacheable task in a graph Turbo owns, rather than one stage with hand-written change detection and eight without. The gate costs 0.14 seconds when nothing has changed, and two bespoke scripts are gone.

## Discussion

### Why an orchestrator rather than more of the same

`TOOL-062` answered this question the other way three hours earlier, and the reasoning it gave — an orchestrator adds a dependency for about ten seconds — was sound about the stage it was looking at and wrong about the gate. The build was already the cheap stage. Every remaining stage would have needed its own fingerprint, its own record file, and its own set of the four correctness rules, and the fourth hand-written cache is where one of them quietly gets a rule wrong.

The threshold framing was also wrong on its own terms. The cost of adopting Turborepo does not scale with package count; a `turbo.json` for two packages is the same file as one for twenty, and a repository that grows past a threshold has to be migrated at the least convenient moment. The axis that matters is whether a repository has workspaces at all.

### What survives from the fingerprint work

The four correctness rules `TOOL-062` established are what `turbo.json` has to get right, restated as configuration rather than code: declare `inputs` to match what the task actually reads; fold in the dependency's hash so a change reaches everything downstream; never let a recorded result outrank the evidence on disk; and never let a cache hit be a replayed green that hides a real change. Turbo enforces the second by construction through `dependsOn`, checks the third itself through `outputs`, and leaves the first and fourth entirely to whoever writes the file.

### Remote caching

Deliberately not taken. It is the feature that would pay most in CI, and it is also an external service holding build artefacts, which is a decision to make on its own rather than fold into a migration. `remoteCache.enabled` is `false` explicitly rather than by omission, so turning it on is a visible change.
