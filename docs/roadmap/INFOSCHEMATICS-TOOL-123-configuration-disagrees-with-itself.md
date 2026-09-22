---
id: INFOSCHEMATICS-TOOL-123
area: TOOL
title: Configuration disagrees with itself
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T15:30:00Z
updated_at: 2026-09-22T15:30:00Z
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

## Discussion

Surfaced on 2026-09-22 during a recap. Both findings predate this session's work.

The reason to do it rather than suppress it: a repository whose own audit has two permanent failures trains its readers to ignore the audit, which is the failure mode `AGENTS.md` names about checks generally — a check that measures nothing reports success, and a check nobody reads is the same thing by another route. Two findings is where that habit forms.
