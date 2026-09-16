---
id: INFOSCHEMATICS-TOOL-075
area: TOOL
title: Example generator inputs
theme: tool
horizon: now
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 8c2a8c359ec0512820fe5b2bb2f7f0aeec879e4f
created_at: 2026-09-16T13:55:00Z
updated_at: 2026-09-16T20:45:00Z
---

# Example generator inputs

## Goal

Declare what the example-generation check actually reads, so it cannot replay a green that a change to its real input has already invalidated.

## Context

Found on 2026-09-16 while delivering scoped renderer definition identity (`INFOSCHEMATICS-TOOL-058`). `scripts/examples.ts:4` imports `parseInfoschematic` and `formatInfoschematicIssue` from `../packages/domain-core/src/index.ts`, and neither that path nor `packages/domain-model/src/**` — which `domain-core` re-exports and imports throughout (`packages/domain-core/src/index.ts:1`, `define.ts:1`) — is among the `inputs` of `//#self:examples:verify` at `turbo.json:73-75`. [The repository guidance](../../AGENTS.md) names this failure mode exactly: "a task whose `inputs` miss a file it actually reads will report a green it did not earn."

The sibling task in the same file already gets this right: `//#self:schema:verify` declares `packages/domain-core/src/**` (`turbo.json:65`) and `packages/domain-model/src/**` (`turbo.json:67`) because its generator reads them the same way. The declaration to copy is next door.

Pre-existing rather than introduced. Small, mechanical, and worth doing because the same class of miss was just proved live in two other tasks during the same batch.

## Boundary

The `inputs` declaration and its proof. No change to the generator, the examples, or the check's behaviour.

## Steps

1. [x] Prove the miss the way `AGENTS.md` prescribes: edit `packages/domain-core/src/index.ts` and watch `bunx turbo run self:examples:verify` replay from cache rather than rerun. Verifiable by `FULL TURBO` on a tree whose real input just changed.
2. [x] Add the paths the generator genuinely reads to that task's `inputs` — `packages/domain-core/src/**` and `packages/domain-model/src/**`, matching `//#self:schema:verify` — then repeat step 1 and watch it rerun. Verifiable by `0 cached` after the same edit.
3. [x] Sweep the other `//#` root tasks for the same class of miss while the reasoning is fresh, and report what is found rather than fixing it here unless the fix is the same one line. Verifiable by the recorded list.

## Files touched

- `turbo.json`

## Verify

- `bunx turbo run self:examples:verify` reruns after an edit to any declared input and replays when nothing it reads has moved.
- `bun run self:check` passes.

## Dependencies / blocks

None.

## Documentation impact

### Specifications

None. Task inputs are not a product contract.

### Decision Records

None.

### Guides

None. `AGENTS.md:19` already states the rule this item applies — "a task whose `inputs` miss a file it actually reads will report a green it did not earn. Add the file to `inputs` in the same change that makes the task read it, and prove the miss by editing it" — so the guidance is written and only the declaration is behind it. If step 3's sweep finds the same miss in several tasks, that is a finding for a new record, not a new paragraph here.

## Review

### Delivered

The `inputs` declaration and its proof, within the stated boundary: no change to the generator, the examples, or the check's behaviour. Baseline `993988f2960b90a9aadd254fbcd98cbb29f7d4df`. Step 3's sweep found a second task with the same miss and fixed it, which the step expressly permits when the fix is the same one line — it was.

### Summary of changes

`turbo.json` only, two tasks:

- `//#self:examples:verify` gains `packages/domain-core/src/**` and `packages/domain-model/src/**`, matching `//#self:schema:verify` next door.
- `//#self:scripts:typecheck` gains `packages/*/src/**`. This is the sweep's finding: `scripts/` imports ten modules from six packages by source path, so the task typechecks package sources it never declared.

The other five root tasks are clean. `//#self:schema:verify` and `//#self:tokens:verify` already declare what their generators import; `//#self:packages:check-versions` reads only manifests it names; `//#self:boundaries:verify` and `//#self:scripts:test` both declare broadly enough to cover their reads.

### Verification

- **Miss proved before the fix.** An edit to `packages/domain-core/src/index.ts` left `bunx turbo run self:examples:verify` reporting `FULL TURBO` — a replay on a tree whose real input had just changed.
- **Rerun proved after the fix.** The same edit gives `0 cached, 1 total`. A distinct never-before-seen probe string was needed to show this: a repeated probe reproduces a tree state turbo has already cached, so the second attempt legitimately replays. That is a trap worth knowing — it looks exactly like the fix not working.
- **Second miss proved and fixed the same way.** An edit to `packages/view-model/src/tokens.ts` gave `FULL TURBO` from `self:scripts:typecheck` before, `0 cached` after.
- `bun run self:check` — 44 successful, 44 total.

### Outstanding concerns

None. The change is declarative and cannot alter what any check concludes, only whether it is entitled to skip.

### Post-change review

Goal met: neither task can now replay a green invalidated by a change to something it reads. Scope held — one file, two declarations. Regression risk is one-directional: over-declaring costs cache hits, never correctness, and `packages/*/src/**` on a typecheck task is honest rather than generous, since that is what `tsconfig.scripts.json` pulls in. Ready for acceptance.

### Mini recap

Two of seven root tasks were reporting greens they had not earned. Both are fixed and both misses were demonstrated before and after, per `AGENTS.md:19`. The learning worth keeping is the verification trap, not the fix: proving an `inputs` miss requires a probe the cache has never seen, or a warm cache will replay a genuinely-changed tree and look like a failed fix. `INFOSCHEMATICS-TOOL-073` and `INFOSCHEMATICS-TOOL-074` are the same family and follow in this batch.

## Discussion

Worth pairing with `INFOSCHEMATICS-TOOL-074` in one sitting: both are the same failure in different clothing — a check reporting a result it did not earn — and the sweep in step 3 is the cheap half of that item's vacuity argument.
