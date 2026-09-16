# Runtime model — RUNTIME

Framework-neutral derivation and immutable materialisation of typed selection and draft operations. Part of the [Specifications corpus](index.md).

## Quality properties

### RUNTIME-001 — Runtime derivation is framework-neutral

Reusable registers, canonical Sequences and Scenes, visibility predicates, routed Flows, placement lookups and specification lookups MUST derive without React or browser state. Equivalent canonical inputs MUST receive deterministic results.

_Conformance:_ conforming

_Verify:_ exercise representative register, visibility, routing and Sequence derivation through `createInfoschematicRuntime`.

_Evidence:_ `packages/view-model/src/runtime.test.ts` and `packages/view-model/src/specifications.test.ts` cover framework-neutral runtime derivation.

### RUNTIME-002 — Selection and capabilities are discriminated by kind

View Model MUST expose a discriminated selection for Region, Fabric, Card, Flow and Overlay. Every selection MUST carry `kind`, stable `id`, geometry role and nullable authored `code`.

Each kind MUST support create, select, property editing, remove and within-kind reorder. Region, Fabric, Card and Overlay MUST support move and resize. Flow MUST NOT expose generic move or resize because its endpoint and waypoint operations own route geometry.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-model`, then select one of each kind — Region, Fabric, Card, Flow, Overlay — and read what comes back: every selection carries `kind`, a stable `id`, its geometry role, and an authored `code` that may be null. Then ask each kind for its capabilities: create, select, property editing, remove, and within-kind reorder must be available for all five, move and resize for the four boxed kinds, and a generic move or resize of a Flow must be refused rather than silently ignored.

_Evidence:_ `ArtefactSelection`, `artefactCapabilities` and `artefactCan` in `packages/view-model/src/editable.ts`.

### RUNTIME-003 — Geometry operations preserve kind constraints

Region, Fabric, Card and Overlay geometry MUST use a box movable and resizable on both axes; an authored Region corner radius MUST survive geometry changes. Default resize minima MUST be 20 by 20 for Region and Overlay, and 40 by 40 for Fabric and Card. Invalid, stale or kind-mismatched geometry MUST be rejected rather than partially applied.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-model`, then move and resize a Region, Fabric, Card, and Overlay on both axes and confirm an authored Region corner radius survives. Resize each toward nothing and confirm it stops at 20 by 20 for Region and Overlay and 40 by 40 for Fabric and Card. Then submit geometry that is invalid, stale, or aimed at the wrong kind: each must be rejected whole, with no half-applied box left behind.

_Evidence:_ geometry records and `artefactResizeMinimums` in `packages/view-model/src/editable.ts`; immutable application in `packages/view-model/src/artefact-draft.ts`.

### RUNTIME-004 — Draft materialisation is immutable and deterministic

Applying artefact operations MUST return a new `InfoschematicConfig` without mutating the host configuration or supplied serialisable values. Created and replacement values MUST be deep-copied. A rejected operation MUST leave the current materialised value unchanged and produce an indexed diagnostic.

Create, property replacement, geometry, reorder and remove operations MUST apply in their supplied order. Callers MUST use deterministic dependency ordering before persistence or handoff. Reorder MUST change only the authored array for the selected kind. Flow property replacement MAY replace route points and other authored Flow properties, but generic Flow movement and resize MUST remain invalid.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-model`, then apply a batch of artefact operations and compare the host configuration before and after by deep equality — it must be untouched, and the created and replacement values in the result must not share references with what was supplied. Include one operation that must be rejected and confirm the materialised value is unchanged and the diagnostic names its index. Reorder one kind and confirm only that authored array moved, then confirm a Flow property replacement may set route points while a generic Flow move or resize stays invalid.

_Evidence:_ `packages/view-model/src/artefact-draft.test.ts` covers all six kinds, immutability, authored order, property replacement, rejection and cascades.

### RUNTIME-005 — Removal materialisation preserves references

Removing a Card MUST remove direct and transitive Adapter Cards that wrap it and every Flow ending on a removed Card. Removing a Fabric MUST remove its endpoint Flows. Removing a Region MUST NOT cascade to any other artefact. Removing an Overlay MUST clear direct Sequence Scene Overlay references and remove it from Standalone and Sequence Scene focus collections.

Unrelated Scopes, Flow families, renderer keys, renderer properties and authored route data MUST survive materialisation unchanged.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-model`, then remove artefacts from a document built to expose the cascades: a Card wrapped by an Adapter Card that is itself wrapped, with Flows ending on each; a Fabric with endpoint Flows; a Region containing all of it; an Overlay referenced by a Sequence Scene and present in Standalone and Sequence focus collections. Removing the Card must take the transitive Adapter Cards and every Flow ending on a removed Card; removing the Fabric must take its endpoint Flows; removing the Region must take nothing else; removing the Overlay must clear its references and focus entries. Then diff the result for Scopes, Flow families, renderer keys, renderer properties, and authored route data — all must survive unchanged.

_Evidence:_ `applyArtefactOperations` in `packages/view-model/src/artefact-draft.ts`.

### RUNTIME-006 — Draft preview derives a complete runtime

Canvas MAY derive a transient runtime by materialising operations over the complete host configuration and passing the result to `createInfoschematicRuntime`. The preview MUST NOT mutate the host configuration. Existing component-offset and route drafts MUST remain later overlays, while an unchanged supplied Flow MUST NOT mask a materialised Flow route or property replacement.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-canvas`, then derive a preview runtime from operations over a complete host configuration: the host configuration must be unchanged afterwards, and `createInfoschematicRuntime` must have received the materialised result rather than a patch. Hold a component-offset draft and a route draft across the preview and confirm both still win as later overlays, then confirm a supplied Flow left untouched does not mask a materialised route or property replacement of the same Flow.

_Evidence:_ `packages/view-canvas/src/InfoschematicDiagram.preview.test.tsx` covers six-kind creation, geometry, ordering, property replacement, safe removal, draft overlay precedence and Present Overlay independence.

### RUNTIME-007 — Public inputs share one canonical runtime

View Model MUST accept a canonical `Infoschematic` or established `InfoschematicConfig` through one public runtime factory. It MUST normalise either form once through Domain Core, expose the canonical `DefinedInfoschematic` as runtime configuration, and MUST NOT convert canonical inputs into established configuration before Canvas, Present or static rendering derives behaviour. Compatibility-only projections MUST be explicitly named and confined to established selection or Studio source-edit boundaries.

_Conformance:_ conforming

_Verify:_ compare canonical and established inputs through `createInfoschematicRuntime`, inspect package boundaries, and run Canvas, Present, Studio and static-renderer suites.

_Evidence:_ `packages/view-model/src/runtime.ts` owns the single normalisation point; `packages/view-model/src/compatibility.test.ts`, `packages/view-model/src/runtime.test.ts`, and cross-View tests cover both input forms.
