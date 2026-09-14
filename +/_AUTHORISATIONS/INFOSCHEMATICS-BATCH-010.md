---
id: INFOSCHEMATICS-BATCH-010
repository: https://github.com/infoschematics/infoschematics
approved: true
approved_at: 2026-09-14T07:04:24Z
authority_mode: outcome
authority_evidence: User asked Codex to complete substantial roadmap work autonomously while they were away and return it for review.
approved_payload_sha256: 889fdab6e888fc01e4d7fd260f38f2f70eb4ecb90bbe7d2393ad7a8f9cd12e8d
run_id: INFOSCHEMATICS-BATCH-010-RUN-001
timebox_ends_at: 2026-09-14T11:04:24Z
item_ids: [INFOSCHEMATICS-TOOL-035]
completion_target: awaiting-review
mandatory_stops: [public-contract-change-outside-plan, destructive-or-irreversible-work, external-coordination, verification-failure, contested-shared-path, unsafe-moved-head, push-deploy-publish-or-release]
---

# INFOSCHEMATICS-BATCH-010 — Canonicalise View internals

## Outcome authority

Deliver the next dependency-ready Tool roadmap item while the user is away, stopping at an evidence-backed review boundary.

## Selected plan

1. `INFOSCHEMATICS-TOOL-035` — make View Model, Canvas, Present, Studio, and static rendering consume the canonical model behind one established-input compatibility boundary.

## Repository and scope

- Repository: `https://github.com/infoschematics/infoschematics`.
- Work item: `docs/roadmap/INFOSCHEMATICS-TOOL-035-canonical-view-internals.md`.
- Implementation scope is limited to the packages, examples, checks, and documentation named by that approved plan.

## Timebox

The run expires at `2026-09-14T11:04:24Z`.

## Verification

Run the item’s focused compatibility, canonical-input, runtime, Canvas, Present, Studio, static SVG, editing, and visual-parity tests, then `bun run self:packages:build` and `bun run self:check`.

## Allowed decisions and delegation

Implementation-level refactors inside the approved canonical-boundary design are allowed. No delegation is authorised for this tightly coupled single-item migration.

## Completion and remedial policy

The item may reach `awaiting-review` only with every planned step complete and the canonical six-heading review packet. Non-blocking improvements become separately captured work rather than silently widening this item.

## Mandatory stops

- Any public-contract change outside the approved plan.
- Destructive or irreversible work.
- External coordination or repository writes.
- Failed required verification.
- A contested shared path or unsafe moved `HEAD`.
- Any push, deploy, publish, or release.

## Run ledger

<!-- ki-batch-run: INFOSCHEMATICS-BATCH-010-RUN-001 889fdab6e888fc01e4d7fd260f38f2f70eb4ecb90bbe7d2393ad7a8f9cd12e8d -->

| Item | Start | Result | Evidence | Next human action |
| --- | --- | --- | --- | --- |
| `INFOSCHEMATICS-TOOL-035` | `in-progress` | `awaiting-review` | Baseline `76fda523`; implementation `1842009f`; `self:check` passed with 644 unit/integration and 13 browser tests | Review canonical runtime parity and the isolated Studio source-edit bridge |

## Batch recap

The selected record reached the authorised `awaiting-review` target. Canonical and established public inputs now converge on one canonical runtime used by Canvas, Present, Studio presentation, and static SVG rendering. Code-like canonical editing identities retain compatibility with established records and attached Flow movement. The final source-edit projection remains explicitly bounded to `INFOSCHEMATICS-TOOL-033`; acceptance, pruning, push, deployment, publication, and release remain outside this run.
