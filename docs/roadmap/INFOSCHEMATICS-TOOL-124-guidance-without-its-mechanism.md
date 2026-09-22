---
id: INFOSCHEMATICS-TOOL-124
area: TOOL
title: Guidance without its mechanism
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T15:30:00Z
updated_at: 2026-09-22T19:40:00Z
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

## Current state

`AGENTS.md` requires visual changes to be rendered and looked at in a real browser, with captures written to the repository-root `reports/`. It names no mechanism. The browser automation available to a session refuses `localhost`, `127.0.0.1` and private addresses, so it cannot reach the Vite dev server; the look has to be driven by a short Playwright script, which works and which the repository already has Playwright installed for. Every session rediscovers that, and the constraints that go with it — `/tmp` is outside Vite's `server.fs`, and a new directory under `packages/` is read as a workspace package and fails config load.

There is no `lint` script in the root `package.json`; the only gate is `self:check`. Markdown is linted by rumdl through `lint-staged` at commit time. The consequence is timing rather than a missing command: a Markdown problem in a document being drafted is invisible until `git commit`, at which point `lint-staged` rewrites the file underneath the writer and an in-progress exact-string edit against it fails. The user's own working preferences warn that a formatter write invalidates an in-context copy; this repository's arrangement makes that certain rather than possible, and nothing says so.

## Steps

- [ ] Decide between a committed script under `scripts/` and a documented snippet in `AGENTS.md`. A script stays correct and is discoverable; it is also another thing to maintain, and looks vary enough between sessions that a fixed one may not fit. Take the narrower option unless the wider one earns itself.
- [ ] Land the chosen mechanism, carrying the three constraints a session otherwise rediscovers: the dev-server address the automation cannot reach, `server.fs` and `/tmp`, and why a new directory under `packages/` breaks config load.
- [ ] Add a Markdown lint command that can be run before committing, so the rumdl pass is not first encountered as a mid-edit rewrite.
- [ ] State the `lint-staged` timing in `AGENTS.md`: a commit rewrites Markdown files, so finish edits to a document before committing rather than across a commit.
- [ ] Use the mechanism once for a real look and confirm the capture lands in `reports/`.

## Files touched

`AGENTS.md`, the root `package.json` for the Markdown lint script, and `scripts/` if the decision is a committed script.

## Verify

Run the mechanism end to end against a live dev server and confirm a capture in `reports/`; run the Markdown lint command against a deliberately broken document and confirm it fails before any commit. `bun run self:check` for the script typecheck if a script lands.

## Dependencies / blocks

Nothing blocks it. It does not block anything either, but it is the item that makes every other visual item cheaper — `INFOSCHEMATICS-TOOL-120`, `-121`, `-125` and `-126` all end in a browser look.

## Documentation impact

### Decision Records

None. This is repository guidance, not a durable product decision.

### Specifications

None.

### Guides

`AGENTS.md` is the whole documentation impact: the visual-evidence paragraph gains its mechanism, and the Markdown timing gains a sentence.

### Roadmap

Nothing follows.

## Discussion

Captured on 2026-09-22 while delivering `INFOSCHEMATICS-TOOL-112`, where both were hit in the same session: the browser look for the Studio creation check, and `bun run ki:lint:md` from a plan file that carried a command this repository has never had.

The general shape is worth noting when this is shaped. Both are cases where a rule was written and the mechanism it depends on was not, so the rule reads as satisfiable and is not. The check to apply is whether anything else in `AGENTS.md` mandates a practice without naming how it is performed, rather than fixing only the two that happened to be hit.

A judgement to make: whether a committed script under `scripts/` is better than a documented pattern. A script is discoverable and stays correct; it is also another thing to maintain, and the looks a session needs vary enough that a fixed one may not fit. The narrower version — a documented snippet in `AGENTS.md` — may be the whole answer.

### Adoption

Adopted into Now on 2026-09-22 while shaping the queue before a pause. The script-or-snippet choice is taken as part of delivery; the narrower answer is the default and has to earn its way to the wider one.
