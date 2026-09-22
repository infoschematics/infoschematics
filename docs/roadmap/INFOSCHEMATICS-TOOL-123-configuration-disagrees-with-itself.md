---
id: INFOSCHEMATICS-TOOL-123
area: TOOL
title: Configuration disagrees with itself
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T15:30:00Z
updated_at: 2026-09-22T17:30:00Z
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

Whether the examples should build at all is in scope as a question. `ADR-INFOSCHEMATICS-023` keeps example packages copyable rather than published, so a `build` script may be the wrong answer and excluding them from the task correspondence rule may be the right one.

## Current state

Two standing `ki repo audit --skill ki-engineering` findings, both configuration rather than code.

`GEN-1` requires the managed discovery surfaces to share their exclusions across Biome, Knip and the Markdown linter. `knip.json` omits `.claude/skills/` and `.agents/skills/`; the other two exclude them. The finding carries its own trap: Knip may then report the added ignore entries as unused configuration hints, and the root script runs `knip --treat-config-hints-as-errors`, so the fix has to satisfy both the cross-tool contract and the hint check.

`TURBO-2` warns that four example workspaces declare no `build` script — `examples/is-blank`, `examples/is-infoschematics`, `examples/is-showcase`, `examples/is-system` — while `turbo.json` expects one per workspace, and that the root `self:check` script invokes `self:lockfile:verify` as an undeclared task. `AGENTS.md` already states why this matters more than it looks: Turborepo owns the task graph, `inputs` are load-bearing, and a task whose declaration is wrong reports a green it did not earn.

## Steps

- [ ] Add `.claude/skills/` and `.agents/skills/` to `knip.json`'s ignores and confirm `knip --treat-config-hints-as-errors` still passes — if it reports the entries as unused hints, resolve that rather than dropping the exclusion.
- [ ] Decide whether the four example workspaces declare a no-op `build` or whether `turbo.json` stops expecting one from every workspace, and apply it. `ADR-INFOSCHEMATICS-023` is the record that made examples independently authored; check it before assuming a build script is the right answer.
- [ ] Declare `self:lockfile:verify` as a task in `turbo.json` so the root script invokes something the graph knows about.
- [ ] Prove each declaration by editing a file the task reads and confirming it reruns, per `AGENTS.md`'s rule about `inputs`.

## Files touched

`knip.json`, `turbo.json`, the root `package.json` if the script changes, and the four `examples/*/package.json` files if the decision is to declare a build.

## Verify

`bun run self:check`, then `ki repo audit --skill ki-engineering` reporting neither `GEN-1` nor `TURBO-2`. The declaration check is the real verification: a task that is declared but reads the wrong `inputs` still reports a green it did not earn, so edit a real input and watch it rerun.

## Dependencies / blocks

Nothing blocks it and it blocks nothing. It is the configuration half of the same audit run whose dependency half is `INFOSCHEMATICS-TOOL-122`.

## Documentation impact

### Decision Records

None expected. If the answer to the example workspaces is that `turbo.json` should stop requiring a build from every workspace, `ADR-INFOSCHEMATICS-023` is amended rather than superseded.

### Specifications

None. No user-observable behaviour changes.

### Guides

`AGENTS.md` already states the task-graph reasoning; it gains nothing unless the example workspaces' relationship to the graph changes.

### Roadmap

Nothing follows.

## Discussion

Surfaced on 2026-09-22 during a recap. Both findings predate this session's work.

The reason to do it rather than suppress it: a repository whose own audit has two permanent failures trains its readers to ignore the audit, which is the failure mode `AGENTS.md` names about checks generally — a check that measures nothing reports success, and a check nobody reads is the same thing by another route. Two findings is where that habit forms.

### Adoption

Adopted into Now on 2026-09-22 while shaping the queue before a pause. Both findings are small and the pairing is deliberate: they are one question — the repository disagreeing with its own configuration — asked twice.
