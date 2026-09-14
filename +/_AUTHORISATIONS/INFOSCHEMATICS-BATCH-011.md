---
id: INFOSCHEMATICS-BATCH-011
repository: https://github.com/infoschematics/infoschematics
approved: true
approved_at: 2026-09-14T07:08:29Z
authority_mode: outcome
authority_evidence: User authorised whatever work is needed to finish all site-based roadmap items and explicitly requested cost-effective lower-model delegation.
approved_payload_sha256: b18140c78a07d7462aa4cdeacbd5cbbe8554cac9f102c3a98db2694707037ba5
run_id: INFOSCHEMATICS-BATCH-011-RUN-001
timebox_ends_at: 2026-09-14T13:08:29Z
item_ids: [INFOSCHEMATICS-SITE-024, INFOSCHEMATICS-SITE-025]
completion_target: done
mandatory_stops: [public-contract-change-outside-plan, destructive-or-irreversible-work, external-coordination, verification-failure, contested-shared-path, unsafe-moved-head, push-deploy-publish-or-release]
closure_item_ids: [INFOSCHEMATICS-SITE-024, INFOSCHEMATICS-SITE-025]
---

# INFOSCHEMATICS-BATCH-011 — Rebuild component guidance foundations

## Outcome authority

Deliver and consolidate acceptance of the two dependency-ready Site foundations for the approved documentation redesign while the primary agent coordinates lower-cost delegated implementation.

## Selected plans

1. `INFOSCHEMATICS-SITE-024` — move the labelled whole Infoschematic into Overview and establish the first-class Components documentation hierarchy.
2. `INFOSCHEMATICS-SITE-025` — build the compact reusable component demo frame with real Rendered and Design treatments and focused source.

## Repository scope

- Repository: `https://github.com/infoschematics/infoschematics`.
- Work items: `docs/roadmap/INFOSCHEMATICS-SITE-024-documentation-architecture.md` and `docs/roadmap/INFOSCHEMATICS-SITE-025-component-demo-frame.md`.
- Implementation: Site-owned content and code under `apps/site` plus item lifecycle and this authorisation record.
- Excluded: package model or renderer changes, unsupported grid and Point values, MUI dependency, push, deployment, publication, and release.

## Excluded candidates

- `INFOSCHEMATICS-SITE-006` changes the public Domain and renderer contract across packages and remains coupled to the non-website workstream.
- `INFOSCHEMATICS-SITE-019` remains blocked by `INFOSCHEMATICS-TOOL-043` and its canonical-view prerequisites.
- `INFOSCHEMATICS-SITE-023` is already awaiting review and will be reconciled through its existing delivery packet rather than reimplemented.
- `INFOSCHEMATICS-SITE-026` remains draft until both selected foundations land, then enters a separate dependency-ready cycle.

## Timebox

This authority expires at `2026-09-14T13:08:29Z`.

## Verification

Run each item’s focused Site tests and type checking, inspect its pages at desktop and 390-pixel widths, then run `bun run self:check` after integration. Every accepted item must first reach `awaiting-review` with its own six-heading review packet.

## Allowed decisions and delegation

Lower-cost runtime delegation is permitted for bounded Site-only implementation packets. The primary agent retains shared routing and style integration, accessibility and visual decisions, lifecycle changes, verification, commits, and acceptance evidence. Apply implementation-level choices already anticipated by each plan; stop for any new package or public-contract decision.

## Completion and remedial policy

Each admitted item must reach `awaiting-review`, pass a fresh review-packet and repository-evidence check, then close through `ki-accept` under this approval-bound closure authority. Non-blocking improvements become separately scoped follow-up work; they do not erase delivered evidence.

## Mandatory stops

- Public-contract change outside a selected Site plan.
- Destructive or irreversible work.
- New external coordination.
- Required verification failure that cannot be repaired within the affected item.
- Contested shared paths or a moved `HEAD` that cannot be safely revalidated.
- Any push, deploy, publish, or release.

## Run ledger

<!-- ki-batch-run: INFOSCHEMATICS-BATCH-011-RUN-001 b18140c78a07d7462aa4cdeacbd5cbbe8554cac9f102c3a98db2694707037ba5 -->
