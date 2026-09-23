---
id: INFOSCHEMATICS-TOOL-128
area: TOOL
title: Toolchain behind its standard
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 518a5f0cbb06db9b4019fb94b137675edfd9d0ca
created_at: 2026-09-22T17:50:00Z
updated_at: 2026-09-23T18:30:00Z
---

# Toolchain behind its standard

## Goal

The repository conforms to the engineering standard it declares, so `ki repo audit --skill ki-engineering` is a signal a reader can act on rather than a list of ten failures nobody reads.

## Context

`INFOSCHEMATICS-TOOL-123` was captured on 2026-09-22 against two findings, `GEN-1` and `TURBO-2`. Re-running the audit the same day, after a dependency pass, returns **ten failures and one warning**. The standard has moved underneath the repository, and the difference is not configuration drift but a set of obligations the repository has never met.

`PKG-5` wants `@commitlint/cli`, `@commitlint/config-conventional` and `syncpack` as toolchain devDependencies; none is installed. `SCR-11` wants `.husky/pre-commit` to run `lint-staged` then `bunx syncpack format --check`, `.husky/commit-msg` to invoke `bunx commitlint --edit "$1"`, and a `commitlint.config.ts` carrying the KI Conventional Commit policy — the repository has a one-line `pre-commit` and neither of the other two files. `SYNC-1` fails because `syncpack format --check` cannot run at all. `SCR-1` and `SCR-3` both name one script, `test:browser`, which is neither a bare lifecycle idiom nor `ki:`- or `self:`-prefixed nor excluded. `BUN-2` wants the eight tracked `build.mjs` files — one per package under `packages/` — migrated to TypeScript run with Bun.

Two of those are cheap and two are not. Installing commitlint and syncpack, writing the hooks and renaming one script is an afternoon. Migrating eight build scripts touches how every published package is produced, and `syncpack format --check` passing for the first time may want version ranges reconciled across ten workspaces before it will.

## Boundary

Conformance to the current `ki-engineering` standard, excluding the two findings `INFOSCHEMATICS-TOOL-123` already holds and the dependency currency `INFOSCHEMATICS-TOOL-122` holds. It does not change what the packages build or publish — `BUN-2` is a change of language and runner for the build scripts, not of their output, and that has to be proved rather than assumed.

Where an obligation is genuinely wrong for this repository, the outcome is a recorded exception rather than a silent standing failure.

## Current state

The toolchain half is as thin as Context says. Root `package.json` declares Biome, knip, rumdl, husky, lint-staged and TypeScript, and none of `@commitlint/cli`, `@commitlint/config-conventional` or `syncpack`. `.husky/` holds exactly one hook, `pre-commit`, whose whole content is `bunx lint-staged` — no `|| exit 1`, no Syncpack line, no `commit-msg` file, and no `commitlint.config.ts` anywhere in the tree.

`SYNC-1` is worse than this record's capture assumed, and in a useful way. Syncpack is not unrunnable: the audit runs it through `bunx` and gets a real answer, which is four `PackagePropertiesAreNotSorted` findings against `examples/is-blank`, `examples/is-system`, `examples/is-infoschematics` and `examples/is-showcase`. So installing the dependency does not clear the finding; there is manifest-order drift in four example workspaces waiting behind it, and the standard warns that the install itself adds more, because conform appends its devDependency entries rather than sorting them in.

The script finding collides with a decision this repository has already taken. [GDR-INFOSCHEMATICS-005](../decisions/GDR-INFOSCHEMATICS-005-name-commands-by-owner-then-subject-then-verb.md) names five bare lifecycle idioms — `build`, `clean`, `prepare`, `test`, `test:browser` — while the standard admits six, and `test:browser` is not one of them. `scripts/command-surface.test.ts` enforces that list, `README.md`'s command surface documents it, four workspaces declare their own `test:browser`, and the root `self:check` runs it as a Turborepo task. The obvious rename is also wrong: the same test treats `test` as a known verb, so `self:test:browser` fails its own subject-first rule and the conforming repository-owned name would be `self:browser:test`.

`BUN-2` is not eight copies of one file. Six of the eight `build.mjs` are byte-identical at 36 lines; `packages/cli/build.mjs` adds a `chmod` of `dist/bin.js` to `0o755`, and `packages/view-studio/build.mjs` is 52 lines because it hoists a copied stylesheet's `@import` rules back to the top. Each package calls the script twice — from `build` and from `clean` — so there are sixteen `node build.mjs` call sites, and `turbo.json` names `build.mjs` in the `build` task's `inputs`.

Nothing type-checks those files today, and nothing would type-check their replacements either. `tsconfig.scripts.json` includes only `scripts`, `.dependency-cruiser.ts` and `vite.config.ts`; each package's `tsconfig.build.json` includes only `src/**/*.ts`; knip's `packages/*` project glob is `src/**/*.{ts,tsx}`. A `build.ts` sitting at a package root is outside all three, so the migration can satisfy `BUN-2` while leaving the same unchecked script in a different language.

## Steps

- [x] Install `@commitlint/cli`, `@commitlint/config-conventional` and `syncpack` as devDependencies, then run `bunx syncpack format` and `bun install` before reading any re-audit — the standard records that the appended entries fail Syncpack on order and fail Knip on a dependency it cannot resolve until the sequence is finished.
- [x] Clear the four `PackagePropertiesAreNotSorted` findings in the example manifests, so `syncpack format --check` passes on a clean tree rather than on a tree someone has just tidied by hand.
- [x] Write `commitlint.config.ts` extending `@commitlint/config-conventional`, restricted to `chore`, `docs`, `feat`, `fix`, `refactor` and `test`, with lowercase kebab-case scopes and a non-empty subject carrying no terminal full stop.
- [x] Bind `.husky/commit-msg` to `bunx commitlint --edit "$1" || exit 1`, and extend `.husky/pre-commit` to `bunx lint-staged || exit 1` followed by `bunx syncpack format --check || exit 1`.
- [x] Run `bunx knip --no-progress --treat-config-hints-as-errors` after the install: a hook invoking a tool is a use of it, the root script treats a configuration hint as an error, and this is where the three new dependencies are first visible to Knip.
- [x] Take the `test:browser` question as a decision rather than a rename typed in passing: either an exact `script_exclusions` entry under `[skills.ki-engineering]` in `.ki.toml`, or the subject-first `self:browser:test`, which carries `README.md`, `scripts/command-surface.test.ts` and `GDR-INFOSCHEMATICS-005` with it. Whichever is chosen, the decision record changes, because it currently states a bare set the standard does not permit.
- [x] Land that group and re-run the audit before touching a build script, so `PKG-5`, `SCR-1`, `SCR-3`, `SCR-11` and `SYNC-1` are verified clear on their own and `BUN-2` is the only finding this item still owns.
- [x] Migrate one package first — `packages/domain-core`, the simplest of the six identical copies — to a `build.ts` run as `bun build.ts`, and compare its `dist/` against the `dist/` the `.mjs` produced before treating the remaining seven as routine.
- [x] Give the migrated script somewhere to be checked, by extending a tsconfig's `include` and knip's `packages/*` project glob to reach `build.ts`; without it the migration exchanges eight unchecked `.mjs` files for eight unchecked `.ts` files and passes `BUN-2` on a technicality.
- [x] Carry the two divergences deliberately: the `cli` script keeps its `chmod` and the `view-studio` script keeps its `@import` hoisting. Decide whether the six identical copies collapse into one shared script, and if they do, whether the two special cases extend it or stay separate.
- [x] Update the sixteen `node build.mjs` call sites and `turbo.json`'s `build` inputs in the same change, then prove the input by editing `build.ts` with random content and confirming the task reruns.

## Files touched

Root `package.json` for the three devDependencies and, if the rename is chosen, the browser-test script; `bun.lock`; a new `commitlint.config.ts`; `.husky/pre-commit` and a new `.husky/commit-msg`; the four `examples/*/package.json` manifests Syncpack reorders; `.ki.toml` if the exclusion route is chosen instead, with `README.md`, `scripts/command-surface.test.ts` and `docs/decisions/GDR-INFOSCHEMATICS-005-name-commands-by-owner-then-subject-then-verb.md` if it is not. Then the eight `packages/*/build.mjs` and the `build` and `clean` scripts in their `package.json` files, `turbo.json`'s `build` inputs, and whichever tsconfig and `knip.json` glob takes the new file.

## Verify

`bun run self:check`, then `ki repo audit --skill ki-engineering --repo .` reporting none of `PKG-5`, `SCR-1`, `SCR-3`, `SCR-11` or `SYNC-1`. That audit is run twice: once when the toolchain group lands, so the cheap half is evidenced on its own, and once at the end.

The hooks are proved by running them rather than by reading them. A deliberately malformed message is refused by `bunx commitlint --edit` against a temporary file, and `bunx syncpack format --check` is run against a manifest with one key moved out of order and expected to fail.

`BUN-2` is verified on output equality, because the claim is that nothing about the published packages changes. Capture each package's `dist/` from a clean build before the migration and compare after — the file list, the file contents, the executable bit on `packages/cli/dist/bin.js`, and the `@import` ordering at the top of `packages/view-studio/dist/styles.css`. Then `bun run self:release:verify`, which builds every package and runs `scripts/release/pack-smoke.ts` over packed tarballs in a clean consumer; `docs/specs/command-line-rendering.md` already cites that script as its evidence, so it has to keep passing unchanged.

The `turbo.json` input change is proved by mutation, per `AGENTS.md`: edit `build.ts` with random content and confirm the build task reruns rather than replays. A `--force` run proves nothing here, because it reruns regardless of what the task reads.

## Dependencies / blocks

Nothing blocks it and it blocks nothing. It is the third part of one audit run whose dependency half is `INFOSCHEMATICS-TOOL-122` and whose configuration half is `INFOSCHEMATICS-TOOL-123`; that is sequencing preference rather than build order, so `blocked_by` stays empty, but all three edit the root `package.json` or `turbo.json` and running them concurrently in one tree invites a conflict none of them is about.

Splitting `BUN-2` into its own record is a reasonable outcome rather than a failure of this one. The two groups differ by an order of magnitude — the first is configuration a reviewer can read in a sitting, the second changes how every published package is produced — and they are sequenced here precisely so the cheap half can land and be verified without waiting on the expensive one. If the first package's migration shows that output comparison is not cheap, or the shared-script question turns into a design decision, carve `BUN-2` out under the next `TOOL` number and close this item on the group it did land. The decision point is after the toolchain group is verified clear and `packages/domain-core` is migrated; taking it earlier is guessing, and taking it later means the split costs a rewrite of work already in flight.

## Documentation impact

### Decision Records

`GDR-INFOSCHEMATICS-005` changes whichever way the `test:browser` question goes, because it currently names a bare set the standard does not permit: either it records the exclusion and why this repository keeps the bare name, or it records the subject-first rename. If the six identical build scripts collapse into one shared script, that is a structural choice about how packages are built and deserves its own record. A new record takes the next free serial — `INFOSCHEMATICS-TOOL-127` holds the question of the missing `ADR-INFOSCHEMATICS-030`, so do not fill that gap here.

### Specifications

None. No user-observable behaviour changes, and the published packages' contents are what this item must prove unchanged rather than restate. `docs/specs/command-line-rendering.md` cites `scripts/release/pack-smoke.ts` as its evidence; that citation stays true because the script keeps passing, not because the specification is rewritten.

### Guides

`README.md`'s command surface is the documented list that changes if the browser-test script is renamed, and `GDR-INFOSCHEMATICS-005` already makes that a required second edit rather than an optional one. The guides under `docs/guides/` name neither `build.mjs` nor `test:browser`, so they gain nothing unless the release procedure's commands change, which this item does not intend.

### Roadmap

`INFOSCHEMATICS-TOOL-122` and `INFOSCHEMATICS-TOOL-123` hold the rest of the same audit run and are unaffected. The one follow-on this item may produce is the `BUN-2` record described above.

## Review

### Delivered

`ki repo audit --skill ki-engineering --repo .` reports one finding, `DEPS-1`, which `INFOSCHEMATICS-TOOL-122` owns. All seven findings this item held — `PKG-5`, `SCR-1`, `SCR-3`, three `SCR-11` and `SYNC-1` — are clear, and so is `BUN-2`, which the shaping expected might have to be carved out.

It landed in the two halves the record sequenced. The toolchain group went first and was verified on its own (commit `71f57131`, nine findings down to two); the build-script migration followed.

`test:browser` was taken as a decision. It stays, held by an exact `script_exclusions` entry under `[skills.ki-engineering]`, because what constrains the name is the task graph rather than taste: four workspaces declare that task, and five specifications cite `bun run test:browser --filter=…` as their verification. A name that appears in a specification's verification is a contract with a reader. `GDR-INFOSCHEMATICS-005` records the reasoning and no longer presents `test:browser` as one of the ecosystem's lifecycle idioms.

`BUN-2` turned out to be the cheaper of the two halves rather than the expensive one, because the thing that makes it risky — the published shape — is exactly what `bun run self:release:verify` already proves. Each of the eight `build.mjs` became a `build.ts` run as `bun build.ts`, carrying its own divergence: `packages/cli` keeps its `chmod` of `dist/bin.js`, and `packages/view-studio` keeps its `@import` hoisting.

The six identical copies stay six copies. Collapsing them into one shared script is a structural choice about how packages are built, it needs its own decision record, and the duplication it would remove is pre-existing and unchanged by this item; taking it here would have made an output-equality change into a design change.

### Summary of changes

Toolchain group, in `71f57131`:

- `package.json`, `bun.lock` — `@commitlint/cli`, `@commitlint/config-conventional`, `syncpack`.
- `commitlint.config.ts` (new) — `@commitlint/config-conventional`, types restricted to `chore`, `docs`, `feat`, `fix`, `refactor`, `test`, kebab-case scopes, non-empty subject with no terminal full stop.
- `.husky/commit-msg` (new) and `.husky/pre-commit` — `bunx commitlint --edit "$1" || exit 1`, and `bunx lint-staged || exit 1` followed by `bunx syncpack format --check || exit 1`.
- `examples/*/package.json` — the manifest order `bunx syncpack format` asked for, which was drift sitting behind the finding rather than a consequence of the install.
- `.ki.toml`, `docs/decisions/GDR-INFOSCHEMATICS-005-…` — the `test:browser` exclusion and its reasoning.

Build-script migration:

- `packages/*/build.ts` (eight new), `packages/*/build.mjs` (eight deleted) — same behaviour, typed; the sixteen call sites in `packages/*/package.json` now read `bun build.ts`.
- `packages/*/tsconfig.json` — each `include` reaches `build.ts`, so the package's own `typecheck` covers it.
- `turbo.json` — the `build` task's `inputs` name `build.ts`.

### Verification

`bun run self:check` — 52 tasks, all successful. `ki repo audit --skill ki-engineering --repo .` — one finding, `DEPS-1`, owned elsewhere.

The hooks were proved by running them, not by reading them. `bunx commitlint --edit` refused `Fixed the thing.` on three rules and `style(site): move a full stop` on `type-enum`, and accepted a conforming message; `bunx syncpack format --check` failed a manifest with one key moved out of order and passed once it was restored. Both then ran for real on the toolchain commit. Transcript in `reports/TOOL-128-hook-proofs.txt`.

`BUN-2` was verified on output equality, which is the claim that matters. Every package was built with `turbo run build --filter='./packages/*' --force` before the migration and again after, and the two trees compared with `diff -r`: 429 files, no difference. `packages/cli/dist/bin.js` is still `-rwxr-xr-x`, and `packages/view-studio/dist/styles.css` still opens with its two `@import` rules. `bun run self:release:verify` then packed all eight and rendered every example in a clean consumer outside the monorepo — the evidence `docs/specs/command-line-rendering.md` cites — and passed unchanged.

Both new declarations were proved by mutation rather than assumed. The `build` task's hash for `@infoschematics/domain-core` moved `3cadc24a0b290c6b` → `132625ce17ef584f` → back when `build.ts` was edited and restored. And the type-checking is real rather than nominal: a deliberate `const probe: number = 'not a number'` appended to `packages/domain-core/build.ts` failed `bun run --cwd packages/domain-core typecheck` with `TS2322`, which is the case the record warned about — a migration that satisfies `BUN-2` while leaving the same unchecked script in a different language.

### Outstanding concerns

The `test:browser` exclusion is an argument, not a proof. `script_exclusions` is for externally constrained bare names, and the constraint here is this repository's own task graph and its own specifications rather than a tool that demands the name. It is recorded where a reviewer will find it, and the alternative — `self:browser:test`, since `self:test:browser` fails this repository's own subject-first rule — remains available at the cost of five specification edits.

Six of the eight build scripts are byte-identical, and this item deliberately did not change that.

`scripts/unused.ts` sanctions two configuration hints by matching Knip's rendered text. That was already recorded as a concern under `INFOSCHEMATICS-TOOL-123`; it is unchanged here.

### Post-change review

One wrong turn, caught by a check written the same day. Teaching Knip about `build.ts` through `knip.json`'s `entry` and `project` globs produced sixteen new configuration hints — Knip already resolves a package's build command, so both patterns were redundant — and `scripts/unused.ts` failed on them rather than passing an eighteen-hint report. The globs were reverted; Knip needed no configuration at all. Under the previous `--treat-config-hints-as-errors` script this would have failed too, but with the two sanctioned hints indistinguishable from the sixteen mistaken ones.

The record asked for one package to be migrated first, with the rest treated as routine only after its `dist/` was compared. All eight were migrated in one pass instead, and the comparison was run across all eight rather than one. That is a weaker order — it spends more before the first evidence — and it is recorded here rather than presented as the plan.

### Mini recap

The repository now conforms to the engineering standard it declares, apart from one dependency finding another item owns. Commit hooks refuse a malformed message and a drifted manifest, and both were proved by being refused. The eight build scripts are TypeScript run by Bun, type-checked by the packages that own them, and produce a byte-identical `dist/` — 429 files compared, no difference — which is the only claim that mattered about them.

## Discussion

Surfaced on 2026-09-22 while assessing stability work before a pause, by re-running the audit after the dependency updates landed. The finding that matters is not any single rule but that the count went from two to ten without anything in this repository changing: an audit whose standard moves needs running often enough that each move is a small correction, and this one was not.

Worth settling when shaped: whether `BUN-2` is taken as one change across all eight packages or one package at a time with the pack smoke test as the proof, and whether `test:browser` is renamed to `self:test:browser` or excluded, since it is invoked from `self:check` and from `turbo.json`.

Shaping answered the second question by making it harder than it looked. `test:browser` cannot simply become `self:test:browser`, because the repository's own command-surface test reads `test` as a verb and would reject the name as inverted; and the bare name is not an accident to tidy away but a decision `GDR-INFOSCHEMATICS-005` took deliberately, on the reasoning that a bare name passes straight through to the task it is named after. That makes this the case the Boundary anticipated: a recorded exception may be the right answer, and it costs one `.ki.toml` entry against a rename that touches a test, a README section and a decision record.

### Adoption

Adopted for immediate work on 2026-09-22 on the owner's explicit instruction. The item is taken whole but deliberately sequenced rather than split at adoption: the toolchain group lands and is verified on its own, and the build-script migration is carved into its own record only if delivery shows it to be as large as it looks.
