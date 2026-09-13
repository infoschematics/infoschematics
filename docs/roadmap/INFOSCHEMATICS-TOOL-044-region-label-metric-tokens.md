---
id: INFOSCHEMATICS-TOOL-044
area: TOOL
title: Region label tokens
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
---

# Region label tokens

## Goal

Make Region label and frame-notch measurements explicit shared product tokens without changing any rendered geometry.

## Context

[ADR-INFOSCHEMATICS-017](../decisions/ADR-INFOSCHEMATICS-017-use-deterministic-region-label-metrics.md) retains the deterministic character-count estimator and its current values while moving their ownership from unexplained resolver constants into the visual token manifest. ROUTE-018 records the accepted contract as pending.

## Boundary

This item does not introduce browser text measurement, a glyph-width table, authored typography controls, new label placements, or an accepted visual baseline shift. It does not change `labelOffset` semantics.

## Current state

`regionGeometryDefaults` in View Model owns `characterWidth: 9.4`, `labelHeight: 14`, `labelInset: 16`, and `notchPadding: 10`. Canvas and static SVG already consume the same resolved geometry, and existing tests cover compass placement, mounts, constrained Regions, and renderer parity.

## Steps

- [ ] Add the four Region label measurements to the shared visual token manifest with names that describe their geometric role.
- [ ] Make `regionGeometry` consume those tokens while retaining any compatibility export required by public package consumers.
- [ ] Add short, long, narrow, mixed-case, numeric, and non-ASCII fixtures across compass placements and internal and boundary mounts.
- [ ] Prove the resolved label, notch, outline, Canvas markup, and static SVG remain unchanged.
- [ ] Mark ROUTE-018 conforming with direct test evidence and update generated token projections.

## Files touched

- `packages/view-model/src/tokens.ts`
- `packages/view-model/src/region-geometry.ts`
- focused View Model, Canvas, static SVG, and token-generation tests
- generated visual token projections
- `docs/specs/routing-and-placement.md`
- `docs/roadmap/INFOSCHEMATICS-TOOL-044-region-label-metric-tokens.md`

## Verify

Run focused `bunx vitest run` suites for Region geometry, Canvas treatments, static SVG, and token generation, then `bun run self:check`. Compare pre-change and post-change resolved fixture values and renderer markup exactly; any output difference fails the item.

## Dependencies / blocks

ADR-INFOSCHEMATICS-017 fixes the ownership, algorithm, values, and zero-pixel constraint. No browser, external font service, or Site change is required.

## Documentation impact

### Decision Records

No new decision is required; implementation must conform to ADR-INFOSCHEMATICS-017.

### Specifications

Mark ROUTE-018 conforming and cite focused fixture and renderer-parity evidence.

### Guides

No guide change is required because authored controls and rendered output do not change.

### Roadmap

No follow-on work is expected unless exact parity reveals a previously hidden renderer discrepancy.

## Discussion

### Locked metrics

The migration retains character width 9.4, label height 14, default inset 16, and notch padding 10. Naming and ownership change; values, calculation, and output do not.

### Compatibility

`regionGeometryDefaults` may remain as a derived compatibility export if consumers use it, but the token manifest becomes the single source. Tests must prevent a second independent set of numeric values.
