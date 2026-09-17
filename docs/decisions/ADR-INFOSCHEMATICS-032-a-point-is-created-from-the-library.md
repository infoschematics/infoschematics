---
id: ADR-INFOSCHEMATICS-032
title: A Point is created from the Library
date: 2026-09-17
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [ADR-INFOSCHEMATICS-031]
---

# ADR-INFOSCHEMATICS-032: A Point is created from the Library

## Context

[`ADR-INFOSCHEMATICS-031`](ADR-INFOSCHEMATICS-031-a-point-is-its-own-artefact-kind.md) made a [Point](../reference/vocabulary.md#point) a sixth artefact kind and accepted, as a consequence, that it would not be creatable: "A Point is not creatable from the library." Everything else that record decided stands. This record reverses that one consequence and corrects the claim it closes with.

The consequence left [Design](../reference/vocabulary.md#design) able to select, move, re-coordinate, reorder and remove a Point but not to add one, which is the only kind in that position. A Producer who wants a [Flow](../reference/vocabulary.md#flow) to enter the Diagram from nowhere — the thing the kind exists for — has to leave Studio, edit the document and come back.

The closing claim, that Card, Fabric and Flow are "already in" the same state, is not true. Those three are seeded from `libraryTemplates` in `packages/view-studio/src/app/editor/library.ts`; it is Graphic and Region that come from the separate factory path in `packages/view-studio/src/app/editor/artefact-factories.ts`. The record read the factory path's `Extract<ArtefactKind, 'graphic' | 'region'>` as the whole create surface when it is one of two.

Two create paths therefore exist, and a Point had to join one of them. The obvious argument points at the factory path: a Point needs no default extent and no seeded content, which is exactly what a template carries and a factory does not.

## Decision

A Point is created from the **Library** path, as a template like a Card's, and a created Point **stands alone** — creation does not also draw a Flow.

The path follows from identity, not from extent. `PointConfig` requires a `code` and a `scopes` list. The factory path allocates `FactoryIdentity = Readonly<{ code: null; id: string }>`, because a Graphic and a Region have no code and no Scope; the Library path allocates a code from a per-kind prefix and applies the current Scope. A Point is a coded, Scoped artefact, so the factory path would have had to grow the one thing it deliberately does not have. Extent is the weaker axis: a template with no box is a smaller change than an allocator with no code.

The prefix is `PNT`, beside `CRD`, `FAB` and `FLW`.

A created Point stands alone because a Point with no Flow attached is already a valid document — the schema attaches nothing to it, and the authoring guide says so in as many words. Creation that produced an invalid document until a second operation completed it would make an isolated Point a state the product forbids while the format allows it, and would put two artefacts behind one undo. Connecting the Point is the Flow template's job, and that template is already in the Library.

The placement guards stay as strict as they were. `instantiateLibraryTemplate` gated every non-flow seed on a finite positive `width` and `height`; that guard is now stated over the two box kinds by name rather than as "not a flow", so a coordinate seed is not measured for an extent it does not have. A Point seed is still gated on a non-empty Scope and on the finite landing position every seed is gated on.

## Consequences

`DESIGN-014`'s six-kind contract gains creation for the Point, and `EDIT-013`'s Library requirement covers a fourth kind, so a Point now enters the complete editing lifecycle `EDIT-019` requires rather than most of it.

`EDIT-008` is untouched by this: the created value carries a coordinate and no box, and `ResizeArtefactOperation` still cannot name a Point. The create operation and the draft applier needed no change at all — `packages/view-model/src/artefact-draft.ts` already inserted a created Point into `definition.points`, because `CreateArtefactOperation<'point'>` was writable from the day the kind was added. Only Studio's picker was missing.

`submitOperation` in `packages/view-studio/src/app/editor/ArtefactControls.tsx` loses the comment explaining that a `point` case could not exist and gains the case. That comment was accurate when written and is the clearest signal of what changed here.

A Producer can now create a Point with no Flow, which is a dot on the surface that means nothing until one is drawn. That is accepted: the same is true of a Card with no Flow, and the alternative is a product that refuses a document the format accepts.

Both guides that tell a Producer a Point arrives by authoring it — `apps/site/content/authoring.md` and `apps/site/content/studio.md` — become wrong on delivery and are corrected in the same change.
