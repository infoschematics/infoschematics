---
id: INFOSCHEMATICS-BATCH-013
repository: https://github.com/infoschematics/infoschematics
approved: true
approved_at: 2026-09-14T08:34:11Z
authority_mode: outcome
authority_evidence: User asked Codex to complete substantial roadmap work autonomously while they were away and return it for review.
approved_payload_sha256: 701fa83827031c4f684742d4958145009685c08943ec8b01ba30aabd721fab41
run_id: INFOSCHEMATICS-BATCH-013-RUN-001
timebox_ends_at: 2026-09-14T11:34:11Z
item_ids: [INFOSCHEMATICS-TOOL-033]
completion_target: awaiting-review
mandatory_stops: [public-contract-change-outside-plan, destructive-or-irreversible-work, external-coordination, verification-failure, contested-shared-path, unsafe-moved-head, push-deploy-publish-or-release]
---

# INFOSCHEMATICS-BATCH-013 — Complete lossless Sequence editing

## Outcome authority

Complete the dependency-ready remainder of YAML edit preservation while the user is away, stopping at an evidence-backed review boundary.

## Selected plan

1. `INFOSCHEMATICS-TOOL-033` — project canonical Studio Sequence and Scene presentation edits into the versioned source-document protocol.

## Repository and scope

- Repository: `https://github.com/infoschematics/infoschematics`.
- Work item: `docs/roadmap/INFOSCHEMATICS-TOOL-033-preserve-yaml-edits.md`.
- Implementation scope is limited to the remaining presentation projection, its tests, and affected contract documentation.

## Timebox

The run expires at `2026-09-14T11:34:11Z`.

## Verification

Run focused Domain Core, View Model, and Studio source-edit tests, then `bun run self:check` after integration.

## Allowed decisions and delegation

Implementation-level decisions anticipated by the approved plan are allowed. No delegation is authorised for this tightly coupled single-item completion.

## Completion and remedial policy

The item may reach `awaiting-review` only with its final step complete and the canonical six-heading review packet. Non-blocking improvements become separately captured work rather than silently widening this item.

## Mandatory stops

- Any public-contract change outside the approved plan.
- Destructive or irreversible work.
- External coordination or repository writes.
- Failed required verification that cannot be repaired within the item.
- A contested shared path or unsafe moved `HEAD`.
- Any push, deploy, publish, or release.

## Run ledger

<!-- ki-batch-run: INFOSCHEMATICS-BATCH-013-RUN-001 701fa83827031c4f684742d4958145009685c08943ec8b01ba30aabd721fab41 -->

| Item | Start | Result | Evidence | Next human action |
| --- | --- | --- | --- | --- |
| `INFOSCHEMATICS-TOOL-033` | `ready` | `awaiting-review` | Baseline `f2bdeee4`; implementation `9fbcf712`; `self:check` passed with 647 unit/integration and 14 browser tests | Review Direct Sequence editing, stable-ID YAML operations, and host acknowledgement |

## Batch recap

The selected record reached the authorised `awaiting-review` target. Canonical YAML Sequences now populate Studio's Direct editors and return granular, stable-ID document edits without replacing the presentation tree. Expanded and collapsed Sequences preserve independent timing and Callout switches, unexposed Scene fields survive, inserted collapsed Scenes receive deterministic IDs, and an acknowledged host document clears only represented drafts. Acceptance, pruning, push, deployment, publication, and release remain outside this run.
