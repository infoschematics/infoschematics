---
id: INFOSCHEMATICS-TOOL-018
area: TOOL
title: Region surface treatments
theme: tool
horizon: next
status: awaiting-review
blocks: []
blocked_by: []
baseline_ref: 763e5ae42c8422deefaf74d724357579bdf8ffb5
---

# Region surface treatments

## Goal

Define the next bounded Region surface vocabulary for fills, frames, and diagram backgrounds without exposing raw renderer syntax or weakening cross-renderer parity.

## Context

Region currently supports one solid colour fill and solid, dashed, or dotted frames with opacity. The IBC diagram uses translucent Region fills over the blueprint Canvas surface as a de facto background system, but the product does not state how diagram surface, background Regions, and future treatments compose. Earlier shaping also mixed label metrics into this question; [Region label geometry](INFOSCHEMATICS-TOOL-042-region-label-geometry.md) now owns that independent decision.

## Boundary

This item decides the surface contract and captures implementation separately. It does not implement arbitrary SVG gradients, CSS, images, free-form paint servers, Region label geometry, or Studio controls. Any selected treatment must remain primitive serialisable data and preserve deterministic Canvas and static SVG output.

## Current state

The Domain Model owns optional Region fill, corner radius, and frame style and opacity. Current examples use only solid translucent fills, optional solid, dashed, or dotted frames, and neutral or blueprint diagram surfaces with authored grids. Canvas and static SVG already paint the backdrop, grid, Regions, and remaining elements in that order with parity coverage.

## Steps

- [x] Catalogue concrete Region surface needs from current examples and reject ideas without a named audience or authoring outcome.
- [x] Define composition order between diagram surface, grid, Region fill, Region frame, Card and Fabric surfaces, and focus treatments.
- [x] Evaluate a small named treatment set for gradients, patterns, per-side rules, double frames, and background intent against serialisation, accessibility, theming, and static SVG portability.
- [x] Select the smallest coherent addition or explicitly retain the current vocabulary, recording defaults, absence semantics, and renderer requirements.
- [x] Add or update the durable decision and specification gaps, then capture a bounded implementation item only for the selected set.

## Files touched

- `docs/decisions/ADR-INFOSCHEMATICS-011-separate-authored-appearance-from-output-detail.md`
- `docs/specs/appearance.md`
- `docs/roadmap/INFOSCHEMATICS-TOOL-018-region-fill-frame-and-background-variety.md`

## Verify

Review the selected contract against neutral and blueprint examples, overlapping translucent Regions, focus dimming, print-safe static SVG, and absent appearance. Run ki repo audit --skill ki-work-roadmap --repo . and bun run self:check.

## Dependencies / blocks

The current appearance model, shared visual tokens, Region geometry resolver, and renderer parity tests have landed. Label geometry is deliberately split into [Region label geometry](INFOSCHEMATICS-TOOL-042-region-label-geometry.md) rather than a dependency.

## Documentation impact

### Decision Records

Update ADR-INFOSCHEMATICS-011 with the surface composition order and the boundary of the retained portable vocabulary.

### Specifications

Add APPEAR-015 for surface composition and remove the now-resolved Region-treatment candidate from Gaps.

### Guides

No guide change is required because the authoring vocabulary remains unchanged.

### Roadmap

No implementation record is required because the present vocabulary remains sufficient.

## Review

### Delivered

Completed the approved decision boundary from baseline `763e5ae42c8422deefaf74d724357579bdf8ffb5`. The work catalogued current example needs, defined surface composition, assessed the proposed treatment families, and retained the existing portable vocabulary without adding schema or renderer behaviour.

### Summary of changes

Extended ADR-INFOSCHEMATICS-011 with the backdrop, grid, Region, and foreground composition order and the explicit exclusion of unproven paint features. Added APPEAR-015 with current Canvas/static-SVG evidence and removed the resolved Region-treatment candidate from the appearance Gaps.

### Verification

`ki repo audit --skill ki-decision-records --repo .`, `ki repo audit --skill ki-specs --repo .`, and `ki repo audit --skill ki-work-roadmap --repo .` passed. `bun run self:check` passed all tests, type checks, dependency checks, package builds, and the production Site build.

### Outstanding concerns

None within the approved boundary. Region label measurement remains independently tracked by INFOSCHEMATICS-TOOL-042 and responsive density by INFOSCHEMATICS-TOOL-039.

### Post-change review

The result establishes a deterministic cross-renderer surface contract without adding unsupported authoring choices. Existing documents remain valid and require no migration; the only risk is documentation drift, covered by the feature specification and existing parity tests.

### Mini recap

The diagram surface is the background, its grid sits above it, Regions follow in authored order, and ordinary diagram elements follow Regions. The existing serialisable Region treatment vocabulary is sufficient.

## Discussion

### Surface composition

Background intent should not be inferred from a very large Region. The decision must state whether a first-class diagram background exists or whether Regions remain ordinary bounded artefacts layered over the Canvas surface.

The diagram surface remains the first-class background. Renderers paint the authored grid over it, then Regions in authored order; each Region paints fill, frame, and label before Fabrics, Cards, Flows, and Overlays. Focus and editing treatments are transient overlays and do not change the authored composition.

### Vocabulary size

Named portable treatments are preferable to renderer-specific paint values. Each additional treatment must have the same semantics in Canvas and static SVG.

No current example or audience task requires gradients, image fills, arbitrary patterns, per-side rules, or double frames. Adding them would expand validation, accessible contrast handling, theme behaviour, and static SVG definitions without a demonstrated authoring outcome, so the current vocabulary is retained.

### Independent label work

Label measurement and notch geometry can change without adding a fill or frame. Keeping it in [Region label geometry](INFOSCHEMATICS-TOOL-042-region-label-geometry.md) avoids coupling typography decisions to surface vocabulary.
