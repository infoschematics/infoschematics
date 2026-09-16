---
id: INFOSCHEMATICS-TOOL-065
area: TOOL
title: Repository command surface
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: dbd57e2f
created_at: 2026-09-15T14:05:00Z
updated_at: 2026-09-16T12:55:00Z
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

1. [x] Write the inventory as a test, not a document: a case under `scripts/` that reads `package.json`, `turbo.json`, `.husky/pre-commit`, and the `scripts/` tree, and fails when an executable script has no invoker or a root script names no reachable target. It must fail on the current tree before anything is fixed — that failing run is the inventory.
2. [x] Resolve `scripts/ibc-visual-compatibility.ts` explicitly: keep it as a documented cross-repository procedure with a stated fixture prerequisite, reduce it to the pure comparison its test actually uses, or delete it and its fixture. Whichever is chosen, the step-1 test stops failing on it for a stated reason rather than an exemption.
3. [x] Resolve `self:verify:typecheck` and `knip.json` the same way: give each a real invoker or remove it. If `knip` is wired in, narrow `entry` so scripts are analysed rather than assumed live, and drop `ignoreDependencies` for `syncpack` by removing the dependency.
4. [x] Collapse the build duplication without breaking the external caller: make `self:cf:build` delegate to `build` rather than restate it, and correct `docs/guides/cloudflare.md:33` to explain the seam by who calls it rather than by what it does.
5. [ ] Reduce `scripts/render-example.ts` to example-id resolution plus a call into `@infoschematics/cli`, so the repository has one renderer, one argument parser, and one rasteriser. Confirm `bun run self:examples:render --all` still produces the same SVG bytes for every registered example before and after.

   Not done, and not partially done: the tree is at its pre-change state for this step. Two independent findings stopped it.

   The argument parser cannot be unified as stated. `packages/cli/src/index.ts:107` returns its SVG through `line()`, which appends a trailing newline, so delegating the SVG path would change the bytes this item's own verification requires to be identical. Delegation would also drop four options the script has and the published command does not — `--annotations`, `--json`, `--all`, and the `reports/<stem>.svg` default output path — so it is a reduction in capability, not a deduplication.

   The rasteriser cannot be unified today either, and the reason is a live product defect rather than anything about this script. Swapping `rsvg-convert` for `rasteriseInfoschematicSvg` kept all four SVGs byte-identical and changed the PNG visibly: every Flow arrowhead rendered as an unrotated pennant. `@resvg/resvg-js` does not implement the `orient="auto-start-reverse"` the renderer emits, so it applies no rotation at all, which means every PNG the published `@infoschematics/cli` emits today carries the same fault. Captured as `INFOSCHEMATICS-TOOL-071`, sequenced after `INFOSCHEMATICS-TOOL-058`; the obvious one-token fix to `orient="auto"` is wrong, because `packages/render-svg/src/index.ts:613` uses `marker-start` for a bidirectional Flow and that arrowhead is meant to point back out of its source.
6. [x] Make `ki:deps:update` respect `.ki.toml:40-42`, or delete it in favour of the conformance-governed route. Prove it either way by attempting an update with the `@types/node` hold in place and showing the hold survives.
7. [x] Settle the prefix regimes and the subject-then-verb order, record the rule in a Decision Record, then rename to match and fix every reference the step-1 test can see.
8. [x] Add the command surface to `README.md` beside the existing `scripts/` contract at `README.md:78`, stating what each prefix means and where a new command belongs.

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

## Review

### Delivered

Seven of the eight steps. Step 5 is not delivered, and it is recorded above with the two findings that stopped it, one of which became `INFOSCHEMATICS-TOOL-071`.

The inventory is now a test rather than a document: `scripts/command-surface.test.ts` reads `package.json`, `turbo.json`, `.husky/pre-commit`, `README.md`, `.ki.toml`, and the `scripts/` tree, and holds ten cases over them. The naming regime it enforces is recorded in `GDR-INFOSCHEMATICS-005`, the surface it requires to be written down is in `README.md` under `### Command surface`, and every reference in the living documents has been renamed to match.

### Summary of changes

`scripts/command-surface.test.ts` is new. It parses every root script into the targets it names — a task, another root script, a workspace script, a file, a directory, or a binary in `node_modules/.bin` — and fails when any of them does not resolve. It then holds five rules: every command module under `scripts/` is reached by a root script, the commit hook, or the README section; every root script appears in that README section; every `//#` task in `turbo.json` has a root script behind it; every bare script name passes straight through to the task it is named after; and every `self:` name reads subject first. A sixth pairs each `*:generate` with a `*:verify` that runs the same script with `--check`. A second block enforces the `.ki.toml` dependency hold that `ki:deps:update` would otherwise cross, comparing the declared `@types/node` major against `releaseNodeEngine` rather than restating `22` as a second literal.

`package.json` renamed seven scripts into subject-then-verb order — `self:verify:schema` to `self:schema:verify`, `self:verify:visual-tokens` to `self:tokens:verify`, `self:verify:examples` to `self:examples:verify`, `self:verify:depcruise` to `self:boundaries:verify`, `self:verify:repo` to `self:scripts:test`, `self:verify:typecheck:scripts` to `self:scripts:typecheck`, and `self:verify:typecheck` to `self:typecheck` — and `turbo.json` renamed the six root tasks to match. `self:check` names the same checks it named before, in the same order. `self:cf:build` now delegates to `build`. `self:unused:verify` is new and is the invoker `knip.json` never had. `syncpack` is gone from `devDependencies`, and with it the `ignoreDependencies` entry that was hiding it.

`knip.json` names the real entry points under `scripts/` instead of treating every file there as one, and drops the stale `.claude/skills` and `.agents/skills` ignores. `ignoreBinaries: ["rsvg-convert"]` stays, because step 5 stayed reverted and the shell-out survives.

`turbo.json` widens the `inputs` of `//#self:scripts:test` by six entries — `.husky/**`, `.ki.toml`, `README.md`, `apps/*/package.json`, `bun.lock`, and `turbo.json` — because the new test reads all of them.

Three commands were deliberately not renamed. `self:check`, `self:release:verify`, and `self:packages:build` are named by workflows under `.github/workflows/`, and `self:cf:build` is named by the Cloudflare Workers Builds configuration, which lives outside this repository entirely. `docs/guides/cloudflare.md` now says so: the seam is explained by who calls it, and by the fact that renaming it breaks the deploy at the next push with nothing in the gate able to see it.

`scripts/ibc-visual-compatibility.ts` is resolved as step 2's first option. It is documented in the README command surface as a cross-repository procedure with its fixture prerequisite stated — the fixture workspace must already have `sharp`, which the script resolves by walking upward from `--fixture` and never from here — and the reason it is not a root script is given: a root script would advertise a command that fails for every contributor without that fixture.

### Verification

`bun run self:check` passes: 43 tasks, 43 successful. `bun run self:scripts:test` is 14 files and 60 tests; the new file is 10 of those tests.

The test was proved red three times rather than assumed:

- Removing `self:unused:verify` from the README section: `expected [ 'self:unused:verify' ] to deeply equal []`.
- Renaming `self:tokens:verify` back to `self:verify:visual-tokens`: three cases failed at once — `expected [ 'self:verify:visual-tokens' ] to deeply equal []` for the ordering rule, `expected [ 'self:tokens:verify' ] to deeply equal []` for the dangling root task, and `self:tokens:generate has no self:tokens:verify` for the generator pairing.
- Bumping `@types/node` to `^24.9.2`: `@types/node is ^24.9.2; GDR-INFOSCHEMATICS-004 holds it at 22 until releaseNodeEngine moves: expected 24 to be 22`.

The widened `inputs` were proved the same way. `bunx turbo run self:scripts:test` twice gives `1 cached, 1 total` and `>>> FULL TURBO`; appending a line to `README.md` gives `0 cached, 1 total`; restoring it returns to `FULL TURBO`; appending a line to `.ki.toml` gives `0 cached, 1 total`, and restoring it returns to `FULL TURBO`. Both files are newly listed inputs, and neither was an input before this change.

`bun run self:examples:render --all` was compared against SVGs captured from the pre-change tree. `cmp` is silent for all four: `blank`, `infoschematics`, `homepage`, `system`. Nothing here changes rendered output, and `scripts/render-example.ts` is at its committed state.

Every surviving root script ran once by hand. `self:typecheck` (13 tasks), `self:packages:clean` (8 tasks), `self:release:verify` (clean-consumer smoke passed for 8 packages, 3 examples copied clean), `ki:site:build`, `self:cf:build` (9 tasks, which is what proves the delegation), and the three generators, which produced no diff. `self:unused:verify` fails, which is covered below. `self:dev`, `ki:site:dev`, `ki:site:preview`, and `ki:site:deploy` were not run: three start servers and the fourth deploys.

### Outstanding concerns

**`self:unused:verify` fails on the current tree, and is deliberately not in the gate.** Giving `knip.json` an invoker is what made its findings visible, and there are three, all real and all outside this item: `packages/view-studio/src/app/panels/ThemeStrip.tsx` has no importer anywhere, and `isComponentsPath` (`apps/site/src/routes.ts:318`) and `componentsGuideContents` (`apps/site/src/VisualGuide.tsx:10`) are exported and unused. Wiring the command into `self:check` would therefore break the gate on someone else's code. It is a narrowing command for now, and it can join the gate in the change that clears those three.

**A check that proves two outputs agree cannot notice that both are wrong.** `scripts/release/pack-smoke.ts` compares the packed consumer's PNG against the workspace PNG, so it passed throughout the arrowhead defect: the two outputs agreed, because they share the renderer and the rasteriser that are both wrong. The lesson generalises past this one file — a parity check is evidence of agreement, never of correctness, and needs at least one assertion against something that is not the other side of the comparison.

**The repository still has two argument parsers and two rasterisers**, which is what step 5 existed to remove. The four blockers are named in step 5 above so a follow-up inherits the reason rather than rediscovering it: the trailing newline `packages/cli/src/index.ts:107` adds through `line()`, and the `--annotations`, `--json`, `--all`, and default-output-path options the script has and the published command does not. Unifying them means giving the published command those options first, which is a product change and not this item's.

**`docs/roadmap/*` was left alone.** Those records name `self:verify:*` commands that no longer exist, deliberately: they are point-in-time records, and one of them is being actively delivered in another worktree. A reader following a command name out of an old roadmap record will not find it.

**The subject-first rule is enforced against a known-verb list.** A verb the list does not know is treated as a subject, so the check never invents a violation and will not catch a new verb standing in the subject position until that verb is added. `GDR-INFOSCHEMATICS-005` records that as the deliberate direction of the trade.

### Post-change review

The inventory-as-a-test decision was right for a reason that only became visible afterwards. Writing the surface as a document would have produced the same list and none of the pressure: the reason `self:unused:verify` had to be created rather than noted is that the test fails on a `//#` task with no script and on a command module with no invoker, and the reason `syncpack` came out is that removing the knip exemption left nothing pointing at it. A document would have recorded all three as observations and changed none of them.

`self:verify:repo` is the name that taught the most. It said nothing — every command in the file is about the repository — and renaming it to `self:scripts:test` immediately exposed that its `inputs` were wrong: once the name said it tested `scripts/`, the question of what `scripts/` reads answered itself, and six files were missing. The old name had been hiding an unearned green for as long as it existed.

The step 5 investigation is the part that paid for itself in a way the item did not anticipate. Nothing in the suite could have found the arrowhead defect, because the defect is in the rasteriser's reading of an SVG attribute and every check compares that output against another copy of itself. It was found by rendering a PNG and looking at it, which is what `AGENTS.md` already says to do, and it is now `INFOSCHEMATICS-TOOL-071`.

What I would do differently: the manifest and task-graph edits were made through throwaway scripts to keep the renames atomic and the sort order stable, and that was the right mechanism, but it meant the two files changed shape before the README section documenting them existed. The test was then red for the wrong reason for a while — undocumented commands rather than a real inventory failure — which cost a cycle of reading failures that were not findings. The README section should have been written first.

### Mini recap

The repository's commands are now one list, in one order, written down in one place, and held by one test. Names read owner, then subject, then verb; `GDR-INFOSCHEMATICS-005` says why; `README.md` says what each one is for; and `scripts/command-surface.test.ts` fails if any of that stops being true. Two dead entries are gone, knip has an invoker and honest findings, and the `.ki.toml` dependency hold is now enforced by a check that has been seen to fail. Step 5 is not done, and the reason it is not done turned out to be a defect in the published PNG output rather than anything about the script it was meant to simplify.

## Discussion

### Whether a development command may read another package's source

`scripts/render-example.ts:10-13` imports `../packages/domain-core/src/index.ts`, `../packages/render-svg/src/index.ts`, and `../packages/view-model/src/runtime.ts` — source paths, not package entries. Step 5 would replace those with one call into `@infoschematics/cli`, which is a published entry that only exists after a build. That trades a script that always works on a clean checkout for one that proves the published shape but needs `bun run self:packages:build` first, and `scripts/examples.ts` and `scripts/generate-visual-tokens.ts` read source the same way. The open question is whether the repository wants one rule for all of `scripts/` or a stated exception for the renderer alone, and the answer decides whether step 5 is a simplification or a new build prerequisite in the middle of the example workflow.

### How much is worth doing

The cheapest useful outcome is steps 1 to 4: the inventory test, the two dead entries, and the build seam. Steps 5 and 7 cost considerably more — step 5 changes a rasteriser and so can change output bytes, and step 7 touches every reference in the tree — and pay off only if the Decision Record lands with them. They should be judged separately rather than carried along.
