# Canvas View specification

Canvas View renders the reusable interactive React Infoschematic surface from serialisable Domain Model data and framework-neutral View Model calculations. `packages/view-canvas` owns renderer bindings and the base interaction contract; Present and Studio add behaviour without replacing that ownership.

## Host rendering

### CANVAS-001 — The host supplies an immutable renderer registry

Canvas MUST accept renderer configuration as an optional application prop. The registry MUST be treated as immutable for the mounted application and MUST NOT be populated through a process-global registration API. Internal React context MAY distribute the supplied value. Fabric and Graphic components, property validators, diagnostic callbacks, shared SVG definitions, and Scope icons MUST remain outside `InfoschematicConfig`.

_Implementation surface: the renderer contract and context in `packages/view-canvas/src/renderers.tsx`, and the `renderers` prop in `packages/view-canvas/src/Canvas.tsx`._

### CANVAS-002 — Renderer definitions are versioned and validated

Each Fabric or Graphic renderer definition MUST bind one stable authored key and positive schema version to a runtime property validator and React implementation. Canvas MUST validate authored properties before invoking that implementation. An unknown key or invalid property value MUST select the relevant fallback and MUST emit a structured diagnostic when the host supplies a diagnostic callback. An unsupported definition version or duplicate key MUST be rejected deterministically and reported through the same callback.

The diagnostic MUST identify the problem kind and affected renderer reference without requiring the Audience to inspect console output. Diagnostic reporting MUST NOT make rendering throw. The first definition for a duplicate key MUST win.

_Implementation surface: `defineInfoschematicRenderers`, definition resolution, validation, and diagnostics in `packages/view-canvas/src/renderers.tsx`._

### CANVAS-003 — Extension failure retains product behaviour

An unavailable or invalid Fabric renderer MUST retain generic labelled bounds. An unavailable or invalid Graphic renderer MUST produce a deterministic labelled placeholder. Fallback content MUST be accessible and MUST NOT remove Canvas-owned geometry, selection, pointer behaviour, or editing frames.

_Verification: `packages/view-canvas/src/renderers.test.tsx` covers inferred definition types, immutable snapshots, diagnostics, resolution and server rendering; `packages/view-canvas/src/Canvas.test.tsx` covers validated implementations and labelled fallbacks without losing interaction geometry._

### CANVAS-004 — Renderer compatibility is explicit

Renderer keys MUST be treated as durable authored identifiers. The current definition contract MUST use schema version `1`; a definition with another version MUST be diagnosed as unsupported. A backwards-compatible validator change MAY retain its key and version. Because authored renderer references do not yet select a schema version, an incompatible property change MUST use a new stable renderer key until Domain Model introduces an explicit version selector.

Shared SVG definitions and Scope icons MAY remain unversioned host-level support because authored renderer properties do not select their implementation contract directly.

## Dependency boundary

Canvas MAY depend on Domain Model and View Model. It MUST NOT depend on Present, Studio, a particular authored Infoschematic, or a host's renderer implementations.
