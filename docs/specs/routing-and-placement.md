# Routing and placement — ROUTE

Flow routes, ports, snapping, labels, overlays, and Card-internal layout in diagram coordinates. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### ROUTE-001 — Routes are orthogonal

Every rendered route MUST consist only of absolute horizontal and vertical runs. Parsing or constructing a route MUST reject a diagonal run rather than silently approximating it.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-model test`, whose routing and waypoint cases exercise orthogonal edits. Then author a route with a diagonal run and confirm it is rejected rather than drawn: a `routePath` that quietly straightens the diagonal into something orthogonal fails the requirement as surely as one that draws it.

_Evidence:_ `packages/view-model/src/routing.test.ts` and `packages/view-model/src/waypoints.test.ts` exercise orthogonal route edits; `routePath` in `packages/view-model/src/geometry.ts` rejects diagonals.

### ROUTE-002 — Route edits preserve anchored ends

Moving one end of a route MUST carry the endpoint to its requested position while preserving the far endpoint. Where a straight two-point route cannot remain orthogonal, the calculation MUST introduce a bend rather than move the far endpoint.

Every derivation of a route MUST reach that construction, not only the editor's. A Flow with no waypoints has no shape anyone drew — its two [ports](../reference/vocabulary.md#port) are all the document says — so both the draft overlay and the document itself MUST route between those ports through the one shared construction rather than joining them with a naked pair of points. A document that renders as a straight run MUST keep it, because the construction collapses to the straight run wherever the ports line up.

A route that carries waypoints is a shape someone drew, so every waypoint MUST be left where it was authored when a component at either end moves. The run that reaches a port is the one a move can invalidate — the port travels with the component while the waypoint beside it stays put — and reading the document back MUST repair that run the same way the draft overlay repairs it, by leaning the neighbouring point onto the port's axis or inserting a bend. A committed move MUST therefore draw the route the draft showed, rather than a second answer that is diagonal and that no renderer will accept.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-model test`, whose route cases cover end movement, bend insertion and orthogonality. Then drag one end of a straight two-point route off its axis: the far endpoint MUST stay where it is and a bend MUST appear, so a route that stays straight by dragging the other end with it fails the requirement. Then give a Flow an interior waypoint, move a component at one end of it, and accept the change: the accepted document MUST draw the route the draft drew, with the interior waypoint still where it was authored, rather than failing to draw at all.

_Evidence:_ `packages/view-model/src/routing.test.ts` covers end movement, bend insertion and orthogonality. `joinedToPort` in `packages/view-model/src/routing.ts` repairs the run reaching a port, and `packages/view-model/src/runtime.test.ts` covers a waypointed Flow whose attached component has moved.

### ROUTE-003 — Waypoint edits preserve route validity

Inserting, moving or deleting an interior waypoint, and moving an interior run, MUST leave every route run orthogonal. A route edit MUST NOT move a terminal point as an incidental consequence.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-model test`, whose waypoint cases cover insertion, movement, deletion, segment movement and terminal protection. Then insert, move and delete an interior waypoint and drag an interior run, checking the terminals after each: every run MUST stay orthogonal and neither terminal MUST have moved.

_Evidence:_ `packages/view-model/src/waypoints.test.ts` covers insertion, movement, deletion, segment movement and terminal protection.

### ROUTE-004 — Route normalisation removes redundant points

Normalising a route MUST remove repeated points and merge consecutive collinear runs. It MUST preserve a route whose runs already alternate axes.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-model test`, whose normalisation cases cover repeated points, collinear runs and a route that is already normal. Then normalise a route twice: the second pass MUST return the first pass unchanged, and a normalisation that drops a bend the route needs to stay orthogonal fails the requirement.

_Evidence:_ `packages/view-model/src/routing.test.ts` covers repeated points, collinear runs and already-normal routes.

### ROUTE-005 — Ports lie on their declared edge

Every calculated port MUST lie on the edge named by its compass-side identifier. Port coordinates MUST be derived from the artefact box and counts in force, so identity and placement agree by construction.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-model test`, whose guide cases cover edge placement and per-side counts. Then take a port identity such as `N2` and check its coordinate against the artefact box: a port whose coordinate leaves the edge its compass side names, or which was derived from anything but the box and the counts in force, fails the requirement.

_Evidence:_ `packages/view-model/src/guides.test.ts` covers edge placement and per-side counts.

### ROUTE-006 — A side is subdivided rather than filled from one end

Ports on one side MUST be spread across the usable side length. Numbering MUST proceed centre-outward, making port one the most central position the requested count permits.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-model test`, whose guide cases cover subdivision, centre-outward numbering and the position of port one. Then ask a side for three ports and read their coordinates: they MUST be spread across the usable side length with port one nearest the centre, so a run of ports packed from one end fails the requirement.

_Evidence:_ `packages/view-model/src/guides.test.ts` covers subdivision, centre-outward numbering and the position of port one.

### ROUTE-007 — A side offers every count it can place safely

A side MUST accept every port count for which its ports can occupy distinct interior grid lines, including zero. A count larger than the available space MUST be reduced to the greatest count the side can place without collision.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-model test`, whose guide cases cover the allowed counts, even distribution, saturation and the maximum safe count. Then ask a short side for zero ports and for far more than it can hold: zero MUST be accepted, and the excess MUST come back as the greatest count that side can place on distinct interior grid lines rather than as colliding ports.

_Evidence:_ `packages/view-model/src/guides.test.ts` covers allowed counts, even distribution and saturation at the maximum safe count.

### ROUTE-008 — Unspecified port counts use one declared default

When an artefact side has no authored count, port calculation MUST use the View Model's declared default consistently. A consumer MUST NOT invent a second implicit count.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-model test`, whose guide cases cover the default count. Then grep the consumers for a numeric port-count fallback of their own: every one MUST read `defaultPortCount`, because a second implicit count is what this requirement forbids and a side with no authored count would still place ports without anything going red.

_Evidence:_ `packages/view-model/src/guides.test.ts` covers the default count; `defaultPortCount` is exported by `packages/view-model/src/ports.ts`.

### ROUTE-009 — Port audits expose collisions and mismatches

A port audit MUST report routes landing on the same port, ports that are closer than the configured minimum spacing and a shared port identity whose calculated coordinates disagree.

_Conformance:_ conforming

_Verify:_ run an audit over a document authored to break each rule in turn — two routes landing on one port, two ports closer than the minimum spacing, and one port identity whose calculated coordinates disagree. `auditPorts` MUST report all three; a document that breaks a rule and audits clean fails the requirement.

_Evidence:_ `auditPorts` in `packages/view-model/src/ports.ts`.

### ROUTE-010 — The editing grid uses diagram coordinates

Grid snapping MUST operate in the Infoschematic's coordinate space. The standard editing increment is ten diagram units, matching the minimum default port spacing.

_Conformance:_ conforming

_Verify:_ nudge an artefact once with the grid active and read the authored coordinate, not the screen one: the step MUST be ten diagram units, matching `minimumPortGap`. Repeat while zoomed and panned — a step that changes size with the zoom is snapping in screen space, which is what this requirement forbids.

_Evidence:_ grid projection in `packages/view-studio/src/app/editor/use-editor.ts` and `minimumPortGap` in `packages/view-model/src/ports.ts`.

### ROUTE-011 — Alignment guides come from the scene

Alignment guides MUST be derived from visible box edges, box centres and other handles rather than from a hard-coded list of coordinates.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-model test`, whose guide cases cover box edges, centres, handles and duplicate suppression. Then move an artefact and confirm the guides that appear correspond to the visible boxes and handles around it; add an artefact and confirm new guides come with it, since a hard-coded coordinate list would not change.

_Evidence:_ `packages/view-model/src/guides.test.ts` covers box edges, centres, handles and duplicate suppression.

### ROUTE-012 — Each axis snaps independently

Snapping MUST choose the nearest guide within threshold on each axis independently. An axis with no guide in range MUST retain the requested coordinate.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-model test`, whose guide cases cover independent axes, nearest-guide preference and no-guide behaviour. Then drag an artefact so one axis has a guide in range and the other has none: the first MUST snap to the nearest guide and the second MUST keep the coordinate requested, so an axis dragged along by its neighbour's snap fails the requirement.

_Evidence:_ `packages/view-model/src/guides.test.ts` covers independent axes, nearest-guide preference and no-guide behaviour.

### ROUTE-013 — A flow label belongs to its route

A flow-label position MUST be represented as a share of route length rather than as a free coordinate. Projecting a loose point onto a route MUST return the nearest point on one of its runs.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-model test` and `bun run --filter=@infoschematics/view-studio test`, which cover projection onto horizontal and vertical runs and label-share precision. Then place a route label, edit the route's geometry, and look at the label: held as a share of route length it stays on the route, so a label that leaves the route when the route changes has been stored as a free coordinate.

_Evidence:_ `packages/view-model/src/routing.test.ts` covers projection onto horizontal and vertical runs; `packages/view-studio/src/app/editor/use-editor.test.ts` covers label-share precision.

### ROUTE-014 — Automatic label placement avoids occupied space

Automatically placed route labels MUST try candidate positions in a stable order and avoid component boxes and already placed labels where possible. An authored or draft position MUST take precedence over automatic placement.

_Conformance:_ conforming

_Verify:_ place two Flows whose labels compete for the same gap between Cards and look at the result: `placeLabels` MUST try its candidates in a stable order and avoid Card boxes and already-placed labels where it can. Render the same document twice and the placement MUST be identical. Then draft a label position by hand: it MUST be kept rather than re-placed automatically.

_Evidence:_ `placeLabels` in `packages/view-model/src/placement.ts`.

### ROUTE-015 — Floating overlays remain within the view

A floating overlay position MUST be clamped inside the view before being scored. The first unobstructed candidate SHOULD win; where every candidate is obstructed, the least costly candidate SHOULD win.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-model test`, whose placement cases cover the preferred, clear, least-obstructed and clamped candidates. Then open a floating overlay near a view edge: its position MUST be clamped inside the view before any candidate is scored, so an overlay scored where it could not be seen fails the requirement.

_Evidence:_ `packages/view-model/src/placement.test.ts` covers preferred, clear, least-obstructed and clamped candidates.

### ROUTE-016 — Card internals are placed from the Card's own box

View Model MUST resolve where a Card's label, description, stereotype, and identity chip are drawn from that Card's own box, its resolved treatment, and its authored text. Both renderers MUST consume that one resolution rather than place Card text independently, and every position MUST be the element's visual centre so a renderer draws it with a middle dominant baseline.

The label MUST always be placed. An optional element MUST be withheld where its band does not fit the box, and the identity chip MUST give way to an authored stereotype it would otherwise be drawn over. Element widths MAY be estimated from a fixed advance per character, because no text metric is available to static output and both renderers MUST agree on the same estimate.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-model test` and `bun run self:scripts:test`, which cover the reference, square, tall, narrow and undersized boxes and compare placed Card geometry across both renderers. Then render a Card small enough that a band does not fit and look at it: the label MUST still be placed, the optional elements MUST be withheld rather than overflowing, and the identity chip MUST give way to an authored stereotype rather than being drawn over it.

_Evidence:_ `packages/view-model/src/card-layout.test.ts` covers the reference, square, tall, narrow, and undersized boxes; `scripts/visual-treatment-parity.test.ts` compares placed Card geometry across both renderers.

### ROUTE-017 — Card text is fitted to the Card it is drawn on

View Model MUST resolve the text a Card draws as well as where it draws it: the lines its label is drawn on, and the stereotype and description strings that fit their own bands. Text that does not fit MUST be reduced rather than drawn past the Card's border — wrapped onto the lines the treatment allows, then ended with an ellipsis. A compact Card MUST keep its label to one line, because its stack already carries a band and a description; the legacy treatment MAY wrap onto a second line where the box is tall enough for it. Wrapping MUST break on word boundaries against the box's usable width, never on a character count, and the stereotype MUST be fitted to the box rather than to the space the identity chip leaves.

A fitted string is a visual reduction only. Every renderer MUST keep the authored label, stereotype, and description in full in the Card's accessible name, as CANVAS-007 requires.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-model test` and `bun run self:scripts:test`, which cover untouched short text, width-aware wrapping, a truncated compact label, a single over-long word and the fitted stereotype and description bands, and compare the drawn strings across both renderers. Then render a Card with text too long for it and look at it: nothing MUST be drawn past the border, wrapping MUST break on word boundaries against the usable width rather than a character count, and the full authored label, stereotype and description MUST still be readable in the accessible name.

_Evidence:_ `packages/view-model/src/card-layout.test.ts` covers untouched short text, a width-aware wrap, a truncated compact label, a single over-long word, and fitted stereotype and description bands; `scripts/visual-treatment-parity.test.ts` compares the drawn strings across both renderers and asserts the authored text survives in the accessible name.

### ROUTE-020 — A Point's label is placed clear of the routes that reach it

View Model MUST resolve where a Point's authored label is drawn from that Point's own position and the Flows that reach it, and both renderers MUST consume that one resolution rather than place the text independently. The label MUST take a side no Flow leaves by, chosen in a stable preference order, so the text is never drawn over the route the Point terminates; where every side is taken a side MUST still be chosen rather than the label withheld, because a Point whose label is dropped is the defect this requirement exists to remove.

The resolved position MUST be the line's visual centre, so a renderer draws it on a middle dominant baseline as ROUTE-016 already requires of Card text, and it MUST carry the anchor it is drawn with: beside the mark the position is the edge the text runs away from, not a centre, and converting one into the other would need a width. No text MUST be measured to place the label, for the reason ROUTE-018 gives. A blank label MUST draw nothing rather than an empty line box.

_Conformance:_ conforming

_Verify:_ author a Point reached by Flows from the left, the right and above, render it through both renderers and look at the result: the label MUST sit on the one remaining side, never across a route, and both renderings MUST put it in the same place. Render `apps/site/src/playground/seeds/media-pipeline.yaml`, whose `CAPTIONS` is left upward by its only Flow, and the label MUST read below the mark. Then blank that label and render again: nothing MUST be drawn where the text was. Falsified by a label crossing the route it terminates, by the two renderings disagreeing, or by an empty line box standing in for a blank label.

_Evidence:_ `resolvePointLabel` and `pointLabelSide` in `packages/view-model/src/point-layout.ts`; `scripts/visual-treatment-parity.test.ts` compares the drawn label's position and anchor across both renderers.

### ROUTE-021 — A reader's tag takes the place the code is already drawn

A viewer control that reveals element codes MUST draw an element's code where that element already draws it, and MUST NOT add a second copy of a code the element is already carrying. Where an element draws no code of its own the annotation MUST keep its own placement, so the control still reveals what was missing.

A Card that resolves an identity chip is the case this exists for: the chip and the annotation are two renderings of one string, placed by two rules, and a reader switching the control on saw the code shift by a few pixels and double. The drawn position MUST come from the same Card resolution ROUTE-016 requires rather than from a second calculation, and an element whose chip is withheld — because its box is too small, or because the rendered scale reduced the treatment away — MUST be annotated as any uncoded element is.

_Conformance:_ conforming

_Verify:_ run `bun run --filter=@infoschematics/view-canvas test`, whose editing cases render one document with and without an authored `card.identity` and compare the annotated codes against the chips. Then open a Diagram that authors `card.identity`, zoom until the chips are drawn, and turn the tag control on and off: each Card MUST carry its code exactly once in both states and in the same place in both, while a Fabric that draws no code of its own MUST gain a tag. Falsified by a code appearing twice, by the code moving as the control is switched, or by an element that draws nothing losing its tag.

_Evidence:_ `cardText` and `selfCoded` in `packages/view-canvas/src/InfoschematicDiagram.tsx` resolve each Card's own layout once and withhold the annotation for a code already drawn; `packages/view-canvas/src/InfoschematicDiagram.editing.test.tsx` covers the annotated codes with and without an authored chip and the position the tag takes.

## Quality properties

### ROUTE-018 — Region labels use deterministic shared metrics

View Model MUST derive Region label length, frame notch, and outline solely from shared deterministic metrics. It MUST NOT depend on browser or host-font measurement. Canvas and static SVG MUST consume the same resolved geometry, and authored `labelOffset` MUST remain a placement-only override.

_Conformance:_ conforming

_Verify:_ Compare resolved geometry and both renderer outputs for short, long, narrow, mixed-case, numeric, and non-ASCII labels across compass placements and internal and boundary mounts.

_Evidence:_ `packages/view-model/src/region-geometry.test.ts` covers shared values, representative label classes, compass placements, internal and boundary mounts, and constrained frames; `scripts/visual-treatment-parity.test.ts` compares Canvas and static SVG geometry.

### ROUTE-019 — A Region label survives a route that crosses its band

A Flow route MAY occupy a Region label's band. A Flow between a Card inside a Region and one outside it crosses that Region's frame, and a label mounted on the frame shares the crossing legitimately, so the band MUST NOT be reserved by refusing the route: the label MUST survive the crossing instead. Every renderer MUST draw a Region label above the routes that cross its band, over an opaque backing in the Region's resolved surface colour, so no route stroke is left standing between the glyph strokes. The backing MUST be derived from the same resolved label geometry both renderers already consume, so each covers the same band rather than estimating its own.

Legibility here MUST NOT be pursued by moving the label. ROUTE-018 fixes Region label geometry to shared deterministic metrics, and a label whose position depends on which engine measured it would break the parity that requirement exists to hold.

_Conformance:_ divergent

_Verify:_ Render a document that routes a Flow through a Region label's band through both renderers and read the label. `examples/is-infoschematics/infoschematic.yaml` is one: two routes cross its "View and renderer packages" band.

_Evidence:_ Divergent in both renderers as of 2026-09-16. `infoschematic-region-label` in `packages/render-svg/src/index.ts` and `packages/view-canvas/src/InfoschematicDiagram.tsx` carries no backing, and the static renderer emits every Region before every Flow, so a crossing route erases glyphs; the same label loses the same glyphs in Chromium. Both engines place it within a pixel of each other, so this is paint order rather than measurement.

## Gaps

- `ROUTE-001`'s compositions are recorded in [Composition](composition.md): with `EDIT-018` as `COMPOSE-002`, and with `AUTHOR-005` as `COMPOSE-003`, where geometry this area rejects is refused outside the result shape authoring promises. `ROUTE-002`'s bend insertion is the calculation both of them need reached.
