---
id: INFOSCHEMATICS-TOOL-018
area: TOOL
title: Region surface treatments
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
---

# Region surface treatments

## Goal

Define the next bounded Region surface vocabulary for fills, frames, and diagram backgrounds without exposing raw renderer syntax or weakening cross-renderer parity.

## Context

Region currently supports one solid colour fill and solid, dashed, or dotted frames with opacity. The IBC diagram uses translucent Region fills over the blueprint Canvas surface as a de facto background system, but the product does not state how diagram surface, background Regions, and future treatments compose. Earlier shaping also mixed label metrics into this question; [Region label geometry](INFOSCHEMATICS-TOOL-042-region-label-geometry.md) now owns that independent decision.

## Boundary

This item decides the surface contract and captures implementation separately. It does not implement arbitrary SVG gradients, CSS, images, free-form paint servers, Region label geometry, or Studio controls. Any selected treatment must remain primitive serialisable data and preserve deterministic Canvas and static SVG output.

## Current state

The Domain Model owns optional Region fill, corner radius, and frame style and opacity. View Model resolves defaults and shared geometry. Canvas and static SVG have parity coverage for the existing vocabulary, while diagram-level appearance owns neutral or blueprint surface and grid treatments.

## Steps

- [ ] Catalogue concrete Region surface needs from current examples and reject ideas without a named audience or authoring outcome.
- [ ] Define composition order between diagram surface, grid, Region fill, Region frame, Card and Fabric surfaces, and focus treatments.
- [ ] Evaluate a small named treatment set for gradients, patterns, per-side rules, double frames, and background intent against serialisation, accessibility, theming, and static SVG portability.
- [ ] Select the smallest coherent addition or explicitly retain the current vocabulary, recording defaults, absence semantics, and renderer requirements.
- [ ] Add or update the durable decision and specification gaps, then capture a bounded implementation item only for the selected set.

## Files touched

- docs/decisions/
- docs/decisions/README.md
- docs/specs/domain-model.md
- docs/specs/view-model.md
- docs/specs/view-canvas.md
- docs/specs/render-svg.md
- docs/roadmap/

## Verify

Review the selected contract against neutral and blueprint examples, overlapping translucent Regions, focus dimming, print-safe static SVG, and absent appearance. Run ki repo audit --skill ki-work-roadmap --repo . and bun run self:check.

## Dependencies / blocks

The current appearance model, shared visual tokens, Region geometry resolver, and renderer parity tests have landed. Label geometry is deliberately split into [Region label geometry](INFOSCHEMATICS-TOOL-042-region-label-geometry.md) rather than a dependency.

## Documentation impact

### Decision Records

Add or update a decision defining surface composition and why each selected treatment belongs in the product vocabulary.

### Specifications

Update appearance requirements only for the selected contract and leave rejected candidates out of normative text.

### Guides

Defer new authoring examples until an implementation item lands; document unchanged vocabulary only if the decision retains it.

### Roadmap

Capture one implementation record for the selected treatment set, or close without follow-up if the present vocabulary remains sufficient.

## Discussion

### Surface composition

Background intent should not be inferred from a very large Region. The decision must state whether a first-class diagram background exists or whether Regions remain ordinary bounded artefacts layered over the Canvas surface.

### Vocabulary size

Named portable treatments are preferable to renderer-specific paint values. Each additional treatment must have the same semantics in Canvas and static SVG.

### Independent label work

Label measurement and notch geometry can change without adding a fill or frame. Keeping it in [Region label geometry](INFOSCHEMATICS-TOOL-042-region-label-geometry.md) avoids coupling typography decisions to surface vocabulary.
