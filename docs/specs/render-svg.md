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

### SVG-007 — Static output honours resolved visual treatments

Static SVG MUST use View Model's visual-treatment and region-geometry resolvers for authored surface and grid; absent, solid, dashed, and dotted Lane and Zone frames; independently plain or notched Region labels and their placement; Card compactness; optional Card metadata; and Domain semantic colour. It MUST NOT implement a second set of appearance defaults or notch calculations. Omitted appearance MUST retain neutral surface, no authored grid, non-compact Cards, hidden optional Card metadata, solid-framed Lanes with plain labels, and unframed Zones with plain labels.

The `cardDetails` option MAY override identity, stereotype, and description visibility without mutating authored data. It MUST NOT override Card compactness. Domain colour MUST remain independent of Scope visibility, with existing Scope treatment available as the fallback for an unclassified Card.

The standalone SVG root MUST retain its accessible role, title, and whole-diagram label. Its description MUST summarise visible Card identity, stereotype, and description so visually hidden detail remains available at the image boundary. Each Card's accessible label and `<title>` MUST retain the same useful authored detail. Output MUST expose stable semantic treatment attributes sufficient to compare representative Canvas and SVG fixtures without relying on browser CSS.

_Verification: `packages/render-svg/src/index.test.ts`, `packages/view-model/src/appearance.test.ts`, and `packages/view-model/src/region-geometry.test.ts`._

### SVG-008 — Explicit signals have deterministic still treatment

The `signals` render option MAY identify configured Flows that should receive signalled emphasis. Static SVG MUST emit a deterministic, non-animated still treatment for each known identifier. Unknown identifiers MUST be ignored, and duplicate identifiers MUST NOT change output.

Omitting `signals`, or supplying an empty list, MUST preserve the ordinary motion-free output. Static SVG MUST NOT derive signals from Scene focus, filtering, or authored Flow data. It MUST NOT serialise occurrence keys, animation elements, timers, callbacks, browser preferences, or runtime completion state.

Signalled emphasis MUST leave the normal Flow route, direction, accessible label, authored geometry, and output ordering intact. It MUST use the shared signal still-treatment token so Canvas reduced-motion and static output interpret the emphasis consistently without requiring byte-identical markup.

_Verification: `packages/render-svg/src/index.test.ts` covers deterministic signalled output, unknown identifiers, duplicate identifiers, and unchanged default output._

## Dependency boundary

`@infoschematics/render-svg` MUST NOT depend on React, React DOM, browser globals, or any interactive View package. Shared derivation belongs in View Model.
