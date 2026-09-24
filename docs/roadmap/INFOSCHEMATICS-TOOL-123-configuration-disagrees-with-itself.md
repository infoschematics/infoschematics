---
id: INFOSCHEMATICS-TOOL-123
area: TOOL
title: Configuration disagrees with itself
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 1ddc5daecf1f7cff1e2ed8829b2ca064a350e448
created_at: 2026-09-22T15:30:00Z
updated_at: 2026-09-24T16:00:00Z
---

# Configuration disagrees with itself

## Goal

The repository's own tool configuration matches the contract it declares, so `ki repo audit --skill ki-engineering` reports on real problems rather than on two findings a reader has learned to scroll past.

## Context

Two standing findings, both about configuration rather than code.

`GEN-1` requires the managed discovery surfaces to share exclusions across Biome, Knip and Markdown. `knip.json` is missing `.claude/skills/` and `.agents/skills/`, which the other two exclude. The finding carries its own warning that Knip may then report those ignore entries as unused configuration hints, and that the hint must not override the cross-tool contract — so the fix is known and the trap in taking it is known.

`TURBO-2` warns that four example workspaces declare no `build` script — `examples/is-blank`, `is-infoschematics`, `is-showcase`, `is-system` — while `turbo.json` expects one per workspace, and that a root script invokes `self:lockfile:verify` as an undeclared task. `AGENTS.md` already states why this matters more here than it looks: Turborepo owns the task graph, `inputs` are load-bearing, and a task whose declaration is wrong reports a green it did not earn.

The two are grouped because they are one question asked twice — the repository says one thing in its contract and another in its configuration — and because neither is worth its own delivery cycle.

## Boundary

Configuration files and the audit contract they answer to: `knip.json`, `turbo.json`, and the example workspaces' `package.json` scripts. It changes no product behaviour and no published shape.

It does not include dependency currency, which is `INFOSCHEMATICS-TOOL-122`.

Whether the examples should build at all is in scope as a question. `ADR-INFOSCHEMATICS-021` keeps example packages copyable rather than published, so a `build` script may be the wrong answer and excluding them from the task correspondence rule may be the right one.

## Current state

Two standing `ki repo audit --skill ki-engineering` findings, both configuration rather than code.

`GEN-1` requires the managed discovery surfaces to share their exclusions across Biome, Knip and the Markdown linter. `knip.json` omits `.claude/skills/` and `.agents/skills/`; the other two exclude them. The finding carries its own trap: Knip may then report the added ignore entries as unused configuration hints, and the root script runs `knip --treat-config-hints-as-errors`, so the fix has to satisfy both the cross-tool contract and the hint check.

`TURBO-2` warns that four example workspaces declare no `build` script — `examples/is-blank`, `examples/is-infoschematics`, `examples/is-showcase`, `examples/is-system` — while `turbo.json` expects one per workspace, and that the root `self:check` script invokes `self:lockfile:verify` as an undeclared task. `AGENTS.md` already states why this matters more than it looks: Turborepo owns the task graph, `inputs` are load-bearing, and a task whose declaration is wrong reports a green it did not earn.

## Steps

- [x] Add `.claude/skills/` and `.agents/skills/` to `knip.json`'s ignores and confirm `knip --treat-config-hints-as-errors` still passes — if it reports the entries as unused hints, resolve that rather than dropping the exclusion.
- [x] Decide whether the four example workspaces declare a no-op `build` or whether `turbo.json` stops expecting one from every workspace, and apply it. `ADR-INFOSCHEMATICS-021` is the record that made examples independently authored; check it before assuming a build script is the right answer.
- [x] Declare `self:lockfile:verify` as a task in `turbo.json` so the root script invokes something the graph knows about.
- [x] Prove each declaration by editing a file the task reads and confirming it reruns, per `AGENTS.md`'s rule about `inputs`.

## Files touched

`knip.json`, `turbo.json`, the root `package.json` if the script changes, and the four `examples/*/package.json` files if the decision is to declare a build.

## Verify

`bun run self:check`, then `ki repo audit --skill ki-engineering` reporting neither `GEN-1` nor `TURBO-2`. The declaration check is the real verification: a task that is declared but reads the wrong `inputs` still reports a green it did not earn, so edit a real input and watch it rerun.

## Dependencies / blocks

Nothing blocks it and it blocks nothing. It is the configuration half of the same audit run whose dependency half is `INFOSCHEMATICS-TOOL-122`.

## Documentation impact

### Decision Records

None expected. If the answer to the example workspaces is that `turbo.json` should stop requiring a build from every workspace, `ADR-INFOSCHEMATICS-021` is amended rather than superseded.

### Specifications

None. No user-observable behaviour changes.

### Guides

`AGENTS.md` already states the task-graph reasoning; it gains nothing unless the example workspaces' relationship to the graph changes.

### Roadmap

Nothing follows.

## Review

### Delivered

Both standing `ki repo audit --skill ki-engineering` findings are gone: the audit now reports nine findings, all of them owned by `INFOSCHEMATICS-TOOL-128` (the toolchain group) and `INFOSCHEMATICS-TOOL-122` (dependency currency), and none by `GEN-1` or `TURBO-2`.

`GEN-1` was the interesting half. Adding `.claude/skills` and `.agents/skills` to `knip.json` makes Knip report both as configuration hints asking for their removal, because its root project glob is `scripts/**/*.ts` and neither path is anything it would otherwise read. The root script ran `knip --treat-config-hints-as-errors`, so taking the contract seriously failed the check, and the flag cannot tell a hint that is advice from a hint that is the contract working. The resolution is `scripts/unused.ts`: it runs Knip, sanctions exactly those two hints by name, and fails on every other hint and every issue — so the strictness the flag was there for survives without its one wrong answer.

`TURBO-2` was two smaller things. The four example workspaces now declare a `build` that runs their existing `check` — rendering their own YAML to `/dev/null` — which is a real obligation rather than a no-op, and is what `ADR-INFOSCHEMATICS-021` already says an example owes: its content has to render through the published CLI. Each carries a package-level `turbo.json` saying that build has no outputs, because the root `build` task declares `dist/**` and an example emits nothing; without it Turborepo warned about missing output files on every run. And the root `self:check` now names its root tasks as `//#self:…`, which is what the graph calls them.

### Change Summary

- `scripts/unused.ts` (new) — runs `knip --no-progress`, reading **both** streams, because Knip writes issues to standard output and configuration hints to standard error; a wrapper that read only the first would see an empty report and pass a repository it never looked at. `assess` is pure and exported so every verdict is testable.
- `scripts/unused-report.test.ts` (new) — seven cases over `assess`, including the two that matter: a sanctioned hint that stops being reported, and one that comes back reworded. Both fail, which is the assertion about the command's own coverage that `AGENTS.md` requires.
- `knip.json` — gains the two shared exclusions `GEN-1` requires.
- `package.json` — `self:unused:verify` runs the wrapper; `self:check` prefixes its root tasks with `//#`.
- `examples/{is-blank,is-infoschematics,is-showcase,is-system}/package.json` — a `build` script delegating to `check`.
- `examples/*/turbo.json` (four new) — `extends: ["//"]` with `build.outputs: []`.
- `turbo.json` — `build.inputs` gains `infoschematic.yaml`, which the example builds now read.
- `README.md` — the command-surface row for `self:unused:verify` describes what it now does.

### Verification

`bun run self:check` — 52 tasks, all successful.

`ki repo audit --skill ki-engineering --repo .` — nine findings, none of them `GEN-1` or `TURBO-2`. The nine are `PKG-5`, `SCR-1`, `SCR-3`, three `SCR-11`, `BUN-2`, `SYNC-1` and `DEPS-1`, all pre-existing and all owned elsewhere.

The declarations were proved by mutation rather than assumed, per `AGENTS.md`. Reading the task hash from `turbo run … --dry=json`, editing a declared input and reading it again:

- `//#self:unused:verify` ← `scripts/unused.ts`: `6410713331a41bdc` → `9fd79a2d20a5ebc8` → back.
- `build` (`@infoschematics/is-showcase`) ← `examples/is-showcase/infoschematic.yaml`: `9aec597340307a08` → `c50f57fde37b0de0` → back.
- `//#self:lockfile:verify` ← `examples/is-blank/package.json`: `134e766353024431` → `0dda423ecf1cc8e5` → back.

Seen through the runner as well: `turbo run build --filter=@infoschematics/is-blank` reported 6 cached of 6, then 5 of 6 once `infoschematic.yaml` changed.

The wrapper was exercised against both failures it exists to catch, not only against a passing repository. An orphan module under `scripts/` failed it with `unused files: scripts/zz-probe-unused.ts`; removing `.agents/skills` from `knip.json` failed it with the sanctioned-hint message, and restoring it passed. Evidence in `reports/TOOL-123-turbo-inputs.txt`.

### Outstanding concerns

The sanction is matched against Knip's rendered text, because `--reporter json` emits `{"issues":[]}` and omits configuration hints entirely — there is no structured surface for the thing being sanctioned. The wording is pinned by the requirement that both hints be present, so a reworded hint fails loudly rather than being waved through, but it is a text contract with a tool that has no reason to keep it.

The four example manifests still fail `SYNC-1` with `PackagePropertiesAreNotSorted`, which is about their root property order and not about the `build` script added here. That finding belongs to `INFOSCHEMATICS-TOOL-128`.

### Post-change review

One method error, caught and corrected. The first input proof read `tasks[0]` out of a filtered `--dry=json` run and reported no hash change; `tasks[0]` in a filtered run is a dependency's build, not the filtered package's. Selecting the task by package name showed the change. The note in `reports/TOOL-123-turbo-inputs.txt` records the wrong reading beside the right one, because a proof that silently read the wrong task is exactly the failure mode this step exists to prevent.

The first version of the wrapper read only standard output and reported a clean repository while seeing nothing at all — the `AGENTS.md` failure mode, reproduced on the first attempt at the check meant to avoid it. It was caught because the sanctioned-hints assertion failed, which is the assertion earning its place on its first run.

### Mini recap

Two audit findings that a reader had learned to scroll past are gone, and neither was closed by suppressing it. The Knip one turned out to be a genuine conflict between a cross-tool contract and a tool flag that cannot see it, resolved by a wrapper that sanctions exactly the two entries the contract requires and fails if they ever stop being reported. The Turborepo one turned out to be three small honest declarations: examples build by rendering themselves, that build has no outputs, and root tasks are named as root tasks.

## Done

Accepted 2026-09-24 by Kris Brown on the review packet above.

## Discussion

Surfaced on 2026-09-22 during a recap. Both findings predate this session's work.

The reason to do it rather than suppress it: a repository whose own audit has two permanent failures trains its readers to ignore the audit, which is the failure mode `AGENTS.md` names about checks generally — a check that measures nothing reports success, and a check nobody reads is the same thing by another route. Two findings is where that habit forms.

### Adoption

Adopted into Now on 2026-09-22 while shaping the queue before a pause. Both findings are small and the pairing is deliberate: they are one question — the repository disagreeing with its own configuration — asked twice.
