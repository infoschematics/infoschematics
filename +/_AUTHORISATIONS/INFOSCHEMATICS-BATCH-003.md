---
id: INFOSCHEMATICS-BATCH-003
repository: https://github.com/infoschematics/infoschematics
approved: true
approved_at: 2026-09-07T21:33:03Z
authority_mode: outcome
authority_evidence: User approved KI-HARNESS-GOV-054 and instructed immediate delegated estate rollout with mechanical work delegated where possible.
approved_payload_sha256: c475c10f4358fb6d22f1ecf791d0941b47873986e8f7a03fdf1b645d9b6468ea
run_id: INFOSCHEMATICS-BATCH-003-RUN-001
timebox_ends_at: 2026-09-08T03:33:03Z
item_ids: [INFOSCHEMATICS-TOOL-022]
completion_target: awaiting-review
mandatory_stops: [public-contract-change, destructive-or-irreversible-work, external-coordination, verification-failure, touched-path-overlap, new-staged-path, moved-head, stylesheet-change, push-deploy-publish-or-release]
---

# INFOSCHEMATICS-BATCH-003 — Adopt repository-owned script naming

## Outcome authority

Deliver the approved Infoschematics receiver portion of GOV-054 through its canonical local roadmap lifecycle. Apply only the locked twelve-script rename and scoped live-reference updates, preserve the other actor's stylesheet, and stop at evidence-backed `awaiting-review`.

## Selected plans

1. `INFOSCHEMATICS-TOOL-022` — rename the twelve specified unclaimed `ki:` scripts to identical `self:` suffixes, update scoped live references, and remove the resulting empty exclusion declaration.

## Scope

Work only in `https://github.com/infoschematics/infoschematics` and only on the exact files named by `INFOSCHEMATICS-TOOL-022`. Do not touch or stage `apps/site/src/styles.css`.

## Shared working tree

Expected receiver `HEAD` is `0dacf9cc2be690520fd8332fc24c49b1a281a80c`. The sole recorded pre-existing dirty path is unstaged `apps/site/src/styles.css`, whose preflight diff SHA-256 is `0b1b698ee54d92e2cedb44f945eb5712a33240b9499100086cfd1976d34a4c9c`; it remains outside the worker's touched-path set. Stop on any new staged path, changed pre-existing diff, touched-path overlap, or unaccounted moved `HEAD`.

## Timebox

This run starts only after the Ready record and SHA-bound authority exist and expires at `2026-09-08T03:33:03Z`.

## Required verification

Verify exact script mapping and configuration semantics; parse changed JSON, YAML, and TOML; search scoped live surfaces for stale former names; run the focused engineering audit, full repository and roadmap audits, `bun run self:check`, `bun run self:release:verify`, and `git diff --check`; confirm the stylesheet diff remains unchanged and unstaged.

## Allowed decisions and delegation

Apply the locked rename mechanically and update only scoped live references. The assigned receiver worker is the sole owner of the approved touched paths during this run; no further delegation, command-design change, or scope inference is authorised.

## Completion and remedial policy

Move `INFOSCHEMATICS-TOOL-022` through `in-progress` to `awaiting-review` only after every required check passes. Closure and pruning are not authorised; any additional concern becomes separate receiver-owned work.

## Mandatory stops

Stop on public-contract change, destructive or irreversible work, external coordination, verification failure, touched-path overlap, a new staged path, moved `HEAD`, any stylesheet change, push, deploy, publish, or release.

## Run ledger

<!-- ki-batch-run: INFOSCHEMATICS-BATCH-003-RUN-001 c475c10f4358fb6d22f1ecf791d0941b47873986e8f7a03fdf1b645d9b6468ea -->

| Item | Start | Result | Evidence | Next human action |
| --- | --- | --- | --- | --- |
| INFOSCHEMATICS-TOOL-022 | ready | awaiting-review | `91e2fae8` to `cb7755cc`; required semantic, audit, executable, stale-reference, and diff gates passed | Review the item delivery packet |

## Batch recap

The single selected item reached the authorised `awaiting-review` target. The twelve repository-owned scripts and scoped live references now use `self:`, the empty exclusion declaration is gone, and all required gates pass. The unrelated `apps/site/src/styles.css` modification remains unchanged and unstaged. Closure, pruning, external action, and push were not performed.
