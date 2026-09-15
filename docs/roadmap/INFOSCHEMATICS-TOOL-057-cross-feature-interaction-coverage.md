---
id: INFOSCHEMATICS-TOOL-057
area: TOOL
title: Cross-feature interaction coverage
theme: tool
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-15T05:19:55Z
updated_at: 2026-09-15T05:19:55Z
---

# Cross-feature interaction coverage

## Goal

Establish accepted requirements and coverage for what happens when two features are used together, so a feature that degrades another's usability fails a run rather than waiting to be noticed by hand.

## Context

The Specifications corpus verifies features in isolation. Across 170 requirements in 16 feature areas there are no cross-area requirement references at all: no requirement in any area constrains how its behaviour composes with another area's. Every requirement is individually conforming and the suite is green, yet nothing in that arrangement can observe two correct features combining into a worse experience.

This matters now because several items about to be delivered land on the same surfaces. Design interaction layers, multi-selection alignment, and the configurable design grid all change the Design editing surface and compete for the same gestures, selection semantics, and toolbar space. The Studio-backed playground changes the host those features run inside. Diagram dynamics and Scene signal treatments both add motion to the same Canvas. Each will be verified against its own feature area, and the combinations will not be verified anywhere.

## Boundary

This item does not add end-to-end tests of whole user journeys as a substitute for feature coverage, re-verify individual requirements, define usability as a matter of taste, or block feature work behind a new gate before the collisions are understood. Repointing stale evidence and resolving non-conforming requirements is separate work.

## Discussion

### Naming the compositions that matter

The useful unit is not "test everything against everything". It is the small set of pairs where two features contend for one resource: the same pointer gesture, the same keyboard binding, the same selection, the same screen region, the same rendering order, the same motion channel. Shaping should enumerate those contended resources and derive the pairs from them, which keeps the matrix small and justified.

### Where the requirements belong

A cross-feature requirement has no obvious home in a corpus organised one file per feature area, and duplicating it into both areas would let the copies drift. Shaping must decide whether these become a dedicated area with its own prefix, or requirements sited in one owning area and referenced from the other. This is the first structural question and should be settled before any requirement is written.

### Manual testing is the discovery instrument

A collision is easier to notice than to specify. Manual exploration should come first and feed this item: each observed collision becomes a named requirement and a regression case, so the finding is captured once and defended automatically thereafter. The rendered browser matrix is the natural home for the resulting cases, since these behaviours depend on real layering, pointer capture, and focus.

### Regression, not just defect

The suspicion prompting this item is that something used to be more usable than it is now. If that is borne out, the outcome is not only a fix but a requirement stating the property that was lost, so it cannot be traded away silently a second time.
