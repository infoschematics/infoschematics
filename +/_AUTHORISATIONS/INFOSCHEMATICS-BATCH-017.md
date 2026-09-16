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

## Decision-record numbers

Three items in this batch each name "the next free number after `ADR-INFOSCHEMATICS-027`", so concurrent delivery would have two of them writing the same record. The numbers are allocated here instead, and each agent is told its own:

- `ADR-INFOSCHEMATICS-028` — `TOOL-066`, the panel-visibility decision.
- `ADR-INFOSCHEMATICS-029` — `TOOL-059`, the held-emphasis authored surface. `TOOL-060` extends that same record rather than opening another; its own record already says the surface decision is taken once for both.
- `ADR-INFOSCHEMATICS-030` — `TOOL-057`, the composition-constraint siting instrument.

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
| INFOSCHEMATICS-TOOL-064 | 1 | Awaiting review | First-rule duplicate caught; cite gate red when staled | Accept after a look |
| INFOSCHEMATICS-TOOL-065 | 1 | Awaiting review | Hold check and README check proven red; stale lockfile repaired | Accept; 7 of 8 steps |
| INFOSCHEMATICS-TOOL-066 | 2 | Awaiting review | Dock open on Design seen in a PNG; sticky-tab case red | Accept; clipping in `076` |
| INFOSCHEMATICS-TOOL-058 | 2 | Awaiting review | Ids scoped per rendering; gate 43/43 with `064` landed | Accept; arrowheads in `071` |
| INFOSCHEMATICS-TOOL-069 | 3 | Awaiting review | Steering case red 240/240 with the cleanup removed | Accept; 6 of 7 steps |
| INFOSCHEMATICS-TOOL-059 | 3 | Awaiting review | Reduced-motion restatement proven red; gate 44/44 | Accept; `079`/`080` parked |
| INFOSCHEMATICS-TOOL-060 | 3 | Awaiting review | Mark's removal proven red; region fold output-identical | Accept; all ten steps |
| INFOSCHEMATICS-TOOL-063 | 3 | Awaiting review | Widened target red in one case; endpoint cascade red | Accept; guide gap `SITE-028` |

## Findings held for a later wave

Captured, not admitted to this batch. Fifteen records so far: `TOOL-071` and `TOOL-072` from looking at the rasterised output, `TOOL-073` from the lockfile the command rename left stale, five from the wave-two recheck (`TOOL-074` through `TOOL-078`), four from wave three — `TOOL-079`, `TOOL-080`, `TOOL-081` and `SITE-027` — and three from `TOOL-063`: `SITE-028` for the guide follow-up its own record asked for and could not create, plus `TOOL-082` and `TOOL-083`. Each was parked by the item that found it rather than absorbed into it.

`TOOL-074` deserves the owner's attention before the remaining waves, and it is the one finding here that bears on this batch's own evidence. The dependency-boundary check reports `0 modules, 0 dependencies cruised`: dependency-cruiser cannot parse TypeScript 7, so it passes by examining nothing. `AGENTS.md` claims `bun run self:check` verifies dependency boundaries, and it has not done so since the TypeScript upgrade — which means every green in this run, including the 43/43 gates cited above, asserts a boundary guarantee it did not test. Nothing else in the gate is affected, and no delivered item in this batch is known to cross a boundary; the claim is simply unproven rather than false.
