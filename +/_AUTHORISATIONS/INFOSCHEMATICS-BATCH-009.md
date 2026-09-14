---
id: INFOSCHEMATICS-BATCH-009
repository: https://github.com/infoschematics/infoschematics
approved: true
approved_at: 2026-09-14T02:13:55Z
authority_mode: outcome
authority_evidence: User instructed Codex to progress all in-progress and ready TOOL roadmap items autonomously.
approved_payload_sha256: 4219c6862fc6d9a97f17a08ab50ade8cd7935fa86e97224dcd2acb0c981b493b
run_id: INFOSCHEMATICS-BATCH-009-RUN-001
timebox_ends_at: 2026-09-14T08:13:55Z
item_ids: [INFOSCHEMATICS-TOOL-037, INFOSCHEMATICS-TOOL-034, INFOSCHEMATICS-TOOL-033, INFOSCHEMATICS-TOOL-014, INFOSCHEMATICS-TOOL-039]
completion_target: awaiting-review
mandatory_stops: [public-contract-change-outside-plan, destructive-or-irreversible-work, external-coordination, verification-failure, contested-shared-path, unsafe-moved-head, push-deploy-publish-or-release]
---

# INFOSCHEMATICS-BATCH-009 — Deliver active Tool work

## Outcome authority

Progress every in-progress or Ready Tool roadmap item autonomously to an evidence-backed awaiting-review state while preserving each approved boundary and established compatibility contract.

## Selected plans

1. `INFOSCHEMATICS-TOOL-037` — finish the Design interaction regression contract already in progress.
2. `INFOSCHEMATICS-TOOL-034` — unify Themes and Stories into canonical Sequences while retaining established-input compatibility.
3. `INFOSCHEMATICS-TOOL-033` — preserve YAML concrete syntax through stable-ID transactional edits after the Sequence contract lands.
4. `INFOSCHEMATICS-TOOL-014` — add explicit serialisable renderer schema-version selection.
5. `INFOSCHEMATICS-TOOL-039` — add opt-in responsive diagram detail resolution.

## Scope

Work only in `https://github.com/infoschematics/infoschematics`, within the files and documentation named by the five selected records. SITE roadmap records and unrelated website work are excluded. The existing `INFOSCHEMATICS-TOOL-037` lifecycle and baseline are retained; each Ready record receives its own immutable start baseline.

## Timebox

This authority expires at `2026-09-14T08:13:55Z`.

## Verification

Run each item’s focused Vitest and package checks, then `bun run self:check` after integration. Visual changes require inspection at the widths or interaction states named by their record.

## Allowed decisions and delegation

Make implementation-level decisions expressly anticipated by each approved plan and record them in that item. Bounded runtime delegation is permitted for disjoint item-owned paths; the primary agent retains lifecycle mutations, integration, shared-file conflict resolution, final gates, and commits.

## Completion

Each selected record stops at `awaiting-review` with completed Steps and the canonical six-heading review packet. Acceptance, pruning, push, deploy, publication, and release remain outside this run.

## Mandatory stops

- A public-contract change outside a selected record’s approved plan.
- Destructive or irreversible work.
- New external coordination.
- A required verification failure that cannot be repaired within the affected item.
- A contested shared path or moved `HEAD` that cannot be revalidated safely.
- Any push, deploy, publish, or release.

## Run ledger

<!-- ki-batch-run: INFOSCHEMATICS-BATCH-009-RUN-001 4219c6862fc6d9a97f17a08ab50ade8cd7935fa86e97224dcd2acb0c981b493b -->

### INFOSCHEMATICS-TOOL-037

- Starting state: `in-progress`, baseline `6e2c957ac37f4349d3e70bc213d17ea777fde986`.
- Resulting state: `awaiting-review` at `7f629e7989133ef496771880bf52e0291ea6c1c5`.
- Result: hardened Canvas and Studio Design interactions, including attached Flow movement, browser gesture coverage, pending-removal treatment, numeric placement, and keyboard de-duplication.
- Verification: 78 focused tests, 10 isolated Chromium tests, item branch `self:check`, visual pending-removal inspection, and the final integrated gate passed.
- Decisions and delegation: one isolated worker recovered the existing branch after a model-capacity failure; the primary agent reviewed, integrated, and reran the complete gate.

### INFOSCHEMATICS-TOOL-034

- Starting state: `ready`, baseline `e47f2ae54bd64431190ab9154576374c88b531a8`.
- Resulting state: `awaiting-review` at `cc467afa5ff8dc6dfd72d7b475441d120b82971c`.
- Result: replaced canonical Themes and Stories with Sequences, preserved established-input compatibility, and covered all four expanded/collapsed and timed/manual presentation combinations.
- Verification: 353 focused tests, package build, item branch `self:check`, desktop and narrow visual review, independent Callout-gating interaction, and the final integrated gate passed.
- Decisions and delegation: an isolated worker delivered the item; the primary agent reconciled its schema, renderer, and Studio overlaps with TOOL-014 and TOOL-039.

### INFOSCHEMATICS-TOOL-033

- Starting state: `ready`; the completed foundation began from `cc467afa5ff8dc6dfd72d7b475441d120b82971c`.
- Resulting state: `draft` at horizon `waiting-for`, with `INFOSCHEMATICS-TOOL-035` recorded as the reciprocal build-order dependency.
- Result: delivered opaque authored-document retention, stable-ID transactional YAML edits, exact inverse restoration, ordered `elements`, Studio document input, five-kind artefact projection, host acknowledgement, ADR, Specifications, and host guide.
- Verification: 47 focused item tests, 31 focused post-integration tests, item branch `self:check`, passing `ki-authoring`, `ki-specs`, and `ki-guides` audits, and the final integrated gate passed.
- Decisions and delegation: isolated implementation produced four code increments; primary review required source-shaped Flow edits, host acknowledgement, mapping-order insertion, and authored `elements` normalisation before integration.
- Park reason: Studio's Scene and presentation editors remain Theme and Story compatibility internals. Completing their canonical Sequence projection would duplicate the migration owned by TOOL-035, so the item did not falsely enter `awaiting-review`.

### INFOSCHEMATICS-TOOL-014

- Starting state: `ready`, baseline `e47f2ae54bd64431190ab9154576374c88b531a8`.
- Resulting state: `awaiting-review` at `b3d0d21ee8097b6f427eaf6a0d7340913ebefd4d`.
- Result: added serialisable, versioned renderer references across the canonical contract, compatibility layer, Canvas, Studio, static SVG output, schema, tests, decision, Specifications, vocabulary, and integration guide.
- Verification: 55 focused tests, schema verification, package build, item branch `self:check`, documentation audits, and the final integrated gate passed.
- Decisions and delegation: one isolated worker delivered the item; the primary agent integrated it before Sequences and retained both contracts through later conflict resolution.

### INFOSCHEMATICS-TOOL-039

- Starting state: `ready`, baseline `e47f2ae54bd64431190ab9154576374c88b531a8`.
- Resulting state: `awaiting-review` at `0fc6d23cc41a4009590d73539025cf766681a128`.
- Result: added opt-in responsive Card-detail resolution shared by Canvas and static SVG output, with deterministic scale thresholds and documented server-rendering behaviour.
- Verification: 50 focused tests, two dedicated browser tests, item `self:check`, documentation audits, and the final integrated gate passed.
- Decisions and delegation: delivered on main by the primary agent, then preserved through the renderer-version and Sequence integrations.

### Batch recap

Four records reached evidence-backed `awaiting-review`; TOOL-033 delivered its independent foundation and returned to Waiting for the already-existing TOOL-035 dependency. The final integrated `bun run self:check` passed 616 unit and integration tests, 12 Chromium tests, all package and example typechecks, generated schema and token checks, dependency analysis across 364 modules and 1,131 dependencies, and the production Site build.

The documentation audits introduced no item-scoped failures. The decision audit still reports the pre-existing ADR-INFOSCHEMATICS-018 filename mismatch, and the roadmap audit still reports six unrelated records carrying the retired `candidate` field.
