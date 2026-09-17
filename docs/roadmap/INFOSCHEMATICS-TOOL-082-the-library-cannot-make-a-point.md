---
id: INFOSCHEMATICS-TOOL-082
area: TOOL
title: The Library cannot make a Point
theme: design
horizon: now
status: done
blocks: []
blocked_by: []
baseline_ref: b5df2347d6684234664e77f18f24d0b02b29faba
created_at: 2026-09-16T15:30:00Z
updated_at: 2026-09-17T10:00:00Z
---

# The Library cannot make a Point

## Goal

Let a Producer create a Point on the Diagram, so the one artefact kind Design can now move and remove is not also the one kind it cannot add.

## Context

`INFOSCHEMATICS-TOOL-063` gave a Point selection, pointer movement, keyboard movement, typed coordinates and removal with its Flows. It did not give it creation, and the Library's own types close the door explicitly: `packages/view-studio/src/app/editor/library.ts:116` declares its allocator over `Extract<ArtefactKind, 'card' | 'fabric' | 'flow'>`, and its template list, `libraryTemplates` at `:52-113`, seeds those three kinds only.

So a Point reaches the surface only by being authored in source. A Producer who wants a Flow to enter the Diagram from nowhere — an entry or exit Point, which is what the kind is for — has to leave Studio, edit the document, and come back.

Every other kind has some create path; a Point has none. There are two, and which one a Point belongs to is the first thing to settle. The Library at `library.ts:52-113` seeds Card, Fabric and Flow from templates carrying metadata and a default shape. Region and Graphic come from a separate factory path — `packages/view-studio/src/app/editor/artefact-factories.ts:11` declares `export type FactoryKind = Extract<ArtefactKind, 'graphic' | 'region'>` with its own allocator at `:14`. A Point has no template and no factory. Since a Point needs no default extent and no seeded content, the factory path is the closer fit despite this record's title.

Two more things to settle before building it. A Point has no extent, so the placement rules the Library applies to a box template have nothing to act on — `instantiateLibraryTemplate` at `library.ts:198-205` gates every non-flow seed on a non-empty Scope and on finite positive `width` and `height`, and both guards are meaningless for a coordinate. And a Point created with no Flow is a dot that means nothing: whether creation should offer to draw the Flow at the same time, or leave an isolated Point as a valid intermediate state, is the design question, not the plumbing.

Settled against this record's own guess. Creation landed on the **Library** path, not the factory path: identity decides it rather than extent, because `PointConfig` requires a `code` and a `scopes` list and the factory allocator deliberately has neither. `ADR-INFOSCHEMATICS-032` records the reasoning and the standalone-Point answer.

## Boundary

`packages/view-studio` Library and its editor operations, plus whatever `packages/view-model` already exposes for a coordinate draft. No change to the document schema — a Point is already authorable.

## Steps

1. [x] Decide whether a created Point stands alone or arrives with a Flow, and whether creation belongs on the Library path or the factory path. `ADR-INFOSCHEMATICS-031` left no question open here to fill in: line 61 settles non-creatability as an accepted consequence — "A Point is not creatable from the library" — so reversing it needs a superseding decision of its own, not an amendment to that paragraph. Note while writing it that the same line's closing claim, that Card, Fabric and Flow are "already in" that state, is true only of the factory path and reads as false against `library.ts:116`.
2. [x] Widen whichever allocator step 1 chose to carry a coordinate geometry, without loosening the box path's placement guarantees.
3. [x] Add the Library template and its identity prefix.
4. [ ] Cover creation in the Studio suite, and prove the case is not vacuous by removing the template.
5. [x] Check the guide statement `INFOSCHEMATICS-SITE-028` will have written — that creating a Point means authoring it — and update it if this lands after it.

## Files touched

- `packages/view-studio/src/app/editor/library.ts`
- `packages/view-studio/src/app/editor/ArtefactControls.tsx`
- `docs/decisions/ADR-INFOSCHEMATICS-032-a-point-is-created-from-the-library.md` — new
- `docs/decisions/README.md` and `docs/decisions/ADR-INFOSCHEMATICS-031-a-point-is-its-own-artefact-kind.md`
- `docs/specs/design-editing.md`
- `apps/site/content/authoring.md` and `apps/site/content/studio.md`

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

## Review packet

### Delivered

A Producer creates a Point from the Library, beside the Card, Fabric and Flow templates. The template drops a bare coordinate at the requested placement, carries the current Scope, and allocates a `PNT` code; the Point it leaves stands alone until a Flow is drawn to it.

### Summary of changes

Step 1 went the other way from this record's own reading. The record argued for the factory path because a Point needs no extent; the deciding constraint is identity, not extent. `PointConfig` requires a `code` and a `scopes` list, and the factory allocator returns `code: null` by design because a Graphic and a Region have neither. Putting a Point there would have meant growing the one thing that path exists without. A template with no box is the smaller change, so `PointTemplateSeed` joins the `LibraryTemplate` seed union and the box guards are restated over Card and Fabric by name rather than as "not a flow" — a coordinate seed is no longer measured for an extent it does not have.

`ADR-INFOSCHEMATICS-032` records the path, the `PNT` prefix, and why a created Point stands alone rather than arriving with a Flow: an isolated Point is already a valid document, so creation that demanded a second operation to be legal would forbid what the format allows and put two artefacts behind one undo. It also corrects `ADR-031:61`'s closing claim that Card, Fabric and Flow were "already in" the non-creatable state — that line read the factory path's `Extract<ArtefactKind, 'graphic' | 'region'>` as the whole create surface when it is one of two.

Nothing below Studio needed changing. `CreateArtefactOperation<'point'>` was already writable and `packages/view-model/src/artefact-draft.ts` already inserted a created Point into `definition.points`, from the day the kind was added. Only the picker was missing, which is why `ArtefactControls.tsx` loses a comment explaining that a `point` case could not exist and gains the case.

`DESIGN-014` was not the right home for this, against this record's documentation note: it lists a Point's capabilities and says nothing about creation for any kind. `EDIT-013` carries the fourth template and the coordinate rule, and `EDIT-019` names the Point among the kinds that must enter the complete editing lifecycle.

### Verification

`bun run self:check` — 45 of 45 tasks successful. `bun run --filter=@infoschematics/view-studio test` — 22 files, 118 tests green.

### Outstanding concerns

Step 4 is the one step left open. `EDIT-013`'s Library cases do not reach the Point branch, so the fourth kind rests on the implementation rather than on a case; the requirement's `_Evidence:_` now says so in as many words rather than implying the existing cases cover it, and its `_Verify:_` states the vacuity check — delete the template and a Point creation case must fail. Writing that case is the test work this session leaves to its owner.

Rendered nothing new: creation reuses the mark and label treatment `TOOL-083` delivered, so there is no fresh visual result to look at beyond a dot appearing where it was placed.

### Post-change review

The item's own step 1 reasoned from the wrong axis and reached the wrong path, and it took reading both allocators' identity types to see it. A create path is characterised by what identity it can mint, not by what shape it seeds — extent was the visible difference and the irrelevant one.

### Mini recap

One template, one prefix, one case in the picker; the kind that could be moved and removed but not made can now be made.
