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

## Visual tokens

### CANVAS-005 — Shared Canvas semantics use generated tokens

Canvas MUST consume the generated CSS projection of View Model's `visualTokens` manifest for shared geometry, surfaces, text, Flow, focus, selection, and output-default values. Generated custom properties MUST use the `--infoschematic-canvas-<group>-<token>` namespace and MUST NOT be edited as an independent styling source.

Canvas-only hit targets, drag handles, editing guides, and transient motion MAY remain local when no framework-neutral calculation or renderer must agree on their value. Authored Scope fills and Flow-family colours MUST continue to come from `InfoschematicConfig` rather than the generated token set.

## Visual treatments

### CANVAS-006 — Canvas resolves authored appearance through View Model

Canvas MUST consume View Model's resolved visual treatment and region geometry rather than interpret authored appearance independently. It MUST render the selected surface and authored grid; absent, solid, dashed, and dotted Lane and Zone frames; independently plain or notched Region labels at the resolved placement; Card compactness; optional Card metadata; and Domain semantic colour. A Domain-classified Card MUST use its Domain colour and fill independently of Scope visibility; an unclassified Card MAY retain the existing Scope treatment as fallback.

Absent appearance MUST render the backward-compatible defaults: neutral surface, no authored grid, non-compact Cards, hidden optional Card metadata, solid-framed Lanes with plain labels, and unframed Zones with plain labels. An absent or hidden Region label MUST suppress a requested notch without changing the authored frame style. Label placement and rounded or notched outlines MUST use the framework-neutral geometry returned by View Model.

The `cardDetails` output option MAY override authored identity, stereotype, and description visibility. It MUST NOT remove authored metadata or override Card compactness. The legacy boolean Design grid MUST remain an editing overlay independent of the authored grid treatment.

_Implementation surface: `packages/view-canvas/src/Canvas.tsx`, `packages/view-canvas/src/InfoschematicDiagram.tsx`, and `packages/view-model/src/appearance.ts`._

### CANVAS-007 — Visual reduction preserves accessible meaning

The root SVG description MUST summarise visible Card identity, stereotype, and description. A Card's accessible label MUST retain those authored values even when output options hide their visual rows.

Canvas MUST provide an accessible name for the complete Infoschematic and for interactive Lane, Zone, Card, and Flow elements. Hiding optional Card rows visually MUST NOT remove the Card's authored identity, stereotype, or description from its accessible SVG metadata. Domain colour, surface, and grid MUST NOT be the only source of meaning.

Representative treatment fixtures MUST prove the same resolved surface, grid, frame, label placement, Card detail, compactness, and Domain decisions as static SVG. Tests MAY compare semantic attributes and deterministic geometry rather than byte-identical React and string-rendered markup.

_Verification: `packages/view-canvas/src/InfoschematicDiagram.treatments.test.tsx` and `packages/view-model/src/region-geometry.test.ts`._

## Dependency boundary

Canvas MAY depend on Domain Model and View Model. It MUST NOT depend on Present, Studio, a particular authored Infoschematic, or a host's renderer implementations.
