---
id: INFOSCHEMATICS-TOOL-042
area: TOOL
title: Region label geometry
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
---

# Region label geometry

## Goal

Decide how Region label placement and frame notches derive from typography so labels remain predictable across renderers without relying on unexplained character-width constants.

## Context

View Model currently estimates Region label width with a 9.4 character factor plus fixed inset and notch padding. The shared resolver keeps Canvas and static SVG aligned, but the constants are not named visual tokens and estimated width can drift for long or unusual labels. Authored labelOffset is an escape hatch for placement, not a substitute for a coherent measurement contract.

## Boundary

This item decides the geometry contract and captures implementation separately. It does not add Region surface treatments, expose arbitrary font metrics in authored data, depend on browser-only measurement in View Model, or silently change accepted label positions without visual evidence.

## Current state

Region label placement, boundary mounting, and notch path geometry are resolved in packages/view-model/src/region-geometry.ts and consumed by Canvas and static SVG. The visual token manifest owns shared renderer measurements but does not name label inset, notch padding, or width estimation.

## Steps

- [ ] Build representative fixtures for short, long, narrow, mixed-case, numeric, and non-ASCII Region labels across all compass placements and both internal and boundary mounts.
- [ ] Compare named deterministic typography tokens, a shared glyph-width table, actual renderer text measurement, and the current character estimate against framework neutrality, SSR, static SVG, font availability, and visual parity.
- [ ] Decide which measurements are product tokens, which are derived geometry, and whether authored labelOffset semantics remain unchanged.
- [ ] Quantify visual differences from the current resolver and require explicit approval for any baseline shift.
- [ ] Record one decision and update specification gaps, then capture a bounded implementation record only if the selected model changes production behaviour.

## Files touched

- docs/decisions/
- docs/decisions/README.md
- docs/specs/view-model.md
- docs/specs/view-canvas.md
- docs/specs/render-svg.md
- docs/roadmap/

## Verify

Review the decision against every fixture and confirm it addresses framework neutrality, font availability, deterministic static output, Canvas parity, notched-frame padding, labelOffset, and migration of accepted visuals. Run ki repo audit --skill ki-work-roadmap --repo . and bun run self:check.

## Dependencies / blocks

The shared Region geometry resolver, visual token manifest, renderer parity tests, and authored label placement contract have landed. [Region surface treatments](INFOSCHEMATICS-TOOL-018-region-fill-frame-and-background-variety.md) is independent.

## Documentation impact

### Decision Records

Add an architecture decision defining typography measurement ownership and rejected alternatives.

### Specifications

Update View Model and renderer requirements only for the selected contract and its deterministic verification fixtures.

### Guides

If labelOffset behaviour changes, update the authoring guide in the later implementation item; otherwise no guide change is needed.

### Roadmap

Capture a separate implementation record only when the decision selects production changes.

## Discussion

### Framework neutrality

Browser text measurement would match a mounted font but makes View Model and server-side SVG output environment-dependent. A deterministic shared metric may be less exact yet more portable and testable.

### Token boundary

Insets and notch padding are plausible visual tokens because both renderers must agree. Glyph measurement is derived behaviour and should not become an authored option.

### Visual migration

The existing approximation has accepted output. Any replacement must show side-by-side fixtures and treat changed label or notch positions as an explicit visual migration rather than incidental cleanup.
