---
id: INFOSCHEMATICS-BATCH-017
repository: infoschematics
mode: outcome
policy: safe-local-v1
completion_target: awaiting-review
authorised_at: 2026-09-16T11:00:00Z
expires_at: 2026-09-16T23:00:00Z
---

# INFOSCHEMATICS-BATCH-017

## Authority

Granted in session on 2026-09-16: the readied roadmap board was presented as three waves with the collisions between items named, and the outcome — complete the readied work — was authorised affirmatively.

The authority is for delivery to review, not for closure. Today's own evidence is the reason: a review packet accepted at face value would have closed `TOOL-064` while its central claim was false and a live stylesheet shadow survived it. Every item in this batch is rechecked independently against the tree before it is offered for acceptance.

## Exact scope

Ten `ready` items, frozen at authorisation:

    INFOSCHEMATICS-TOOL-057,
    INFOSCHEMATICS-TOOL-058,
    INFOSCHEMATICS-TOOL-059,
    INFOSCHEMATICS-TOOL-060,
    INFOSCHEMATICS-TOOL-063,
    INFOSCHEMATICS-TOOL-064,
    INFOSCHEMATICS-TOOL-065,
    INFOSCHEMATICS-TOOL-066,
    INFOSCHEMATICS-TOOL-069,
    INFOSCHEMATICS-TOOL-070

Excluded deliberately:

- `INFOSCHEMATICS-TOOL-023` — blocked on an owner decision about whether a playback policy is authored data. Three delivered artefacts disagree, and no reading of the evidence settles it.
- `INFOSCHEMATICS-TOOL-041` — waiting condition unmet, blocked by `TOOL-070`, and publication is the owner's to authorise.

## Order

Three waves, sequenced by the file collisions the readiness reviews found rather than by priority.

1. `TOOL-070`, `TOOL-065`, `TOOL-064` — disjoint. `TOOL-064` first of the stylesheet work because `TOOL-058` depends on its de-duplication.
2. `TOOL-058`, `TOOL-066`, `TOOL-059` — each needs a wave-one item landed, none collides with another in this wave.
3. `TOOL-063`, `TOOL-060`, `TOOL-057`, `TOOL-069` — `063` after `066`, `060` after `059`, and the last two want the earlier cases to exist.

## Isolation

Each item is delivered by one agent in its own git worktree, so several writers never share a checkout. The lead merges each worktree to `main` and removes it in the same pass. No agent merges its own work, and no agent touches another item's files.

## Completion target

Each named item at `awaiting-review` with a six-heading review packet, plus an independent recheck of that packet against the tree. No item is accepted or pruned by this run.

## Mandatory stops

- Any push, deploy, publish, release or tag.
- Publication of the packages, and any change to a package version.
- Accepting or pruning any work item.
- Material scope expansion, or admitting a remedial finding to this batch — capture it for a later wave instead.
- Failed verification that cannot be repaired inside the item.

## Run ledger

<!-- ki-batch-run: INFOSCHEMATICS-BATCH-017-RUN-001 -->

| Item | Wave | Result | Evidence | Next human action |
| ---- | ---- | ------ | -------- | ----------------- |
| INFOSCHEMATICS-TOOL-070 | 1 | Awaiting review | Guard red with `packages/cli` removed; forced gate 43/43 | Accept, or return |
