---
id: INFOSCHEMATICS-TOOL-136
area: TOOL
title: Site copy contradicts versioning
theme: tool
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: cc88b70c305a7e2f3f3aebb29ac198a90a6ff710
created_at: 2026-09-23T21:05:00Z
updated_at: 2026-10-04T16:32:45Z
---

# Site copy contradicts versioning

## Goal

A host application developer reading the public React integration page is told the same thing about renderer property-schema versions that the specification requires and the code implements.

## Context

`apps/site/content/react-integration.md` states that "every definition needs a stable key, schema version `1`, validator, and component", that "the current authored renderer reference does not carry a separate schema version, and the registry supports definition schema version `1`", and that an incompatible property change is handled by registering a **new stable key** such as `example.fabric.network-v2`.

The specification says the opposite. `EXTEND-002` in [the renderer-extensions specification](../specs/renderer-extensions.md) requires an authored reference to select a positive integer property-schema version, permits an incompatible property change to "use a new version under the same stable key", and states that the registry "MAY expose several versions for one key" with resolution selecting the exact requested pair. Its stated evidence is that the shared Canvas resolver selects version `1` and `2` definitions registered under one key. `EXTEND-006` repeats the versioned binding and makes an unregistered requested version its own diagnostic, distinct from an unknown key.

[The host renderer guide](../guides/host-integrating-renderers.md) agrees with the specification: it shows `version: 2` authored against `schemaVersion: 2` and says several versions may share a key.

So the public page is the outlier, and it is the outlet [ADR-INFOSCHEMATICS-014](../decisions/ADR-INFOSCHEMATICS-014-site-owned-user-guide.md) makes the consumer journey. A developer following it would reach for a new key where the product offers a new version, and would read the `unsupported-version` diagnostic as a defect rather than as the contract working.

## Boundary

Public Site content under `apps/site/content/`, specifically the renderer-versioning claims on the React integration page. Confirm the behaviour against `packages/view-canvas/src/renderers.test.tsx` before rewriting anything, because the specification's evidence line is a claim about that suite rather than a reading of it, and the page may be describing something true that the specification overstates.

It does not change the registry API, the specification, or the guide unless the code turns out to contradict them too — in which case the defect is larger than copy and this record says so rather than absorbing it.

## Current state

The code agrees with the specification and the guide, so the defect is copy and nothing larger. `rendererReferenceOf` in `packages/domain-model/src/renderer.ts` normalises an authored reference to `{ key, version }`, reading a scalar key as version `1`. `resolveInfoschematicRenderer` in `packages/view-canvas/src/renderers.tsx` selects the definition matching the exact key-and-version pair, reports `unsupported-version` with the versions that key does offer when the pair is missing, and reports `duplicate-key` per key-and-version pair rather than per key. `packages/view-canvas/src/renderers.test.tsx` registers version `1` and `2` definitions under one key and resolves each, so `EXTEND-002`'s evidence line is a reading of the suite, not only a claim about it. Component-only maps answer version `1` alone.

`apps/site/content/react-integration.md` is wrong in three places: line 114 says every definition needs schema version `1` and that the first duplicate key wins, and line 131 says the authored reference carries no version and that an incompatible change takes a new key.

## Steps

- [x] Rewrite the definition paragraph so a definition needs a stable key, a positive integer schema version naming its property schema, a validator and a component; the first registration of a repeated key-and-version pair wins; and component-only maps answer version `1` only.
- [x] Rewrite the incompatible-change paragraph: the authored reference names a key and a version, a scalar key means version `1`, and an incompatible property change registers a new schema version under the same key beside the old one, which stays registered while documents still request it. Keep the prohibitions on reinterpreting old properties and on authored migration callbacks, restated for the version rather than the key.
- [x] Show the structured authored reference in a short YAML example, in the form the host renderer guide already uses.

## Files touched

`apps/site/content/react-integration.md` only.

## Verify

`grep -nE "schema version .1., validator|network-v2|does not carry a separate schema version|first duplicate key wins" apps/site/content/react-integration.md` returns nothing. Read the rewritten paragraphs against `EXTEND-002` and `EXTEND-006` in `docs/specs/renderer-extensions.md` and the `selects the exact authored schema version` case in `packages/view-canvas/src/renderers.test.tsx`: every claim on the page is one of theirs. `bunx rumdl check apps/site/content/react-integration.md` is clean and `bun run self:check` passes, which includes the production Site build that renders the page.

## Dependencies / blocks

None. The concurrent `INFOSCHEMATICS-TOOL-129` work touches `apps/site/content/authoring.md`, not this page.

## Documentation impact

### Decision Records

None.

### Specifications

None.

### Guides

The Site consumer page only. The specification, the host renderer guide and the registry API are unchanged, because the code agrees with them.

### Roadmap

None.

## Review

### Delivered

The React integration page now tells a host application developer what `EXTEND-002` and `EXTEND-006` require and the code does: a definition carries a positive integer `schemaVersion`, several versions may share a key, an authored reference names a key and a version (a scalar meaning version `1`), and an incompatible property change registers a new version under the same key rather than a new key. The boundary held: only the public page changed; the registry API, the specification and the host renderer guide were confirmed against the code and left alone. Baseline `cc88b70c305a7e2f3f3aebb29ac198a90a6ff710`; the change is the commit carrying this packet.

### Change Summary

- `apps/site/content/react-integration.md` - the definition paragraph states the positive integer schema version and that the first registration of a repeated key-and-version pair wins (not the first duplicate key); the compatibility sentence states that component-only maps answer version `1` only (`componentSchemaVersion` in `packages/view-canvas/src/renderers.tsx`); the incompatible-change paragraph replaces the `example.fabric.network-v2` advice with a new `schemaVersion` under the same key, adds a YAML example of the structured reference in the `kind:` form the authored schema uses, and explains `unsupported-version` as the contract working. The prohibitions on reinterpreting old properties and on authored migration callbacks are kept, restated for the version.
- No approved deviation.

### Verification

- The Boundary's precondition was checked before rewriting: `packages/view-canvas/src/renderers.test.tsx` case `selects the exact authored schema version while scalar references request version one` registers version `1` and `2` under one key and resolves each; `rendererReferenceOf` in `packages/domain-model/src/renderer.ts` reads a scalar as version `1`. The specification's evidence line is accurate.
- `grep -nE "schema version .1., validator|network-v2|does not carry a separate schema version|first duplicate key wins" apps/site/content/react-integration.md` - no match.
- `bunx rumdl check apps/site/content/react-integration.md` - no issues.
- `bunx turbo run build test --filter=@infoschematics/site` - 24 tasks successful; Site test files 12 passed; the production build renders the page.
- `bun run self:check` - fails, on causes outside this change: `scripts/specification-evidence.test.ts` reports `ROUTE-011` in `docs/specs/routing-and-placement.md` declaring no conformance state (committed at `638e2818` before this item began), and `@infoschematics/view-canvas` token cases fail against the concurrent uncommitted `INFOSCHEMATICS-TOOL-129` work in the shared tree. Neither touches this page.
- `ki repo audit --skill ki-work-roadmap` - this record passes; the only finding is on the concurrent uncommitted `INFOSCHEMATICS-SITE-032` record.

### Outstanding concerns

- `bun run self:check` is not green repository-wide for the two causes above; a reviewer should rerun it once `ROUTE-011` and `INFOSCHEMATICS-TOOL-129` settle.
- The page's YAML example uses `kind:`, which is the authored field for a Fabric or Overlay renderer; a Callout's renderer field was not separately illustrated.

### Post-change review

The goal is met: every renderer-versioning claim on the page is now one the specification makes and the suite proves, and the page no longer advises a new key where the product offers a new version. Scope held to one file. Regression risk is limited to the rendered page, which builds. Ready for acceptance subject to the repository-wide gate.

### Mini recap

Three paragraphs of Site copy corrected to match `EXTEND-002`/`EXTEND-006` and the resolver; Site build and tests green; the repository gate is red for unrelated reasons. Learning route (not promoted): the duplication test between a guide and a Site page is "do they say the same thing", which the record's Discussion already states; a check comparing renderer-versioning claims across the guide and the page is not proposed.

## Done

Accepted 2026-10-04 by the Fable reviewer on the review packet above, under the owner's delegated estate-push authority. No nits.

## Discussion

Found on 2026-09-23 while reorganising `docs/guides/` by audience under `INFOSCHEMATICS-TOOL-135`. The guide and the page were compared to decide whether the guide duplicated the Site-owned journey and could be removed. It cannot: the two disagree, and the guide is the one the specification supports.

That is the general lesson worth keeping. The duplication test is not "do these cover the same ground" but "do they say the same thing", and two documents covering one subject are cheap to keep in step only while nobody has noticed they diverged.

Adopted 2026-10-04 under the owner's delegated estate-push authority, moved from Triage to Now and shaped to Ready in the same change.
