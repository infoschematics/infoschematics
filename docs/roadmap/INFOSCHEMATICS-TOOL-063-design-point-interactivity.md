---
id: INFOSCHEMATICS-TOOL-063
area: TOOL
title: Point interactivity in Design
theme: tool
horizon: now
status: done
blocks: []
blocked_by: [INFOSCHEMATICS-TOOL-066]
baseline_ref: f9c1c7af81a528380f89ba3f7811ebf79a7b62a0
created_at: 2026-09-15T12:10:00Z
updated_at: 2026-09-16T16:49:00Z
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
10. Update the specification corpus in the same change: set `DESIGN-014` to `conforming` and delete its divergence note, rewrite `DESIGN-018`'s vacuous-Point paragraph, add the Point cases to `DESIGN-015`'s minimum matrix, refresh `EDIT-008`'s evidence, and leave `APPEAR-012` as written now that its claim is earned. Verifiable by `bun run self:scripts:test`, which runs the corpus integrity suites under `scripts/`.

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

Run the focused suites first, innermost outward, because each step above names the one that proves it: `bun run --cwd packages/view-model test`, `bun run --cwd packages/view-canvas test`, `bun run --cwd packages/view-canvas test:browser`, `bun run --cwd packages/view-studio test`, `bun run --cwd packages/view-studio test:browser`, then `bun run self:scripts:test`. Finish with `bun run self:check`, because `test:browser` is its last stage and the new cases must survive the full gate rather than only pass in isolation.

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

## Review

### Delivered

Point interactivity in Design, as `DESIGN-014` promised it and `DESIGN-018` caveated it. A Point can now be pressed on the Diagram across a target wider than the mark it draws, moved by arrow key, dragged with the route that ends on it following, given coordinates by typing them, reordered, removed together with the Flows that name it, and taken out of interaction by closing its own layer while staying drawn exactly where it was. `ADR-INFOSCHEMATICS-031` records the step 1 decision and what it cost.

Steps 1 through 10 are complete. One piece of this record's own Documentation impact is not delivered: the new Triage record for the Guides work is a roadmap record, and this run's authority does not extend to creating one, so Points remain absent from the consumer guidance and that gap is unrecorded. The lead should raise it.

### Summary of changes

A Point is its own artefact kind rather than an addressable part of the Flow that owns it, which is the question step 1 posed and `ADR-INFOSCHEMATICS-031` settles. `artefactKinds` is six long, and a Point carries `PointGeometry` — `{ at, role: 'point' }` — a third geometry role beside box and route, in `packages/view-model/src/editable.ts`. `MovableGeometry` admits it, `artefactResizeMinimums` now excludes `'point'` alongside `'flow'` because a Point has no extent to size, and `movableBox` measures it as a zero-extent box so the group arithmetic keeps working unchanged. A Point is addressed by a prefixed selection key, `point:POINT-A`, which is the convention `region:`, `port:`, `waypoint:` and `graphic:` already follow.

Canvas draws the layer in `packages/view-canvas/src/InfoschematicDiagram.tsx`: one group per Point carrying `data-artefact-kind="point"`, holding a transparent fourteen-unit `.point-target` that is drawn first and only while the layer is interactive, then the six-unit `.point-mark` that takes no pointer events. The widened target is what makes a six-unit mark pressable; the layer is painted after the ordinary Flow layer and before a promoted selected Flow. `pointRadius` and `pointTargetRadius` are visual tokens rather than literals, and `packages/view-canvas/src/styles.css` states selection, hover and group-hold on the mark itself rather than as a second shape beside it, because a ring appearing next to the smallest thing on the surface reads as another element rather than as this one answering.

Studio reaches it through `packages/view-studio/src/app/editor/infoschematic-editable.ts`, which handles the `point:` key; `ArtefactControls.tsx` describes point geometry and submits point operations; `PlacementPanel.tsx` gained the coordinate case it had no placement for; and `EditorTools.tsx` gets its sixth layer control by iterating `artefactKinds`, exactly as the record's Current state predicted.

Two changes were not on the plan. `planArtefactRemoval` in `packages/view-studio/src/app/editor/artefact-operations.ts` treated a Point as a Region and removed it alone, which left every Flow that named it pointing at an id that no longer existed — a document the editor then refused rather than drew. A Point is a Flow endpoint in exactly the way a Card and a Fabric are, so it joins that disjunct; `'carries a Point Flows off with it'` fails without the fix. And `PlacementPanel.tsx` named its fields from the selection key, so a Point's inputs would have announced themselves as `point:POINT-A x`; `nameOf` drops the kind prefix, which is the editor's business and not a name a Producer needs.

`apps/site/src/playground/seeds/media-pipeline.yaml` gains a `CAPTIONS` Point with a `CAPTIONED` Flow leaving it, so the preset a person actually opens has something on it that is a Point rather than a Card. In the specification corpus `DESIGN-014` is now `conforming` with its divergence paragraph replaced, `DESIGN-018`'s vacuous-Point note is rewritten around the narrowest closed layer there is, `EDIT-008` and `EDIT-009` carry real evidence in place of a vague gesture at Canvas tests, and `DESIGN-015` gained a MUST: where a kind's press target is not the shape it paints, at least one case must aim a press at a coordinate on the Infoschematic and resolve it through the browser's own hit testing, because presence in the tree is not reach.

### Verification

`bun run self:check --force` — 43 successful, 43 total, 0 cached, 22.3s. Forced, so every number here was earned rather than replayed. No `turbo.json` change was needed: every file this item touches already falls inside an existing task's `inputs`, and no new file was introduced outside those globs.

Two proofs by deliberate breakage rather than by assertion. Deleting the `.point-target` circle from the Canvas Point layer makes exactly one case fail — the press aimed eight units off `POINT-A`'s centre — and nothing else; the widened target is therefore load-bearing and the case that covers it is not vacuous. Reverting the endpoint disjunct in `planArtefactRemoval` makes `'carries a Point Flows off with it'` fail with the Flow left behind, and makes the browser case's change list lose `FLOW-B`. Both were restored.

The new pointer case lives in `packages/view-canvas/src/InfoschematicDiagram.browser.test.tsx`, beside the Card and Adapter drags it imitates: a Point is dragged and the route that ends on it is redrawn as `M300 140 H420 V100`, an exact path rather than a substring, so the assertion cannot pass by coincidence. The Studio browser suite resolves a press through `elementFromPoint` at four aimed coordinates: eight units off centre takes the Point, dead centre takes it, twenty units away takes the neighbouring Point whose widened target overlaps, and forty units away takes nothing even though a Flow's twelve-unit press stroke runs there.

I looked at it rather than trusting the suite, in a real Chromium at 1440×900 with the real Studio mounted, and captured what I saw. The record's instruction to press **Show panels** first is obsolete — `INFOSCHEMATICS-TOOL-066` opens the dock on entering a Producer mode, and it did. In Present a Point draws as an open ring in its scope's colour, amber where the scope is amber, with the Flow leaving the ring cleanly and meeting the Card's arrowhead. In Design, selected, the mark switches to the selection green and thickens, and the three-control cluster — Earlier, Later, Remove — sits above the mark rather than inside it, which is the sensible difference from a Card whose cluster sits in its top corner. Hover, focus and selection are three distinguishable states on three different Points at once, measured as well as seen: selected `rgb(130, 179, 102)` at 3px, hovered `rgb(121, 201, 255)` at 2px, untouched its own `rgb(36, 99, 235)` at 2px. A real `Tab` reaches a Point and applies the shared focus glow, `drop-shadow(color(srgb 0.509804 0.701961 0.4 / 0.75) 0px 0px 7px)`; a programmatic `focus()` does not match `:focus-visible` and reports nothing, which is a false negative worth knowing about before anyone asserts on it. The Design panel for a selected Point reads `Point`, `X 200`, `Y 90` with no dimensions row, and the fields are named `X` and `Y` rather than by the prefixed key.

Reach was measured rather than assumed. Each coordinate field is 68×20 and, once the panel's scroll region is brought to it, `elementFromPoint` at the field's own centre returns that field — it is the painted element there, not merely present in the tree. `offsetParent` was not used for the Point itself: an SVG element never has one, so that check would have reported a false negative on the mark.

### Outstanding concerns

A Point's colour cannot be authored or edited. Canvas already reads `point.appearance?.color`, but the config type has no `appearance` field, so colour derives from the Point's scope and no Studio round trip can carry one. This was out of this item's boundary and remains undone.

A Point has no Identity part in the Details panel, because `identityOf` returns nothing for a `point:` key. Its authored `label` — which both the mark's `<title>` and its `aria-label` read out — can therefore only be changed in Source. Visible in the look: where a Card shows Identity, ID and NAME, a Point shows only Point, X and Y.

The focus glow is faint on a Point. It is the same shared treatment every selectable artefact gets, and it is applied, but a seven-pixel drop shadow around an eleven-pixel circle reads far less clearly than the same shadow around a Card. This record's own Discussion says size is the usability risk and no suite can see it; that judgement is a designer's rather than mine, so I have left the shared treatment alone and flagged it.

The coordinate fields sit below the fold of the `.editor-panes` scroll region at 1440×900 — the pane shows 324 pixels of 633 — so a Producer must scroll the panel to type a Point's coordinates. A Card's `x` field sits further down still, so this is a pre-existing property of the panel rather than anything this item introduced.

Three defects in or near this surface are not mine and are not fixed. `INFOSCHEMATICS-TOOL-076`, the `SELECTION` heading cut by the split-pane resizer at 1440×900, is in the panel this item populates. The `key` is not a prop console error appears in the browser suites; I proved it pre-existing this session by stashing every change in this worktree and re-running the Canvas browser suite, where it still appeared, and the gate attributes it to an unrelated Dynamics case. `INFOSCHEMATICS-TOOL-074` leaves `self:boundaries:verify` cruising zero modules, so that task is not evidence of anything and the layering argument here rests on reading the imports: this item adds a kind to `packages/view-model/src/editable.ts` that both Canvas and Studio already import from, and creates no new package edge.

A Card's `bounds` still expands from its `0 0 640 320` shorthand into a mapping when the document is edited. That is the same class of defect as the `at` expansion this item fixed with `compactCoordinate`, it predates this work, and it is out of boundary.

`docs/roadmap/INFOSCHEMATICS-TOOL-057-cross-feature-interaction-coverage.md:37` still counts `DESIGN-014` among three divergent requirements and cites `docs/specs/design-session.md:147`. Both are stale as of this change. It is not my record to edit, so the lead should reconcile it.

The Studio browser suite has no pointer-drag case of any kind, for any artefact; the drag proof for a Point is at the Canvas layer where the idiom exists. Movement through the real editor is proven by key and by typed coordinate rather than by dragging.

### Post-change review

Read `ADR-INFOSCHEMATICS-031` first: everything else follows from a Point being a sixth kind with a third geometry role, and the alternative — an addressable part of its Flow — would have spread Point handling through the route code instead of through a kind enumeration. The place to check that judgement is `artefactResizeMinimums`, which had assumed every non-Flow kind has a box and now has two exclusions; if a third arrives, that type wants restating as a positive list of box kinds rather than a growing exclusion.

The riskiest change is the removal cascade, because it was wrong in a way the compiler could not see and no existing test noticed: a Point read as a Region and was removed alone. It is worth confirming that the disjunct is about being a Flow endpoint and not about being movable, since the next kind added will face the same fork.

The thing most likely to come back is size. Every interaction now works, and a six-unit mark with a fourteen-unit target is still a small thing to hit and a small thing to see a focus ring on. I measured and photographed rather than inferred, but whether the treatment is strong enough on something this small is a design call that should be made deliberately rather than inherited from the Card.

### Mini recap

A Point is now a first-class artefact kind in Design: pressable across a widened invisible target, movable by key, drag and typed coordinate, removable with its Flows, and filterable by its own interaction layer, with `ADR-INFOSCHEMATICS-031` recording why it is a kind rather than part of a Flow. Two unplanned defects were fixed on the way — a removal that orphaned Flows, and a field name that read the editor's selection key out loud. The gate is 43 of 43 fresh, the widened target and the removal cascade are each proved by deliberate breakage, and the surface was rendered and looked at rather than inferred from a green suite. Left undone: the Guides Triage record, which needs authority this run does not have.

## Discussion

### Is a Point a kind, or a coordinate the type system should stop pretending is a box

The original question — sixth `ArtefactKind` or addressable part of the Flow — is still open, but reading the tree sharpens it into something narrower and more consequential. Every kind Design reaches today has a box. `artefactResizeMinimums` is typed for every non-Flow kind. `groupMovableSelection` filters on `geometry === 'box'`. `Placement` has no coordinate case. `moveGeometry` reads `geometry.box`. A Point is the first element whose position is a point rather than an extent, so admitting it as a sixth kind means introducing a third geometry role and then answering, at each of those sites, a question nobody has had to answer: what does this operation mean for something with no extent?

Align is the sharp end. `DESIGN-020` says only kinds the matrix records as movable may take part in a group geometry operation, and a Point is movable. Aligning a Point to the anchor's left edge is perfectly well defined — its coordinate goes there. Distributing it is not: equalising gaps needs widths, and a Point's width is zero, so a Point in a distribute group either counts as a zero-width participant, which changes everyone else's spacing in a way no reader would predict, or silently sits out, which contradicts a capability row that says it moves. Choosing one of those is a contract decision, not an implementation detail, and it has to be made before the geometry role is written rather than discovered when the first mixed selection is distributed.

The alternative answer — a Point is part of the Flow that owns it — dodges all of that by giving a Point no independent geometry and no layer of its own. It costs `DESIGN-014`'s six-kind wording, contradicts `EDIT-008`, orphans the `point` value that `APPEAR-012` and `STATIC` already require in `data-artefact-kind`, and leaves a Point that no Flow references unreachable. It is not obviously wrong, and it is cheaper. That is why the decision is step 1 and not a paragraph in this record.

### Size is the usability risk, and nothing in the suite can see it

The static renderer paints a Point at radius 6 in diagram units. On the Playground at a typical fit that is a handful of screen pixels — well under any reasonable target size, and smaller than the grid it snaps to. Whatever this item builds, the question of whether a person can actually take the Point they meant, distinguish hover from selection on something that small, and separate two Points sitting eight units apart, can only be answered on a rendered surface. The browser matrix can prove an offset press resolves to the right element; it cannot tell you the target is comfortable, and it will report green on a Point nobody can hit twice in a row.
