---
id: INFOSCHEMATICS-BATCH-012
repository: https://github.com/infoschematics/infoschematics
approved: true
approved_at: 2026-09-14T07:45:47Z
authority_mode: outcome
authority_evidence: User authorised whatever work is needed to finish all site-based roadmap items and explicitly requested cost-effective lower-model delegation.
approved_payload_sha256: b0e63a939686e62b44c145d58194fa4ed52640ff5ffb4d89ee20cab543af20e0
run_id: INFOSCHEMATICS-BATCH-012-RUN-001
timebox_ends_at: 2026-09-14T13:45:47Z
item_ids: [INFOSCHEMATICS-SITE-026]
completion_target: done
mandatory_stops: [public-contract-change-outside-plan, destructive-or-irreversible-work, external-coordination, verification-failure, contested-shared-path, unsafe-moved-head, push-deploy-publish-or-release]
closure_item_ids: [INFOSCHEMATICS-SITE-026]
---

# INFOSCHEMATICS-BATCH-012 — Component reference pages

## Outcome authority

Deliver and consolidate acceptance of the dependency-ready Site component catalogue using the approved documentation architecture and demo frame.

## Selected plan

`INFOSCHEMATICS-SITE-026` — split the monolithic Components guide into a concise hub and focused Canvas, Regions, Fabrics, Cards, Flows, Points, Graphics, and Future pages.

## Repository scope

- Repository: `https://github.com/infoschematics/infoschematics`.
- Work item: `docs/roadmap/INFOSCHEMATICS-SITE-026-component-reference-pages.md`.
- Implementation: Site-owned component routes, guide composition, supported controls, examples, references, tests, and responsive styling under `apps/site`.
- Excluded: package model or renderer contract changes, `INFOSCHEMATICS-SITE-006`, blocked `INFOSCHEMATICS-SITE-019`, and unsupported future notation.

## Completion contract

The item may close only after every component route has focused reader-facing content, the shared demo frame, honest current controls and references, nested navigation, focused and browser tests, a clean production build, and desktop and 390-pixel inspection.

## Mandatory stops

- Public-contract change outside the selected Site plan.
- Destructive or irreversible work.
- New external coordination.
- Required verification failure that cannot be repaired within the affected item.
- Contested shared paths or moved `HEAD` that cannot be safely revalidated.
- Any push, deploy, publish, or release.

## Run ledger

<!-- ki-batch-run: INFOSCHEMATICS-BATCH-012-RUN-001 b0e63a939686e62b44c145d58194fa4ed52640ff5ffb4d89ee20cab543af20e0 -->

| Item | Start | Result | Evidence | Next human action |
| --- | --- | --- | --- | --- |
| `INFOSCHEMATICS-SITE-026` | ready | awaiting-review | `d92553d3` baseline; `fab582b6` result; 92 focused tests, Site type check and build, 13 browser tests, and desktop/390px inspection passed | Consolidate acceptance under the approved batch closure |
