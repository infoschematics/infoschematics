---
id: INFOSCHEMATICS-TOOL-065
area: TOOL
title: Repository command surface
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-15T14:05:00Z
updated_at: 2026-09-15T15:00:00Z
---

# Repository command surface

## Goal

Make the repository's own commands comprehensible: one obvious way to run each job, names that say which regime a command belongs to, and no command that exists twice under two names.

## Context

The root manifest carries thirty scripts across three naming regimes, `scripts/` carries eight executable entry points beside its tests and its two libraries, and `packages/cli` now publishes a command of its own. The surface grew one command at a time with each feature and has never been read as a whole, so it is no longer clear which command a contributor or an agent should reach for. Raised directly: "I'm wondering if it's all understood really how it works."

The published CLI is the reason to look now. `packages/cli` renders an Infoschematic document to SVG, PNG, or a preview server; `scripts/render-example.ts` renders an Infoschematic document to SVG or PNG and differs only in resolving a registered example id rather than a pathname. One of those two is the product and the other is a development convenience that could be a thin call into it.

The monorepo migration was the reason to hold this rather than act immediately, and it has since landed (`INFOSCHEMATICS-TOOL-067`, delivered). Turborepo now owns the task graph, several root scripts have become thin `turbo run` wrappers, and `scripts/build-packages.ts` and `scripts/typecheck.ts` are gone — so the list is settled enough to audit.

## Boundary

This item rationalises how the repository's own jobs are invoked. It does not change what any job does, alter the gate's coverage, rename a published package command, or change the task runner the migration chooses.

## Current state

Concrete findings from reading the surface, each to be confirmed against the tree at delivery rather than trusted from here:

- `build` and `self:cf:build` are now byte-identical: both are `turbo run build`. The migration collapsed the pipeline without collapsing the two names for it, so one of them is pure duplication.
- `scripts/render-example.ts` duplicates what `packages/cli` does, as above.
- `scripts/ibc-visual-compatibility.ts` is fifteen kilobytes of `sharp`-based comparison reachable from no script entry at all; only its own test calls it. That contradicts the premise stated in `scripts/cli.ts` that every script is a real command.
- `ki:deps:update` is `bun update --latest`, which would drive straight through the four major-version holds recorded in `.ki.toml` rather than respecting them.
- Three generate/check pairs — schema, visual tokens, examples — share one script each through a `--check` flag, which is the good pattern; nothing states it, so the next generator need not follow it.
- Naming is inconsistent in both directions: `self:tokens:generate` against `self:verify:visual-tokens` for the same subject, and three prefixes (`ki:`, `self:`, bare) whose distinction is not documented anywhere a contributor reads.

## Steps

- [ ] Inventory every root script, every `scripts/` entry point, and every published package command, recording for each what invokes it — a human, the gate, a hook, CI, or nothing.
- [ ] Remove or wire up what nothing invokes, deciding explicitly for `scripts/ibc-visual-compatibility.ts` whether it is a command, a library, or spent.
- [ ] Collapse the duplicate build pipelines to one definition.
- [ ] Decide whether `scripts/render-example.ts` becomes a call into `@infoschematics/cli` with example-id resolution, and if so make the CLI the only renderer in the repository.
- [ ] Settle the prefix regimes and the subject-then-verb order, then rename to match and fix every reference.
- [ ] Make `ki:deps:update` respect the `.ki.toml` holds, or remove it in favour of the conformance-governed route.
- [ ] Document the surface where a contributor meets it, so the next command added has an obvious place to go.

## Files touched

- `package.json` and the workspace manifests
- `scripts/` entry points and `scripts/cli.ts`
- `.ki.toml` where a command and a hold disagree
- `AGENTS.md` and the contributor guidance under `docs/guides/`

## Verify

Run `bun run self:check` and confirm the gate covers exactly what it covered before the rename. Grep the tree, the hooks, and the site configuration for every renamed command and confirm no reference survives to the old name. Run each surviving command once by hand, because a script that nothing invokes is precisely the kind that breaks unnoticed.

## Dependencies / blocks

Nothing blocks this now. The monorepo migration it was sequenced behind has landed (`INFOSCHEMATICS-TOOL-067`, delivered), which is what settled the root script list. Coordinate with major dependency upgrades (`INFOSCHEMATICS-TOOL-052`) only to the extent that both touch the root manifest.

## Documentation impact

### Decision Records

Likely one, recording the naming regime and the rule for where a new command belongs, since the current inconsistency is what a decision would have prevented.

### Specifications

None. None of this changes product behaviour.

### Guides

Contributor guidance gains the command surface it currently lacks.

### Roadmap

None.

## Discussion

### What the CLI owns

If the published CLI is the renderer, the repository should have no second renderer. Shaping should decide whether a development command may reach into a package's source directly or must go through its published entry, because that answer also decides how the example renderer is written.

### How much is worth doing

The cheapest useful outcome is deleting what nothing calls and collapsing the duplicate build. The renames cost more and pay off only if they are documented, so they should be judged separately rather than carried along.
