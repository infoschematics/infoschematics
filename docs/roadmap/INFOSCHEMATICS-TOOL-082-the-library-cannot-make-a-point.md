---
id: INFOSCHEMATICS-TOOL-082
area: TOOL
title: The Library cannot make a Point
theme: design
horizon: triage
status: draft
blocks: []
blocked_by: []
baseline_ref: 83fa1a84
created_at: 2026-09-16T15:30:00Z
updated_at: 2026-09-16T15:30:00Z
---

# The Library cannot make a Point

## Goal

Let a Producer create a Point on the Diagram, so the one artefact kind Design can now move and remove is not also the one kind it cannot add.

## Context

`INFOSCHEMATICS-TOOL-063` gave a Point selection, pointer movement, keyboard movement, typed coordinates and removal with its Flows. It did not give it creation, and the Library's own types close the door explicitly: `packages/view-studio/src/app/editor/library.ts:116` declares its allocator over `Extract<ArtefactKind, 'card' | 'fabric' | 'flow'>`, and its template list at `:22-111` seeds those three kinds only.

So a Point reaches the surface only by being authored in source. A Producer who wants a Flow to enter the Diagram from nowhere — an entry or exit Point, which is what the kind is for — has to leave Studio, edit the document, and come back. Every other placeable kind can be started from the Library.

Two things to settle before building it. A Point has no extent, so the placement rules the Library applies to a box template (default size, collision nudge, Scope membership) have nothing to act on: what a fresh Point needs is a coordinate and an identity. And a Point created with no Flow is a dot that means nothing — whether creation should offer to draw the Flow at the same time, or leave an isolated Point as a valid intermediate state, is the design question, not the plumbing.

## Boundary

`packages/view-studio` Library and its editor operations, plus whatever `packages/view-model` already exposes for a coordinate draft. No change to the document schema — a Point is already authorable.

## Steps

1. [ ] Decide whether a created Point stands alone or arrives with a Flow, and record the reason wherever `ADR-INFOSCHEMATICS-031` left the question open.
2. [ ] Widen the Library allocator and template seed to carry a coordinate geometry, without loosening the box path's placement guarantees.
3. [ ] Add the Library template and its identity prefix.
4. [ ] Cover creation in the Studio suite, and prove the case is not vacuous by removing the template.
5. [ ] Check the guide statement `INFOSCHEMATICS-SITE-028` will have written — that creating a Point means authoring it — and update it if this lands after it.

## Files touched

- `packages/view-studio/src/app/editor/library.ts`
- `packages/view-studio/src/app/editor/LibraryPanel.tsx`
- `packages/view-studio/src/app/editor/library.test.ts`

## Verify

- `bun run self:check`.
- A Point created from the Library appears where it was placed, and renders identically in static output.

## Dependencies / blocks

Follows `INFOSCHEMATICS-TOOL-063`, merged. Would make `INFOSCHEMATICS-SITE-028`'s creation sentence stale, so land the guide first or update it here.

## Discussion

Found while verifying `TOOL-063`: the delivered interaction is complete for an authored Point, and the absence is creation rather than anything broken.
