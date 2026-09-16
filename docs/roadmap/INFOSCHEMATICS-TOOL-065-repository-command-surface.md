---
id: INFOSCHEMATICS-TOOL-065
area: TOOL
title: Repository command surface
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-15T14:05:00Z
updated_at: 2026-09-16T10:45:00Z
---

# Repository command surface

## Goal

Make the repository's own commands comprehensible: one obvious way to run each job, names that say which regime a command belongs to, and no command that exists twice under two names.

## Context

The root manifest carries thirty scripts across three naming regimes, `scripts/` carries seven executable entry points beside its tests and its four libraries, and `packages/cli` now publishes a command of its own. The surface grew one command at a time with each feature and has never been read as a whole, so it is no longer clear which command a contributor or an agent should reach for. Raised directly: "I'm wondering if it's all understood really how it works."

The published CLI is the reason to look now. `packages/cli` renders an Infoschematic document to SVG, PNG, or a preview server; `scripts/render-example.ts` renders an Infoschematic document to SVG or PNG and differs only in resolving a registered example id rather than a pathname. One of those two is the product and the other is a development convenience that could be a thin call into it.

The monorepo migration was the reason to hold this rather than act immediately, and it has since landed (`INFOSCHEMATICS-TOOL-067`, delivered). Turborepo now owns the task graph, several root scripts have become thin `turbo run` wrappers, and `scripts/build-packages.ts` and `scripts/typecheck.ts` are gone — so the list is settled enough to audit.

## Boundary

This item rationalises how the repository's own jobs are invoked. It does not change what any job does, alter the gate's coverage, rename a published package command, or change the task runner the migration chose.

## Current state

Read against the tree on 2026-09-16, at `package.json:62-92`, `turbo.json`, `knip.json`, `.ki.toml`, and `scripts/`.

- `build` (`package.json:63`) and `self:cf:build` (`package.json:72`) are still byte-identical: both are exactly `turbo run build`. The duplication is real but deleting either is not free — `self:cf:build` is the build command configured in Cloudflare Workers Builds and documented as such at `docs/guides/cloudflare.md:29`. What has gone stale is the justification: `docs/guides/cloudflare.md:33` explains the name by the work it does, and that work is now whatever `turbo run build` does, so the seam carries no behaviour of its own.
- `scripts/render-example.ts` duplicates `packages/cli` more concretely than before. Both parse a document through `@infoschematics/domain-core`, render through `@infoschematics/render-svg`, and rasterise — but through different rasterisers and different argument parsers. `scripts/render-example.ts:70` shells out to `rsvg-convert`, while `packages/cli/src/raster.ts` uses the `@resvg/resvg-js` dependency declared at `packages/cli/package.json`. The script parses with `scripts/cli.ts`; the package parses with `packages/cli/src/options.ts`. Only the example-id catalogue at `scripts/render-example.ts:23-27` is genuinely unique to the script.
- `scripts/ibc-visual-compatibility.ts` is still reachable from no command: nothing in `package.json:62-92`, `turbo.json`, or `.husky/pre-commit` names it. It runs only by hand through the `import.meta.main` guard on its last line, and `scripts/ibc-visual-compatibility.test.ts:3` imports one pure function from it and otherwise reads the committed baseline at `scripts/fixtures/ibc-2026-visual-baseline.json`. It also cannot run in this repository: `loadSharp` at `scripts/ibc-visual-compatibility.ts:294-312` walks upward from the `--fixture` directory looking for `sharp` in an _external_ workspace, and `sharp` is not a dependency here. It is the capture half of a cross-repository procedure, not a repository command — and it does not use the `scripts/cli.ts` contract either, hand-rolling its own usage string at lines 63-65.
- `ki:deps:update` is still exactly `bun update --latest` (`package.json:65`). `.ki.toml:40-42` now records **one** hold, not four: `@types/node` major releases, pinned to the Node floor that `releaseNodeEngine` fixes at `scripts/release/packages.ts:27` per `GDR-INFOSCHEMATICS-004`. The defect is unchanged in kind and smaller in blast radius — the command would still bump `@types/node` straight past the hold, and `self:packages:check-versions` would not catch it because `scripts/release/packages.ts:97` only checks each published package's `engines.node`, never the devDependency range.
- Three generate/check pairs share one script each through a `--check` flag: `self:schema:generate` / `self:verify:schema` (`package.json:82`, `:87`), `self:tokens:generate` / `self:verify:visual-tokens` (`:83`, `:90`), and `self:examples:generate` / `self:verify:examples` (`:75`, `:85`). That is the good pattern; nothing states it, so the next generator need not follow it.
- Naming is inconsistent in both directions. `self:tokens:generate` and `self:verify:visual-tokens` name the same subject two ways. Three prefixes (`ki:`, `self:`, bare) divide the surface and the distinction is documented nowhere a contributor reads — `README.md:59-87` explains the gate, the narrowing commands, and the `scripts/` contract, but never the prefixes.
- Two commands are newly suspect for the same reason the old list was. `self:verify:typecheck` (`package.json:88`) is invoked by nothing: not `self:check`, not `turbo.json`, not a hook, not a document. And `knip.json` configures a whole unused-code analysis that no script, task, or hook ever runs — the one tool that would have found the rest of this list is itself unreachable, and it is configured in a way that would have missed two of these findings anyway (`entry: ["scripts/**/*.ts"]` makes every script an entry point, and `ignoreDependencies: ["syncpack"]` silences a devDependency with no command and no configuration file).

## Steps

1. [ ] Write the inventory as a test, not a document: a case under `scripts/` that reads `package.json`, `turbo.json`, `.husky/pre-commit`, and the `scripts/` tree, and fails when an executable script has no invoker or a root script names no reachable target. It must fail on the current tree before anything is fixed — that failing run is the inventory.
2. [ ] Resolve `scripts/ibc-visual-compatibility.ts` explicitly: keep it as a documented cross-repository procedure with a stated fixture prerequisite, reduce it to the pure comparison its test actually uses, or delete it and its fixture. Whichever is chosen, the step-1 test stops failing on it for a stated reason rather than an exemption.
3. [ ] Resolve `self:verify:typecheck` and `knip.json` the same way: give each a real invoker or remove it. If `knip` is wired in, narrow `entry` so scripts are analysed rather than assumed live, and drop `ignoreDependencies` for `syncpack` by removing the dependency.
4. [ ] Collapse the build duplication without breaking the external caller: make `self:cf:build` delegate to `build` rather than restate it, and correct `docs/guides/cloudflare.md:33` to explain the seam by who calls it rather than by what it does.
5. [ ] Reduce `scripts/render-example.ts` to example-id resolution plus a call into `@infoschematics/cli`, so the repository has one renderer, one argument parser, and one rasteriser. Confirm `bun run self:examples:render --all` still produces the same SVG bytes for every registered example before and after.
6. [ ] Make `ki:deps:update` respect `.ki.toml:40-42`, or delete it in favour of the conformance-governed route. Prove it either way by attempting an update with the `@types/node` hold in place and showing the hold survives.
7. [ ] Settle the prefix regimes and the subject-then-verb order, record the rule in a Decision Record, then rename to match and fix every reference the step-1 test can see.
8. [ ] Add the command surface to `README.md` beside the existing `scripts/` contract at `README.md:78`, stating what each prefix means and where a new command belongs.

## Files touched

- `package.json` — the `scripts` block at lines 62-92
- `turbo.json` — task `inputs` for any renamed root task
- `knip.json` — narrowed or deleted, per step 3
- `scripts/render-example.ts`, `scripts/ibc-visual-compatibility.ts`, `scripts/cli.ts`
- `scripts/fixtures/ibc-2026-visual-baseline.json` — only if step 2 deletes the procedure
- A new test file under `scripts/` for the invoker inventory, named beside the existing `scripts/dependency-boundaries.test.ts` convention
- `README.md` and `docs/guides/cloudflare.md`
- `.ki.toml` — only if step 6 changes how the hold is enforced
- `docs/decisions/` — a new Decision Record for the naming regime, per step 7

## Verify

- `bun run self:verify:repo` runs the new inventory test; confirm it fails on the pre-change tree and passes after.
- `bun run self:check` passes and its task list still names the same checks it named before any rename, compared against `package.json:73` as it stands today.
- `bun run self:examples:render --all` produces byte-identical SVG output before and after step 5.
- Every surviving root script runs once by hand, including the ones nothing else invokes — `bun run self:verify:typecheck`, `bun run self:packages:clean`, `bun run self:release:verify` — because a script no other command calls is precisely the kind that breaks unnoticed.
- `bun run ki:site:build` still succeeds after step 4, since that is the path Cloudflare Workers Builds exercises downstream of `self:cf:build`.

## Dependencies / blocks

Nothing blocks this now. The monorepo migration it was sequenced behind has landed (`INFOSCHEMATICS-TOOL-067`, delivered), which is what settled the root script list. Coordinate with major dependency upgrades (`INFOSCHEMATICS-TOOL-052`) only to the extent that both touch the root manifest, and note that step 6 reads the same `.ki.toml` hold that item exists to lift.

## Documentation impact

### Decision Records

One is expected, and step 7 depends on it: a new record under `docs/decisions/` fixing the prefix regimes (`ki:` for Knowledge Islands contract commands, `self:` for repository-owned jobs, bare for task-runner passthrough), the subject-then-verb order, and the rule for where a new command belongs. The current inconsistency is exactly what such a record would have prevented.

### Specifications

None. Nothing here changes product behaviour, so no document under `docs/specs/` gains or loses a requirement, and no conformance state moves.

### Guides

Two changes. `README.md` gains the command surface beside its existing `scripts/` contract, and `docs/guides/cloudflare.md:33` is corrected where it explains `self:cf:build` by behaviour the name no longer owns.

### Roadmap

None to this record. If step 2 keeps `scripts/ibc-visual-compatibility.ts` as a cross-repository procedure, that procedure's own home is a separate capture, not a step here.

## Discussion

### Whether a development command may read another package's source

`scripts/render-example.ts:10-13` imports `../packages/domain-core/src/index.ts`, `../packages/render-svg/src/index.ts`, and `../packages/view-model/src/runtime.ts` — source paths, not package entries. Step 5 would replace those with one call into `@infoschematics/cli`, which is a published entry that only exists after a build. That trades a script that always works on a clean checkout for one that proves the published shape but needs `bun run self:packages:build` first, and `scripts/examples.ts` and `scripts/generate-visual-tokens.ts` read source the same way. The open question is whether the repository wants one rule for all of `scripts/` or a stated exception for the renderer alone, and the answer decides whether step 5 is a simplification or a new build prerequisite in the middle of the example workflow.

### How much is worth doing

The cheapest useful outcome is steps 1 to 4: the inventory test, the two dead entries, and the build seam. Steps 5 and 7 cost considerably more — step 5 changes a rasteriser and so can change output bytes, and step 7 touches every reference in the tree — and pay off only if the Decision Record lands with them. They should be judged separately rather than carried along.
