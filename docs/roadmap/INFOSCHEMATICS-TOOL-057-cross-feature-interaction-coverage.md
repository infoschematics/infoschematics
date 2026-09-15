---
id: INFOSCHEMATICS-TOOL-057
area: TOOL
title: Cross-feature interaction coverage
theme: tool
horizon: next
status: ready
blocks: []
blocked_by: []
baseline_ref: null
created_at: 2026-09-15T05:19:55Z
updated_at: 2026-09-15T15:00:00Z
---

# Cross-feature interaction coverage

## Goal

Establish accepted requirements and coverage for what happens when two features are used together, so a feature that degrades another's usability fails a run rather than waiting to be noticed by hand.

## Context

The Specifications corpus verifies features in isolation. Across 170 requirements in 16 feature areas there are no cross-area requirement references at all: no requirement in any area constrains how its behaviour composes with another area's. Every requirement is individually conforming and the suite is green, yet nothing in that arrangement can observe two correct features combining into a worse experience.

This matters now because several items about to be delivered land on the same surfaces. Design interaction layers, multi-selection alignment, and the configurable design grid all change the Design editing surface and compete for the same gestures, selection semantics, and toolbar space. The Studio-backed playground changes the host those features run inside. Diagram dynamics and Scene signal treatments both add motion to the same Canvas. Each will be verified against its own feature area, and the combinations will not be verified anywhere.

## Boundary

This item does not add end-to-end tests of whole user journeys as a substitute for feature coverage, re-verify individual requirements, define usability as a matter of taste, or block feature work behind a new gate before the collisions are understood. Repointing stale evidence and resolving non-conforming requirements is separate work.

## Current state

188 requirements across 16 feature areas, and not one cross-area reference among them. Every area constrains its own behaviour in isolation; none constrains how that behaviour composes with another area's. The suite is green and each requirement is individually conforming, which is exactly the arrangement that cannot observe two correct features combining into a worse experience.

The contended surfaces are already identifiable. Design editing, multi-selection alignment, and the configurable design grid all take pointer gestures and keyboard bindings on the same Design surface. Diagram dynamics and Scene signal treatments both drive motion on the same Canvas. The docked panels and the Design toolbar compete for the same screen region. Nothing names those contentions, so nothing verifies them.

Browser tests exist in `packages/view-canvas`, `packages/view-studio`, and `apps/site`, run by `bun run test:browser`. That is the right home for composition cases, because these behaviours depend on real layering, pointer capture, and focus rather than on a simulated DOM.

## Steps

- [ ] Enumerate the contended resources — pointer gesture, keyboard binding, selection, screen region, render order, motion channel — and derive the feature pairs from them, so the matrix is small and each entry is justified by a resource two features share.
- [ ] Settle where a cross-feature requirement lives: a dedicated area with its own prefix, or sited in one owning area and referenced from the other. This is structural and blocks every requirement written after it.
- [ ] Run a manual exploration pass over the derived pairs and record each observed collision, since a collision is easier to notice than to specify.
- [ ] Write one requirement and one browser regression case per confirmed collision, each with an evidence line that resolves.
- [ ] Where a collision turns out to be a regression rather than a defect, state the property that was lost as the requirement, so it cannot be traded away silently a second time.

## Files touched

- `docs/specs/index.md` and either a new area file or the owning area files, depending on the structural decision
- Browser test files under `packages/view-canvas/src/` and `packages/view-studio/src/`
- `docs/decisions/` — one record for where cross-feature requirements live

## Verify

`bun run test:browser` covers each new composition case, and each case fails when the collision is reintroduced — assert that, rather than only that it passes today. `bun run self:verify:repo` confirms every new requirement's evidence path resolves.

## Dependencies / blocks

Nothing blocks the shaping. [Specification evidence integrity](INFOSCHEMATICS-TOOL-056-specification-evidence-integrity.md) makes the new evidence lines mechanically defended rather than trusted, and is worth landing first for that reason. The feature items that share these surfaces — Design point interactivity, the held and travelling element emphases, and Scene signal treatments — each gain a composition requirement from this item, so this item is more useful shaped before they land than after.

## Documentation impact

### Decision Records

One is needed. Where a cross-feature requirement lives is a structural choice about the corpus with two defensible answers, and the copies drift if the choice is left implicit.

### Specifications

This item is the specification change: a set of composition requirements that do not exist in any form today, possibly in a new area.

### Guides

None. No consumer-facing or contributor procedure changes; the requirements are verified by the existing browser suite.

### Roadmap

The feature items landing on these surfaces gain a composition requirement each, which is scope added to them rather than new items.

## Discussion

### Naming the compositions that matter

The useful unit is not "test everything against everything". It is the small set of pairs where two features contend for one resource: the same pointer gesture, the same keyboard binding, the same selection, the same screen region, the same rendering order, the same motion channel. Shaping should enumerate those contended resources and derive the pairs from them, which keeps the matrix small and justified.

### Where the requirements belong

A cross-feature requirement has no obvious home in a corpus organised one file per feature area, and duplicating it into both areas would let the copies drift. Shaping must decide whether these become a dedicated area with its own prefix, or requirements sited in one owning area and referenced from the other. This is the first structural question and should be settled before any requirement is written.

### Manual testing is the discovery instrument

A collision is easier to notice than to specify. Manual exploration should come first and feed this item: each observed collision becomes a named requirement and a regression case, so the finding is captured once and defended automatically thereafter. The rendered browser matrix is the natural home for the resulting cases, since these behaviours depend on real layering, pointer capture, and focus.

### Regression, not just defect

The suspicion prompting this item is that something used to be more usable than it is now. If that is borne out, the outcome is not only a fix but a requirement stating the property that was lost, so it cannot be traded away silently a second time.
