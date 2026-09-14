# Runtime model — RUNTIME

Framework-neutral derivation and immutable materialisation of typed selection and draft operations. Part of the [Specifications corpus](index.md).

## Quality properties

### RUNTIME-001 — Runtime derivation is framework-neutral

Reusable registers, resolved Scenes and Stories, visibility predicates, routed Flows, placement lookup and interface lookup MUST derive from `InfoschematicConfig` without React or browser state. Equivalent consumers MUST receive deterministic results from the same configuration.

_Conformance:_ conforming

_Verify:_ `packages/view-model/src/runtime.test.ts` exercises representative register, visibility, routing and Scene derivation through `createInfoschematicRuntime`.

_Evidence:_ `packages/view-model/src/runtime.test.ts` exercises representative register, visibility, routing and Scene derivation through `createInfoschematicRuntime`.

### RUNTIME-002 — Selection and capabilities are discriminated by kind

View Model MUST expose a discriminated selection for Region, Fabric, Card, Flow and Overlay. Every selection MUST carry `kind`, stable `id`, geometry role and nullable authored `code`.

Each kind MUST support create, select, property editing, remove and within-kind reorder. Region, Fabric, Card and Overlay MUST support move and resize. Flow MUST NOT expose generic move or resize because its endpoint and waypoint operations own route geometry.

_Conformance:_ conforming

_Verify:_ inspect `ArtefactSelection`, `artefactCapabilities` and `artefactCan` in `packages/view-model/src/editable.ts`. against this requirement.

_Evidence:_ `ArtefactSelection`, `artefactCapabilities` and `artefactCan` in `packages/view-model/src/editable.ts`.

### RUNTIME-003 — Geometry operations preserve kind constraints

Region, Fabric, Card and Overlay geometry MUST use a box movable and resizable on both axes; an authored Region corner radius MUST survive geometry changes. Default resize minima MUST be 20 by 20 for Region and Overlay, and 40 by 40 for Fabric and Card. Invalid, stale or kind-mismatched geometry MUST be rejected rather than partially applied.

_Conformance:_ conforming

_Verify:_ inspect geometry records and `artefactResizeMinimums` in `packages/view-model/src/editable.ts`; immutable application in `packages/view-model/src/artefact-draft.ts`. against this requirement.

_Evidence:_ geometry records and `artefactResizeMinimums` in `packages/view-model/src/editable.ts`; immutable application in `packages/view-model/src/artefact-draft.ts`.

### RUNTIME-004 — Draft materialisation is immutable and deterministic

Applying artefact operations MUST return a new `InfoschematicConfig` without mutating the host configuration or supplied serialisable values. Created and replacement values MUST be deep-copied. A rejected operation MUST leave the current materialised value unchanged and produce an indexed diagnostic.

Create, property replacement, geometry, reorder and remove operations MUST apply in their supplied order. Callers MUST use deterministic dependency ordering before persistence or handoff. Reorder MUST change only the authored array for the selected kind. Flow property replacement MAY replace route points and other authored Flow properties, but generic Flow movement and resize MUST remain invalid.

_Conformance:_ conforming

_Verify:_ `packages/view-model/src/artefact-draft.test.ts` covers all six kinds, immutability, authored order, property replacement, rejection and cascades.

_Evidence:_ `packages/view-model/src/artefact-draft.test.ts` covers all six kinds, immutability, authored order, property replacement, rejection and cascades.

### RUNTIME-005 — Removal materialisation preserves references

Removing a Card MUST remove direct and transitive Adapter Cards that wrap it and every Flow ending on a removed Card. Removing a Fabric MUST remove its endpoint Flows. Removing a Region MUST NOT cascade to any other artefact. Removing an Overlay MUST clear direct Sequence Scene Overlay references and remove it from Standalone and Sequence Scene focus collections.

Unrelated Scopes, Flow families, renderer keys, renderer properties and authored route data MUST survive materialisation unchanged.

_Conformance:_ conforming

_Verify:_ inspect `applyArtefactOperations` in `packages/view-model/src/artefact-draft.ts`. against this requirement.

_Evidence:_ `applyArtefactOperations` in `packages/view-model/src/artefact-draft.ts`.

### RUNTIME-006 — Draft preview derives a complete runtime

Canvas MAY derive a transient runtime by materialising operations over the complete host configuration and passing the result to `createInfoschematicRuntime`. The preview MUST NOT mutate the host configuration. Existing component-offset and route drafts MUST remain later overlays, while an unchanged supplied Flow MUST NOT mask a materialised Flow route or property replacement.

_Conformance:_ conforming

_Verify:_ `packages/view-canvas/src/InfoschematicDiagram.preview.test.tsx` covers six-kind creation, geometry, ordering, property replacement, safe removal, draft overlay precedence and Present Overlay independence.

_Evidence:_ `packages/view-canvas/src/InfoschematicDiagram.preview.test.tsx` covers six-kind creation, geometry, ordering, property replacement, safe removal, draft overlay precedence and Present Overlay independence.
