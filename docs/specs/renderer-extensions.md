# Renderer extensions — EXTEND

Host-provided visual implementations, compatibility, validation, and accessible generic fallbacks. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### EXTEND-001 — Extension failure retains product behaviour

An unavailable or invalid Fabric renderer MUST retain generic labelled bounds. An unavailable or invalid Overlay renderer MUST produce a deterministic labelled placeholder. Fallback content MUST be accessible and MUST NOT remove Canvas-owned geometry, selection, pointer behaviour, or editing frames.

_Conformance:_ conforming

_Verify:_ `packages/view-canvas/src/renderers.test.tsx` covers inferred definition types, immutable snapshots, diagnostics, resolution and server rendering; `packages/view-canvas/src/Canvas.test.tsx` covers validated implementations and labelled fallbacks without losing interaction geometry.

_Evidence:_ `packages/view-canvas/src/renderers.test.tsx` covers inferred definition types, immutable snapshots, diagnostics, resolution and server rendering; `packages/view-canvas/src/Canvas.test.tsx` covers validated implementations and labelled fallbacks without losing interaction geometry.

### EXTEND-002 — Renderer compatibility is explicit

Renderer keys MUST be treated as durable authored identifiers. The current definition contract MUST use schema version `1`; a definition with another version MUST be diagnosed as unsupported. A backwards-compatible validator change MAY retain its key and version. Because authored renderer references do not yet select a schema version, an incompatible property change MUST use a new stable renderer key until Domain Model introduces an explicit version selector.

Shared SVG definitions and Scope icons MAY remain unversioned host-level support because authored renderer properties do not select their implementation contract directly.

_Conformance:_ pending

_Verify:_ add a focused implementation or rendered-output check for this accepted requirement.

### EXTEND-003 — Fabrics retain a generic fallback

Every visible authored Fabric MUST render independently. A configured renderer receives the Fabric and its effective edited bounds; an absent or unknown renderer key MUST use the generic bounds-driven Fabric rendering rather than coupling visibility to another Fabric or known key.

_Conformance:_ conforming

_Verify:_ renderer and Canvas integration tests under `packages/view-canvas/src/` cover configured, unknown, unsupported and invalid Fabric renderers.

_Evidence:_ renderer and Canvas integration tests under `packages/view-canvas/src/` cover configured, unknown, unsupported and invalid Fabric renderers.

### EXTEND-004 — Story Overlays resolve through authored data

A Story Overlay reference MUST resolve to a Overlay in the serialisable Infoschematic definition before Studio invokes the matching host renderer. An unresolved reference MUST NOT be treated as a renderer key or produce embedded fallback narrative.

_Conformance:_ conforming

_Verify:_ Canvas integration tests under `packages/view-canvas/src/` cover resolved and unresolved Story Overlay references and accessible fallback rendering.

_Evidence:_ Canvas integration tests under `packages/view-canvas/src/` cover resolved and unresolved Story Overlay references and accessible fallback rendering.

## Quality properties

### EXTEND-005 — The host supplies an immutable renderer registry

Canvas MUST accept renderer configuration as an optional application prop. The registry MUST be treated as immutable for the mounted application and MUST NOT be populated through a process-global registration API. Internal React context MAY distribute the supplied value. Fabric and Overlay components, property validators, diagnostic callbacks, shared SVG definitions, and Scope icons MUST remain outside `InfoschematicConfig`.

_Conformance:_ conforming

_Verify:_ inspect the renderer contract and context in `packages/view-canvas/src/renderers.tsx`, and the `renderers` prop in `packages/view-canvas/src/Canvas.tsx`. against this requirement.

_Evidence:_ the renderer contract and context in `packages/view-canvas/src/renderers.tsx`, and the `renderers` prop in `packages/view-canvas/src/Canvas.tsx`.

### EXTEND-006 — Renderer definitions are versioned and validated

Each Fabric or Overlay renderer definition MUST bind one stable authored key and positive schema version to a runtime property validator and React implementation. Canvas MUST validate authored properties before invoking that implementation. An unknown key or invalid property value MUST select the relevant fallback and MUST emit a structured diagnostic when the host supplies a diagnostic callback. An unsupported definition version or duplicate key MUST be rejected deterministically and reported through the same callback.

The diagnostic MUST identify the problem kind and affected renderer reference without requiring the Audience to inspect console output. Diagnostic reporting MUST NOT make rendering throw. The first definition for a duplicate key MUST win.

_Conformance:_ conforming

_Verify:_ inspect `defineInfoschematicRenderers`, definition resolution, validation, and diagnostics in `packages/view-canvas/src/renderers.tsx`. against this requirement.

_Evidence:_ `defineInfoschematicRenderers`, definition resolution, validation, and diagnostics in `packages/view-canvas/src/renderers.tsx`.

### EXTEND-007 — Hosts supply visual implementations

Studio MUST accept host-owned renderer configuration separately from `InfoschematicConfig` and pass it through the lower View contracts. Fabric, Overlay, Callout, shared SVG definition and Scope icon implementations MUST NOT be stored in authored configuration or imported from a particular realisation by the reusable package. Studio MUST NOT create a second renderer registry contract alongside Canvas and Present.

_Conformance:_ conforming

_Verify:_ inspect compatibility exports in `packages/view-studio/src/index.ts`; the owning registry and context are in `packages/view-canvas/src/renderers.tsx`. against this requirement.

_Evidence:_ compatibility exports in `packages/view-studio/src/index.ts`; the owning registry and context are in `packages/view-canvas/src/renderers.tsx`.
