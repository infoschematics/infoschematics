---
id: INFOSCHEMATICS-TOOL-124
area: TOOL
title: Guidance without its mechanism
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 3b99aa096215e899c5b4e6c02e91324eee59b0cf
created_at: 2026-09-22T15:30:00Z
updated_at: 2026-09-23T02:45:00Z
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

- [x] Decide between a committed script under `scripts/` and a documented snippet in `AGENTS.md`. A script stays correct and is discoverable; it is also another thing to maintain, and looks vary enough between sessions that a fixed one may not fit. Take the narrower option unless the wider one earns itself.
- [x] Land the chosen mechanism, carrying the three constraints a session otherwise rediscovers: the dev-server address the automation cannot reach, `server.fs` and `/tmp`, and why a new directory under `packages/` breaks config load.
- [x] Add a Markdown lint command that can be run before committing, so the rumdl pass is not first encountered as a mid-edit rewrite.
- [x] State the `lint-staged` timing in `AGENTS.md`: a commit rewrites Markdown files, so finish edits to a document before committing rather than across a commit.
- [x] Use the mechanism once for a real look and confirm the capture lands in `reports/`.

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

## Review

### Delivered

`AGENTS.md` now names the mechanism for the look it mandates, and the repository has a Markdown gate that can be run before a commit rather than only during one. Both mechanics were being rediscovered by every session that hit them, at the cost of a rewritten Playwright script and a formatter rewrite landing underneath an edit in progress.

### Summary of changes

`scripts/look.ts` is the committed browser look, reached as `bun run self:browser:look`. It serves `apps/site` itself on a port the operating system chooses, so a look never fights a dev server or a preview for a fixed port — the failure that cost the previous session a working mechanism. It drives Chromium through Playwright, writes captures and a log to `reports/<slug>/`, and takes `--probe <file>` for a module that drives the page beyond the first capture.

It refuses to call three things a look, which is the whole reason to commit one rather than describe it: a run that captured nothing, a capture too small to be a rendered page, and a page or console error. `scripts/look.test.ts` holds those rules, and `captureFloor` is set from measurement rather than taste — an empty 1600×1000 page weighs 6,989 bytes against the playground's 319,146.

`ki:lint:md` and `ki:lint:md:fix` run rumdl over the repository in check and fix form. The check is what tells you what the commit will say; the fix is the same rewrite `lint-staged` performs, taken at a moment of the writer's choosing rather than under a half-finished edit.

`AGENTS.md` gains the mechanism sentence beside the existing visual-evidence rule, carrying why it is committed — the browser automation an agent session is given refuses `localhost`, `127.0.0.1` and private addresses, so it cannot reach a dev server — and keeps the `/tmp` and `packages/` constraints where they already were, now beside a command that respects them. A second paragraph states the `lint-staged` timing and the two commands. `README.md` documents both commands in the command surface, as `scripts/command-surface.test.ts` requires.

### Verification

`bun run self:check` — 52 tasks, all successful, with `scripts/look.test.ts` running inside `self:scripts:test`.

The mechanism was used for a real look rather than only shipped: `reports/tool-124/` holds the Studio playground at 319,146 bytes and, after a probe clicked into the Direct workspace, at 340,364 bytes with `data-workspace=direct`. Both were looked at, and the second shows the editor dock open on Scenes — the probe moved the application rather than waiting beside it.

Each refusal was provoked rather than asserted: a probe that captured nothing, a probe that captured `about:blank`, and a probe that threw inside the page each exited 1 with the matching reason, the last while its capture was perfectly good. The Markdown check was run against a deliberately broken document and exited 1 on eight findings; the fix form applied all eight and exited 0. Evidence in `reports/TOOL-124-look-and-lint.md`.

### Outstanding concerns

The wider option was taken where the record said to prefer the narrower one, so it has to earn itself. What earned it was that a snippet cannot fail: the three refusals are the value here, and a session pasting a snippet writes the version without them, which is exactly how a blank frame and a page that threw were both read as clean looks before. The maintenance risk the record named — looks varying enough that a fixed one does not fit — is answered by `--probe`, which leaves every look-specific step outside the committed file.

The Discussion asked whether anything else in `AGENTS.md` mandates a practice without naming how it is performed. Sweeping the file, nothing else does: the vocabulary-citation rule, the `inputs` rule and the coverage-assertion rule each either name their command or are enforced inside `self:check`, so they fail loudly rather than waiting to be rediscovered.

`ki:lint:md` claims a `ki:` name for a command no external standard currently declares under that spelling. The hosted rubric owns rumdl's rules and configuration, and the name is the one plans written elsewhere already reach for, which is what made its absence cost a session — but if the Knowledge Islands standard later spells it differently, this is the line to move.

### Post-change review

The missing mechanism was never missing knowledge — every session worked it out, and worked it out the same way. What a session could not carry was the three refusals, because they are the part you only write after a blank capture has already fooled you once. That is the general argument for committing a mechanism: not that the steps are hard, but that the assertions are the part rediscovery drops.

The port choice is the same shape of lesson. `ki:site:preview` binds a fixed port, and the previous session lost its mechanism to an `Address already in use` it could not safely clear, because the process might have belonged to another writer. Asking the operating system for a port removes the contention rather than resolving it.

### Mini recap

`AGENTS.md` says how to look and how to lint; `bun run self:browser:look` does the looking and fails three ways a snippet would not; `bun run ki:lint:md` moves the Markdown pass ahead of the commit. Every visual item after this one — `INFOSCHEMATICS-TOOL-120`, `-121`, `-125` and `-126` — starts from a working mechanism.

## Discussion

Captured on 2026-09-22 while delivering `INFOSCHEMATICS-TOOL-112`, where both were hit in the same session: the browser look for the Studio creation check, and `bun run ki:lint:md` from a plan file that carried a command this repository has never had.

The general shape is worth noting when this is shaped. Both are cases where a rule was written and the mechanism it depends on was not, so the rule reads as satisfiable and is not. The check to apply is whether anything else in `AGENTS.md` mandates a practice without naming how it is performed, rather than fixing only the two that happened to be hit.

A judgement to make: whether a committed script under `scripts/` is better than a documented pattern. A script is discoverable and stays correct; it is also another thing to maintain, and the looks a session needs vary enough that a fixed one may not fit. The narrower version — a documented snippet in `AGENTS.md` — may be the whole answer.

### Adoption

Adopted into Now on 2026-09-22 while shaping the queue before a pause. The script-or-snippet choice is taken as part of delivery; the narrower answer is the default and has to earn its way to the wider one.
