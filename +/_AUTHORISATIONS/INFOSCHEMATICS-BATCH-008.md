---
id: INFOSCHEMATICS-BATCH-008
repository: https://github.com/infoschematics/infoschematics
approved: true
approved_at: 2026-09-13T16:56:19Z
authority_mode: outcome
authority_evidence: User instructed Codex to autonomously complete all discussed website changes, keep going, delegate where appropriate, and commit completed milestones.
approved_payload_sha256: 5a2f570e824a66f71e28dbccbebe022b2b7121f8a79e93f1dd3efb3967c7f055
run_id: INFOSCHEMATICS-BATCH-008-RUN-001
timebox_ends_at: 2026-09-13T22:56:19Z
item_ids: [INFOSCHEMATICS-SITE-016]
completion_target: awaiting-review
mandatory_stops: [public-contract-change-outside-plan, destructive-or-irreversible-work, external-coordination, verification-failure, contested-shared-path, moved-head, push-deploy-publish-or-release]
---

# INFOSCHEMATICS-BATCH-008 — Connect homepage to the guide

## Outcome authority

Deliver the requested homepage Getting started action and connect all five overview artefacts to stable user-guide destinations while preserving the accepted visual composition and inert authored definition.

## Selected plans

1. `INFOSCHEMATICS-SITE-016` — replace the inert homepage image with the supported inline host, map `STR-01`, `PRS-02`, `INFO-03`, `OUT-04`, and `OUT-05` to guide destinations, and provide equivalent named keyboard paths.

## Scope

Work only in `https://github.com/infoschematics/infoschematics` and within the Site files named by `INFOSCHEMATICS-SITE-016`. Consume the public inline host delivered by `INFOSCHEMATICS-TOOL-038`; do not change its renderer contract or authored overview. The implementation baseline is `d18a0f88416bc2f349a6ffedb85aa914674b4e97`.

## Timebox

This run expires at `2026-09-13T22:56:19Z`.

## Verification

Run focused homepage and inline-host tests, the Site production build, `bun run self:check`, and the roadmap audit. Inspect the built homepage at desktop and a true 390-pixel CSS viewport; verify the CTA and five destinations, pointer activation, named keyboard equivalents, visual treatment, wrapping, and horizontal overflow.

## Decisions and delegation

Use `/docs/visual-guide/#anatomy` for Structure, `/docs/authoring/#add-presentation-material` for Presentation, `/docs/` for Infoschematic, `/docs/static-rendering/` for Rendered, and `/docs/present/` for Presented. The Site owns this mapping and navigation. A bounded Site implementation lane may edit the named component, tests, and styles; the primary agent retains integration, visual review, verification, and commit ownership.

## Excluded candidates

- `INFOSCHEMATICS-SITE-019` remains excluded because `INFOSCHEMATICS-TOOL-033` and `INFOSCHEMATICS-TOOL-043` have not landed.
- Authored callbacks, renderer navigation, generic SVG-group button semantics, persistent DOM editing, and a homepage composition redesign remain excluded.

## Completion and remedial policy

The admitted record may reach `awaiting-review` only through complete implementation and rendered evidence. Non-blocking improvements become separately prioritised work rather than widening the Site or renderer contract. Acceptance, pruning, push, deployment, publication, and release are excluded.

## Mandatory stops

- Public-contract change outside the selected Site navigation boundary.
- Destructive or irreversible work.
- New external coordination.
- Required verification failure that cannot be repaired within the item.
- Contested touched paths or moved `HEAD` that cannot be revalidated safely.
- Any push, deploy, publish, or release.

## Run ledger

<!-- ki-batch-run: INFOSCHEMATICS-BATCH-008-RUN-001 5a2f570e824a66f71e28dbccbebe022b2b7121f8a79e93f1dd3efb3967c7f055 -->

| Item | Start | Result | Evidence | Next human action |
| --- | --- | --- | --- | --- |
| `INFOSCHEMATICS-SITE-016` | ready | awaiting-review | `6e2c957a` baseline; `1bca0ba7` implementation; focused tests, Site build, desktop/390px browser checks, and the final combined repository gate passed | Review the CTA, five guide mappings, and visible keyboard-equivalent controls |

## Batch recap

The selected record reached the authorised `awaiting-review` target. The homepage now uses real inline SVG, offers a Getting started action beneath the lede, and maps its five authored cards to stable guide destinations through Site-owned pointer navigation and named keyboard controls. Authored data, renderer navigation, persistent DOM editing, acceptance, pruning, deployment, and release remain outside this run.
