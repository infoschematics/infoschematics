---
id: INFOSCHEMATICS-TOOL-082
area: TOOL
title: The Library cannot make a Point
theme: design
horizon: now
status: ready
blocks: []
blocked_by: []
baseline_ref: 8c2a8c359ec0512820fe5b2bb2f7f0aeec879e4f
created_at: 2026-09-16T15:30:00Z
updated_at: 2026-09-16T20:30:00Z
---

# The Library cannot make a Point

## Goal

Let a Producer create a Point on the Diagram, so the one artefact kind Design can now move and remove is not also the one kind it cannot add.

## Context

`INFOSCHEMATICS-TOOL-063` gave a Point selection, pointer movement, keyboard movement, typed coordinates and removal with its Flows. It did not give it creation, and the Library's own types close the door explicitly: `packages/view-studio/src/app/editor/library.ts:116` declares its allocator over `Extract<ArtefactKind, 'card' | 'fabric' | 'flow'>`, and its template list, `libraryTemplates` at `:52-113`, seeds those three kinds only.

So a Point reaches the surface only by being authored in source. A Producer who wants a Flow to enter the Diagram from nowhere — an entry or exit Point, which is what the kind is for — has to leave Studio, edit the document, and come back.

Every other kind has some create path; a Point has none. There are two, and which one a Point belongs to is the first thing to settle. The Library at `library.ts:52-113` seeds Card, Fabric and Flow from templates carrying metadata and a default shape. Region and Graphic come from a separate factory path — `packages/view-studio/src/app/editor/artefact-factories.ts:11` declares `export type FactoryKind = Extract<ArtefactKind, 'graphic' | 'region'>` with its own allocator at `:14`. A Point has no template and no factory. Since a Point needs no default extent and no seeded content, the factory path is the closer fit despite this record's title.

Two more things to settle before building it. A Point has no extent, so the placement rules the Library applies to a box template have nothing to act on — `instantiateLibraryTemplate` at `library.ts:198-205` gates every non-flow seed on a non-empty Scope and on finite positive `width` and `height`, and both guards are meaningless for a coordinate. And a Point created with no Flow is a dot that means nothing: whether creation should offer to draw the Flow at the same time, or leave an isolated Point as a valid intermediate state, is the design question, not the plumbing.

## Boundary

`packages/view-studio` Library and its editor operations, plus whatever `packages/view-model` already exposes for a coordinate draft. No change to the document schema — a Point is already authorable.

## Steps

1. [ ] Decide whether a created Point stands alone or arrives with a Flow, and whether creation belongs on the Library path or the factory path. `ADR-INFOSCHEMATICS-031` left no question open here to fill in: line 61 settles non-creatability as an accepted consequence — "A Point is not creatable from the library" — so reversing it needs a superseding decision of its own, not an amendment to that paragraph. Note while writing it that the same line's closing claim, that Card, Fabric and Flow are "already in" that state, is true only of the factory path and reads as false against `library.ts:116`.
2. [ ] Widen whichever allocator step 1 chose to carry a coordinate geometry, without loosening the box path's placement guarantees.
3. [ ] Add the Library template and its identity prefix.
4. [ ] Cover creation in the Studio suite, and prove the case is not vacuous by removing the template.
5. [ ] Check the guide statement `INFOSCHEMATICS-SITE-028` will have written — that creating a Point means authoring it — and update it if this lands after it.

## Files touched

- `packages/view-studio/src/app/editor/library.ts` or `packages/view-studio/src/app/editor/artefact-factories.ts`, per step 1
- `packages/view-studio/src/app/editor/LibraryPanel.tsx`
- `packages/view-studio/src/app/editor/library.test.ts`
- `docs/decisions/ADR-INFOSCHEMATICS-032-<slug>.md` — new, if step 1 reverses `ADR-031`'s consequence

## Verify

- `bun run self:check`.
- A Point created from the Library appears where it was placed, and renders identically in static output.

## Dependencies / blocks

Follows `INFOSCHEMATICS-TOOL-063`, merged. Would make `INFOSCHEMATICS-SITE-028`'s creation sentence stale, so land the guide first or update it here.

## Documentation impact

### Specifications

Required if creation lands, and the corpus names the gap precisely. DESIGN-014 (`docs/specs/design-session.md:141`) lists what a Point must do — selectable, movable, property-editable, removable, reorderable — and creation is absent from that list while it is present for other kinds. EDIT-019 (`docs/specs/design-editing.md:207`) requires created artefacts to enter the complete editing lifecycle, and EDIT-013 (`:135`) governs Library creation producing independent authored values. Whichever path step 1 chooses, the Point joins the requirement that governs that path, and EDIT-008 (`:79`) — "Point MUST move as a coordinate and MUST NOT acquire box geometry" — is the constraint the new creation path must not break.

### Decision Records

`ADR-INFOSCHEMATICS-031:61` records non-creatability as an accepted consequence in so many words: "A Point is not creatable from the library." Reversing it takes a superseding record — `ADR-INFOSCHEMATICS-032` — not an edit to that paragraph. The same record should correct that line's closing claim, which reads as though Card, Fabric and Flow share one create path when the factory path at `packages/view-studio/src/app/editor/artefact-factories.ts:11` serves Graphic and Region instead.

### Guides

`apps/site/content/authoring.md` and `apps/site/content/studio.md` both tell a Producer that a Point arrives by authoring it. `INFOSCHEMATICS-SITE-028` is about to write that sentence; this item makes it false, which is the sequencing constraint recorded under dependencies.

## Batch exclusion

Excluded from `INFOSCHEMATICS-BATCH-018` on 2026-09-16. Step 1 would reverse `ADR-INFOSCHEMATICS-031:61`, which records non-creatability as an accepted consequence. One answer closes the item as a documented decision; the other makes it a feature with a superseding ADR. That is a boundary-changing answer, so it needs the owner first.

## Discussion

Found while verifying `TOOL-063`: the delivered interaction is complete for an authored Point, and the absence is creation rather than anything broken.
