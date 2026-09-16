---
id: INFOSCHEMATICS-TOOL-070
area: TOOL
title: Release workflow package set
theme: tool
horizon: now
status: ready
blocks: [INFOSCHEMATICS-TOOL-041]
blocked_by: []
baseline_ref: null
created_at: 2026-09-16T10:30:00Z
updated_at: 2026-09-16T10:30:00Z
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

- [ ] Write the assertion first, and prove it fails: a test that reads `.github/workflows/release-npm.yml` and requires both lists to equal `releasePackages` exactly, in the same dependency-first order. On the current tree it must report the missing CLI.
- [ ] Decide where the workflow's list should come from — a generated step reading `releasePackages` at run time, or hand-written lists held honest by the assertion. Prefer whichever keeps the workflow readable without a second source of truth.
- [ ] Correct both lists so the eighth package is present in dependency-first position, and confirm the new assertion passes.
- [ ] Assert the npm floor in the workflow before the release gate runs, so a below-floor runner fails immediately and says why.
- [ ] Confirm the assertion is in the gate's `inputs`, and prove the miss by editing the workflow and watching the task rerun rather than replay.

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

## Discussion

### One source or two

Generating the list from `releasePackages` removes the drift by construction, but a workflow that computes its own package set is harder to read in a release emergency than one that states it. An assertion keeps the readable form and fails loudly when it lies. Shaping should decide which, knowing the failure mode being defended against is silent omission rather than a wrong name.
