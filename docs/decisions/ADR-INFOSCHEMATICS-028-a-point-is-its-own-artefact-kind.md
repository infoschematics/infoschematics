---
id: ADR-INFOSCHEMATICS-028
title: A Point is its own artefact kind
date: 2026-09-17
status: current
decision_type: architecture
decision_type_url: https://knowledgeislands.info/specifications/decision-records/adr
decision_depends_on: [KDR-INFOSCHEMATICS-001, ADR-INFOSCHEMATICS-025]
---

# ADR-INFOSCHEMATICS-028: A Point is its own artefact kind

## Context

`ArtefactKind` in `packages/view-model/src/editable.ts` had five members: Region, Fabric, Card, Flow and Graphic. A [Point](../reference/vocabulary.md#point) was not among them, so [Design](../reference/vocabulary.md#design) could not reach one. The gap was wider than a missing enum member: the interactive Canvas never read `infoschematicPoints` at all, so a Point was not drawn on the working surface, and no document in the repository authored one — the only Point fixture in the tree was a unit test in `packages/render-svg`.

Four stated requirements already described the behaviour that absence denied. [`DESIGN-014`](../specs/design-session.md) states the six-kind contract and was recorded `divergent` because of Point. [`DESIGN-018`](../specs/design-session.md) recorded the Point [interaction layer](../reference/vocabulary.md#interaction-layer) as vacuously filterable. [`EDIT-008`](../specs/design-editing.md) states that a Point moves as a coordinate and must not acquire box geometry. [`APPEAR-012`](../specs/appearance.md) claimed Canvas exposes identity for all six kinds, while its evidence test looped over five.

So the question was not whether a Point should be reachable. It was what a Point _is_ to the editing contract, and there were two defensible answers.

A Point could be a sixth `ArtefactKind` with a geometry role of its own. Every kind Design reached had a box, and the contract had that assumption written into it in four places: `artefactResizeMinimums` is typed for every non-Flow kind, `groupMovableSelection` filtered on `geometry === 'box'`, `Placement` had no coordinate case, and `moveGeometry` reads `geometry.box`. Admitting a Point means introducing a third geometry role and answering, at each of those sites, what the operation means for something with no extent.

Or a Point could be an addressable part of the Flow that owns it — no independent geometry, no layer of its own, edited through the Flow's endpoint tools. That answer needs no third geometry role and no new capability row. It is materially cheaper.

A second question follows the first. Studio has two create paths, and a kind has to join one of them: `libraryTemplates` in `packages/view-studio/src/app/editor/library.ts` seeds a Card, a Fabric and a Flow, while the separate factory path in `packages/view-studio/src/app/editor/artefact-factories.ts` makes a Graphic and a Region. The obvious argument points at the factory path, since a Point needs no default extent and no seeded content, which is exactly what a template carries and a factory does not.

## Decision

A Point is a sixth `ArtefactKind`, with its own `PointGeometry` role carrying a coordinate rather than a box. It is created from the **Library** path, as a template like a Card's, and a created Point **stands alone** — creation does not also draw a Flow.

The canonical vocabulary decides the kind. [`KDR-INFOSCHEMATICS-001`](KDR-INFOSCHEMATICS-001-product-vocabulary.md) states that an Infoschematic contains exactly six visible element types and names Point as one of them, and in the same paragraph names what is _not_ an element type: "Routes, Waypoints and Ports describe Flow geometry; they are not additional element types." A Point is deliberately absent from that exclusion list, and the sentence that closes it — "Behaviour determines an artefact kind, not merely how it looks" — is the test to apply. Making a Point part of a Flow would move it into a category the vocabulary explicitly reserves for Flow geometry, and `ArtefactKind` is the editing contract's projection of that vocabulary. It cannot hold five members while the vocabulary holds six.

The authored data agrees, and settles the part the vocabulary leaves implicit. Three properties of the authored shape make the Flow-part answer unworkable rather than merely inconsistent:

- A Point carries `ports?: PortCounts` (`packages/domain-core/src/schema.ts`, `packages/domain-model/src/model.ts`). Several Flows may attach to one Point at distinct ports, so there is no single owning Flow to be a part of. The Flow-part answer has no answer for a Point with two Flows on it.
- `points:` is `optional()` in the schema and requires no referencing Flow. A Point with no Flow attached is valid authored data, and under the Flow-part answer it would be unreachable — authored, drawn, and uneditable.
- A Point has its own `id`, `label` and `appearance`. Those are properties of the Point, not of any Flow, and `packages/domain-core/src/serialise.ts` keeps `points:` as its own collection in canonical order between `fabrics:` and `regions:`.

The static renderer has been treating a Point as an artefact in its own right since it was written: `packages/render-svg/src/index.ts` emits each Point as a `<g>` carrying `data-artefact-id` and `data-artefact-kind="point"`, which is the identity contract `APPEAR-012` and the `STATIC` requirements read. `apps/site/src/InlineSvgReference.tsx` already lists `point` among six inline SVG artefact kinds and Site already publishes a Points component page. The Flow-part answer would orphan all of that.

`EDIT-008`'s rule is therefore honoured directly rather than by exception: the role is `{ role: 'point'; at: Point }`, a Point never acquires a box, `artefactCapabilities.point` grants move without resize, and `artefactResizeMinimums` is `Exclude<ArtefactKind, 'flow' | 'point'>` so the type system refuses to hold a resize minimum for something with no extent.

### The create path follows identity, not extent

`PointConfig` requires a `code` and a `scopes` list. The factory path allocates `FactoryIdentity = Readonly<{ code: null; id: string }>`, because a Graphic and a Region have no code and no Scope; the Library path allocates a code from a per-kind prefix and applies the current Scope. A Point is a coded, Scoped artefact, so the factory path would have had to grow the one thing it deliberately does not have. Extent is the weaker axis: a template with no box is a smaller change than an allocator with no code. The prefix is `PNT`, beside `CRD`, `FAB` and `FLW`.

A created Point stands alone because a Point with no Flow attached is already a valid document — the schema attaches nothing to it, and the authoring guide says so in as many words. Creation that produced an invalid document until a second operation completed it would make an isolated Point a state the product forbids while the format allows it, and would put two artefacts behind one undo. Connecting the Point is the Flow template's job, and that template is already in the Library.

The placement guards stay as strict as they were. `instantiateLibraryTemplate` gated every non-flow seed on a finite positive `width` and `height`; that guard is stated over the two box kinds by name rather than as "not a flow", so a coordinate seed is not measured for an extent it does not have. A Point seed is still gated on a non-empty Scope and on the finite landing position every seed is gated on.

### Group participation

A Point takes part in both align and distribute, represented to a group geometry operation as a zero-extent box at its coordinate.

`DESIGN-020` reads participation out of the capability matrix — "Only kinds the capability matrix records as movable MAY take part in a group geometry operation" — and a Point is movable. That is a ceiling rather than a floor, so excluding a Point would have conformed; the reason not to exclude it is that the existing arithmetic is already correct for a zero-extent participant, and no special case is needed to make it so.

Align is unambiguous. `alignedOffset` computes each edge from `box.x`, `box.width` and their vertical counterparts, so for a zero-extent box every one of the six edges and centre lines resolves to the Point's own coordinate. Aligning a Point left, right or to the horizontal centre all put its coordinate on the anchor's named line, the anchor's own offset stays zero, and the operation stays idempotent.

Distribute is well defined too, which is the part worth writing down because it was expected not to be. `distributeOffsets` equalises the gaps between participants, with `occupied` summing the sizes and `gap = (span - occupied) / (n - 1)`. A zero-width participant contributes nothing to `occupied` and one share to the divisor, which is exactly what equalising gaps around a thing with no width means. Two Cards at `x: 0, w: 100` and `x: 300, w: 100` with a Point between them yield `gap = 100`, the two Cards stay where they are as required, and the Point lands at `x: 200` — one gap clear of each. Three Points alone distribute to even spacing by the same route, because for zero-extent elements gap spacing and centre spacing coincide.

So participation costs nothing and buys a real authoring want: a column of entry Points lined up down a diagram's edge, or spaced evenly against the Cards they feed. `groupMovableSelection` accordingly excludes route geometry rather than filtering on `geometry === 'box'`, which is what it always meant — a Flow has no single extent to align — and `groupMovements` in `use-editor.ts` projects a Point's coordinate into the zero-extent box the arithmetic consumes while keeping the real `PointGeometry` on the operation it records.

## Consequences

`DESIGN-014`'s six-kind contract is `conforming` and covers creation for the Point, `DESIGN-018`'s vacuous-Point paragraph is gone, `DESIGN-015`'s minimum rendered matrix carries the Point cases, `EDIT-008`'s evidence is refreshed, `EDIT-013`'s Library requirement covers a fourth kind, and `APPEAR-012`'s six-kind identity claim is earned by a six-kind loop rather than asserted over five. A Point enters the complete editing lifecycle `EDIT-019` requires rather than most of it.

The third geometry role is the cost, and it is paid at every exhaustive site the compiler names: `artefactCapabilities`, `artefactKinds`, `ArtefactValueByKind`, `kindDependencyOrder`, `valuesForKind`, `layerControls`, `collectionName`, `collection`, `describeArtefactGeometry` and `submitOperation`. That the compiler enumerates them is the point of having the contract be exhaustive records rather than open maps; a fourth role later will be found the same way.

`Placement` carries a `coordinate` case so the Properties panel can state `x` and `y` and offer no width or height. That is a panel case rather than a box with two axes suppressed, so nothing in the panel has to decide whether an absent extent is zero or unknown.

`EDIT-008` is untouched by creation: the created value carries a coordinate and no box, and `ResizeArtefactOperation` still cannot name a Point. The create operation and the draft applier needed no change — `packages/view-model/src/artefact-draft.ts` inserts a created Point into `definition.points`, because `CreateArtefactOperation<'point'>` was writable from the day the kind was added.

A Producer can create a Point with no Flow, which is a dot on the surface that means nothing until one is drawn. That is accepted: the same is true of a Card with no Flow, and the alternative is a product that refuses a document the format accepts.

The size of the thing is the residual risk, and it is not a type-system risk. The static renderer paints a Point at radius 6 in diagram units, which at a typical Playground fit is a handful of screen pixels — smaller than the grid it snaps to and well under any reasonable target size. Canvas therefore draws a transparent hit target wider than the paint, following the precedent `DESIGN-011` sets for a Flow's stroke, and a rendered case resolves an offset press through `elementFromPoint` so that the target is proven reachable rather than merely present. No unit test can say whether a person can reliably take the Point they meant, or separate two Points sitting eight units apart; that remains a question for a rendered surface and a human looking at it.
