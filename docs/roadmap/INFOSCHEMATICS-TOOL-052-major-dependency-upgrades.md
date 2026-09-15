---
id: INFOSCHEMATICS-TOOL-052
area: TOOL
title: Major dependency upgrades
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-13T20:08:57Z
updated_at: 2026-09-15T14:20:00Z
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

- [ ] Phase one: raise TypeScript and `@types/node` together, since the Node type definitions track the compiler.
- [x] Assess the TypeScript 6.x migration notes and the 7.x native-port consequences before choosing whether to land on 6.x first or go directly to 7.x, and record which and why — 7.x directly, for the reason recorded above.
- [ ] Confirm all thirteen `tsc --noEmit` projects pass, then confirm the published package builds still emit equivalent declaration output.
- [ ] Remove only the TypeScript and `@types/node` holds from `.ki.toml`, leaving the Vite holds explicit and unambiguous.
- [ ] Phase two: raise Vite and `@vitejs/plugin-react` together, since the plugin major is coupled to the Vite major.
- [ ] Confirm the site production build, `vitest.browser.config.ts`, and the Chromium browser suites all pass, and address the existing deprecation warnings about `esbuild` and `optimizeDeps.esbuildOptions` that the plugin currently emits rather than carrying them across the major.
- [ ] Compare the built site bundle before and after for unintended output changes, then remove the two Vite holds from `.ki.toml`.
- [ ] Keep each phase a separately revertible commit, and mix in no unrelated dependency refreshes.

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

That condition is currently unmet. The working tree carries an uncommitted monorepo task-runner migration — `turbo.json`, a per-workspace `test` and `typecheck` script in every manifest, a `vitest.config.ts` per workspace over a new `scripts/vitest-workspace.ts`, and a modified `bun.lock` — which is the same set of files both phases touch. Re-resolving the lockfile for a major bump underneath that would change its dependency resolution, and any gate result would be evidence about the migration rather than about the upgrade. Phase one resumes when that migration has landed.

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
