---
id: INFOSCHEMATICS-BATCH-004
repository: https://github.com/infoschematics/infoschematics
approved: true
approved_at: 2026-09-08T17:51:13Z
authority_mode: outcome
authority_evidence: User asked Codex to progress as much roadmap work as possible on comprehensive Getting Started, visual-guide, current-feature, and decision-record documentation during the next half hour.
approved_payload_sha256: f1a7d8ce92d93c915f3e1d67de12e9587e92792eb74670623033aa295a476e35
run_id: INFOSCHEMATICS-BATCH-004-RUN-001
timebox_ends_at: 2026-09-08T18:31:13Z
item_ids: [INFOSCHEMATICS-SITE-011, INFOSCHEMATICS-TOOL-027]
completion_target: awaiting-review
mandatory_stops: [public-contract-change, destructive-or-irreversible-work, external-coordination, verification-failure, touched-path-overlap, new-staged-path, moved-head, push-deploy-publish-or-release]
---

# INFOSCHEMATICS-BATCH-004 — Refresh the public documentation

## Outcome authority

Deliver as much of the current comprehensive-documentation outcome as the timebox and clean verification permit. Keep the visual guide about diagram output, not Studio or editorial interfaces. Stop both records at evidence-backed `awaiting-review` for the user's return and review.

## Selected plans

1. `INFOSCHEMATICS-SITE-011` — restructure Getting Started and the visual guide around visible anatomy, groupings, treatments, and live output controls.
2. `INFOSCHEMATICS-TOOL-027` — reconcile the completed guide with vocabulary, public documentation, Site navigation, and concise current decision records.

## Scope

Work only in `https://github.com/infoschematics/infoschematics` and only on files declared by the two selected records plus this authorisation. No product behaviour, public TypeScript contract, deployment, release, or push is authorised.

## Shared working tree

Expected `HEAD` is `532cdbfcb4d1a762b70500f65ed11b06ac6ddfe2`. The tree is clean and no pre-existing staged or unstaged paths were observed at authorisation.

## Timebox

Work until `2026-09-08T18:31:13Z`. Prefer a complete, verified SITE-011 delivery over a broad unfinished sweep. TOOL-027 may proceed only after SITE-011 review evidence is complete and current `HEAD` and touched paths are revalidated.

## Verification

Each item must pass its stated focused checks and `bun run self:check`. Documentation must pass the configured `ki-authoring` audit. Any failed required gate stops the affected item without weakening the check.

## Decisions and exclusions

The run may make non-contentious information-architecture, prose, specimen, and local test-structure decisions within the approved records. It must stop for a new product concept, public contract, architectural ownership change, destructive action, external coordination, or decision-record change that alters rather than clarifies governing policy.

No delegation is authorised. Acceptance, pruning, deployment, release, and push are excluded.

## Completion and remedial policy

Admitted items may reach `awaiting-review` only through their own complete implementation evidence. Non-blocking follow-ups are recorded in the relevant review packet or a separately prioritised work item; they do not silently broaden this run.

## Run ledger

<!-- ki-batch-run: INFOSCHEMATICS-BATCH-004-RUN-001 f1a7d8ce92d93c915f3e1d67de12e9587e92792eb74670623033aa295a476e35 -->

| Item | Start | Result | Evidence | Next human action |
| --- | --- | --- | --- | --- |
| INFOSCHEMATICS-SITE-011 | ready | awaiting-review | `532cdbfc` baseline; `3102a8c5` delivery; full gate and visual checks pass | Review guide flow and representative controls |
| INFOSCHEMATICS-TOOL-027 | ready | awaiting-review | `3102a8c5` baseline; full gate, Markdown, authoring, citation, and decision sweeps pass | Review documentation voice and decision concision |

## Batch recap

Both selected records reached the authorised `awaiting-review` target. SITE-011 replaced the specimen wall with a structured guide to anatomy, groupings, treatments, and presentation-state boundaries, with every authored appearance option interactive. TOOL-027 added stable vocabulary anchors and citations, reconciled public navigation and YAML-first format wording, and reviewed every decision record, tightening the four that retained obsolete or volatile material.

During SITE-011, `HEAD` advanced from `532cdbfc` to `4a59f0b3` through a user-owned two-value global page-inset change in `apps/site/src/styles.css`. The exact overlap was inspected, found independent of the new guide rules, and retained before the run continued. No other staged or dirty paths were present.

Required gates pass. No public TypeScript contract, renderer behaviour, deployment, release, push, acceptance, or pruning was performed.
