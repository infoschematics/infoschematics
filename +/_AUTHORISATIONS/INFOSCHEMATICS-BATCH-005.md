---
id: INFOSCHEMATICS-BATCH-005
repository: https://github.com/infoschematics/infoschematics
approved: true
approved_at: 2026-09-10T01:26:30Z
authority_mode: outcome
authority_evidence: User instructed Codex to progress as many Infoschematics roadmap items as possible to awaiting-review after pushing both repositories.
approved_payload_sha256: 6ae177eec831db0e6e701f8faa264f40f875c7f364bae84e7666c435eea52452
run_id: INFOSCHEMATICS-BATCH-005-RUN-001
timebox_ends_at: 2026-09-10T07:26:30Z
item_ids: [INFOSCHEMATICS-TOOL-036]
completion_target: awaiting-review
mandatory_stops: [public-contract-change-outside-plan, destructive-or-irreversible-work, external-coordination, verification-failure, contested-shared-path, moved-head, push-deploy-publish-or-release]
---

# INFOSCHEMATICS-BATCH-005 — Clarify presentation controls

## Outcome authority

Progress the largest currently executable non-contentious portion of the local roadmap to evidence-backed `awaiting-review`. Keep items with unresolved domain, renderer-contract, release-authority, or animation-model decisions outside this run.

## Selected plans

1. `INFOSCHEMATICS-TOOL-036` — align reusable Present and Studio controls with Architectural Scope and Flow Family semantics, removing unexplained bulk actions while preserving individual selection and initial visibility.

## Scope

Work only in `https://github.com/infoschematics/infoschematics` and only within the files named by `INFOSCHEMATICS-TOOL-036`. The baseline planning state is `07263474f3c9e26038a68e47e2e362a715ba5eb7`; the implementation baseline will be the committed planning and authorisation state.

## Timebox

This run expires at `2026-09-10T07:26:30Z`.

## Verification

Run the item’s focused Vitest command, `bun run self:check`, and the roadmap audit. A failed required gate stops the item unless it can be repaired within the approved boundary.

## Decisions and exclusions

The run may apply the already-agreed naming and removal of trailing show/hide-all controls. It may retain lower-level reducer actions for compatibility but must not introduce a new reset control, change authored models, alter Sequence playback, or widen Scope membership semantics. No delegation is authorised.

Excluded candidates remain in their current lifecycle state: `INFOSCHEMATICS-TOOL-014` needs release authority and compatibility decisions; `INFOSCHEMATICS-TOOL-028` needs a public SVG kind and compatibility decision; `INFOSCHEMATICS-TOOL-034` needs a separately bounded model migration; `INFOSCHEMATICS-TOOL-035` depends on that migration’s direction; the remaining Future items still require model or treatment design.

## Completion and remedial policy

The admitted item may reach `awaiting-review` only through its complete implementation evidence. Non-blocking improvements become separately prioritised work rather than silently widening this run. Acceptance, pruning, deployment, release, and further pushes are excluded.

## Mandatory stops

- Public-contract change outside the selected plan.
- Destructive or irreversible work.
- New external coordination.
- Required verification failure that cannot be repaired within the item.
- Contested touched paths or moved `HEAD` that cannot be revalidated safely.
- Any push, deploy, publish, or release.

## Run ledger

<!-- ki-batch-run: INFOSCHEMATICS-BATCH-005-RUN-001 6ae177eec831db0e6e701f8faa264f40f875c7f364bae84e7666c435eea52452 -->

| Item | Start | Result | Evidence | Next human action |
| --- | --- | --- | --- | --- |
| `INFOSCHEMATICS-TOOL-036` | ready | awaiting-review | `c3b71f0e` baseline; focused tests, package build, full repository gate and roadmap/authoring audits passed | Review terminology, removed bulk controls and expanded desktop layout |

## Batch recap

The selected record reached the authorised `awaiting-review` target. Present and Studio now distinguish Architectural Scopes from Flow Families, expose only individual vocabulary controls, preserve initial all-visible state and retain lower-level compatibility actions. Automated browser control was unavailable, so the review packet explicitly retains desktop visual inspection as the only concern. No acceptance, pruning, deployment, release or post-baseline push was performed.
