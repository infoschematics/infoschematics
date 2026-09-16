---
id: INFOSCHEMATICS-TOOL-073
area: TOOL
title: Lockfile agrees with the manifests
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-16T13:20:00Z
updated_at: 2026-09-16T16:49:00Z
---

# Lockfile agrees with the manifests

## Goal

Fail the gate when `bun.lock` and the workspace manifests disagree, so a dependency change cannot reach a commit in a state that only a frozen install would reject.

## Context

Found while merging the repository command surface (`INFOSCHEMATICS-TOOL-065`) on 2026-09-16. That item removed `syncpack` from the root `devDependencies` and left `bun.lock` naming it. `bun run self:check` reported 43 of 43 tasks successful on that tree, twice, because every task it runs works from an already-installed `node_modules` and none of them installs anything. `bun install --frozen-lockfile` on the same tree failed outright: "lockfile had changes, but lockfile is frozen".

That is the shape worth fixing rather than the single stale entry. A frozen install is what continuous integration and the release workflow do, so the disagreement is invisible locally and fatal remotely — the gate is green exactly where it matters least.

Repaired in place at merge time by running `bun install` and committing the resulting lockfile. Nothing in the repository would have caught it.

## Boundary

One check and its placement. This item does not change dependency versions, does not adopt a version-agreement tool to replace the one just removed, and does not alter how installs happen in the workflows.

## Steps

1. [ ] Decide where the check belongs. A `//#` root task in `turbo.json` is the obvious home, but an install-shaped check has to be honest about cost and network: `bun install --frozen-lockfile --dry-run` is the candidate to measure first. Verifiable by the recorded timing of the candidate on a warm and a cold cache.
2. [ ] Add the check to `bun run self:check` in whatever form step 1 settles, declaring `bun.lock` and every `package.json` in its `inputs` so it replays only when one of them moves. Verifiable by editing a manifest and watching the task rerun rather than replay.
3. [ ] Prove it red the way it actually broke: remove a dependency from a manifest without touching the lockfile and watch the check fail. Verifiable by that failure, not by the check passing.
4. [ ] State in the releasing guide that a frozen install is the remote contract, so the reason the check exists survives the person who added it.

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

## Discussion

The command surface item also removed `syncpack`, whose purpose was version agreement across manifests. Whether anything should replace it is a separate question from this one: this item is about the lockfile agreeing with the manifests it locks, not about the manifests agreeing with each other.
