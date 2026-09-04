# View Model specification

The View Model owns framework-neutral calculations derived from Domain Model data. It may calculate geometry, routes, ports, guides and placement, but it does not render React, own browser state or decide application navigation.

## Runtime derivation

### VIEW-016 — Runtime derivation is framework-neutral

Reusable registers, resolved Scenes and Stories, visibility predicates, routed Flows, placement lookup and interface lookup MUST derive from `InfoschematicConfig` without React or browser state. Equivalent consumers MUST receive deterministic results from the same configuration.

_Verification: `packages/view-model/src/runtime.test.ts` exercises representative register, visibility, routing and Scene derivation through `createInfoschematicRuntime`._

## Visual tokens

### VIEW-017 — Shared visual semantics have one source

View Model MUST export a deeply readonly `visualTokens` manifest for visual values that must agree across renderer paths or between TypeScript geometry and rendered output. The manifest MUST group Canvas values by geometry, surfaces, text, Flows, focus, selection, and motion-independent output defaults. Token names MUST describe stable semantic roles rather than literal colours or measurements.

Authored Scope fills and Flow-family colours MUST remain `InfoschematicConfig` data. Present chrome, Studio chrome, and intentional one-off composition values MUST NOT be promoted solely because they repeat within one View.

### VIEW-018 — CSS projection is deterministic

`scripts/generate-visual-tokens.ts` MUST project every manifest leaf to one CSS custom property named `--infoschematic-canvas-<group>-<token>` in `packages/view-model/src/tokens.generated.css`. Output MUST use deterministic lexical ordering, MUST reject colliding generated names, and MUST expose a check mode that fails when committed generated output differs from fresh output. Generated CSS MUST NOT become a second source of truth.

### VIEW-019 — Renderer values remain consistent

Interactive Canvas output MUST consume the generated CSS projection for shared values. Framework-neutral renderers MUST consume the TypeScript manifest directly without importing CSS or an interactive View. Representative tests MUST prove matching semantic names and values across TypeScript, generated CSS, interactive Canvas output, and static output.

## Routes

### VIEW-001 — Routes are orthogonal

Every rendered route MUST consist only of absolute horizontal and vertical runs. Parsing or constructing a route MUST reject a diagonal run rather than silently approximating it.

_Verification: `packages/view-model/src/routing.test.ts` and `packages/view-model/src/waypoints.test.ts` exercise orthogonal route edits; `routePath` in `packages/view-model/src/geometry.ts` rejects diagonals._

### VIEW-002 — Route edits preserve anchored ends

Moving one end of a route MUST carry the endpoint to its requested position while preserving the far endpoint. Where a straight two-point route cannot remain orthogonal, the calculation MUST introduce a bend rather than move the far endpoint.

_Verification: `packages/view-model/src/routing.test.ts` covers end movement, bend insertion and orthogonality._

### VIEW-003 — Waypoint edits preserve route validity

Inserting, moving or deleting an interior waypoint, and moving an interior run, MUST leave every route run orthogonal. A route edit MUST NOT move a terminal point as an incidental consequence.

_Verification: `packages/view-model/src/waypoints.test.ts` covers insertion, movement, deletion, segment movement and terminal protection._

### VIEW-004 — Route normalisation removes redundant points

Normalising a route MUST remove repeated points and merge consecutive collinear runs. It MUST preserve a route whose runs already alternate axes.

_Verification: `packages/view-model/src/routing.test.ts` covers repeated points, collinear runs and already-normal routes._

## Ports

### VIEW-005 — Ports lie on their declared edge

Every calculated port MUST lie on the edge named by its compass-side identifier. Port coordinates MUST be derived from the artefact box and counts in force, so identity and placement agree by construction.

_Verification: `packages/view-model/src/guides.test.ts` covers edge placement and per-side counts._

### VIEW-006 — A side is subdivided rather than filled from one end

Ports on one side MUST be spread across the usable side length. Numbering MUST proceed centre-outward, making port one the most central position the requested count permits.

_Verification: `packages/view-model/src/guides.test.ts` covers subdivision, centre-outward numbering and the position of port one._

### VIEW-007 — A side offers every count it can place safely

A side MUST accept every port count for which its ports can occupy distinct interior grid lines, including zero. A count larger than the available space MUST be reduced to the greatest count the side can place without collision.

_Verification: `packages/view-model/src/guides.test.ts` covers allowed counts, even distribution and saturation at the maximum safe count._

### VIEW-008 — Unspecified port counts use one declared default

When an artefact side has no authored count, port calculation MUST use the View Model's declared default consistently. A consumer MUST NOT invent a second implicit count.

_Verification: `packages/view-model/src/guides.test.ts` covers the default count; `defaultPortCount` is exported by `packages/view-model/src/ports.ts`._

### VIEW-009 — Port audits expose collisions and mismatches

A port audit MUST report routes landing on the same port, ports that are closer than the configured minimum spacing and a shared port identity whose calculated coordinates disagree.

_Implementation surface: `auditPorts` in `packages/view-model/src/ports.ts`._

## Grid and guides

### VIEW-010 — The editing grid uses diagram coordinates

Grid snapping MUST operate in the Infoschematic's coordinate space. The standard editing increment is ten diagram units, matching the minimum default port spacing.

_Implementation surface: grid projection in `packages/view-studio/src/app/editor/use-editor.ts` and `minimumPortGap` in `packages/view-model/src/ports.ts`._

### VIEW-011 — Alignment guides come from the scene

Alignment guides MUST be derived from visible box edges, box centres and other handles rather than from a hard-coded list of coordinates.

_Verification: `packages/view-model/src/guides.test.ts` covers box edges, centres, handles and duplicate suppression._

### VIEW-012 — Each axis snaps independently

Snapping MUST choose the nearest guide within threshold on each axis independently. An axis with no guide in range MUST retain the requested coordinate.

_Verification: `packages/view-model/src/guides.test.ts` covers independent axes, nearest-guide preference and no-guide behaviour._

## Labels and overlays

### VIEW-013 — A flow label belongs to its route

A flow-label position MUST be represented as a share of route length rather than as a free coordinate. Projecting a loose point onto a route MUST return the nearest point on one of its runs.

_Verification: `packages/view-model/src/routing.test.ts` covers projection onto horizontal and vertical runs; `packages/view-studio/src/app/editor/use-editor.test.ts` covers label-share precision._

### VIEW-014 — Automatic label placement avoids occupied space

Automatically placed route labels MUST try candidate positions in a stable order and avoid component boxes and already placed labels where possible. An authored or draft position MUST take precedence over automatic placement.

_Implementation surface: `placeLabels` in `packages/view-model/src/placement.ts`._

### VIEW-015 — Floating overlays remain within the view

A floating overlay position MUST be clamped inside the view before being scored. The first unobstructed candidate SHOULD win; where every candidate is obstructed, the least costly candidate SHOULD win.

_Verification: `packages/view-model/src/placement.test.ts` covers preferred, clear, least-obstructed and clamped candidates._

## Artefact editing

### VIEW-020 — Selection and capabilities are discriminated by kind

View Model MUST expose a discriminated selection for Region, Fabric, Card, Flow and Graphic. Every selection MUST carry `kind`, stable `id`, geometry role and nullable authored `code`.

Each kind MUST support create, select, property editing, remove and within-kind reorder. Region, Fabric, Card and Graphic MUST support move and resize. Flow MUST NOT expose generic move or resize because its endpoint and waypoint operations own route geometry.

_Implementation surface: `ArtefactSelection`, `artefactCapabilities` and `artefactCan` in `packages/view-model/src/editable.ts`._

### VIEW-021 — Geometry operations preserve kind constraints

Region, Fabric, Card and Graphic geometry MUST use a box movable and resizable on both axes; an authored Region corner radius MUST survive geometry changes. Default resize minima MUST be 20 by 20 for Region and Graphic, and 40 by 40 for Fabric and Card. Invalid, stale or kind-mismatched geometry MUST be rejected rather than partially applied.

_Implementation surface: geometry records and `artefactResizeMinimums` in `packages/view-model/src/editable.ts`; immutable application in `packages/view-model/src/artefact-draft.ts`._

### VIEW-022 — Draft materialisation is immutable and deterministic

Applying artefact operations MUST return a new `InfoschematicConfig` without mutating the host configuration or supplied serialisable values. Created and replacement values MUST be deep-copied. A rejected operation MUST leave the current materialised value unchanged and produce an indexed diagnostic.

Create, property replacement, geometry, reorder and remove operations MUST apply in their supplied order. Callers MUST use deterministic dependency ordering before persistence or handoff. Reorder MUST change only the authored array for the selected kind. Flow property replacement MAY replace route points and other authored Flow properties, but generic Flow movement and resize MUST remain invalid.

_Verification: `packages/view-model/src/artefact-draft.test.ts` covers all six kinds, immutability, authored order, property replacement, rejection and cascades._

### VIEW-023 — Removal materialisation preserves references

Removing a Card MUST remove direct and transitive Adapter Cards that wrap it and every Flow ending on a removed Card. Removing a Fabric MUST remove its endpoint Flows. Removing a Region MUST NOT cascade to any other artefact. Removing a Graphic MUST clear direct Story Scene Graphic references and remove it from Standalone Scene, Thematic Scene and Story Scene focus collections.

Unrelated Scopes, Flow families, renderer keys, renderer properties and authored route data MUST survive materialisation unchanged.

_Implementation surface: `applyArtefactOperations` in `packages/view-model/src/artefact-draft.ts`._

### VIEW-024 — Draft preview derives a complete runtime

Canvas MAY derive a transient runtime by materialising operations over the complete host configuration and passing the result to `createInfoschematicRuntime`. The preview MUST NOT mutate the host configuration. Existing component-offset and route drafts MUST remain later overlays, while an unchanged supplied Flow MUST NOT mask a materialised Flow route or property replacement.

_Verification: `packages/view-canvas/src/InfoschematicDiagram.preview.test.tsx` covers six-kind creation, geometry, ordering, property replacement, safe removal, draft overlay precedence and Present Graphic independence._

## Gaps

- `auditPorts` has no dedicated automated test in this repository.
- `placeLabels` has no dedicated automated test covering obstacle and label clearance.
- The ten-unit grid is currently declared by Studio while minimum port spacing is declared by View Model; one shared grid contract has not yet been established.
- Domain-wide checks connecting flow endpoints to calculated ports remain a consumer responsibility.
