---
id: INFOSCHEMATICS-BATCH-006
repository: https://github.com/infoschematics/infoschematics
approved: true
approved_at: 2026-09-10T01:35:53Z
authority_mode: outcome
authority_evidence: User instructed Codex to progress as many Infoschematics roadmap items as possible to awaiting-review after pushing both repositories.
approved_payload_sha256: 6315f05dd1f2c1f02d0d91c220a09a63a00d14fe3459b7481db34070a1ecb5b2
run_id: INFOSCHEMATICS-BATCH-006-RUN-001
timebox_ends_at: 2026-09-10T07:35:53Z
item_ids: [INFOSCHEMATICS-TOOL-028]
completion_target: awaiting-review
mandatory_stops: [public-contract-change-outside-plan, destructive-or-irreversible-work, external-coordination, verification-failure, contested-shared-path, moved-head, push-deploy-publish-or-release]
---

# INFOSCHEMATICS-BATCH-006 — Expose SVG artefact identity

## Outcome authority

Progress the next bounded roadmap item supported by the user’s explicit requirement that authored diagram-element IDs be present in SVG. Keep unresolved dynamics, Sequence, CLI, Region-treatment and release work outside this run.

## Selected plans

1. `INFOSCHEMATICS-TOOL-028` — define and implement one collision-safe SVG metadata pair for all six canonical visual element types across Canvas and static SVG.

## Scope

Work only in `https://github.com/infoschematics/infoschematics` and only within the files named by `INFOSCHEMATICS-TOOL-028`. The planning baseline is `843c927ccf0764d8464ea681836c81feb57bf50e`; implementation starts from the committed planning and authorisation state.

## Timebox

This run expires at `2026-09-10T07:35:53Z`.

## Verification

Run the item’s focused Canvas and static-renderer tests, `bun run self:check`, and the roadmap and authoring audits. A failed required gate stops the item unless repair remains inside the approved boundary.

## Decisions and exclusions

The shared attributes are `data-artefact-id` and `data-artefact-kind`; kind values use the canonical six names, including `overlay`. Static SVG retains `data-id` as a compatibility duplicate. Authored IDs never become native SVG `id` values. Diagram root identity, Port identity, child-node structure, dynamics and editor callbacks are excluded. No delegation is authorised.

## Completion and remedial policy

The admitted item may reach `awaiting-review` only through complete implementation evidence. Non-blocking improvements become separately prioritised work rather than widening the renderer contract. Acceptance, pruning, deployment, release and further pushes are excluded.

## Mandatory stops

- Public-contract change outside the selected additive metadata contract.
- Destructive or irreversible work.
- New external coordination.
- Required verification failure that cannot be repaired within the item.
- Contested touched paths or moved `HEAD` that cannot be revalidated safely.
- Any push, deploy, publish, or release.

## Run ledger

<!-- ki-batch-run: INFOSCHEMATICS-BATCH-006-RUN-001 6315f05dd1f2c1f02d0d91c220a09a63a00d14fe3459b7481db34070a1ecb5b2 -->

| Item | Start | Result | Evidence | Next human action |
| --- | --- | --- | --- | --- |
| `INFOSCHEMATICS-TOOL-028` | ready | awaiting-review | `40d39468` baseline; focused renderer tests, full repository gate and roadmap/authoring audits passed | Review metadata names, compatibility policy and documented exclusions |

## Batch recap

The selected record reached the authorised `awaiting-review` target. Static SVG and Canvas now expose authored identity on all six canonical visual element groups through one collision-safe metadata pair, while static `data-id` and renderer-owned native IDs remain unchanged. The older Graphic vocabulary anchor remains an explicitly recorded documentation follow-up. No acceptance, pruning, deployment, release or post-baseline push was performed.
