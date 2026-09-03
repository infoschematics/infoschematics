# Static SVG renderer specification

The static SVG renderer produces deterministic, framework-neutral output from serialisable Infoschematic configuration. It consumes Domain Model and View Model only and does not emulate interactive or Producer state.

## Output

### SVG-001 — Output is deterministic

The same configuration and options MUST produce byte-for-byte identical SVG. Output ordering MUST follow authored order and MUST NOT depend on object enumeration outside declared authored collections.

_Verification: `packages/render-svg/src/index.test.ts` snapshots title-only and representative configured output._

### SVG-002 — Text and attributes are safe

All authored text and attribute values MUST be XML escaped. Numeric geometry MUST be finite before serialisation.

_Verification: `packages/render-svg/src/index.test.ts` covers XML-significant text and invalid coordinates._

### SVG-003 — Scene visibility is explicit

The caller MAY select a Standalone Scene, Thematic Scene, or Story Scene. The renderer MUST apply the selected Scene's focus deterministically and MUST make the treatment of unfocused content explicit through options rather than interactive state.

### SVG-004 — Scope visibility is explicit

The caller MAY select visible Scopes. When omitted, all configured Scopes MUST be visible. Flow visibility MUST continue to respect both its family and endpoint visibility.

### SVG-005 — Graphics remain serialisable

Placed Graphics MUST resolve from authored configuration. The framework-neutral renderer MUST provide labelled fallback output without importing host React renderers or executing authored callbacks.

### SVG-006 — Static output uses shared visual semantics

Static SVG MUST consume shared Canvas geometry, surface, text, Flow, focus, and output-default values directly from View Model's readonly `visualTokens` manifest. It MUST NOT duplicate those literals or import generated CSS. Equivalent built-in Canvas artefacts MUST retain the same semantic treatment across interactive and static output, while authored Scope fills and Flow-family colours MUST continue to come from `InfoschematicConfig`.

## Dependency boundary

`@infoschematics/render-svg` MUST NOT depend on React, React DOM, browser globals, or any interactive View package. Shared derivation belongs in View Model.
