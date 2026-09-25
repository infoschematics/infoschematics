---
id: INFOSCHEMATICS-TOOL-127
area: TOOL
title: Missing decision serial
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: 6dfc6d5f1060a3b56bfab4f3aec87971ac3248a0
created_at: 2026-09-22T12:10:00Z
updated_at: 2026-09-25T08:50:27Z
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

`ADR-INFOSCHEMATICS-030` exists. `docs/decisions/ADR-INFOSCHEMATICS-030-a-composition-is-its-own-requirement.md` was added by `0ba5df47`, the commit that merged what had been one decision and renumbered the corpus by its narrative, and that renumbering closed the gap this record was opened over. `ki repo audit --skill ki-decision-records --repo .` passes with no warning.

The serial series is contiguous from `001` to `038`. The record's earlier description of the range at risk — `ADR-031` through `ADR-042` — was the count before the renumbering; `042` never existed.

`ki-decision-records` still offers no way to declare an accepted serial exception. `serialEvidence` in the skill's `scripts/rubric/contexts/decision-records.ts` derives the missing set arithmetically from the highest serial in each series and consults no configuration, so `.ki.toml` has nothing to say to it. That does not cost this repository anything now, but it is the reason the third option was never available here.

## Steps

- [x] Choose among the three options, and record the reasoning wherever the choice lands. The choice was made for this record by `0ba5df47`: renumbering the corpus by its narrative, undertaken for its own reasons, issued `030` as a real record and left the series contiguous. Neither of the other two options is needed, and neither leaves a warning behind.
- [x] If the answer is acceptance, find out whether `ki-decision-records` supports a declared exception in `.ki.toml`. It does not: the missing set is derived arithmetically from the highest serial in each series and no configuration is read. The answer here is not acceptance, so nothing has to live in `docs/decisions/README.md`, but the absence is recorded above so the next repository to meet a genuine gap does not investigate it again.
- [x] Confirm the audit afterwards reports either nothing or a warning the repository has explicitly accepted. It reports nothing.

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

## Review

### Delivered

The boundary was records hygiene: make `ki repo audit --skill ki-decision-records` pass without a standing warning, or record an accepted exception. Nothing a user sees was in scope under any option, and nothing a user sees changed.

The goal is met, and it was met before this record was picked up. The delivered work is therefore the verification and the written account, not a change to the corpus: `ADR-INFOSCHEMATICS-030` exists, the series is contiguous, and the audit is clean.

Baseline `6dfc6d5`. No product file changed.

### Change Summary

`docs/roadmap/INFOSCHEMATICS-TOOL-127-missing-decision-serial.md` only.

Three material findings, each replacing a stale claim in the record:

- `ADR-INFOSCHEMATICS-030` exists, added by `0ba5df47` when the corpus was renumbered by its narrative. The record's premise that the serial was never issued was true when written and is not true now.
- The corpus runs to `ADR-INFOSCHEMATICS-038`, not `042`. The range the record described as at risk from renumbering was the pre-renumbering count.
- `ki-decision-records` has no mechanism for a declared serial exception, and the reason is structural rather than an oversight in this repository's configuration: `serialEvidence` derives the missing set from the highest serial in each series and reads no configuration at all.

One deliberate non-change: `docs/decisions/README.md` and `.ki.toml` were both named under Files touched and neither was edited, because the option that would have needed them is not the option that applies.

### Verification

`ki repo audit --skill ki-decision-records --repo .` — PASS, no warnings.

`bun run ki:lint:md` — clean.

No code changed, so no suite was in scope. The aggregate gate runs once at the end of the batch.

### Outstanding concerns

One, and it belongs to another repository. `ki-decision-records` cannot express an accepted serial gap, so a repository that has a genuine one — a record deliberately withdrawn, say — must either renumber or live with a permanent warning. This repository is not in that position and has no reason to force the question, so the concern carries no identifier here.

That is the hand-over this record's Documentation impact anticipated: raising it is its own record in `ki-agentic-harness`, which owns the standard, and that repository currently has another writer in its checkout. It is named here so the next person in the harness can open it; nothing in this repository waits on it.

### Post-change review

The goal is met and the evidence is a clean audit rather than an argument. Scope held: no decision record was written, renumbered, or deleted for this record's sake.

Regression risk is nil — no product file, schema, or test changed.

Acceptance readiness: ready. The thing worth reviewing is not a diff but a judgement, namely that a record whose premise dissolved under it is closed as delivered rather than rejected. The goal it named is satisfied, so `done` is the honest state; `rejected` would say the question was not worth asking, and it was.

### Mini recap

Delivered: verification that the serial gap is closed, and the corrected account of why, written into the record so the investigation is not run a third time.

Verified by the governing skill's own audit, clean.

Concerns: the harness cannot declare an accepted serial gap; no identifier here because this repository does not need one.

Learning route, proposed not promoted: "a record's premise can dissolve between shaping and delivery, and re-grounding before implementing is what catches it" is a general delivery lesson rather than an infoschematics fact. Its owner would be the implementation standard in the harness, not any document here.

## Done

Accepted 2026-09-25 by Kris Brown on the review packet above.

## Discussion

Captured on 2026-09-22 after the five misnamed decision records were renamed and this was the one finding that did not clear. It was already investigated once: the history search and the corpus search that established "never issued" are the evidence, and re-running them is the waste this record exists to prevent.

### Adoption

Adopted into Now on 2026-09-22 while shaping the queue before a pause, on the grounds that a permanent warning is a cost the repository pays on every audit run and the investigation behind it is already done.

### Delivery

Re-grounding before implementation found the gap already closed by `0ba5df47`, a commit made for an unrelated reason. The record had been investigated carefully and was still correct when it was written; what it could not know was that a later renumbering would settle it as a side effect. Nothing was wasted except the assumption that a shaped record still describes the repository.
