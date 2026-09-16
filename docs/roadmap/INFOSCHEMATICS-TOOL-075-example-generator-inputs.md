---
id: INFOSCHEMATICS-TOOL-075
area: TOOL
title: Example generator inputs
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-16T13:55:00Z
updated_at: 2026-09-16T13:55:00Z
---

# Example generator inputs

## Goal

Declare what the example-generation check actually reads, so it cannot replay a green that a change to its real input has already invalidated.

## Context

Found on 2026-09-16 while delivering scoped renderer definition identity (`INFOSCHEMATICS-TOOL-058`). `scripts/examples.ts` imports `../packages/domain-core/src/index.ts`, and that path is not among the `inputs` of `//#self:examples:verify` in `turbo.json`. [The repository guidance](../../AGENTS.md) names this failure mode exactly: "a task whose `inputs` miss a file it actually reads will report a green it did not earn."

Pre-existing rather than introduced. Small, mechanical, and worth doing because the same class of miss was just proved live in two other tasks during the same batch.

## Boundary

The `inputs` declaration and its proof. No change to the generator, the examples, or the check's behaviour.

## Steps

1. [ ] Prove the miss the way `AGENTS.md` prescribes: edit `packages/domain-core/src/index.ts` and watch `bunx turbo run self:examples:verify` replay from cache rather than rerun. Verifiable by `FULL TURBO` on a tree whose real input just changed.
2. [ ] Add the paths the generator genuinely reads to that task's `inputs`, then repeat step 1 and watch it rerun. Verifiable by `0 cached` after the same edit.
3. [ ] Sweep the other `//#` root tasks for the same class of miss while the reasoning is fresh, and report what is found rather than fixing it here unless the fix is the same one line. Verifiable by the recorded list.

## Files touched

- `turbo.json`

## Verify

- `bunx turbo run self:examples:verify` reruns after an edit to any declared input and replays when nothing it reads has moved.
- `bun run self:check` passes.

## Dependencies / blocks

None.

## Discussion

Worth pairing with `INFOSCHEMATICS-TOOL-074` in one sitting: both are the same failure in different clothing — a check reporting a result it did not earn — and the sweep in step 3 is the cheap half of that item's vacuity argument.
