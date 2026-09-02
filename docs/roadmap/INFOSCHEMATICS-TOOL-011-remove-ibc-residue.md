---
id: INFOSCHEMATICS-TOOL-011
area: TOOL
title: Remove IBC residue
theme: tool
horizon: next
status: draft
blocks: [INFOSCHEMATICS-TOOL-008]
blocked_by: []
baseline_ref: null
---

## Goal

Remove the original IBC 2026 realisation's authored and rendering residue from reusable packages so the Canvas, Present, and Studio extraction starts from a host-neutral baseline.

## Context

A source comparison with the original IBC 2026 repository found first-realisation material still embedded in `packages/view-studio`. The residue includes fixed Story Graphics and narrative text, Fabric implementations and coordinates, exact labels and identifiers, IBC-specific runtime coupling, source-specific icon mappings, fixed card placement, media-service copy, test fixtures, comments, selectors, and stale interface CSS.

The authored IBC definition itself is not present. Historical documentation provenance and the legacy persistence-key compatibility path are intentional and are not residue. `INFOSCHEMATICS-TOOL-008` is explicitly behaviour-preserving, so it would otherwise distribute the embedded assumptions into the new package boundaries.

## Boundary

This item removes, generalises, or isolates first-realisation material only where it leaks into reusable product behaviour. It does not erase historical provenance, remove intentional storage compatibility, design the general renderer registry owned by `INFOSCHEMATICS-TOOL-007`, complete editing owned by `INFOSCHEMATICS-TOOL-006`, centralise all visual tokens owned by `INFOSCHEMATICS-TOOL-009`, or change the original IBC repository without separate authority.

## Current state

`packages/view-studio` can render the blank example, but its reusable implementation still knows the IBC story names, Fabric layout, labels, codes, lane identifiers, scopes, geometry, and vocabulary. Some of those details are visible output; others are hidden branches or styling hooks that make the package source-specific even when the current definition is blank.

## Steps

- [ ] Turn the audit findings into a checked inventory, classifying each occurrence as remove, generalise, host-transfer, intentional compatibility, or intentional provenance.
- [ ] Remove the fixed `gap` and `cycle` Story Graphics and their IBC narrative from reusable fallback behaviour, leaving graphics driven by authored data or host configuration.
- [ ] Remove IBC-specific Fabric coupling, literal codes, label branches, telemetry state, lane selectors, scope mappings, and fixed placement coordinates; make any retained rendering behaviour configuration- or view-box-driven.
- [ ] Replace source-specific visible and accessibility copy, comments, and test fixtures with host-neutral vocabulary and representative fixtures.
- [ ] Prune obsolete demo, event, and scenario styling that has no live generic owner.
- [ ] Add focused regression tests or search assertions that prevent the identified first-realisation nouns, identifiers, and fixed geometry from returning to reusable packages.
- [ ] Record any compatibility handoff required by the original IBC host rather than silently preserving its implementation inside this repository.

## Files touched

- `packages/view-studio/src/app/**` for graphics, diagram composition, runtime context, icon selection, card creation, and user-facing copy;
- `packages/view-studio/src/styles.css` for source-specific selectors and stale interface rules;
- `packages/view-studio/src/**/*.test.*` for host-neutral fixtures and residue regressions;
- specifications or integration guidance only where generic fallback behaviour or host responsibilities change.

## Verify

Focused tests must prove the blank example and a representative host-neutral configuration render without IBC names, codes, narrative, fixed coordinates, or source-specific runtime branches. A bounded source search must distinguish zero reusable-package residue from the explicitly retained provenance and compatibility occurrences. `bun run check` is the final pass/fail gate.

## Dependencies / blocks

This item blocks `INFOSCHEMATICS-TOOL-008` so package extraction does not preserve or spread source-specific assumptions. `INFOSCHEMATICS-TOOL-007`, `INFOSCHEMATICS-TOOL-006`, and `INFOSCHEMATICS-TOOL-009` retain their existing renderer-registry, editing, and visual-token scopes; this item must not absorb them.

## Documentation impact

### Decision Records

No new decision is expected unless classification reveals a change to renderer or host ownership.

### Specifications

Update the affected view specification only if generic fallback behaviour or configurable rendering responsibilities change.

### Guides

Update integration guidance only if hosts must supply data or rendering behaviour that the reusable package previously embedded.

### Roadmap

Add this work as the explicit residue-removal blocker for `INFOSCHEMATICS-TOOL-008`.

## Discussion

### Ownership test

Content, geometry, identifiers, or branching that exists only because of the first IBC 2026 authored Infoschematic belongs in authored data or its host. A reusable implementation may retain a general rendering capability only when its inputs and behaviour no longer encode that specific realisation.

### Compatibility

Delivery must measure the original IBC host's dependency on every removed built-in and record the required handoff. Compatibility risk is evidence for migration work, not a reason to leave undocumented source-specific behaviour in reusable packages.
