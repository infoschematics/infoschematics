---
id: INFOSCHEMATICS-BATCH-007
repository: https://github.com/infoschematics/infoschematics
approved: true
approved_at: 2026-09-13T16:39:58Z
authority_mode: outcome
authority_evidence: User instructed Codex to autonomously get all discussed website changes running, keep going, and delegate as much as appropriate.
approved_payload_sha256: 2d365a27ff822a4965aaed0348e7a37efb90f9b77b299d81c1d6b748ea1dee4b
run_id: INFOSCHEMATICS-BATCH-007-RUN-001
timebox_ends_at: 2026-09-13T22:39:58Z
item_ids: [INFOSCHEMATICS-TOOL-038]
completion_target: awaiting-review
mandatory_stops: [public-contract-change-outside-plan, destructive-or-irreversible-work, external-coordination, verification-failure, contested-shared-path, moved-head, push-deploy-publish-or-release]
---

# INFOSCHEMATICS-BATCH-007 — Enable inline SVG integration

## Outcome authority

Deliver the reusable inline-SVG host boundary needed by the requested homepage pathways. Keep authored definitions inert, preserve renderer ownership, and leave product-specific navigation to the later Site item.

## Selected plans

1. `INFOSCHEMATICS-TOOL-038` — specify and implement safe same-document SVG insertion, scoped artefact-event resolution, lifecycle cleanup, and accessible host equivalents around trusted static-renderer output.

## Scope

Work only in `https://github.com/infoschematics/infoschematics` and within the files named by `INFOSCHEMATICS-TOOL-038`, using the current canonical specification paths after the repository specification migration. The implementation baseline is `5b2d9f718f8087247a037fef205b16bd82dc7c02`.

## Timebox

This run expires at `2026-09-13T22:39:58Z`.

## Verification

Run focused static-renderer and Site inline-host tests, the production Site build, `bun run self:check`, and the roadmap, specification, and authoring audits. Browser-check two inline diagrams with repeated authored IDs, pointer resolution, keyboard-equivalent controls, replacement, and unmount cleanup.

## Decisions and delegation

The only accepted inline markup source is `renderInfoschematicSvg`. Queries and listeners stay scoped to one host container and resolve only the nearest outer `data-artefact-id` and `data-artefact-kind` group. Native SVG IDs, child structure, CSS classes, and DOM mutation are not public editing contracts. Bounded implementation and review lanes may be delegated; the primary agent retains integration, lifecycle state, verification, and the final account.

## Excluded candidates

- `INFOSCHEMATICS-SITE-016` remains excluded until this prerequisite has landed and its block can be cleared honestly.
- `INFOSCHEMATICS-SITE-019` remains excluded because the reusable lossless YAML and Studio source-panel capabilities have not landed.
- `INFOSCHEMATICS-TOOL-033` and `INFOSCHEMATICS-TOOL-043` remain non-Site dependency work for the other repository lane.

## Completion and remedial policy

The admitted record may reach `awaiting-review` only through complete implementation evidence. Non-blocking improvements become separately prioritised work rather than widening the renderer, authored-data, or Site ownership boundaries. Acceptance, pruning, push, deployment, publication, and release are excluded.

## Mandatory stops

- Public-contract change outside the selected additive inline-integration contract.
- Destructive or irreversible work.
- New external coordination.
- Required verification failure that cannot be repaired within the item.
- Contested touched paths or moved `HEAD` that cannot be revalidated safely.
- Any push, deploy, publish, or release.

## Run ledger

<!-- ki-batch-run: INFOSCHEMATICS-BATCH-007-RUN-001 2d365a27ff822a4965aaed0348e7a37efb90f9b77b299d81c1d6b748ea1dee4b -->
