---
id: INFOSCHEMATICS-TOOL-124
area: TOOL
title: Guidance without its mechanism
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T15:30:00Z
updated_at: 2026-09-22T15:30:00Z
---

# Guidance without its mechanism

## Goal

`AGENTS.md` states the two working mechanics a session currently has to rediscover by hitting them, so the guidance that mandates a practice also says what the practice actually costs.

## Context

Two mechanics were rediscovered on 2026-09-22, neither recorded anywhere.

**The browser look has no working tool.** `AGENTS.md` requires visual changes to be rendered and looked at from a real browser, with captures written to repository-root `reports/`. The browser automation available to a session refuses both `localhost` and `127.0.0.1` as private addresses, so it cannot reach a Vite dev server. The look has to be driven by a short Playwright script instead — which works, and which the repository already has Playwright installed for. The guidance mandates the practice and says nothing about the one mechanism that performs it, so every session pays the discovery cost.

**Markdown linting is not a gate you can run.** There is no lint script in `package.json` — the only gate is `self:check`. Markdown is linted by rumdl through `lint-staged`, at commit time only. The consequence is not the missing command but the timing: a markdown problem in a document being drafted is invisible until `git commit`, and `lint-staged` then rewrites the file underneath the writer, so an in-progress exact-string edit against that file fails afterwards. The user's own working preferences already warn about formatter writes invalidating an in-context copy; this repository's particular arrangement makes that certain rather than possible, and does not say so.

## Boundary

Guidance only: `AGENTS.md`, and whatever small helper the browser-look mechanic deserves if a script kept in the repository beats a script written afresh each time. It changes no product behaviour, no gate and no configuration.

It is not a proposal to add a markdown lint script. Whether one should exist is a separate question, and the mechanic is worth stating either way.

## Discussion

Captured on 2026-09-22 while delivering `INFOSCHEMATICS-TOOL-112`, where both were hit in the same session: the browser look for the Studio creation check, and `bun run ki:lint:md` from a plan file that carried a command this repository has never had.

The general shape is worth noting when this is shaped. Both are cases where a rule was written and the mechanism it depends on was not, so the rule reads as satisfiable and is not. The check to apply is whether anything else in `AGENTS.md` mandates a practice without naming how it is performed, rather than fixing only the two that happened to be hit.

A judgement to make: whether a committed script under `scripts/` is better than a documented pattern. A script is discoverable and stays correct; it is also another thing to maintain, and the looks a session needs vary enough that a fixed one may not fit. The narrower version — a documented snippet in `AGENTS.md` — may be the whole answer.
