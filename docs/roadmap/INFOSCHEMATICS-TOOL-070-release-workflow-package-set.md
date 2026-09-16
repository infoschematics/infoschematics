---
id: INFOSCHEMATICS-TOOL-070
area: TOOL
title: Release workflow package set
theme: tool
horizon: now
status: done
blocks: [INFOSCHEMATICS-TOOL-041]
blocked_by: []
baseline_ref: dbd57e2f5abf88681c0f4a2f68917b32fca38d28
created_at: 2026-09-16T10:30:00Z
updated_at: 2026-09-16T16:49:00Z
---

# Release workflow package set

## Goal

Make the release workflow publish the package set the repository actually declares, and bind it to that declaration so the two cannot drift again.

## Context

`scripts/release/packages.ts` holds the canonical eight published packages in dependency-first order, and `scripts/release/release.test.ts` asserts that set and that order. The GitHub Actions workflow that performs the release does not read it. It carries the package list twice, as hand-written shell arrays, and both copies are missing `packages/cli`.

So the gate is green on an eight-package release while the workflow would allocate the release version to seven names and leave `@infoschematics/cli` unpublished — the one package with a Node runtime and a `bin`, and the only one a consumer installs to get the `infoschematics` command. npm versions are immutable, so the repair after the fact is a coordinated patch release across all eight packages rather than a second attempt at the same version.

Found while assessing whether [initial package publication](INFOSCHEMATICS-TOOL-041-initial-package-publication.md) could proceed. It is a prerequisite for that item, and it is ordinary repository work that needs no registry credential and publishes nothing.

## Boundary

This item corrects the workflow's package set and binds it to the canonical declaration. It does not publish, tag, release, or change any package's version, and it does not resolve the outstanding registry configuration that item 041 is waiting on.

## Current state

- `scripts/release/packages.ts:12-21` declares the eight packages; `:17` is `@infoschematics/cli`. `releasePackageNames` (`:23`) and `releaseNodeEngine` (`:27`) are exported from the same module.
- `.github/workflows/release-npm.yml:69-77` lists seven manifests for the version check: `domain-model`, `domain-core`, `view-model`, `render-svg`, `view-canvas`, `view-present`, `view-studio`. No `cli`.
- `.github/workflows/release-npm.yml:100-108` repeats the same seven as directories for the publish loop.
- `scripts/release/release.test.ts:47-57` asserts the canonical eight and their order, and passes — it never reads the workflow.
- `docs/guides/releasing-packages.md:3` describes the release as covering eight packages.
- The workflow pins Node 24 (`:37-42`) but never asserts the npm floor the guide states at `:9`, so a runner below npm 11.5.1 fails after the gate has already run.

## Steps

- [x] Write the assertion first, and prove it fails: a test that reads `.github/workflows/release-npm.yml` and requires both lists to equal `releasePackages` exactly, in the same dependency-first order. On the current tree it must report the missing CLI.
- [x] Decide where the workflow's list should come from — a generated step reading `releasePackages` at run time, or hand-written lists held honest by the assertion. Prefer whichever keeps the workflow readable without a second source of truth.
- [x] Correct both lists so the eighth package is present in dependency-first position, and confirm the new assertion passes.
- [x] Assert the npm floor in the workflow before the release gate runs, so a below-floor runner fails immediately and says why.
- [x] Confirm the assertion is in the gate's `inputs`, and prove the miss by editing the workflow and watching the task rerun rather than replay.

## Files touched

- `.github/workflows/release-npm.yml`
- `scripts/release/release.test.ts`, or a new sibling test if the workflow assertion reads more naturally on its own
- `turbo.json` if the new file needs declaring in `//#self:verify:repo` inputs
- `docs/guides/releasing-packages.md` if the npm floor becomes a workflow assertion rather than a written instruction

## Verify

Run `bun run self:verify:repo` and confirm the new assertion fails on the uncorrected workflow and passes after. Run `bun run self:check`. Confirm by reading the workflow that the publish loop and the version check name the same eight packages as `releasePackages`, in the same order.

## Dependencies / blocks

Blocks [initial package publication](INFOSCHEMATICS-TOOL-041-initial-package-publication.md): publishing seven of eight packages is not repairable at the same version, so this lands first.

## Documentation impact

### Decision Records

None. This corrects an implementation against a decision already recorded.

### Specifications

None. No published behaviour changes.

### Guides

`docs/guides/releasing-packages.md` if the npm floor moves from prose into an assertion.

### Roadmap

None.

## Review

### Delivered

The approved boundary: the release workflow now names the package set the repository declares, and an assertion binds both of its lists to `releasePackages`; the npm floor is asserted in the workflow before the gate is spent. Excluded, as the boundary states: nothing was published, tagged, released, or versioned, and the registry configuration item [initial package publication](INFOSCHEMATICS-TOOL-041-initial-package-publication.md) waits on is untouched.

Immutable baseline `dbd57e2f5abf88681c0f4a2f68917b32fca38d28`. The resulting evidence is the assertion failing on the uncorrected workflow — naming the absent `packages/cli` in both lists — and passing on the corrected one, with the full repository gate green under `--force`.

### Summary of changes

- `.github/workflows/release-npm.yml`: `packages/cli/package.json` and `packages/cli` added in dependency-first position, fifth, to the version-check and publish lists, so both name all eight. A new `Verify npm publishing floor` step sits immediately after Node setup — before the install, the browser runtime, and the repository gate — and refuses a runner below the floor with the version it found. Comments point both lists and the floor at the canonical module that now holds them honest.
- `scripts/release/workflow.test.ts`, new: requires `package_manifests` and `package_directories` to equal `releasePackages` exactly and in order, requires the stated floor to equal `releaseNpmFloor` and to appear before `bun run self:check`, and covers three ways the check could otherwise fail open.
- `scripts/release/packages.ts`: `releaseNpmFloor = '11.5.1'`, alongside the other release facts.
- `turbo.json`: `.github/workflows/release-npm.yml` declared in `//#self:verify:repo` inputs, because that task now reads it.
- `docs/guides/releasing-packages.md`: the floor is now a workflow assertion rather than only prose, and the publish description records that the stated set is held to `releasePackages`.

The material decision was to keep the workflow's lists stated rather than generated. See the `One source or two` topic in `Discussion`.

### Verification

- `bunx vitest run --root . scripts/release/workflow.test.ts` on the uncorrected workflow: `Test Files 1 failed (1)`, `Tests 4 failed | 3 passed (7)`. The reported diff was the stated set missing `packages/cli` in both lists, plus the absent npm floor.
- `bunx vitest run --root . scripts/release/workflow.test.ts scripts/release/release.test.ts` after the correction: `Test Files 2 passed (2)`, `Tests 12 passed (12)`.
- Turbo `inputs` miss, proven before declaring the file: `turbo run self:verify:repo` cached, then appending a line to the workflow and rerunning reported `Cached: 1 cached, 1 total ... >>> FULL TURBO` — a green the task had not earned.
- Turbo `inputs` fix, proven after declaring the file: an unchanged tree replayed (`1 cached, 1 total`), and the same one-line workflow edit forced execution (`0 cached, 1 total`). The marker line was removed afterwards.
- `bun run self:check`: `Tasks: 43 successful, 43 total`, 7 executed and 36 replayed.
- `bun run self:check --force`: `Tasks: 43 successful, 43 total`, `Cached: 0 cached, 43 total`, 30.2s — every task executed, nothing replayed.
- Read back: the workflow parses as YAML with steps in order `Check out release tag`, `Set up Bun`, `Set up Node and npm`, `Verify npm publishing floor`, `Install dependencies`, `Install browser-test runtime`, `Verify tag and coordinated versions`, `Verify repository and release candidates`, `Publish dependency-first package set`; both package lists read the same eight names in `releasePackages` order.
- The floor comparison was exercised directly: `9.8.1` and `11.5.0` refuse, `11.5.1`, `11.6.0` and `12.0.0` allow.

### Outstanding concerns

None blocking. Two observations, neither in this item's boundary:

- The workflow pins Node `24` while the published packages promise `>=22` and the guide states the npm-imposed Node 22.14 floor. The pin is a runner choice rather than a release fact, so it is stated but unasserted.
- The floor comparison uses `sort -V`, which `ubuntu-latest` provides through GNU coreutils; it was also confirmed working on the local BSD `sort`. A runner image without either would misjudge the comparison rather than fail loudly.

### Post-change review

The goal holds: the workflow publishes the declared eight, and the two can no longer disagree without the repository suite saying so — which is strictly more than a corrected literal would have bought, since the corrected literal is exactly what drifted. Scope held to the five stated steps and the named files; nothing in `packages/` or `apps/` was touched, and no version moved.

Regression risk is low. The workflow is `workflow_dispatch`-only and has never published, so the change cannot disturb a live path; the new assertion reads a file and compares strings, and the new export is a constant. The one behaviour change to a release run is the floor step, which fails closed and before any expensive work. The residual risk is that the assertion checks the workflow's text rather than its execution: it would not catch a workflow that names all eight and then publishes from a different variable. That is a narrower failure than the one it closes.

Ready for acceptance. It also unblocks [initial package publication](INFOSCHEMATICS-TOOL-041-initial-package-publication.md), which still waits on registry configuration.

### Mini recap

Delivered the eight-package release workflow with the set bound to `releasePackages` and the npm floor asserted before the gate, from baseline `dbd57e2f`. Verified by the new assertion failing then passing, both directions of the Turbo `inputs` proof, and a forced 43-task gate at `0 cached`.

No concerns block acceptance; the Node pin and the `sort -V` dependency are recorded above as observations.

Proposed learning routes, not promoted: the repository's own warning that a task whose `inputs` miss a file reports an unearned green now has a second worked example, and the pattern of a check that fails open — a parser returning an empty list for a file it cannot read — has appeared here as it did in `dependency-boundaries.test.ts`. Both would fit the engineering guidance on binding a duplicated statement to its single source rather than correcting the copy.

## Discussion

### One source or two

Generating the list from `releasePackages` removes the drift by construction, but a workflow that computes its own package set is harder to read in a release emergency than one that states it. An assertion keeps the readable form and fails loudly when it lies. Shaping should decide which, knowing the failure mode being defended against is silent omission rather than a wrong name.

Delivery chose the stated lists with an assertion. The failure mode is silent omission, and an assertion addresses it directly: `scripts/release/workflow.test.ts` reads the workflow and requires both lists to equal `releasePackages` exactly, in order, so the workflow stays plain YAML that a release owner can read under pressure while the repository suite refuses to let it lie. The npm floor took the same shape — stated once in the workflow as `npm_floor`, bound to `releaseNpmFloor` in `scripts/release/packages.ts`.

The assertion's own failure mode got attention too, because a parser that returns an empty list for a workflow it cannot read would report agreement exactly when the workflow had stopped saying anything. The extraction throws on an absent or empty array, and three control cases cover a set that lost a package, a set that is not stated at all, and a set stated empty.
