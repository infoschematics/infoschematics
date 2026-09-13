# Appearance — APPEAR

Authored semantic identity, output-detail policy, shared visual tokens, and accessible renderer parity. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### APPEAR-001 — Authored appearance is serialisable intent

An Infoschematic MAY author a neutral or blueprint surface, no grid or one of the standard grid treatments, and Card compactness and metadata-visibility defaults. A Region MAY author an absent, solid, dashed, or dotted frame at an opacity; an optional fill; and an optional label at one of nine compass placements, mounted internally or on the boundary with an along-edge offset. Frame, fill, label placement, and label mount MUST remain independent fields; the notched label treatment is resolved from a boundary mount over a visible frame rather than authored. Appearance MUST remain typed serialisable data and MUST NOT contain CSS, callbacks, renderer components, free coordinates, or derived geometry.

Omitted appearance MUST normalise to a neutral surface, no authored grid, non-compact Cards, and hidden optional Card identity, stereotype, and description. A Region MUST default to no frame, no fill, and a plain internal label. Region placement defaults are resolved by View Model so every renderer receives the same treatment.

_Conformance:_ conforming

_Verify:_ inspect `packages/domain-model/src/appearance.ts`, `packages/domain-model/src/infoschematic.ts`, `packages/domain-model/src/region.ts`, and `packages/domain-core/src/index.ts`. against this requirement.

_Evidence:_ `packages/domain-model/src/appearance.ts`, `packages/domain-model/src/infoschematic.ts`, `packages/domain-model/src/region.ts`, and `packages/domain-core/src/index.ts`.

### APPEAR-002 — Collections and Families supply shared identity

A Card MAY name one Card Collection and a Flow MAY name one Flow Family. Those associations MUST supply their default semantic visual identity without requiring appearance on every individual Card or Flow. Fabrics and Regions MAY carry semantic visual identity directly. Architectural Scopes MUST remain a top-level presentation concern and MUST NOT determine element identity.

_Conformance:_ conforming

_Verify:_ inspect `packages/domain-model/src/model.ts` and `packages/domain-core/src/model.ts`. against this requirement.

_Evidence:_ `packages/domain-model/src/model.ts` and `packages/domain-core/src/model.ts`.

### APPEAR-003 — Authored appearance options are catalogued

Every authored appearance option MUST be described once at runtime: its control shape, the values it accepts where those are a closed set, the default the renderers apply where they state one, and the vocabulary term the option gives visual form to. A consumer that offers an option to a Producer or a reader MUST derive it from that catalogue rather than restate the option's members.

The catalogue MUST be keyed so that an option present in authored appearance and absent from the catalogue fails to compile. Each cited vocabulary term MUST resolve to a declared term id in [the vocabulary reference](../reference/vocabulary.md). The catalogue describes options; it MUST NOT decide what an absent option means, which remains the renderers' resolution.

_Conformance:_ conforming

_Verify:_ inspect `packages/domain-model/src/option-catalogue.ts` and `docs/reference/vocabulary.md`. against this requirement.

_Evidence:_ `packages/domain-model/src/option-catalogue.ts` and `docs/reference/vocabulary.md`.

### APPEAR-004 — Canvas resolves authored appearance through View Model

Canvas MUST consume View Model's resolved visual treatment and region geometry rather than interpret authored appearance independently. It MUST render the selected surface and authored grid; absent, solid, dashed, and dotted Region frames; independently plain or notched Region labels at the resolved placement; Card compactness; optional Card metadata; and Domain semantic colour. A Domain-classified Card MUST use its Domain colour and fill independently of Scope visibility; an unclassified Card MAY retain the existing Scope treatment as fallback.

Absent appearance MUST render the backward-compatible defaults: neutral surface, no authored grid, non-compact Cards, hidden optional Card metadata, and unframed, unfilled Regions with plain internal labels. An absent or hidden Region label MUST suppress a requested notch without changing the authored frame style. Label placement and rounded or notched outlines MUST use the framework-neutral geometry returned by View Model.

The `cardDetails` output option MAY override authored identity, stereotype, and description visibility. It MUST NOT remove authored metadata or override Card compactness. The legacy boolean Design grid MUST remain an editing overlay independent of the authored grid treatment.

_Conformance:_ conforming

_Verify:_ inspect `packages/view-canvas/src/Canvas.tsx`, `packages/view-canvas/src/InfoschematicDiagram.tsx`, and `packages/view-model/src/appearance.ts`. against this requirement.

_Evidence:_ `packages/view-canvas/src/Canvas.tsx`, `packages/view-canvas/src/InfoschematicDiagram.tsx`, and `packages/view-model/src/appearance.ts`.

## Quality properties

### APPEAR-005 — Renderer invariants are not authored options

Shared corner geometry, notch padding, type scales, line widths, fallback colours, and similar renderer invariants MUST NOT be added to authored appearance merely to theme one output. Values whose meaning must agree across renderers belong to View Model visual tokens or renderer-neutral geometry calculations.

An output MAY override whether Card identity, stereotype, and description are visible. Such an override MUST NOT alter the authored data or become part of `InfoschematicConfig`.

_Conformance:_ pending

_Verify:_ add a focused implementation or rendered-output check for this accepted requirement.

### APPEAR-006 — Shared visual semantics have one source

View Model MUST export a deeply readonly `visualTokens` manifest for visual values that must agree across renderer paths or between TypeScript geometry and rendered output. The manifest MUST group Canvas values by geometry, surfaces, text, Flows, focus, selection, and motion-independent output defaults. Token names MUST describe stable semantic roles rather than literal colours or measurements.

Authored Scope fills and Flow-family colours MUST remain `InfoschematicConfig` data. Present chrome, Studio chrome, and intentional one-off composition values MUST NOT be promoted solely because they repeat within one View.

_Conformance:_ pending

_Verify:_ add a focused implementation or rendered-output check for this accepted requirement.

### APPEAR-007 — CSS projection is deterministic

`scripts/generate-visual-tokens.ts` MUST project every manifest leaf to one CSS custom property named `--infoschematic-canvas-<group>-<token>` in `packages/view-model/src/tokens.generated.css`. Output MUST use deterministic lexical ordering, MUST reject colliding generated names, and MUST expose a check mode that fails when committed generated output differs from fresh output. Generated CSS MUST NOT become a second source of truth.

_Conformance:_ pending

_Verify:_ add a focused implementation or rendered-output check for this accepted requirement.

### APPEAR-008 — Renderer values remain consistent

Interactive Canvas output MUST consume the generated CSS projection for shared values. Framework-neutral renderers MUST consume the TypeScript manifest directly without importing CSS or an interactive View. Representative tests MUST prove matching semantic names and values across TypeScript, generated CSS, interactive Canvas output, and static output.

_Conformance:_ pending

_Verify:_ add a focused implementation or rendered-output check for this accepted requirement.

### APPEAR-009 — Shared Canvas semantics use generated tokens

Canvas MUST consume the generated CSS projection of View Model's `visualTokens` manifest for shared geometry, surfaces, text, Flow, focus, selection, and output-default values. Generated custom properties MUST use the `--infoschematic-canvas-<group>-<token>` namespace and MUST NOT be edited as an independent styling source.

Canvas-only hit targets, drag handles, editing guides, and transient motion MAY remain local when no framework-neutral calculation or renderer must agree on their value. Authored Scope fills and Flow-family colours MUST continue to come from `InfoschematicConfig` rather than the generated token set.

_Conformance:_ pending

_Verify:_ add a focused implementation or rendered-output check for this accepted requirement.

### APPEAR-010 — Visual reduction preserves accessible meaning

The root SVG description MUST summarise visible Card identity, stereotype, and description. A Card's accessible label MUST retain those authored values even when output options hide their visual rows.

Canvas MUST provide an accessible name for the complete Infoschematic and for interactive Region, Card, and Flow elements. Hiding optional Card rows visually MUST NOT remove the Card's authored identity, stereotype, or description from its accessible SVG metadata. Domain colour, surface, and grid MUST NOT be the only source of meaning.

Representative treatment fixtures MUST prove the same resolved surface, grid, frame, label placement, Card detail, compactness, and Domain decisions as static SVG. Tests MAY compare semantic attributes and deterministic geometry rather than byte-identical React and string-rendered markup.

_Conformance:_ conforming

_Verify:_ `packages/view-canvas/src/InfoschematicDiagram.treatments.test.tsx` and `packages/view-model/src/region-geometry.test.ts`.

_Evidence:_ `packages/view-canvas/src/InfoschematicDiagram.treatments.test.tsx` and `packages/view-model/src/region-geometry.test.ts`.

### APPEAR-011 — Card internals use the shared layout

Canvas MUST place Card label, description, stereotype, and identity text through View Model's Card layout rather than from constants of its own, so a Card of any proportion reads the same on the Canvas as in static output. It MUST draw those elements with a middle dominant baseline, and MUST NOT draw an element the layout withholds.

It MUST draw the text the layout fits, including one line per fitted label line, rather than fit or wrap text of its own.

_Conformance:_ conforming

_Verify:_ `scripts/visual-treatment-parity.test.ts` compares placed Card geometry at landscape, square, tall, and minimum proportions, and the drawn Card strings at long-text proportions.

_Evidence:_ `scripts/visual-treatment-parity.test.ts` compares placed Card geometry at landscape, square, tall, and minimum proportions, and the drawn Card strings at long-text proportions.

### APPEAR-012 — Visual elements expose authored identity

The outer owning SVG group for every rendered Region, Fabric, Flow, Card, Point and Overlay MUST expose its authored identifier as `data-artefact-id` and its canonical kind as `data-artefact-kind`. Kind values MUST be exactly `region`, `fabric`, `flow`, `card`, `point` or `overlay`. Canvas MUST NOT copy authored identifiers into native SVG `id` attributes, whose document-wide namespace remains renderer- and host-owned. The metadata contract identifies the authored element without promising child markup, output order or CSS structure.

_Conformance:_ conforming

_Verify:_ `packages/view-canvas/src/InfoschematicDiagram.editing.test.tsx` covers all six kinds and collision-safe identifiers.

_Evidence:_ `packages/view-canvas/src/InfoschematicDiagram.editing.test.tsx` covers all six kinds and collision-safe identifiers.

### APPEAR-013 — Component-scale shapes share the radius token

Rectangular component-scale shapes rendered by the supplied view library MUST use the shared `cornerRadius` token rather than define unrelated local radii.

_Conformance:_ conforming

_Verify:_ inspect `cornerRadius` in `packages/view-model/src/tokens.ts`, consumed by `packages/view-studio/src/app/InfoschematicDiagram.tsx` and supplied Fabric renderers. against this requirement.

_Evidence:_ `cornerRadius` in `packages/view-model/src/tokens.ts`, consumed by `packages/view-studio/src/app/InfoschematicDiagram.tsx` and supplied Fabric renderers.

### APPEAR-014 — Annotation labels fit their identities

A rendered Flow annotation label MUST size its bounding box to its displayed identity and MUST NOT overflow a fixed-width badge.

_Conformance:_ conforming

_Verify:_ render short and long Flow identities and assert each annotation badge width contains its label.

_Evidence:_ `packages/view-model/src/tokens.test.ts` and `packages/view-canvas/src/InfoschematicDiagram.editing.test.tsx` cover deterministic long-label sizing.

## Gaps

- Responsive output density and additional Region surface treatments remain candidate appearance contracts.
