---
id: INFOSCHEMATICS-TOOL-127
area: TOOL
title: Missing decision serial
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-22T12:10:00Z
updated_at: 2026-09-22T17:30:00Z
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

## Current state

`ADR-INFOSCHEMATICS-030` does not exist and never did: nothing in the Git history added or deleted such a file, and no document in the corpus cites it, so the gap is an issuing slip rather than a lost record. `ki repo audit --skill ki-decision-records` therefore reports `WARN · Serial series is missing 030` on every run and will go on doing so.

`.ki.toml` carries a `[skills.ki-decision-records]` table but no mechanism for accepting a serial exception, and `docs/decisions/README.md` is the index rather than a place exceptions live. So "accept the gap" currently has nowhere to be written except a commit message, which is where it sits today (`8c413f1c`) and which no reader of the audit will find.

## Steps

- [ ] Choose among the three options, and record the reasoning wherever the choice lands. Renumbering `ADR-031` through `ADR-042` breaks every citation across specs, guides, roadmap records and code comments, and is the least likely to be right. Issuing `ADR-INFOSCHEMATICS-030` for a decision that genuinely wants writing fills the slot honestly if such a decision exists. Accepting the gap needs somewhere durable for the acceptance to live.
- [ ] If the answer is acceptance, find out whether `ki-decision-records` supports a declared exception in `.ki.toml`; if it does not, that is a question for the standard rather than a reason to leave a permanent warning, and the acceptance goes in `docs/decisions/README.md` where the next reader will meet it.
- [ ] Confirm the audit afterwards reports either nothing or a warning the repository has explicitly accepted.

## Files touched

`docs/decisions/README.md`, `.ki.toml` if a declared exception is available, and a new `docs/decisions/ADR-INFOSCHEMATICS-030-*.md` only if the chosen answer is to issue one.

## Verify

`ki repo audit --skill ki-decision-records` clean, or warning only where the repository has recorded the acceptance. `bun run ki:lint:md` for whichever document gains the prose.

## Dependencies / blocks

Nothing blocks it and it blocks nothing.

## Documentation impact

### Decision Records

Possibly one, if the chosen answer is to issue `ADR-INFOSCHEMATICS-030` for a decision that wants writing. The index in `docs/decisions/README.md` changes under any option.

### Specifications

None.

### Guides

None.

### Roadmap

Nothing follows. If `ki-decision-records` has no way to accept a known gap, raising that upstream is its own record in the harness repository, not here.

## Discussion

Captured on 2026-09-22 after the five misnamed decision records were renamed and this was the one finding that did not clear. It was already investigated once: the history search and the corpus search that established "never issued" are the evidence, and re-running them is the waste this record exists to prevent.

### Adoption

Adopted into Now on 2026-09-22 while shaping the queue before a pause, on the grounds that a permanent warning is a cost the repository pays on every audit run and the investigation behind it is already done.
