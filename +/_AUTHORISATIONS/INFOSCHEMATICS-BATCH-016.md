---
id: INFOSCHEMATICS-BATCH-016
repository: https://github.com/infoschematics/infoschematics
approved: true
approved_at: 2026-09-15T05:45:00Z
authority_mode: outcome
authority_evidence: User instructed "lets get on with batch as I'm off back to bed" after agreeing the sequence of applying all roadmap items before a manual walkthrough test.
approved_payload_sha256: 97edc0111a9abecc2da90b3a1bd8c5f330d6c4607dfe0dda6399bc09ab692cfe
run_id: INFOSCHEMATICS-BATCH-016-RUN-001
timebox_ends_at: 2026-09-15T13:45:00Z
item_ids:
  [
    INFOSCHEMATICS-TOOL-050,
    INFOSCHEMATICS-TOOL-051,
    INFOSCHEMATICS-TOOL-054,
    INFOSCHEMATICS-TOOL-047,
    INFOSCHEMATICS-TOOL-048,
    INFOSCHEMATICS-TOOL-049,
    INFOSCHEMATICS-TOOL-055,
    INFOSCHEMATICS-TOOL-045,
    INFOSCHEMATICS-TOOL-046,
    INFOSCHEMATICS-TOOL-052,
  ]
completion_target: awaiting-review
mandatory_stops:
  [
    public-contract-change-outside-plan,
    destructive-or-irreversible-work,
    external-coordination,
    verification-failure,
    contested-shared-path,
    unsafe-moved-head,
    push-deploy-publish-or-release,
  ]
---

# Roadmap consolidation batch

## Authority

Outcome authority covers delivering the ten dependency-ready `TOOL` records in `https://github.com/infoschematics/infoschematics` through `awaiting-review`, during an unattended overnight window.

The target is `awaiting-review`, not `done`. The human's stated plan is to apply the roadmap and then walk the result through by hand; that walkthrough is their review, so consolidated acceptance is not granted here.

## Exact scope

The canonical plan of each named item, and only the files those plans name.

Excluded and why:

- `INFOSCHEMATICS-TOOL-023` — `draft` and blocked by `TOOL-055`. It can only be readied once `TOOL-055` lands, and readying mid-run is outside this envelope.
- `INFOSCHEMATICS-TOOL-041` — `waiting-for` on an external condition.
- `INFOSCHEMATICS-TOOL-056` and `INFOSCHEMATICS-TOOL-057` — captured to `triage` and never adopted. Adoption needs explicit human approval.

## Order

Sequenced for unattended risk rather than for a supervised run:

1. `TOOL-050` — decision only, no product code.
2. `TOOL-051` — additive browser suite.
3. `TOOL-054` — example packages.
4. `TOOL-047`, `TOOL-048`, `TOOL-049` — CLI cluster, in that order; `049` reuses the watch primitive from `048`.
5. `TOOL-055` — Diagram Dynamics.
6. `TOOL-045`, then `TOOL-046` — the contended Design surface, sequenced and not interleaved.
7. `TOOL-052` — dependency majors, alone and last.

`TOOL-052` was previously recommended first, on the reasoning that a smaller migration is easier and everything else would then build on the final toolchain. That reasoning assumed supervision. Unattended, the TypeScript 7 native-port migration touching all thirteen typecheck projects is the item most likely to fail in a way that blocks the other nine, so it goes last: a failure there costs one item rather than ten.

## Timebox

This run expires at `2026-09-15T13:45:00Z`.

## Completion target

Each named item at `awaiting-review` with a six-heading review packet. No item is accepted or pruned by this run.

## Mandatory stops

- Public-contract changes outside a ready plan, or other irreversible work.
- External coordination or repository writes outside exact scope.
- Failed required verification that cannot be repaired within the item.
- A contested shared path or unsafe moved `HEAD`.
- Any push, deploy, publish or release.

## Run ledger

<!-- ki-batch-run: INFOSCHEMATICS-BATCH-016-RUN-001 97edc0111a9abecc2da90b3a1bd8c5f330d6c4607dfe0dda6399bc09ab692cfe -->

| Item                      | Start   | Result  | Evidence | Next human action |
| ------------------------- | ------- | ------- | -------- | ----------------- |
| `INFOSCHEMATICS-TOOL-050` | `ready` | `awaiting-review` | `ADR-INFOSCHEMATICS-021`; `CLI-004` retained unchanged | Review the decision |
| `INFOSCHEMATICS-TOOL-051` | `ready` | `awaiting-review` | `DESIGN-017`; host-fixture browser suite; found `TOOL-058` | Review the suite and the captured defect |
| `INFOSCHEMATICS-TOOL-054` | `ready` | `awaiting-review` | YAML-first example packages; `ADR-INFOSCHEMATICS-022`, `ADR-INFOSCHEMATICS-023`; clean-copy case in the release smoke | Copy an example out and try it |
| `INFOSCHEMATICS-TOOL-047` | `ready` | `awaiting-review` | `--format png` with `--scale` and pinned `--font`; `ADR-INFOSCHEMATICS-024`; `CLI-006`, `CLI-007`, amended `CLI-005`; byte-identical raster proven from a packed consumer | Render a PNG and check it; decide whether transparent output is wanted, since `--background` was dropped as a no-op |
| `INFOSCHEMATICS-TOOL-048` | `ready` | `awaiting-review` | `--watch` over an injected watch primitive; retained output and recovery; `CLI-008`, `CLI-009`; interrupt status `130` | Leave `--watch` running, break a document, fix it |
| `INFOSCHEMATICS-TOOL-049` | `ready` | pending | —        | —                 |
| `INFOSCHEMATICS-TOOL-055` | `ready` | pending | —        | —                 |
| `INFOSCHEMATICS-TOOL-045` | `ready` | pending | —        | —                 |
| `INFOSCHEMATICS-TOOL-046` | `ready` | pending | —        | —                 |
| `INFOSCHEMATICS-TOOL-052` | `ready` | pending | —        | —                 |
