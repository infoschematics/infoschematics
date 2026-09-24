---
id: INFOSCHEMATICS-BATCH-001
repository: https://github.com/infoschematics/infoschematics
approved: true
approved_at: 2026-09-24T17:00:00Z
authority_mode: reviewed-items
approved_payload_sha256: 4faf588cc6aad819ca7af73a1d6770ade71cd911b82d802003b9f3e167b0d00e
expires_at: 2026-09-25T05:00:00Z
item_ids:
  [
    INFOSCHEMATICS-TOOL-127,
    INFOSCHEMATICS-TOOL-130,
    INFOSCHEMATICS-TOOL-114,
    INFOSCHEMATICS-TOOL-115,
    INFOSCHEMATICS-TOOL-116,
    INFOSCHEMATICS-TOOL-107,
    INFOSCHEMATICS-TOOL-119,
    INFOSCHEMATICS-TOOL-126,
    INFOSCHEMATICS-TOOL-125,
  ]
completion_target: awaiting-review
policy: safe-local-v1
---

# INFOSCHEMATICS-BATCH-001

The nine `ready` Next items, named by the human on 2026-09-24. Each canonical record under `docs/roadmap/` owns its own scope, steps, files, verification and review packet; this record carries only the authority envelope and the run account.

`item_ids` is written in delivery order. The order is dependency-led rather than numeric: `INFOSCHEMATICS-TOOL-130` settles what an authored Card-detail value means against the policy above it, which `INFOSCHEMATICS-TOOL-114` states it cannot be planned without, and `INFOSCHEMATICS-TOOL-116` puts the author-declared promises in place that `INFOSCHEMATICS-TOOL-107` repairs against. The rest are independent and ordered smallest-risk first.

Four items carry a decision inside their own boundary — the serial-gap disposition in `INFOSCHEMATICS-TOOL-127`, the appearance-cascade meaning in `INFOSCHEMATICS-TOOL-130`, the promise subject in `INFOSCHEMATICS-TOOL-116`, and the checker-measurement boundary in `INFOSCHEMATICS-TOOL-125`. Each is the decision its record was opened to settle, so it is inside this authority; anything that turns out to reach past its own record is parked rather than decided.

`INFOSCHEMATICS-TOOL-129` is outside this batch: it is `draft`, not `ready`. `INFOSCHEMATICS-TOOL-130` notes it would rather follow it to avoid migrating the same four documents twice; that is a preference and not a blocker, so `INFOSCHEMATICS-TOOL-130` proceeds and touches only the disclosure switches.

`completion_target: awaiting-review` grants no closure. Every item stops at its review packet for human approval.

## Run ledger

<!-- ki-batch-run: INFOSCHEMATICS-BATCH-001-RUN-001 4faf588cc6aad819ca7af73a1d6770ade71cd911b82d802003b9f3e167b0d00e -->

| Item | Result | Baseline | Result commit | Exception |
| --- | --- | --- | --- | --- |
| INFOSCHEMATICS-TOOL-127 | awaiting-review | `6dfc6d5` | `09d820b` | None |
| INFOSCHEMATICS-TOOL-107 | parked | `09d820b` | — | Where the authoring skill lives is a governance decision this repository has not taken |
| INFOSCHEMATICS-TOOL-130 | awaiting-review | `cfead13` | `28c9bec` | None |
| INFOSCHEMATICS-TOOL-119 | awaiting-review | `28c9bec` | `c2496f11` | None |
| INFOSCHEMATICS-TOOL-126 | awaiting-review | `cfead13` | `1319bd1e` | None |
| INFOSCHEMATICS-TOOL-116 | awaiting-review | `1319bd1e` | `4d172303` | None |
| INFOSCHEMATICS-TOOL-114 | awaiting-review | `1319bd1e` | `acbf5ea3` | None |
| INFOSCHEMATICS-TOOL-115 | awaiting-review | `8dd156a` | `ca0fd536` | None |
| INFOSCHEMATICS-TOOL-125 | awaiting-review | `8dd156a` | `197526e7` | None |

## Run outcome

Eight of the nine items reached `awaiting-review`; `INFOSCHEMATICS-TOOL-107` is parked. `completion_target: awaiting-review` grants no closure, so every delivered record waits on a human review packet and none was moved to `done`.

The aggregate gate ran once, at `197526e7`, on a checkout with one writer in it: `bun run self:check` — `Tasks: 52 successful, 52 total`, exit 0; `bun run ki:lint:md` — no issues in 121 files; `ki repo audit --skill ki-work-roadmap --repo .` — PASS; `ki repo audit --skill ki-decision-records --repo .` — PASS. Every measurement taken while a second agent was writing was discarded in favour of this one.

Four Decision Records were opened against the decisions the items named as theirs to take: ADR-INFOSCHEMATICS-039 (detail is a band of scale), ADR-INFOSCHEMATICS-040 (a document promises what it means), ADR-INFOSCHEMATICS-041 (a link names a part), ADR-INFOSCHEMATICS-042 (share the measurement, never the rule). Their index entries were added by the coordinator, because a shared index is the one file concurrent writers cannot both hold.

### Candidates for a later wave

Found while delivering, admitted to no item:

- `ADR-INFOSCHEMATICS-027` still says the interactive Canvas draws no Point, which `INFOSCHEMATICS-TOOL-126` made untrue. An accepted record, so amending it needs its own authority.
- In a read-only Canvas the `.selected` and `.group-held` treatments are gated behind `.editing`, so an arrival reached under `INFOSCHEMATICS-TOOL-115` is announced and reported but invisible to a sighted reader.
- Two Cards created back to back collapse to one: `createCard` allocates from the authored register, so the second reissues the first's code. Placement is exonerated — the search did consult the pending box.
- The vocabulary reference carries no canonical term for a promise, so prose about one cannot cite a stable id.
- `--detail` is specified in `STATIC-021` rather than beside its siblings in `docs/specs/command-line-rendering.md`.
- The showcase still names no Point for a Dynamic to emphasise.
