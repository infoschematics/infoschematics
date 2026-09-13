# Routing and placement — ROUTE

Flow routes, ports, snapping, labels, overlays, and Card-internal layout in diagram coordinates. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### ROUTE-001 — Routes are orthogonal

Every rendered route MUST consist only of absolute horizontal and vertical runs. Parsing or constructing a route MUST reject a diagonal run rather than silently approximating it.

_Conformance:_ conforming

_Verify:_ `packages/view-model/src/routing.test.ts` and `packages/view-model/src/waypoints.test.ts` exercise orthogonal route edits; `routePath` in `packages/view-model/src/geometry.ts` rejects diagonals.

_Evidence:_ `packages/view-model/src/routing.test.ts` and `packages/view-model/src/waypoints.test.ts` exercise orthogonal route edits; `routePath` in `packages/view-model/src/geometry.ts` rejects diagonals.

### ROUTE-002 — Route edits preserve anchored ends

Moving one end of a route MUST carry the endpoint to its requested position while preserving the far endpoint. Where a straight two-point route cannot remain orthogonal, the calculation MUST introduce a bend rather than move the far endpoint.

_Conformance:_ conforming

_Verify:_ `packages/view-model/src/routing.test.ts` covers end movement, bend insertion and orthogonality.

_Evidence:_ `packages/view-model/src/routing.test.ts` covers end movement, bend insertion and orthogonality.

### ROUTE-003 — Waypoint edits preserve route validity

Inserting, moving or deleting an interior waypoint, and moving an interior run, MUST leave every route run orthogonal. A route edit MUST NOT move a terminal point as an incidental consequence.

_Conformance:_ conforming

_Verify:_ `packages/view-model/src/waypoints.test.ts` covers insertion, movement, deletion, segment movement and terminal protection.

_Evidence:_ `packages/view-model/src/waypoints.test.ts` covers insertion, movement, deletion, segment movement and terminal protection.

### ROUTE-004 — Route normalisation removes redundant points

Normalising a route MUST remove repeated points and merge consecutive collinear runs. It MUST preserve a route whose runs already alternate axes.

_Conformance:_ conforming

_Verify:_ `packages/view-model/src/routing.test.ts` covers repeated points, collinear runs and already-normal routes.

_Evidence:_ `packages/view-model/src/routing.test.ts` covers repeated points, collinear runs and already-normal routes.

### ROUTE-005 — Ports lie on their declared edge

Every calculated port MUST lie on the edge named by its compass-side identifier. Port coordinates MUST be derived from the artefact box and counts in force, so identity and placement agree by construction.

_Conformance:_ conforming

_Verify:_ `packages/view-model/src/guides.test.ts` covers edge placement and per-side counts.

_Evidence:_ `packages/view-model/src/guides.test.ts` covers edge placement and per-side counts.

### ROUTE-006 — A side is subdivided rather than filled from one end

Ports on one side MUST be spread across the usable side length. Numbering MUST proceed centre-outward, making port one the most central position the requested count permits.

_Conformance:_ conforming

_Verify:_ `packages/view-model/src/guides.test.ts` covers subdivision, centre-outward numbering and the position of port one.

_Evidence:_ `packages/view-model/src/guides.test.ts` covers subdivision, centre-outward numbering and the position of port one.

### ROUTE-007 — A side offers every count it can place safely

A side MUST accept every port count for which its ports can occupy distinct interior grid lines, including zero. A count larger than the available space MUST be reduced to the greatest count the side can place without collision.

_Conformance:_ conforming

_Verify:_ `packages/view-model/src/guides.test.ts` covers allowed counts, even distribution and saturation at the maximum safe count.

_Evidence:_ `packages/view-model/src/guides.test.ts` covers allowed counts, even distribution and saturation at the maximum safe count.

### ROUTE-008 — Unspecified port counts use one declared default

When an artefact side has no authored count, port calculation MUST use the View Model's declared default consistently. A consumer MUST NOT invent a second implicit count.

_Conformance:_ conforming

_Verify:_ `packages/view-model/src/guides.test.ts` covers the default count; `defaultPortCount` is exported by `packages/view-model/src/ports.ts`.

_Evidence:_ `packages/view-model/src/guides.test.ts` covers the default count; `defaultPortCount` is exported by `packages/view-model/src/ports.ts`.

### ROUTE-009 — Port audits expose collisions and mismatches

A port audit MUST report routes landing on the same port, ports that are closer than the configured minimum spacing and a shared port identity whose calculated coordinates disagree.

_Conformance:_ conforming

_Verify:_ inspect `auditPorts` in `packages/view-model/src/ports.ts`. against this requirement.

_Evidence:_ `auditPorts` in `packages/view-model/src/ports.ts`.

### ROUTE-010 — The editing grid uses diagram coordinates

Grid snapping MUST operate in the Infoschematic's coordinate space. The standard editing increment is ten diagram units, matching the minimum default port spacing.

_Conformance:_ conforming

_Verify:_ inspect grid projection in `packages/view-studio/src/app/editor/use-editor.ts` and `minimumPortGap` in `packages/view-model/src/ports.ts`. against this requirement.

_Evidence:_ grid projection in `packages/view-studio/src/app/editor/use-editor.ts` and `minimumPortGap` in `packages/view-model/src/ports.ts`.

### ROUTE-011 — Alignment guides come from the scene

Alignment guides MUST be derived from visible box edges, box centres and other handles rather than from a hard-coded list of coordinates.

_Conformance:_ conforming

_Verify:_ `packages/view-model/src/guides.test.ts` covers box edges, centres, handles and duplicate suppression.

_Evidence:_ `packages/view-model/src/guides.test.ts` covers box edges, centres, handles and duplicate suppression.

### ROUTE-012 — Each axis snaps independently

Snapping MUST choose the nearest guide within threshold on each axis independently. An axis with no guide in range MUST retain the requested coordinate.

_Conformance:_ conforming

_Verify:_ `packages/view-model/src/guides.test.ts` covers independent axes, nearest-guide preference and no-guide behaviour.

_Evidence:_ `packages/view-model/src/guides.test.ts` covers independent axes, nearest-guide preference and no-guide behaviour.

### ROUTE-013 — A flow label belongs to its route

A flow-label position MUST be represented as a share of route length rather than as a free coordinate. Projecting a loose point onto a route MUST return the nearest point on one of its runs.

_Conformance:_ conforming

_Verify:_ `packages/view-model/src/routing.test.ts` covers projection onto horizontal and vertical runs; `packages/view-studio/src/app/editor/use-editor.test.ts` covers label-share precision.

_Evidence:_ `packages/view-model/src/routing.test.ts` covers projection onto horizontal and vertical runs; `packages/view-studio/src/app/editor/use-editor.test.ts` covers label-share precision.

### ROUTE-014 — Automatic label placement avoids occupied space

Automatically placed route labels MUST try candidate positions in a stable order and avoid component boxes and already placed labels where possible. An authored or draft position MUST take precedence over automatic placement.

_Conformance:_ conforming

_Verify:_ inspect `placeLabels` in `packages/view-model/src/placement.ts`. against this requirement.

_Evidence:_ `placeLabels` in `packages/view-model/src/placement.ts`.

### ROUTE-015 — Floating overlays remain within the view

A floating overlay position MUST be clamped inside the view before being scored. The first unobstructed candidate SHOULD win; where every candidate is obstructed, the least costly candidate SHOULD win.

_Conformance:_ conforming

_Verify:_ `packages/view-model/src/placement.test.ts` covers preferred, clear, least-obstructed and clamped candidates.

_Evidence:_ `packages/view-model/src/placement.test.ts` covers preferred, clear, least-obstructed and clamped candidates.

### ROUTE-016 — Card internals are placed from the Card's own box

View Model MUST resolve where a Card's label, description, stereotype, and identity chip are drawn from that Card's own box, its resolved treatment, and its authored text. Both renderers MUST consume that one resolution rather than place Card text independently, and every position MUST be the element's visual centre so a renderer draws it with a middle dominant baseline.

The label MUST always be placed. An optional element MUST be withheld where its band does not fit the box, and the identity chip MUST give way to an authored stereotype it would otherwise be drawn over. Element widths MAY be estimated from a fixed advance per character, because no text metric is available to static output and both renderers MUST agree on the same estimate.

_Conformance:_ conforming

_Verify:_ `packages/view-model/src/card-layout.test.ts` covers the reference, square, tall, narrow, and undersized boxes; `scripts/visual-treatment-parity.test.ts` compares placed Card geometry across both renderers.

_Evidence:_ `packages/view-model/src/card-layout.test.ts` covers the reference, square, tall, narrow, and undersized boxes; `scripts/visual-treatment-parity.test.ts` compares placed Card geometry across both renderers.

### ROUTE-017 — Card text is fitted to the Card it is drawn on

View Model MUST resolve the text a Card draws as well as where it draws it: the lines its label is drawn on, and the stereotype and description strings that fit their own bands. Text that does not fit MUST be reduced rather than drawn past the Card's border — wrapped onto the lines the treatment allows, then ended with an ellipsis. A compact Card MUST keep its label to one line, because its stack already carries a band and a description; the legacy treatment MAY wrap onto a second line where the box is tall enough for it. Wrapping MUST break on word boundaries against the box's usable width, never on a character count, and the stereotype MUST be fitted to the box rather than to the space the identity chip leaves.

A fitted string is a visual reduction only. Every renderer MUST keep the authored label, stereotype, and description in full in the Card's accessible name, as CANVAS-007 requires.

_Conformance:_ conforming

_Verify:_ `packages/view-model/src/card-layout.test.ts` covers untouched short text, a width-aware wrap, a truncated compact label, a single over-long word, and fitted stereotype and description bands; `scripts/visual-treatment-parity.test.ts` compares the drawn strings across both renderers and asserts the authored text survives in the accessible name.

_Evidence:_ `packages/view-model/src/card-layout.test.ts` covers untouched short text, a width-aware wrap, a truncated compact label, a single over-long word, and fitted stereotype and description bands; `scripts/visual-treatment-parity.test.ts` compares the drawn strings across both renderers and asserts the authored text survives in the accessible name.

## Quality properties

### ROUTE-018 — Region labels use deterministic shared metrics

View Model MUST derive Region label length, frame notch, and outline solely from shared deterministic metrics. It MUST NOT depend on browser or host-font measurement. Canvas and static SVG MUST consume the same resolved geometry, and authored `labelOffset` MUST remain a placement-only override.

_Conformance:_ conforming

_Verify:_ Compare resolved geometry and both renderer outputs for short, long, narrow, mixed-case, numeric, and non-ASCII labels across compass placements and internal and boundary mounts.

_Evidence:_ `packages/view-model/src/region-geometry.test.ts` covers shared values, representative label classes, compass placements, internal and boundary mounts, and constrained frames; `scripts/visual-treatment-parity.test.ts` compares Canvas and static SVG geometry.
