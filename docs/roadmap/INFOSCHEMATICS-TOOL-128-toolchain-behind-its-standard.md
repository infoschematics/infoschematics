---
id: INFOSCHEMATICS-TOOL-128
area: TOOL
title: Toolchain behind its standard
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T17:50:00Z
updated_at: 2026-09-22T17:50:00Z
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

## Discussion

Surfaced on 2026-09-22 while assessing stability work before a pause, by re-running the audit after the dependency updates landed. The finding that matters is not any single rule but that the count went from two to ten without anything in this repository changing: an audit whose standard moves needs running often enough that each move is a small correction, and this one was not.

Worth settling when shaped: whether `BUN-2` is taken as one change across all eight packages or one package at a time with the pack smoke test as the proof, and whether `test:browser` is renamed to `self:test:browser` or excluded, since it is invoked from `self:check` and from `turbo.json`.
