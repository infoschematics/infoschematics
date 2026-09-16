---
id: INFOSCHEMATICS-TOOL-074
area: TOOL
title: The boundary gate cruises nothing
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 8c2a8c359ec0512820fe5b2bb2f7f0aeec879e4f
created_at: 2026-09-16T13:55:00Z
updated_at: 2026-09-16T21:55:00Z
---

# The boundary gate cruises nothing

## Goal

Make the dependency-boundary check examine the repository, and fail loudly when it cannot, so the architecture guarantee [the repository guidance](../../AGENTS.md) rests on is actually enforced.

## Context

Found on 2026-09-16 while delivering scoped renderer definition identity (`INFOSCHEMATICS-TOOL-058`), and confirmed independently:

    $ bun run self:boundaries:verify
    ✔ no dependency violations found (0 modules, 0 dependencies cruised)

Zero modules. The check reports success because it found nothing to examine, and it prints the reason immediately afterwards — after the success line, not before it, so the green is read and acted on before the caveat appears: dependency-cruiser cannot use the TypeScript 7 compiler API, advises installing `typescript@^6`, and states that support for `typescript@>=7` "will follow when its API is published and stable". The repository is on `typescript: ^7.0.2`, so the boundary gate went vacuous the moment TypeScript was upgraded, and nothing said so.

This matters more than the individual finding. `AGENTS.md` states that `bun run self:check` "verifies tests, every TypeScript workspace, dependency boundaries, and the production website build", and [the architecture guide](../design/architecture.md) documents a dependency direction that this check exists to hold. Every green run since the TypeScript upgrade has asserted a boundary guarantee it did not test — including all nine items accepted at `2988e104` and pruned at `8c2a8c35`.

It is the third instance of one pattern found in a single day, which is the real lesson: a check that passes while measuring nothing is worse than no check, because it is read as evidence. The others were a raster comparison proving two outputs agree rather than either being right, and a task whose `inputs` let it replay a green it had not earned.

## Boundary

Restore real boundary enforcement and make vacuity fail. This item does not redesign the dependency rules themselves, does not change the documented dependency direction, and does not downgrade TypeScript for the repository as a whole.

## Steps

1. [x] Make vacuity fail first, before choosing how to fix the cruise. Assert that the boundary check examined more than zero modules — a floor near the real module count, not merely non-zero — so this cannot silently recur when a future toolchain bump breaks the parser again. Verifiable by the assertion failing on today's tree, before anything else changes.
2. [x] Establish which resolution actually works, by trying rather than by reading: a TypeScript 6 parser made available to dependency-cruiser alone without moving the repository off TypeScript 7; dependency-cruiser's own non-TypeScript resolution; or a different boundary tool. Record what each one cruised. Verifiable by the module and dependency counts each option reports.
3. [x] Prove the restored check catches a real violation: add an import that crosses the documented dependency direction — a `packages/domain-model` file importing from `packages/view-canvas`, say — and watch it fail. Revert it. Verifiable by that failure naming the rule.
4. [x] Confirm whether any boundary violation accumulated while the gate was blind, and report what is found. Fixing them, if there are any, is separate work and gets its own record. Verifiable by the restored check's output on the unmodified tree.
5. [x] Correct `AGENTS.md` if the resolution changes what the gate can honestly claim, and record the vacuity floor beside the dependency rules so the next reader knows why it is there.

## Files touched

- `package.json` and possibly `bun.lock`, for whatever parser or tool step 2 settles
- `.dependency-cruiser.ts`
- `turbo.json`
- a new or existing script under `scripts/`, for the vacuity floor
- `AGENTS.md` and `docs/design/architecture.md`, if the claim changes

## Verify

- The boundary check reports a module count consistent with the repository's actual source tree, and fails when handed a deliberate violation.
- The vacuity floor fails on a tree where the parser cannot resolve anything.
- `bun run self:check` passes, and its boundary task is no longer replayable from a cache entry earned while blind — force it once with `turbo run … --force`.

## Dependencies / blocks

None, and it should not wait behind feature work. Every delivery made while this is blind carries an unproven boundary claim.

## Documentation impact

### Specifications

None expected.

### Guides

`AGENTS.md` and the architecture guide, only to the extent the gate's honest claim changes.

## Review

### Delivered

The approved boundary held: real boundary enforcement is restored and vacuity now fails. The dependency rules themselves are unchanged, the documented dependency direction is unchanged, and the repository still builds and typechecks on TypeScript 7 — the TypeScript 6 the checker needs lives only in its own install root.

Immutable baseline: `fce74a415b13dfe9290c4cb0d9774b99553da00d`. Delivered under `INFOSCHEMATICS-BATCH-018` (`authority_mode: outcome`, `completion_target: awaiting-review`).

### Summary of changes

- `scripts/boundaries.ts` (new) — the gate. It installs the boundary tooling with `--frozen-lockfile`, cruises the source roots through that install, and refuses to call a clean cruise a pass unless it cruised at least `moduleFloor` modules and saw at least one cross-package type-only dependency. The cruise roots moved out of the `package.json` script into `boundaryRoots`, so the list lives where it can be read.
- `tooling/boundaries/` (new) — an install root outside the workspace graph holding `dependency-cruiser` and `typescript@^6.0.3`, with its own lockfile. Nothing else in the repository resolves it.
- `package.json` — `self:boundaries:verify` is now `bun scripts/boundaries.ts`; `dependency-cruiser` moved `^18.2.0` → `^18.3.1` so the copy the tests use and the copy the gate uses are the same version.
- `turbo.json` — `//#self:boundaries:verify` gained `tsconfig.json`, `package.json`, `tooling/boundaries/package.json`, and `tooling/boundaries/bun.lock` in its `inputs`: the config names the tsconfig, and the tooling manifest and lockfile decide which parser cruises.
- `scripts/dependency-boundaries.test.ts` — six new tests. Five cover the assessment directly (a healthy cruise, a cruise that read nothing, a plausible-looking fraction one module below the floor, a parser that sees no type-only crossing, and a type-only dependency inside one package counting as no crossing). One is a declared hold: when dependency-cruiser supports the repository's own TypeScript, that test fails and points at deleting `tooling/boundaries`.
- `knip.json` — `scripts/boundaries.ts` as a root entry point.
- `AGENTS.md`, `docs/design/architecture.md`, `README.md`, `.dependency-cruiser.ts` — step 5. The architecture guide's enforcement paragraph previously claimed a property the gate did not have; it now states the floor, the separate install root, and the condition under which that root goes away. `AGENTS.md` carries the general lesson beside the existing `inputs` one.

Material decision — step 2 was settled by measurement, not by reading, and the three candidates did not tie:

| Resolution | Modules | Dependencies | Sees a type-only re-export |
| --- | --- | --- | --- |
| TypeScript 6 available to dependency-cruiser alone | 328 | 1136 | Yes |
| `@swc/core` added to the repository | 327 | 1124 | No |
| No new dependency, explicit file list instead of directories | 327 | 1124 | No |

The second and third are identical in coverage, which settles `@swc/core`: it buys directory scanning and nothing else, at the price of a native dependency. The remaining choice was decided by what the missing 12 edges are — six are cross-package type-only re-exports (`packages/view-canvas/src/index.ts` → four `packages/view-model/src` modules, `packages/domain-core/src/index.ts` → `packages/domain-model/src/index.ts`, `packages/view-studio/src/index.ts` → `app/editor/document-history.ts`), four are triple-slash type references, two are ordinary local edges. Those re-export edges are what `entry-stays-thin` and the ownership rules match on, and `.dependency-cruiser.ts` sets `tsPreCompilationDeps: true` precisely because a type-only crossing is a crossing.

Proved rather than argued: `export type { InfoschematicDiagramProps } from '@infoschematics/view-canvas'` in a Domain Model file produced `violations: []` and no dependency at all under the fallback parser, and `domain-model-has-no-workspace-dependencies` under the TypeScript 6 tooling. The fallback does catch the `import type` form, so the gap is re-exports specifically — narrower than expected, and still exactly the class the rules care about.

A separate install root is the only shape that works under bun's isolated linker. `dependency-cruiser` resolves `typescript` with `createRequire` from its own physical location under `node_modules/.bun/`, which walks up to the repository's own `node_modules/typescript`. A workspace member declaring `typescript@^6` does not change that, because the store holds one physical copy of dependency-cruiser. An install root with its own top-level `node_modules` does.

### Verification

- Step 1, the vacuity floor failing on today's tree before anything else changed, against the repository's own cruiser: `Cruised 0 modules, 0 cross-package type-only.` then `The boundary cruise is not evidence: cruised 0 modules, below the floor of 300 … saw no cross-package type-only dependency …`, exit 1.
- Step 3, the restored check catching a real violation: a `packages/domain-model` file importing `@infoschematics/view-canvas` gave `Dependency boundary violations: domain-model-has-no-workspace-dependencies`, exit 1; removing the file returned `Cruised 329 modules, 165 cross-package type-only.`, exit 0. Both forms were tried — `import type` and `export type … from` — which is how the parser comparison above was established.
- Step 4, whether violations accumulated while the gate was blind: none. The restored check reports zero violations on the unmodified tree, so nothing crossed a boundary during the blind period and no follow-up record is needed for cleanup.
- `bun run self:check`: `45 successful, 45 total`, `0 cached`, exit 0. The boundary task shows `cache miss, executing` and `Cruised 329 modules, 165 cross-package type-only.` in that run, so the gate's own log now carries what it measured.
- `bunx turbo run self:boundaries:verify --force`: `1 successful, 1 total` — the task does not replay a cache entry earned while blind.
- `bunx vitest run --root . scripts/dependency-boundaries.test.ts`: `10 passed (10)`.
- `bun install --frozen-lockfile --dry-run --cwd tooling/boundaries` completes clean, so the tooling root meets the same frozen-install contract the root does.

### Outstanding concerns

- The gate now costs a frozen install of a second root before it cruises: about 50 ms warm, and the whole command takes roughly 1.2 s including the cruise. A cold clone pays for one dependency-cruiser and one TypeScript 6 download the first time the boundary task runs. Turborepo caches the task, so the cost is paid once per change to its declared inputs.
- Two copies of dependency-cruiser now exist, at the same `^18.3.1` spec: the tooling root's, which the gate uses, and the repository's, which `.dependency-cruiser.ts` imports types from and which `scripts/dependency-boundaries.test.ts` calls through the API. A test asserts the two manifests name the same spec. Their lockfiles could still resolve different patches; that is not asserted, because the tooling install may legitimately not exist when the test runs.
- The two pre-existing API tests in `scripts/dependency-boundaries.test.ts` still cruise through the repository's own install, so they exercise the fallback parser rather than the one the gate uses. They prove what they claim — resolution works, an illegal value import is reported — but they cannot prove the re-export case; the script's own assessment is what holds that.
- `turbo.json:99` still declares `bun.lock` in the `inputs` of `//#self:scripts:test`, noted in `INFOSCHEMATICS-TOOL-073` and still not this item's business.

### Post-change review

Goal met: the gate examines the repository (329 modules, 165 cross-package type-only dependencies) and fails loudly when it cannot, and the claim in `AGENTS.md` and the architecture guide is now true rather than aspirational. Scope held — no rule changed, no dependency direction changed, no downgrade of the repository's TypeScript.

Regression risk is concentrated in one place: the floor of 300 is below today's 328 with room for ordinary removal, but a large deliberate deletion would trip it and should be read as the floor asking to be revisited rather than as a violation. The declared hold means a future dependency-cruiser that supports TypeScript 7 will fail the suite by design; the comment in that test says what to do. Acceptance readiness: ready for review, with every measurement above reproducible from the commands recorded.

The durable part is the shape, not the parser: a check now reports what it measured and refuses to be read as evidence when it measured too little. That is the third instance of this pattern in a day, and the first one with an assertion about its own coverage.

### Mini recap

Restored the boundary gate and made its vacuity fail: a floor of 300 modules plus a cross-package type-only count, cruised through a TypeScript 6 install root at `tooling/boundaries` because dependency-cruiser refuses TypeScript 7 and its fallback parser cannot see a type-only re-export. Proved red on a real violation, proved the fallback misses the re-export form, and confirmed no violation accumulated during the blind period. Gate green at 45 tasks.

Learning routes, not promotions. The choice between parsers was decided by diffing the two graphs and reading what the difference was made of — worth doing whenever a tool offers a cheaper backend, because "327 versus 328 modules" looked like a rounding difference and was not. And a check that can fail open wants an assertion about its own coverage in the same change that introduces it; `AGENTS.md` now says so.

## Discussion

Step 1 comes first deliberately. The tempting order is to fix the parser and then trust the green, but that leaves the same trap armed for the next toolchain bump: a check whose failure mode is silence needs an assertion about its own coverage, not a better parser. The floor is the durable part of this item; which parser gets it working again is incidental and will change.
