---
id: INFOSCHEMATICS-TOOL-052
area: TOOL
title: Major dependency upgrades
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-15T15:10:00Z
---

# Major dependency upgrades

## Goal

Deliberately migrate the repository across its held TypeScript, Node type, Vite, and React-plugin major versions while preserving package, application, and release behaviour.

## Context

Repository conformance records the major-version holds in `.ki.toml` because they require coordinated migration rather than incidental dependency updates. The TypeScript and Node type upgrades form one toolchain concern; Vite and its React plugin form another.

## Boundary

This item does not automatically adopt every available major, remove holds before their verification passes, mix unrelated dependency refreshes into the migration, or publish packages.

## Current state

Four holds are recorded in `.ki.toml` under `[skills.ki-engineering].dependency_holds`, and the gap on each has widened since they were written. The repository runs TypeScript 5.9.3 against a 7.x release line, `@types/node` 24.13.3 against 26.x, Vite 7.3.6 against 8.x, and `@vitejs/plugin-react` 5.2.0 against 6.x.

The TypeScript gap is no longer one major: 6.x and 7.x both stand between the pinned and current releases, and 7.x is the native compiler port rather than an incremental change. `bun run self:verify:typecheck` runs thirteen separate `tsc --noEmit` projects, so a compiler change touches every workspace at once and is the widest-blast-radius item here.

These are two unrelated toolchains with no shared verification or rollback boundary. They are sequenced as separate phases below and either phase may be extracted into its own record without disturbing the other.

### Target versions, settled

TypeScript 6 never shipped a stable release: the registry carries `6.0.0-beta` on the `beta` tag and nothing on `latest` below `7.0.2`. Landing on 6.x would therefore mean pinning a beta and keeping a hold for the real gap, so phase one goes directly to 7.x. Because that leaves no remaining gap, no decision record is needed — the condition in [Decision Records](#decision-records) is not met. `@types/node` has no `ts7.0` tag; `26.5.1` is the release its `ts6.0` tag points at and the one to take. Phase two targets Vite `8.x` and `@vitejs/plugin-react` `6.x`, both current on `latest`.

### Failures already observed

An attempted phase-one bump to TypeScript 7.0.2 with `@types/node` 26 was installed, typechecked once, and reverted for an unrelated reason. Its first typecheck produced two real migration failures, which the next pass should expect rather than rediscover:

- `TS2882: Cannot find module or type declarations for side-effect import of './styles.css'` at three sites in the `packages/view-canvas` browser tests. TypeScript 7 requires an ambient declaration for a side-effect import of a non-code asset, so the repository needs one declared where those imports live.
- `TS2591` for `node:fs/promises` in `packages/view-present/src/Present.test.tsx`: that project needs `node` in its `types`, which 5.9 did not require of it.

Neither is a blocker. Both say the same thing about the shape of the work: a compiler major surfaces resolution assumptions that thirteen separate projects were each making quietly.

## Steps

- [x] Phase one: raise TypeScript and `@types/node` together, since the Node type definitions track the compiler — TypeScript raised; `@types/node` deliberately not, because that premise is wrong. See the concerns.
- [x] Assess the TypeScript 6.x migration notes and the 7.x native-port consequences before choosing whether to land on 6.x first or go directly to 7.x, and record which and why — 7.x directly, for the reason recorded above.
- [x] Confirm all thirteen `tsc --noEmit` projects pass, then confirm the published package builds still emit equivalent declaration output.
- [x] Remove only the TypeScript and `@types/node` holds from `.ki.toml`, leaving the Vite holds explicit and unambiguous — the TypeScript hold is gone; the `@types/node` hold is rewritten with the reason that actually governs it.
- [x] Phase two: raise Vite and `@vitejs/plugin-react` together, since the plugin major is coupled to the Vite major.
- [x] Confirm the site production build, `vitest.browser.config.ts`, and the Chromium browser suites all pass, and address the existing deprecation warnings about `esbuild` and `optimizeDeps.esbuildOptions` that the plugin currently emits rather than carrying them across the major.
- [x] Compare the built site bundle before and after for unintended output changes, then remove the two Vite holds from `.ki.toml`.
- [x] Keep each phase a separately revertible commit, and mix in no unrelated dependency refreshes.

## Files touched

- `package.json` and the workspace manifests under `packages/`, `apps/`, and `examples/`
- `bun.lock`
- `.ki.toml` for hold removal, one phase at a time
- `tsconfig*.json` across the workspaces where the compiler majors require changes
- `vite.config.ts`, `vitest.browser.config.ts`, and `apps/site/` build configuration

## Verify

Run `bun run self:check` after each phase independently, not once at the end. For phase one also run `bun run self:packages:build` and `bun run self:packages:pack-smoke` and confirm emitted declarations still satisfy a clean consumer. For phase two also run `bun run --cwd apps/site build` and `bun run test:browser`, and compare the built asset manifest against the pre-upgrade build. Confirm `.ki.toml` holds and installed versions agree after each phase.

## Dependencies / blocks

No roadmap dependency. Sequence this against other in-flight work deliberately: a compiler major touching every workspace will conflict with any concurrent implementation, so it wants a quiet tree rather than a shared one.

That condition was unmet while the monorepo task-runner migration was in flight, because it held the same manifests, lockfile and Vite configuration both phases touch. It landed first, and this item ran against the clean tree it left.

## Documentation impact

### Decision Records

Record the TypeScript target choice if the migration lands on 6.x rather than 7.x, since that leaves a deliberate remaining gap needing its own rationale.

### Specifications

None expected. These upgrades must preserve observable behaviour; any behaviour change is a defect of the migration, not a new requirement.

### Guides

Update contributor toolchain guidance only where required versions or commands change.

### Roadmap

If either phase proves larger than a single reviewable change, split it into its own record rather than letting this item accumulate both toolchains.

## Discussion

### Migration sets

Shaping should assess the TypeScript toolchain and Vite application toolchain independently, then split them into separate delivery records if they do not share a safe verification and rollback boundary.

### Hold removal

Each `.ki.toml` hold remains authoritative until the corresponding migration has landed and the full repository check passes. A partial upgrade must not make the remaining hold ambiguous.

## Review

### Delivered

The repository compiles on TypeScript 7.0.2, the native compiler port, and the website bundles on Vite 8.3.0 with `@vitejs/plugin-react` 6.1.1. Three of the four `.ki.toml` dependency holds are gone. The fourth, `@types/node`, is deliberately kept — with a corrected reason, because the one it carried was wrong.

Nothing about the product changed. Same declarations, same published shape, same site, and the deprecation warnings the old React plugin printed on every browser run are gone rather than carried across the major.

### Summary of changes

Phase one raises `typescript` to `^7.0.2` in the root and the site manifests. The one real migration failure was `packages/view-canvas`, whose browser tests import their own stylesheet for effect: TypeScript 7 will not assume a module for a non-code side-effect import, so the package gains the same one-line `src/vite-env.d.ts` that Studio and Site already carry. Nothing else in thirteen projects needed a change.

`@types/node` stays on its 24 line. Its hold read "tracks the TypeScript and toolchain majors and is adopted with them", and that is the wrong reason to move it: those definitions describe a _runtime_, and both this repository and the published `@infoschematics/cli` promise `node >=22`. Typing against 26 would let code compile here that a supported consumer cannot run, so the hold is rewritten to say what actually lifts it — `engines.node`.

Phase two raises `vite` to `^8.3.0` and `@vitejs/plugin-react` to `^6.1.1`; the plugin's 6.x line peers on Vite 8, so they are one change. It also adds `overrides: { vite: "$vite" }`, which is the interesting part. Vitest declares Vite as an ordinary dependency rather than a peer, so the tree carried a second 8.x copy beside the one the site builds with, and two structurally identical copies of Vite's recursive `PluginOption` defeated the type checker outright: `tsc` reported `TS2321: Excessive stack depth` comparing the generated workspace test configuration against `UserConfig`. One Vite fixes it, and is the honest arrangement anyway — before this, the browser suites pre-bundled through one copy while the site built with another.

### Verification

`bun run self:check --force` passed on both phases, all 43 tasks, nothing replayed from cache. `bun run self:packages:pack-smoke` passed for the eight packages and the three examples, which is what proves a clean consumer still compiles against the emitted declarations.

Declaration output was compared file by file across the compiler majors: 125 declaration files before and after, the same set, of which 15 differ in text. Ten differ only in quote style, where TypeScript 7 prints string literal types in single quotes. The other five differ in how an identical type is printed — members of a union or an object reordered, `box: Box` expanded to its structural form, `(runtime: InfoschematicRuntime) => PresentationState` printed as `typeof initialPresentationState`, `RuntimeSequence` printed as `(RuntimeSequence[])[number]`. No type changed; the printer did.

The site bundle was compared before and after: 109 files against 120, total output 4.65 MB against 4.67 MB, with the 2.7 MB chunk split apart. Rolldown chunks differently from Rollup, so that was expected; then the built bundle was served and looked at — the homepage, the Playground with Studio in it, and a documentation page all render with no console errors, which is the check a green suite cannot make for a bundler change.

Attribution was established rather than assumed. The `TS2321` failure was reproduced under TypeScript 5.9.3 as well as 7.0.2, so it belongs to Vite 8 and not to the compiler. Typechecking all thirteen projects now takes 4.3 seconds.

### Outstanding concerns

The `@types/node` hold was not removed, which deviates from the step that said to remove both. The reasoning is above and now lives in the hold text. Two things about it deserve a decision that is not this item's to take: the repository is _already_ one major loose, typing against 24 while promising `>=22`, and `engines.node >= 22` may simply be stale — Node 22 leaves maintenance before long, and moving it is a published-package contract change. Both were then decided: the floor is the Active LTS line, recorded as [GDR-INFOSCHEMATICS-004](../decisions/GDR-INFOSCHEMATICS-004-promise-the-active-lts-node-line.md), which moves `engines.node` to `>=24` and discharges the hold rather than leaving it standing.

One test failed once and never again. `packages/cli/src/index.test.ts`'s raster scaling case timed out at the default 5000 ms during the first full-gate run, then passed alone, passed under a forced gate on 5.9.3, and passed under three further forced gates on 7.0.2. It rasterises the same document twice at different scales, which is genuinely slow, and the gate now runs 43 tasks at once where it used to run stages in series. That is a real robustness gap in the test rather than in the product, and it is captured as `INFOSCHEMATICS-TOOL-068` rather than fixed here.

The fifteen re-emitted declaration files will show as a diff the first time these packages are published, with no type change behind it.

No decision record was written. The item's own condition was a decision record if the migration landed on 6.x and left a deliberate gap; it landed on 7.x and left none.

Vitest 5.0.1 is available and was not taken. It is a new hold nobody has decided about, and adopting it here would have been the unrelated refresh the last step forbids.

### Post-change review

The valuable finding was not either upgrade. It was that a hold can be wrong in its reasoning while looking right in its effect: `@types/node` was held for tracking the compiler, which is not what those definitions track, and the hold would have been discharged by moving the version that most needed to stay. A hold is a claim about why, and the why is the part to check when it comes due.

The duplicate Vite is the same shape of thing. It pre-existed both majors and was invisible while the top-level copy was 7.x and the nested one 8.x — nothing compared their types. Raising the top-level copy made two identical recursive types meet, and the compiler gave up rather than reporting a duplicate. The error named a stack depth; the cause was an arrangement nobody had chosen.

Going directly to 7.x was settled by the registry rather than by preference: 6.x never shipped anything but a beta, so there was no incremental step to take, and the native port had to be the whole migration. Three failures across thirteen projects is a smaller blast radius than the item feared, and the per-workspace cached typecheck the monorepo migration landed first is why each attempt cost seconds.

### Mini recap

New compiler, new bundler, same output. The repository's own reasons were what needed correcting: one hold held the wrong dependency for the wrong reason, and one duplicate dependency nobody had chosen was what actually broke the build.
