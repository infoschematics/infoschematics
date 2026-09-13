---
id: INFOSCHEMATICS-TOOL-044
area: TOOL
title: Region label tokens
theme: tool
horizon: next
status: done
blocks: []
blocked_by: []
baseline_ref: c5d86818b7f2de7f49e42521f6fa1b8fe0a5488a
---

# Region label tokens

## Goal

Make Region label and frame-notch measurements explicit shared product tokens without changing any rendered geometry.

## Context

[ADR-INFOSCHEMATICS-017](../decisions/ADR-INFOSCHEMATICS-017-use-deterministic-region-label-metrics.md) retains the deterministic character-count estimator and its current values while moving ownership from unexplained resolver constants into the visual token manifest. ROUTE-018 records the accepted contract.

## Boundary

This item does not introduce browser text measurement, a glyph-width table, authored typography controls, new label placements, or an accepted visual baseline shift. It does not change `labelOffset` semantics.

## Current state

`visualTokens.canvas.geometry` now owns `regionLabelCharacterWidth: 9.4`, `regionLabelHeight: 14`, `regionLabelInset: 16`, and `regionNotchPadding: 10`. The public `regionGeometryDefaults` compatibility export derives from those tokens. Canvas and static SVG continue to consume the same resolved geometry.

## Steps

- [x] Add four Region label measurements to the shared visual token manifest with names that describe their geometric role.
- [x] Make `regionGeometry` consume the tokens while retaining the public compatibility export.
- [x] Add short, long, narrow, mixed-case, numeric, and non-ASCII fixtures alongside the existing compass-placement and internal/boundary-mount coverage.
- [x] Prove resolved label, notch, outline, Canvas, and static SVG geometry remain unchanged.
- [x] Mark ROUTE-018 conforming with direct evidence and update generated token projections.

## Files touched

- `packages/view-model/src/tokens.ts`
- `packages/view-model/src/tokens.generated.css`
- `packages/view-model/src/tokens.test.ts`
- `packages/view-model/src/region-geometry.ts`
- `packages/view-model/src/region-geometry.test.ts`
- `docs/specs/routing-and-placement.md`
- `docs/roadmap/INFOSCHEMATICS-TOOL-044-region-label-metric-tokens.md`

## Verify

Run focused `bunx vitest run` suites for Region geometry, visual tokens, token generation, and visual-treatment parity, then `bun run self:check`. The token values, compatibility export, resolved geometry, and renderer parity must remain exact; an output difference fails the item.

## Dependencies / blocks

ADR-INFOSCHEMATICS-017 fixes ownership, algorithm, values, and the zero-pixel constraint. No browser, external font service, or Site change is required.

## Documentation impact

### Decision Records

No new decision was required; the implementation conforms to ADR-INFOSCHEMATICS-017.

### Specifications

ROUTE-018 is now conforming with direct View Model and renderer-parity evidence.

### Guides

No guide change was required because authored syntax and `labelOffset` behaviour did not change.

### Roadmap

No follow-on work is required unless a future visual-token migration deliberately changes the metrics.

## Review

### Delivered

Completed the approved implementation from baseline `c5d86818b7f2de7f49e42521f6fa1b8fe0a5488a`. The four measurements have one named source while the compatibility surface and rendered output remain stable.

### Summary of changes

Added four geometry tokens and their generated CSS projections, derived `regionGeometryDefaults` from them, expanded deterministic label fixtures, and marked ROUTE-018 conforming with evidence.

### Verification

Focused Region geometry, token, token-generation, and visual-treatment-parity suites passed 40 tests. `ki repo audit --skill ki-specs --repo .` and `ki repo audit --skill ki-work-roadmap --repo .` passed. `bun run self:check` passed 535 tests, every workspace type-check, dependency validation, generated-artefact checks, package builds, and the production Site build.

### Outstanding concerns

None within the approved boundary. A future metric change must be handled as an explicit visual migration under ADR-INFOSCHEMATICS-017.

### Post-change review

The token manifest is now the single source for the four values. View Model still owns derived geometry, and both renderers remain consumers of that one resolution.

### Mini recap

Region label metrics are named, shared, generated, and tested. The refactor changes ownership, not pixels.

## Done

Accepted 2026-09-13 by the project owner on the review packet above.

## Discussion

### Locked metrics

The migration retains character width 9.4, label height 14, default inset 16, and notch padding 10. Naming and ownership change; values, calculation, and output do not.

### Compatibility

`regionGeometryDefaults` remains as a derived compatibility export for package consumers, while the token manifest is the single source. Tests prevent a second independent set of numeric values.
