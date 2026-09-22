---
id: INFOSCHEMATICS-TOOL-127
area: TOOL
title: Missing decision serial
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T12:10:00Z
updated_at: 2026-09-22T12:10:00Z
---

# Missing decision serial

## Goal

`ki repo audit --skill ki-decision-records` passes without a standing warning, or the warning is one the repository has deliberately accepted and recorded as such.

## Context

The decision-record standard wants a contiguous serial series per prefix. `ADR-INFOSCHEMATICS-030` does not exist: not pruned, never issued. Nothing in the Git history ever added or deleted such a file, and no document in the corpus cites it, so the gap is an issuing slip rather than a lost record.

The audit therefore reports `WARN · Serial series is missing 030` on every run, and will go on doing so. That is the cost worth weighing: a permanent warning trains a reader to ignore the output, which is the failure mode `AGENTS.md` names for checks whose signal stops meaning anything.

Three ways out. Renumber everything above 030, which buys contiguity by breaking every citation to `ADR-031` through `ADR-042` across specs, guides, roadmap records and code comments — the most damaging option and the least likely to be right. Issue `ADR-INFOSCHEMATICS-030` as a real record for a decision that genuinely wants writing, which fills the slot honestly if such a decision exists. Or accept the gap explicitly, which needs somewhere for the acceptance to live so the next reader does not re-investigate it.

## Boundary

A records-hygiene question, not a product one. Nothing a user sees changes under any option.

If the answer is to accept the gap, the acceptance belongs wherever this repository records that kind of exception — not in a commit message, which is where it currently sits (`8c413f1c`).

## Discussion

Captured on 2026-09-22 after the five misnamed decision records were renamed and this was the one finding that did not clear. It was already investigated once: the history search and the corpus search that established "never issued" are the evidence, and re-running them is the waste this record exists to prevent.
