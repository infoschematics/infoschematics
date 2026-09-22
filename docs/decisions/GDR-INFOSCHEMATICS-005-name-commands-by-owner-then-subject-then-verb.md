---
id: GDR-INFOSCHEMATICS-005
title: Name commands by owner, then subject, then verb
date: 2026-09-16
status: current
decision_type: governance
decision_type_url: https://knowledgeislands.info/specifications/decision-records/gdr
decision_depends_on: [ADR-INFOSCHEMATICS-021]
---

# GDR-INFOSCHEMATICS-005: Name commands by owner, then subject, then verb

## Context

The root manifest had accumulated two naming schemes at once. Six commands were named `self:verify:*` — `self:verify:schema`, `self:verify:visual-tokens`, `self:verify:examples`, `self:verify:depcruise`, `self:verify:repo`, `self:verify:typecheck:scripts` — and their generating counterparts were named the other way round, `self:schema:generate` and `self:tokens:generate`. So the two halves of one generator pair sorted into different parts of the list, and the same subject was called `schema` in one name and `visual-tokens` in another. `self:verify:repo` named no subject at all: it ran the checks under `scripts/`, and the word "repo" was as true of every other command in the file.

That is not only untidy. `self:verify:typecheck` and `self:verify:typecheck:scripts` were one prefix apart and meant different scopes, `bunx knip` had a configuration file and no command to run it, and `self:cf:build` restated the build rather than delegating to it. Each of those is individually small; together they meant the manifest could no longer be read as the list of what this repository can do, which is the only thing a command surface is for.

The underlying reason a list rots is that nothing checks it. A script whose target no longer exists, a command module no script reaches, a Turborepo root task with no script behind it, and a command nobody has written down are all invisible from outside — and the last two are indistinguishable from dead code.

## Decision

A command's name reads **owner, then subject, then verb**.

The owner is the prefix. There are exactly three regimes, and they are a hierarchy of authority rather than a taxonomy of ours:

- **No prefix** for the lifecycle idioms the package manager and Turborepo already define — `build`, `clean`, `prepare`, `test`, `test:browser`. A bare name passes straight through to the task it is named after and adds nothing, so `bun run test` and `turbo run test` are the same run. A bare name is never invented for anything else.
- **`ki:`** for a command whose shape is mandated by a Knowledge Islands capability outside this repository. Its name and its behaviour are not ours to reword, even when a local name would read better.
- **`self:`** for everything this repository owns.

Within `self:`, the subject comes before the verb: `self:tokens:verify`, not `self:verify:visual-tokens`. The subject is the thing acted on — `boundaries`, `examples`, `packages`, `schema`, `scripts`, `tokens` — and the verb is last. A generated artefact's `generate` command is always paired with a `verify` command that runs the same script in check mode, so the pair sorts together and the gate proves the committed artefact matches its generator without a second implementation of the generator's rules.

The surface is documented in `README.md` under `### Command surface`, and `scripts/command-surface.test.ts` holds all of it: every root script names a target that exists, every command module under `scripts/` is reached by a root script, the commit hook, or that README section, every `//#` root task in `turbo.json` has a script behind it, every bare name is a passthrough, every `self:` name is subject-first, and every `generate` has a `verify` on the same script.

## Consequences

Renaming is a breaking change to muscle memory and to anything outside the repository that calls a command by name. `self:cf:build` is the case that matters: Cloudflare Workers Builds is configured to run it, that configuration lives in the Cloudflare dashboard, and nothing in the gate can see it. The name is kept — the command now delegates to `build` rather than restating it — and [the Cloudflare guide](../guides/cloudflare.md) records that the setting has to change first, in the same pass, if it is ever renamed.

The subject-first rule is enforced by a small list of known verbs, so a verb the list does not know is treated as a subject. That is the safe direction: the check never invents a violation, and it catches the one inversion that actually happened. It will not catch a new verb standing where a subject belongs until that verb is added to the list, which is the price of not maintaining a second vocabulary.

Writing the surface down in the README makes the list a reviewable artefact rather than a side effect of the manifest's sort order, and the test makes an undocumented command fail. It also means adding a command is two edits, not one. That is the intended cost: a command nobody can find is not a capability.

The rule says nothing about how a command parses its own arguments. [ADR-INFOSCHEMATICS-021](ADR-INFOSCHEMATICS-021-keep-command-line-input-inert.md) governs that, and the repository currently has two implementations of it — `scripts/cli.ts` for the scripts and the argument handling inside `@infoschematics/cli`. Unifying them is deliberately out of scope here, because the published command and the repository script do not offer the same options.
