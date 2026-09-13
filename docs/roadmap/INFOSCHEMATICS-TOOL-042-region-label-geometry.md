---
id: INFOSCHEMATICS-TOOL-042
area: TOOL
title: Region label geometry
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 6f53607ff64f6a088271ea652829e9a2b9d18828
---

# Region label geometry

## Goal

Decide how Region label placement and frame notches derive from typography so labels remain predictable across renderers without relying on unexplained character-width constants.

## Context

View Model currently estimates Region label width with a 9.4 character factor plus fixed inset and notch padding. A shared resolver keeps Canvas and static SVG aligned, but the constants are not named visual tokens and estimated width can drift for long or unusual labels. Authored `labelOffset` is an escape hatch for placement, not a substitute for a coherent measurement contract.

## Boundary

This item decides the geometry contract and captures implementation separately. It does not add Region surface treatments, expose arbitrary font metrics in authored data, depend on browser-only measurement in View Model, or silently change accepted label positions without visual evidence.

## Current state

`packages/view-model/src/region-geometry.ts` resolves Region label placement, boundary mounting, and notch paths for both Canvas and static SVG. Its local defaults are a 9.4-unit character width, 14-unit label height, 16-unit inset, and 10-unit notch padding. The visual token manifest owns other shared renderer measurements but does not yet name these four values.

Representative calculations confirm the current contract: `A` resolves to 9.4 units, `Distribution` and `North-East 2` to 112.8, `2026` to 37.6, and `Média` to 47. A 60-unit-wide Region labelled `Distribution` suppresses the notch and uses a closed frame. Internal labels also use a closed frame.

## Steps

- [x] Build representative fixtures for short, long, narrow, mixed-case, numeric, and non-ASCII Region labels across compass placements and both internal and boundary mounts.
- [x] Compare named deterministic typography tokens, a shared glyph-width table, actual renderer text measurement, and the current character estimate for framework neutrality, SSR, static SVG, font availability, and visual parity.
- [x] Decide which measurements are product tokens and derived geometry, and whether authored `labelOffset` semantics remain unchanged.
- [x] Quantify visual differences from the current resolver and require explicit approval for any baseline shift.
- [x] Record one decision, update the specification contract, and capture a bounded implementation record because the selected model changes token ownership.

## Files touched

- `docs/decisions/ADR-INFOSCHEMATICS-017-use-deterministic-region-label-metrics.md`
- `docs/decisions/README.md`
- `docs/specs/routing-and-placement.md`
- `docs/roadmap/INFOSCHEMATICS-TOOL-042-region-label-geometry.md`
- `docs/roadmap/INFOSCHEMATICS-TOOL-044-region-label-metric-tokens.md`
- `docs/roadmap/_ISSUES.md`

## Verify

Review the decision against every representative calculation and confirm it addresses framework neutrality, font availability, deterministic static output, Canvas parity, notched-frame padding, `labelOffset`, and migration of accepted visuals. Run `ki repo audit --skill ki-decision-records --repo .`, `ki repo audit --skill ki-specs --repo .`, `ki repo audit --skill ki-work-roadmap --repo .`, and `bun run self:check`.

## Dependencies / blocks

The shared Region geometry resolver, visual token manifest, renderer parity tests, and authored label placement contract have landed. [Region surface treatments](INFOSCHEMATICS-TOOL-018-region-fill-frame-and-background-variety.md) are independent.

## Documentation impact

### Decision Records

ADR-INFOSCHEMATICS-017 retains deterministic measurement, rejects environment-dependent alternatives, and assigns the four measurements to the shared visual token manifest.

### Specifications

ROUTE-018 records the accepted deterministic shared-metric contract as pending until the token implementation lands.

### Guides

No guide change is required because `labelOffset` semantics and rendered output remain unchanged.

### Roadmap

INFOSCHEMATICS-TOOL-044 captures the bounded, zero-pixel token-ownership refactor.

## Review

### Delivered

Completed the approved decision boundary from baseline `6f53607ff64f6a088271ea652829e9a2b9d18828`. The work selected deterministic shared metrics, retained all accepted geometry, and captured the implementation separately.

### Summary of changes

Added ADR-INFOSCHEMATICS-017, accepted ROUTE-018 as pending, documented representative calculations and rejected alternatives, and prepared INFOSCHEMATICS-TOOL-044 to move the four values into the visual token manifest without changing pixels.

### Verification

`ki repo audit --skill ki-decision-records --repo .`, `ki repo audit --skill ki-specs --repo .`, and `ki repo audit --skill ki-work-roadmap --repo .` passed. `bun run self:check` passed 529 tests, every workspace type-check, dependency validation, generated-artefact checks, package builds, and the production Site build.

### Outstanding concerns

None within the decision boundary. ROUTE-018 remains pending until INFOSCHEMATICS-TOOL-044 completes the token-ownership refactor and exact parity fixtures.

### Post-change review

The selected contract keeps View Model framework-neutral and prevents Canvas and static SVG from acquiring independent typography assumptions. It does not expand authored data or change `labelOffset`.

### Mini recap

Region label geometry remains deterministic. Four existing measurements become shared tokens in the follow-on, while all calculated and rendered output stays fixed.

## Discussion

### Framework neutrality

Browser text measurement would follow the mounted font more closely, but would make View Model, server rendering, tests, and static SVG dependent on font availability and load timing. A shared glyph-width table would remain approximate while expanding the contract across Unicode coverage and font revisions. Retaining the current estimator preserves deterministic output without widening the product model.

### Token boundary

Character width, label height, default inset, and notch padding are shared product measurements. Label length, notch limits, and outline paths remain derived geometry. None becomes an authored option.

### Visual migration

The existing approximation is accepted output, so the implementation is constrained to a zero-pixel refactor. Any future algorithm or value change requires an explicit visual-token migration with side-by-side evidence.
