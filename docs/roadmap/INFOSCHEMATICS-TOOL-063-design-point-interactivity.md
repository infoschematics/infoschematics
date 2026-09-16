---
id: INFOSCHEMATICS-TOOL-063
area: TOOL
title: Point interactivity in Design
theme: tool
horizon: now
status: ready
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-066]
baseline_ref: null
created_at: 2026-09-15T12:10:00Z
updated_at: 2026-09-16T10:45:00Z
---

# Point interactivity in Design

## Goal

Give a [Point](../reference/vocabulary.md#point) the Design interaction `DESIGN-014` already promises it, so a Producer can select, move, and edit one on the Diagram rather than only through authored source.

## Context

Found while delivering Design interaction layers (`INFOSCHEMATICS-TOOL-045`, delivered). That item put one [interaction layer](../reference/vocabulary.md#interaction-layer) behind every artefact kind Design can reach and found there were five, not six.

Reading the tree now, the gap is wider than that item recorded. A Point is not an uninteractive drawing on the Canvas: the interactive Canvas does not draw one at all. `packages/render-svg` draws a Point in static output, `packages/domain-core` validates and round-trips an authored `points:` array, and the domain model already accepts a Point as a Flow endpoint — but `packages/view-canvas` never reads `infoschematicPoints`, and no document in the repository authors a Point, so there is currently nowhere a Producer or a reviewer can see one outside a static export.

`DESIGN-014` states the six-kind contract including Point and is recorded `divergent` because of it. `DESIGN-018` records the Point layer as vacuously filterable. `EDIT-008` states that a Point moves as a coordinate and must not acquire box geometry. `APPEAR-012` claims Canvas exposes identity for all six kinds, and its evidence test loops over five. The gap is therefore a stated behaviour that is not delivered, in four places, rather than a term without a plan.

## Boundary

This item makes a Point a first-class Design element: drawn on the interactive Canvas, selectable, movable, property-editable, removable, reorderable, and filterable by its own interaction layer. Drawing it in Canvas is inside the boundary, because there is nothing to interact with otherwise.

It does not change the authored shape of a Point, its static rendering, its treatment in Present beyond being drawn, or the capability row the matrix already declares for it: no box resize, because a Point has no box. It does not add a Point creation tool to the library or factory surfaces; `create` is declared in the capability row but the factories are `Extract<ArtefactKind, 'graphic' | 'region'>` today and stay that way.

## Current state

- `packages/view-model/src/editable.ts:84` declares `ArtefactKind` as `'region' | 'fabric' | 'card' | 'flow' | 'graphic'`. `ArtefactSelection` at `:92` gives four of them `geometry: 'box'` and the Flow `geometry: 'route'`; `artefactCapabilities` at `:115` and `artefactKinds` at `:127` carry the same five; `ArtefactGeometry` at `:232` is exactly `BoxGeometry | RouteGeometry`. The word `point` appears in the file only as the imported coordinate type.
- `packages/view-canvas/src/InfoschematicDiagram.tsx` does not render a Point. The only reader of `infoschematicPoints` in the repository is `packages/render-svg/src/index.ts:281`, alongside the publisher at `packages/view-model/src/runtime.ts:694`. `packages/view-canvas/src/styles.css` has no Point rule at all — every `point` in that file is `pointer-events` or `cursor: pointer`.
- `packages/render-svg/src/index.ts:857`–`880` draws a Point as a circle of radius `canvasTokens.geometry.pointRadius` (6 diagram units) carrying `data-artefact-id` and `data-artefact-kind="point"`. That is the treatment the interactive Canvas has to match, and the 6-unit radius is the size problem in concrete form.
- Authoring a Point is already complete. `packages/domain-core/src/schema.ts:531` accepts `points:`, `packages/domain-core/src/serialise.ts:18` keeps it in canonical order, `packages/domain-model/src/point.ts` defines the authored `PointConfig` (`code`, `label`, `scopes`, `point`, optional `ports`), and `packages/domain-model/src/model.ts:66` puts `definition.points` into the endpoint set, so a Flow may already attach to one.
- No document in the tree authors a Point. Neither `examples/is-infoschematics/infoschematic.yaml` nor `examples/is-infoschematics/overview.yaml` nor either seed under `apps/site/src/playground/seeds/` has a `points:` key; the only Point fixture anywhere is `packages/render-svg/src/index.test.ts:216`–`221`. Delivery has to author one before it can look at anything.
- Adding `'point'` to `ArtefactKind` fails the typecheck at every site that must answer for it, because each is an exhaustive `Record` or `switch`: `artefactCapabilities` (`editable.ts:115`), `artefactKinds` (`:127`), `ArtefactValueByKind` (`:234`), `kindDependencyOrder` (`:645`), `valuesForKind` (`packages/view-model/src/artefact-draft.ts:151`), `layerControls` (`packages/view-studio/src/app/editor/EditorTools.tsx:44`), `collectionName` (`packages/view-studio/src/app/editor/document-operations.ts:35`), `collection` (`document-operations.ts:45`), `describeArtefactGeometry` (`packages/view-studio/src/app/editor/ArtefactControls.tsx:54`) and `submitOperation` (`ArtefactControls.tsx:64`). That list is the work, and the compiler enumerates it.
- `editable.ts:292` types `artefactResizeMinimums` as `Record<Exclude<ArtefactKind, 'flow'>, ResizeMinimum>`. That is the one place the contract assumes every non-Flow kind has a box, and it has to widen to exclude `'point'` as well.
- `editable.ts:224` filters `groupMovableSelection` on `artefact.geometry === 'box'`, so a Point carrying any other geometry role is excluded from the `DESIGN-020` group operations by construction rather than by decision. `MoveArtefactOperation` at `:251` is typed `Exclude<ArtefactGeometry, RouteGeometry>`, so a third role joins move automatically, while `moveGeometry` at `:339` reads `geometry.box` and would not compile.
- `Placement` at `editable.ts:537` has `box`, `route`, `port` and `waypoint` cases and no coordinate case, so `packages/view-studio/src/app/panels/PlacementPanel.tsx` has nothing to show for a Point.
- `packages/view-studio/src/app/editor/infoschematic-editable.ts:247` resolves an Overlay from a `graphic:` key prefix and returns its capabilities and geometry. There is no `point:` branch, and `AuthoredEditableArtefacts` at `:25` carries only `fabrics` and `overlays`, so `packages/view-studio/src/app/App.tsx:295` has nothing to pass for a Point at `:306`.
- `packages/view-studio/src/app/editor/EditorTools.tsx:199` maps `artefactKinds` to one layer control each, so the Point layer control arrives by adding the kind rather than by editing the control surface. That part of the original shaping still holds.
- `docs/specs/design-session.md:147` records `DESIGN-014` `divergent` for Point and `:163` records the vacuous Point layer under an otherwise conforming `DESIGN-018`; both link here. `docs/specs/design-editing.md:79` states `EDIT-008`'s coordinate rule and records it `conforming`. `docs/specs/appearance.md:145` claims `APPEAR-012`'s evidence covers all six kinds, while the loop at `packages/view-canvas/src/InfoschematicDiagram.editing.test.tsx:130` runs over a five-kind `selections` fixture.
- `apps/site/src/InlineSvgReference.tsx:4` already lists `point` among the six inline SVG artefact kinds, and `apps/site/src/routes.ts` already publishes a Points component page, so the public surface expects this to exist.

## Steps

1. Decide whether a Point is a sixth `ArtefactKind` with its own geometry role or an addressable part of the Flow that owns it, and write the next unused `ADR-INFOSCHEMATICS-0NN` under `docs/decisions/` with the reasoning and the consequence for `DESIGN-014`'s six-kind wording. Verifiable by the record existing and being indexed in `docs/decisions/README.md`. Steps 2 onward assume the sixth-kind answer; the other answer means re-shaping from here.
2. Author a Point. Add a Point with at least one port to the `config` fixture in `packages/view-canvas/src/InfoschematicDiagram.editing.test.tsx`, add two Points close together plus a Flow attached to one to the fixture in `packages/view-studio/src/app/App.browser.test.tsx`, and add a Point to `apps/site/src/playground/seeds/media-pipeline.yaml` so there is a document a person can open. Verifiable by `bun run --cwd packages/domain-core test` and `bun run --cwd packages/render-svg test` staying green and the static renderer drawing the new Point.
3. Draw a Point in `packages/view-canvas/src/InfoschematicDiagram.tsx`, matching the static circle and carrying `aria-label`, `data-artefact-id` and `data-artefact-kind="point"`, with its treatment in `packages/view-canvas/src/styles.css` rather than in Studio's stylesheet — `INFOSCHEMATICS-TOOL-064` removed Studio's copy of the Canvas rules and `scripts/stylesheet-shadowing.test.ts` now fails on a duplicate selector. Verifiable by extending the kind loop at `InfoschematicDiagram.editing.test.tsx:130` to six kinds, which earns `APPEAR-012`'s existing evidence claim.
4. Extend the View Model contract in `packages/view-model/src/editable.ts`: add `'point'` to `ArtefactKind` and `artefactKinds`, add a `PointGeometry` role to `ArtefactGeometry`, add the `point` variant to `ArtefactSelection`, add `point: PointConfig` to `ArtefactValueByKind`, give `artefactCapabilities.point` move without resize, widen `artefactResizeMinimums` to `Exclude<ArtefactKind, 'flow' | 'point'>`, place `point` in `kindDependencyOrder`, and teach `moveGeometry` to move a coordinate and clamp it to the diagram bounds. Verifiable by `bun run --cwd packages/view-model typecheck` and `bun run --cwd packages/view-model test`, with the kind list at `editable-capabilities.test.ts:95` extended to six.
5. Decide and record group participation: `groupMovableSelection` excludes anything that is not a box, so state in the same ADR whether a Point takes part in align, in distribute, in both or in neither, and implement that answer. Verifiable by a case in `packages/view-model/src/editable-capabilities.test.ts` that asserts the chosen behaviour for a mixed Card-and-Point selection.
6. Give Canvas a pointer and keyboard target for a Point: press, `Shift`-press to add to the group, `Enter`, `tabIndex`, `role`, the same `selected` and `pointed` treatments the other kinds use, `group-held` when it is a non-anchor member, and `layer-inert` with no `tabIndex` when the Point layer is closed. The hit target must be larger than the 6-unit paint, following the wider-than-stroke precedent `DESIGN-011` sets for a Flow. Verifiable by cases in `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx` that resolve the press through `elementFromPoint` — the resolution `DESIGN-018` already requires — including a press offset from the centre and a press with the layer closed.
7. Wire Studio to the new kind: add a `point:` branch to `packages/view-studio/src/app/editor/infoschematic-editable.ts`, add `points` to its `AuthoredEditableArtefacts` and pass `infoschematicPoints` from `App.tsx:306`, add a coordinate case to `Placement` and render it in `PlacementPanel.tsx` stating `x` and `y`, and answer for `point` in `describeArtefactGeometry`, `submitOperation`, `layerControls`, `collectionName`, `collection` and `valuesForKind`. Verifiable by `bun run --cwd packages/view-studio typecheck` and `bun run --cwd packages/view-studio test`.
8. Make a Point move reviewable: a moved or removed Point must record one change row naming the authored `points:` entry, and undo must put it back in one step. Verifiable by a case in `packages/view-studio/src/app/editor/document-operations.test.ts` and a rendered case asserting both the moved circle and the change list.
9. Extend the rendered matrix `DESIGN-015` requires, in `packages/view-studio/src/app/App.browser.test.tsx`: select, clear, hover, pointer-move, keyboard-move, numeric placement, reorder, property edit, removal, and closing the Point layer leaving the Point drawn, untabbable and released from selection. Include the two-close-Points case, and confirm an attached Flow reprojects when its Point moves. Verifiable by `bun run --cwd packages/view-studio test:browser`.
10. Update the specification corpus in the same change: set `DESIGN-014` to `conforming` and delete its divergence note, rewrite `DESIGN-018`'s vacuous-Point paragraph, add the Point cases to `DESIGN-015`'s minimum matrix, refresh `EDIT-008`'s evidence, and leave `APPEAR-012` as written now that its claim is earned. Verifiable by `bun run self:verify:repo`, which runs the corpus integrity suites under `scripts/`.

## Files touched

- `packages/view-model/src/editable.ts` — kinds, selection, geometry roles, capabilities, minimums, dependency order, `moveGeometry`
- `packages/view-model/src/editable-capabilities.test.ts` — six-kind list and group participation
- `packages/view-model/src/artefact-draft.ts` — `valuesForKind`
- `packages/view-canvas/src/InfoschematicDiagram.tsx` — drawing, hit testing, keyboard target, layer inertness
- `packages/view-canvas/src/styles.css` — the Point treatment, which lives here and not in Studio
- `packages/view-canvas/src/InfoschematicDiagram.editing.test.tsx` — Point in the fixture, six kinds in the identity loop
- `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx` — pointer and keyboard cases resolved through `elementFromPoint`
- `packages/view-studio/src/app/editor/infoschematic-editable.ts` — the `point:` handle branch
- `packages/view-studio/src/app/App.tsx` — passes `infoschematicPoints` into `infoschematicEditable`
- `packages/view-studio/src/app/editor/EditorTools.tsx` — the `layerControls` entry
- `packages/view-studio/src/app/editor/ArtefactControls.tsx` — `describeArtefactGeometry` and `submitOperation`
- `packages/view-studio/src/app/editor/document-operations.ts` and `document-operations.test.ts` — the `points` collection
- `packages/view-studio/src/app/panels/PlacementPanel.tsx` — the coordinate placement case
- `packages/view-studio/src/app/App.browser.test.tsx` — the rendered Point matrix
- `apps/site/src/playground/seeds/media-pipeline.yaml` — a Point in a document a person can open
- `docs/specs/design-session.md`, `docs/specs/design-editing.md`, `docs/specs/appearance.md` — `DESIGN-014`, `DESIGN-018`, `DESIGN-015`, `EDIT-008`, `APPEAR-012`
- `docs/decisions/ADR-INFOSCHEMATICS-0NN-<slug>.md` — **new**, number allocated at delivery
- `docs/decisions/README.md` — the index entry for that record

No new source file is required. Every path above exists except the Decision Record.

## Verify

Run the focused suites first, innermost outward, because each step above names the one that proves it: `bun run --cwd packages/view-model test`, `bun run --cwd packages/view-canvas test`, `bun run --cwd packages/view-canvas test:browser`, `bun run --cwd packages/view-studio test`, `bun run --cwd packages/view-studio test:browser`, then `bun run self:verify:repo`. Finish with `bun run self:check`, because `test:browser` is its last stage and the new cases must survive the full gate rather than only pass in isolation.

Prove the hit target is not just present but reachable: delete the widened target from the Point's Canvas markup and confirm the offset-press case in `InfoschematicDiagram.browser.test.tsx` fails, then restore it. A case that resolves through `elementFromPoint` is the only kind that distinguishes a listener from a reachable element.

Then render it and look, because a Point is small enough that a handle can be correct and still be unusable, and because this repository has twice shipped a treatment that a green suite did not notice. Run `bun run self:dev` — it builds every package and then starts the site, which resolves `@infoschematics/view-studio` from `dist` rather than from source, so a plain `bun run ki:site:dev` will show the previous build. Open `http://localhost:4173/playground/`, choose the Media pipeline preset, press **Show panels** in the title bar, then **Design**, and look for all of:

- The Point is drawn at all, and drawn as the same circle the static renderer draws. Compare against a static render of the same document rather than judging the Canvas alone: `bun run self:examples:render apps/site/src/playground/seeds/media-pipeline.yaml --out reports/point-check.svg` and open both side by side.
- Hovering it and selecting it give two distinguishable treatments, per `DESIGN-010`, and neither is the Card's selection colour leaking across.
- Pressing about five diagram units off its centre still takes it, and pressing empty Canvas beside it clears the selection.
- `Tab` from the neighbouring Card reaches the Point with a visible focus ring, and arrow keys move it by the authored `gridSize`.
- Dragging it drags the attached Flow's route with it, and the Properties panel states `x` and `y` and offers no width or height.
- Two Points eight units apart can each be taken deliberately — this is the case most likely to be wrong, and no unit test will tell you.
- Closing the Point layer from the tools row leaves the circle drawn in exactly the same place with the same colours, takes it out of the tab order, and releases it if it was selected.
- Switching to **Present** leaves the Point drawn and inert with no handle or focus ring on it.

## Dependencies / blocks

No hard dependency. `DESIGN-014`'s divergence and `DESIGN-018`'s caveat are the exceptions this item removes.

Two soft couplings worth planning around. `INFOSCHEMATICS-TOOL-066` also edits `packages/view-studio/src/app/App.tsx` and `packages/view-studio/src/app/App.browser.test.tsx`, and both items expect the next unused `ADR-INFOSCHEMATICS-0NN` and a new index entry in `docs/decisions/README.md`, so delivered in parallel they collide on a number and on two files. Second, until `INFOSCHEMATICS-TOOL-066` lands, the Design tools row — including the Point layer control this item adds — is `display: none` whenever the dock is collapsed, which is its persisted default, so the manual verification above depends on remembering to press **Show panels** first.

## Documentation impact

### Decision Records

One is expected, and it is step 1: whether a Point is its own kind or part of a Flow is a durable contract choice that the capability matrix, Canvas, Studio and every host read. The same record carries the group-participation answer from step 5, because both follow from the same premise about what geometry a Point has. It takes the next unused `ADR-INFOSCHEMATICS-0NN` and an index entry in `docs/decisions/README.md`.

### Specifications

Four requirements change, all in the delivery: `DESIGN-014` in `docs/specs/design-session.md` goes from `divergent` to `conforming` and loses its note; `DESIGN-018` in the same file loses its vacuous-Point paragraph; `DESIGN-015`'s minimum matrix gains the Point cases; `EDIT-008` in `docs/specs/design-editing.md` refreshes its evidence. `APPEAR-012` in `docs/specs/appearance.md` needs no wording change but its evidence claim only becomes true once step 3 lands, so the six-kind loop is part of this item rather than a later tidy.

### Guides

Deferred, per this repository's practice of landing the feature first and capturing site prose as its own record. `apps/site/content/studio.md` gains a Point section and `apps/site/content/authoring.md` gains the `points:` authoring example, and the Points component page under `apps/site/src/routes.ts` gains an interactive specimen — none of it in this delivery.

### Roadmap

One new Triage record for the Guides work above. No change to any existing record beyond this one.

## Discussion

### Is a Point a kind, or a coordinate the type system should stop pretending is a box

The original question — sixth `ArtefactKind` or addressable part of the Flow — is still open, but reading the tree sharpens it into something narrower and more consequential. Every kind Design reaches today has a box. `artefactResizeMinimums` is typed for every non-Flow kind. `groupMovableSelection` filters on `geometry === 'box'`. `Placement` has no coordinate case. `moveGeometry` reads `geometry.box`. A Point is the first element whose position is a point rather than an extent, so admitting it as a sixth kind means introducing a third geometry role and then answering, at each of those sites, a question nobody has had to answer: what does this operation mean for something with no extent?

Align is the sharp end. `DESIGN-020` says only kinds the matrix records as movable may take part in a group geometry operation, and a Point is movable. Aligning a Point to the anchor's left edge is perfectly well defined — its coordinate goes there. Distributing it is not: equalising gaps needs widths, and a Point's width is zero, so a Point in a distribute group either counts as a zero-width participant, which changes everyone else's spacing in a way no reader would predict, or silently sits out, which contradicts a capability row that says it moves. Choosing one of those is a contract decision, not an implementation detail, and it has to be made before the geometry role is written rather than discovered when the first mixed selection is distributed.

The alternative answer — a Point is part of the Flow that owns it — dodges all of that by giving a Point no independent geometry and no layer of its own. It costs `DESIGN-014`'s six-kind wording, contradicts `EDIT-008`, orphans the `point` value that `APPEAR-012` and `STATIC` already require in `data-artefact-kind`, and leaves a Point that no Flow references unreachable. It is not obviously wrong, and it is cheaper. That is why the decision is step 1 and not a paragraph in this record.

### Size is the usability risk, and nothing in the suite can see it

The static renderer paints a Point at radius 6 in diagram units. On the Playground at a typical fit that is a handful of screen pixels — well under any reasonable target size, and smaller than the grid it snaps to. Whatever this item builds, the question of whether a person can actually take the Point they meant, distinguish hover from selection on something that small, and separate two Points sitting eight units apart, can only be answered on a rendered surface. The browser matrix can prove an offset press resolves to the right element; it cannot tell you the target is comfortable, and it will report green on a Point nobody can hit twice in a row.
