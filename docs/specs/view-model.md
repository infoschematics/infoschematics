# View Model specification

The View Model owns framework-neutral calculations derived from Domain Model data. It may calculate geometry, routes, ports, guides and placement, but it does not render React, own browser state or decide application navigation.

## Routes

### VIEW-001 — Routes are orthogonal

Every rendered route MUST consist only of absolute horizontal and vertical runs. Parsing or constructing a route MUST reject a diagonal run rather than silently approximating it.

_Provenance: IBC TOPO-007._

_Verification: `workspaces/view-model/src/routing.test.ts` and `workspaces/view-model/src/waypoints.test.ts` exercise orthogonal route edits; `routePath` in `workspaces/view-model/src/geometry.ts` rejects diagonals._

### VIEW-002 — Route edits preserve anchored ends

Moving one end of a route MUST carry the endpoint to its requested position while preserving the far endpoint. Where a straight two-point route cannot remain orthogonal, the calculation MUST introduce a bend rather than move the far endpoint.

_Provenance: IBC EDIT-017, EDIT-053 and EDIT-055._

_Verification: `workspaces/view-model/src/routing.test.ts` covers end movement, bend insertion and orthogonality._

### VIEW-003 — Waypoint edits preserve route validity

Inserting, moving or deleting an interior waypoint, and moving an interior run, MUST leave every route run orthogonal. A route edit MUST NOT move a terminal point as an incidental consequence.

_Provenance: IBC EDIT-031, EDIT-032 and EDIT-033._

_Verification: `workspaces/view-model/src/waypoints.test.ts` covers insertion, movement, deletion, segment movement and terminal protection._

### VIEW-004 — Route normalisation removes redundant points

Normalising a route MUST remove repeated points and merge consecutive collinear runs. It MUST preserve a route whose runs already alternate axes.

_Provenance: extracted from the route-normalisation behaviour supporting IBC EDIT-033 and EDIT-068._

_Verification: `workspaces/view-model/src/routing.test.ts` covers repeated points, collinear runs and already-normal routes._

## Ports

### VIEW-005 — Ports lie on their declared edge

Every calculated port MUST lie on the edge named by its compass-side identifier. Port coordinates MUST be derived from the artefact box and counts in force, so identity and placement agree by construction.

_Provenance: IBC TOPO-020, EDIT-016 and EDIT-062._

_Verification: `workspaces/view-model/src/guides.test.ts` covers edge placement and per-side counts._

### VIEW-006 — A side is subdivided rather than filled from one end

Ports on one side MUST be spread across the usable side length. Numbering MUST proceed centre-outward, making port one the most central position the requested count permits.

_Provenance: IBC EDIT-014 and EDIT-015._

_Verification: `workspaces/view-model/src/guides.test.ts` covers subdivision, centre-outward numbering and the position of port one._

### VIEW-007 — A side offers every count it can place safely

A side MUST accept every port count for which its ports can occupy distinct interior grid lines, including zero. A count larger than the available space MUST be reduced to the greatest count the side can place without collision.

_Provenance: IBC EDIT-044 and EDIT-063._

_Verification: `workspaces/view-model/src/guides.test.ts` covers allowed counts, even distribution and saturation at the maximum safe count._

### VIEW-008 — Unspecified port counts use one declared default

When an artefact side has no authored count, port calculation MUST use the View Model's declared default consistently. A consumer MUST NOT invent a second implicit count.

_Provenance: IBC EDIT-024._

_Verification: `workspaces/view-model/src/guides.test.ts` covers the default count; `defaultPortCount` is exported by `workspaces/view-model/src/ports.ts`._

### VIEW-009 — Port audits expose collisions and mismatches

A port audit MUST report routes landing on the same port, ports that are closer than the configured minimum spacing and a shared port identity whose calculated coordinates disagree.

_Provenance: IBC TOPO-011 and TOPO-020._

_Implementation surface: `auditPorts` in `workspaces/view-model/src/ports.ts`._

## Grid and guides

### VIEW-010 — The editing grid uses diagram coordinates

Grid snapping MUST operate in the Infoschematic's coordinate space. The standard editing increment is ten diagram units, matching the minimum default port spacing.

_Provenance: IBC TOPO-016 and EDIT-006._

_Implementation surface: grid projection in `workspaces/view-studio/src/app/editor/use-editor.ts` and `minimumPortGap` in `workspaces/view-model/src/ports.ts`._

### VIEW-011 — Alignment guides come from the scene

Alignment guides MUST be derived from visible box edges, box centres and other handles rather than from a hard-coded list of coordinates.

_Provenance: IBC EDIT-008._

_Verification: `workspaces/view-model/src/guides.test.ts` covers box edges, centres, handles and duplicate suppression._

### VIEW-012 — Each axis snaps independently

Snapping MUST choose the nearest guide within threshold on each axis independently. An axis with no guide in range MUST retain the requested coordinate.

_Provenance: IBC EDIT-009 and EDIT-010._

_Verification: `workspaces/view-model/src/guides.test.ts` covers independent axes, nearest-guide preference and no-guide behaviour._

## Labels and overlays

### VIEW-013 — A flow label belongs to its route

A flow-label position MUST be represented as a share of route length rather than as a free coordinate. Projecting a loose point onto a route MUST return the nearest point on one of its runs.

_Provenance: IBC TOPO-012, EDIT-047 and EDIT-057._

_Verification: `workspaces/view-model/src/routing.test.ts` covers projection onto horizontal and vertical runs; `workspaces/view-studio/src/app/editor/use-editor.test.ts` covers label-share precision._

### VIEW-014 — Automatic label placement avoids occupied space

Automatically placed route labels MUST try candidate positions in a stable order and avoid component boxes and already placed labels where possible. An authored or draft position MUST take precedence over automatic placement.

_Provenance: IBC TOPO-012._

_Implementation surface: `placeLabels` in `workspaces/view-model/src/placement.ts`._

### VIEW-015 — Floating overlays remain within the view

A floating overlay position MUST be clamped inside the view before being scored. The first unobstructed candidate SHOULD win; where every candidate is obstructed, the least costly candidate SHOULD win.

_Provenance: extracted from the IBC scene and callout placement implementation rather than a numbered topology requirement._

_Verification: `workspaces/view-model/src/placement.test.ts` covers preferred, clear, least-obstructed and clamped candidates._

## Gaps

- `auditPorts` has no dedicated automated test in this repository.
- `placeLabels` has no dedicated automated test covering obstacle and label clearance.
- The ten-unit grid is currently declared by Studio while minimum port spacing is declared by View Model; one shared grid contract has not yet been established.
- Domain-wide checks connecting flow endpoints to calculated ports remain a consumer responsibility.
