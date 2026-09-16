---
id: INFOSCHEMATICS-TOOL-073
area: TOOL
title: Lockfile agrees with the manifests
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 8c2a8c359ec0512820fe5b2bb2f7f0aeec879e4f
created_at: 2026-09-16T13:20:00Z
updated_at: 2026-09-16T21:05:00Z
---

# Lockfile agrees with the manifests

## Goal

Fail the gate when `bun.lock` and the workspace manifests disagree, so a dependency change cannot reach a commit in a state that only a frozen install would reject.

## Context

Found while merging the repository command surface (`INFOSCHEMATICS-TOOL-065`) on 2026-09-16. That item removed `syncpack` from the root `devDependencies` and left `bun.lock` naming it. `bun run self:check` reported 43 of 43 tasks successful on that tree, twice, because every task it runs works from an already-installed `node_modules` and none of them installs anything. The total has since moved — the gate prints 44, and `turbo run --dry` resolves 55 task ids in the graph of which 44 carry a command — so treat the number as dated rather than as something to reproduce. `bun install --frozen-lockfile` on the same tree failed outright: "lockfile had changes, but lockfile is frozen".

That is the shape worth fixing rather than the single stale entry. A frozen install is what continuous integration and the release workflow do, so the disagreement is invisible locally and fatal remotely — the gate is green exactly where it matters least.

Repaired in place at merge time by running `bun install` and committing the resulting lockfile; `syncpack` now appears in no manifest and in no lockfile entry, and a frozen dry-run install completes clean.

No test would have caught it. `bun.lock` is not unwatched, though: `turbo.json:99` already declares it in the `inputs` of `//#self:scripts:test`, so that task reruns when the lockfile moves. Nothing under `scripts/` reads the lockfile, so the rerun observes nothing — which is the gap, and which also means step 2 is extending an existing `inputs` declaration rather than inventing one.

## Boundary

One check and its placement. This item does not change dependency versions, does not adopt a version-agreement tool to replace the one just removed, and does not alter how installs happen in the workflows.

## Steps

1. [x] Decide where the check belongs. A `//#` root task in `turbo.json` is the obvious home, but an install-shaped check has to be honest about cost and network: `bun install --frozen-lockfile --dry-run` is the candidate to measure first. Verifiable by the recorded timing of the candidate on a warm and a cold cache.
2. [x] Add the check to `bun run self:check` in whatever form step 1 settles, declaring `bun.lock` and every `package.json` in its `inputs` so it replays only when one of them moves. Verifiable by editing a manifest and watching the task rerun rather than replay.
3. [x] Prove it red the way it actually broke: remove a dependency from a manifest without touching the lockfile and watch the check fail. Verifiable by that failure, not by the check passing.
4. [x] State in the releasing guide _why_ a frozen install is the remote contract. `docs/guides/releasing-packages.md:22` already carries the command; what is missing is the consequence of the lockfile disagreeing, so the reason the check exists survives the person who added it.

## Files touched

- `turbo.json`
- `package.json`
- `docs/guides/releasing-packages.md`
- possibly a small script under `scripts/`, if the check needs more than one command

## Verify

- `bun run self:check` passes, and fails on a manifest edited without its lockfile.
- `bun install --frozen-lockfile` agrees with the new check on the same tree, since the check exists to predict it.

## Dependencies / blocks

None. Independent of everything else on the board, and cheap.

## Documentation impact

### Specifications

None. No requirement in the corpus governs repository tooling or the gate's task list, and this item does not propose adding one — the gate is proved by running, not by being specified.

### Decision Records

None. Adding a task to `self:check` is a gate change the commit records; it settles no contested question.

### Guides

`docs/guides/releasing-packages.md` already prints `bun install --frozen-lockfile` at `:22` as the first line of the release sequence. It gains the reason — what an unfrozen install would have let through — so a reader who skips the line knows what they are skipping.

## Review

### Delivered

The approved boundary held: one check, its placement, and the reason it exists. Dependency versions are unchanged, nothing replaced the `syncpack` version-agreement role the command-surface item removed, and no workflow's install behaviour changed.

Immutable baseline: `f4ac2deaefd8ebf38df1e84eba422f9fd5630280`. Delivered under `INFOSCHEMATICS-BATCH-018` (`authority_mode: outcome`, `completion_target: awaiting-review`), so this record carries delivery evidence only and acceptance remains separately approved.

### Summary of changes

- `package.json` — added `"self:lockfile:verify": "bun install --frozen-lockfile --dry-run"` and placed it first in `self:check`, so the cheapest check that can invalidate everything downstream runs before the gate spends time on builds and suites.
- `turbo.json` — added `//#self:lockfile:verify` declaring `bun.lock`, `package.json`, `packages/*/package.json`, `apps/*/package.json`, and `examples/*/package.json` as its `inputs`. Those are exactly the files a frozen install reads, so the task replays only when one of them moves.
- `docs/guides/releasing-packages.md` — added the consequence paragraph beside the existing `bun install --frozen-lockfile` line: the frozen install is the contract with every machine that is not this one, a manifest edit that never reached `bun.lock` builds here and breaks there, and the first sign of it would otherwise be a failed protected publish.
- `README.md` and `scripts/command-surface.test.ts` — an approved deviation, taken because the new script failed the repository's own command-surface convention two ways. The `### Command surface` subject table gained a `lockfile` row, because an undocumented root script is indistinguishable from a dead one. The command parser gained `install` alongside the `update` case it already carried: both act on the dependency tree itself rather than naming a file target, and without that the parser reported `self:lockfile:verify: no file install`. The item's plan anticipated "possibly a small script under `scripts/`"; this is that allowance spent on a test's parser rather than a new command.

Material decision — step 1 settled on a `//#` root task rather than a script wrapper or a workflow-only check, on measurement rather than assumption: `bun install --frozen-lockfile --dry-run` runs in 85 ms and 64 ms on a warm cache, 71 ms against an isolated cold cache (`BUN_INSTALL_CACHE_DIR=$(mktemp -d)`, so bun's shared global cache was never cleared), and 66 ms with `--no-cache`. It needs no network. A check that costs under a tenth of a second on the worst cache state it can meet does not need its own script, and a root task is where a repository-spanning check belongs.

### Verification

- `bun run self:check` — `45 successful, 45 total` (`43 cached, 45 total`), exit 0. The gate total moved 44 → 45 with the new task, which is the visible proof it joined the gate rather than sitting beside it.
- Step 2's `inputs` proved load-bearing rather than assumed: a distinct probe key added to `packages/domain-core/package.json` produced `0 cached, 1 total`; restoring it returned `1 cached, 1 total >>> FULL TURBO`. A repeated identical probe would have replayed from cache and read as a false negative, so the probe value was made distinct.
- Step 3's red proof reproduced the original breakage exactly: `rumdl` deleted from the root `devDependencies` with `bun.lock` untouched gave `error: lockfile had changes, but lockfile is frozen` and turbo reported `Failed: //#self:lockfile:verify`, `0 successful, 1 total`. `package.json` was restored from a copy taken immediately before, and `git diff` confirms the restoration.
- The first full gate run failed honestly before those fixes landed — `scripts/command-surface.test.ts` reported `2 failed`, naming `self:lockfile:verify` as both an unreachable target and an undocumented script. That failure is recorded here rather than erased, because it is the check that caught this item's own omission.

### Outstanding concerns

None blocking. One thing observed and not acted on: `turbo.json:99` still declares `bun.lock` in the `inputs` of `//#self:scripts:test`, which now has a second task genuinely reading the lockfile beside it. Nothing under `scripts/` reads `bun.lock`, so that declaration buys a rerun that observes nothing; removing it is a separate tidy, not this item's business, and leaving it costs only a redundant rerun.

### Post-change review

Goal met at the level stated: the gate now fails where it previously passed, on the exact tree shape that broke. Scope held — no version moved, no tool was adopted to replace `syncpack`, no workflow changed. Regression risk is low and bounded by the check's own nature: it is a dry run, so it writes nothing, and the worst failure mode is a false red when `bun.lock` is legitimately mid-update, which is the state the check exists to name. The `inputs` declaration is the one place this could rot, and it was proved by editing a manifest rather than by reading the list. Acceptance readiness: ready for review; the red proof, the green gate, and the cache-replay proof are all reproducible from the commands recorded above.

### Mini recap

Delivered a frozen-install check into `self:check` with honest `inputs`, proved it red the way the repository actually broke, and wrote down why the frozen install is the remote contract. Verified by a green 45-task gate plus a distinct-probe cache proof. No concerns beyond a redundant `bun.lock` input on `//#self:scripts:test`.

Two learnings worth a route rather than automatic promotion. First: a repeated identical cache probe reads as a false negative, because turbo legitimately replays a tree state it has already seen — probe with a distinct value. Second: the command-surface test is a real gate on new root scripts, not a formality, and a new script should expect to owe it a README row and possibly a parser case; that is worth a sentence in the README's command-surface section if it catches a third contributor the same way.

## Discussion

The command surface item also removed `syncpack`, whose purpose was version agreement across manifests. Whether anything should replace it is a separate question from this one: this item is about the lockfile agreeing with the manifests it locks, not about the manifests agreeing with each other.
