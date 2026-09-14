---
id: INFOSCHEMATICS-BATCH-009
repository: https://github.com/infoschematics/infoschematics
approved: true
approved_at: 2026-09-14T02:13:55Z
authority_mode: outcome
authority_evidence: User instructed Codex to progress all in-progress and ready TOOL roadmap items autonomously.
approved_payload_sha256: 4219c6862fc6d9a97f17a08ab50ade8cd7935fa86e97224dcd2acb0c981b493b
run_id: INFOSCHEMATICS-BATCH-009-RUN-001
timebox_ends_at: 2026-09-14T08:13:55Z
item_ids: [INFOSCHEMATICS-TOOL-037, INFOSCHEMATICS-TOOL-034, INFOSCHEMATICS-TOOL-033, INFOSCHEMATICS-TOOL-014, INFOSCHEMATICS-TOOL-039]
completion_target: awaiting-review
mandatory_stops: [public-contract-change-outside-plan, destructive-or-irreversible-work, external-coordination, verification-failure, contested-shared-path, unsafe-moved-head, push-deploy-publish-or-release]
---

# INFOSCHEMATICS-BATCH-009 — Deliver active Tool work

## Outcome authority

Progress every in-progress or Ready Tool roadmap item autonomously to an evidence-backed awaiting-review state while preserving each approved boundary and established compatibility contract.

## Selected plans

1. `INFOSCHEMATICS-TOOL-037` — finish the Design interaction regression contract already in progress.
2. `INFOSCHEMATICS-TOOL-034` — unify Themes and Stories into canonical Sequences while retaining established-input compatibility.
3. `INFOSCHEMATICS-TOOL-033` — preserve YAML concrete syntax through stable-ID transactional edits after the Sequence contract lands.
4. `INFOSCHEMATICS-TOOL-014` — add explicit serialisable renderer schema-version selection.
5. `INFOSCHEMATICS-TOOL-039` — add opt-in responsive diagram detail resolution.

## Scope

Work only in `https://github.com/infoschematics/infoschematics`, within the files and documentation named by the five selected records. SITE roadmap records and unrelated website work are excluded. The existing `INFOSCHEMATICS-TOOL-037` lifecycle and baseline are retained; each Ready record receives its own immutable start baseline.

## Timebox

This authority expires at `2026-09-14T08:13:55Z`.

## Verification

Run each item’s focused Vitest and package checks, then `bun run self:check` after integration. Visual changes require inspection at the widths or interaction states named by their record.

## Allowed decisions and delegation

Make implementation-level decisions expressly anticipated by each approved plan and record them in that item. Bounded runtime delegation is permitted for disjoint item-owned paths; the primary agent retains lifecycle mutations, integration, shared-file conflict resolution, final gates, and commits.

## Completion

Each selected record stops at `awaiting-review` with completed Steps and the canonical six-heading review packet. Acceptance, pruning, push, deploy, publication, and release remain outside this run.

## Mandatory stops

- A public-contract change outside a selected record’s approved plan.
- Destructive or irreversible work.
- New external coordination.
- A required verification failure that cannot be repaired within the affected item.
- A contested shared path or moved `HEAD` that cannot be revalidated safely.
- Any push, deploy, publish, or release.

## Run ledger

<!-- ki-batch-run: INFOSCHEMATICS-BATCH-009-RUN-001 4219c6862fc6d9a97f17a08ab50ade8cd7935fa86e97224dcd2acb0c981b493b -->
