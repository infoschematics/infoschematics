---
id: INFOSCHEMATICS-TOOL-136
area: TOOL
title: Site copy contradicts versioning
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-23T21:05:00Z
updated_at: 2026-09-23T21:05:00Z
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

## Discussion

Found on 2026-09-23 while reorganising `docs/guides/` by audience under `INFOSCHEMATICS-TOOL-135`. The guide and the page were compared to decide whether the guide duplicated the Site-owned journey and could be removed. It cannot: the two disagree, and the guide is the one the specification supports.

That is the general lesson worth keeping. The duplication test is not "do these cover the same ground" but "do they say the same thing", and two documents covering one subject are cheap to keep in step only while nobody has noticed they diverged.
