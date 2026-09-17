# Appearance — APPEAR

Authored semantic identity, output-detail policy, shared visual tokens, and accessible renderer parity. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### APPEAR-001 — Authored appearance is serialisable intent

An Infoschematic MAY author a neutral or blueprint surface, no grid or one of the standard grid treatments, and Card compactness and metadata-visibility defaults. A Region MAY author an absent, solid, dashed, or dotted frame at an opacity; an optional fill; and an optional label at one of nine compass placements, mounted internally or on the boundary with an along-edge offset. Frame, fill, label placement, and label mount MUST remain independent fields; the notched label treatment is resolved from a boundary mount over a visible frame rather than authored. Appearance MUST remain typed serialisable data and MUST NOT contain CSS, callbacks, renderer components, free coordinates, or derived geometry.

Omitted appearance MUST normalise to a neutral surface, no authored grid, non-compact Cards, and hidden optional Card identity, stereotype, and description. A Region MUST default to no frame, no fill, and a plain internal label. Region placement defaults are resolved by View Model so every renderer receives the same treatment.

_Conformance:_ conforming

_Verify:_ Read `packages/domain-model/src/appearance.ts` and `packages/domain-model/src/region.ts`: frame, fill, label placement, and label mount are separate fields, and no field authors a notch. Then normalise a document that authors no appearance and read what comes back — neutral surface, no grid, non-compact Cards, hidden optional Card identity, stereotype, and description, and Regions unframed, unfilled, with a plain internal label. Author a boundary mount over a visible frame and confirm the notched treatment is resolved rather than read from the document. Falsified by CSS, a callback, a renderer component, a free coordinate, or derived geometry sitting in an appearance field.

_Evidence:_ `packages/domain-model/src/appearance.ts`, `packages/domain-model/src/infoschematic.ts`, `packages/domain-model/src/region.ts`, and `packages/domain-core/src/index.ts`.

### APPEAR-002 — Collections and Families supply shared identity

A Card MAY name one Card Collection and a Flow MAY name one Flow Family. Those associations MUST supply their default semantic visual identity without requiring appearance on every individual Card or Flow. Fabrics and Regions MAY carry semantic visual identity directly. Architectural Scopes MUST remain a top-level presentation concern and MUST NOT determine element identity.

_Conformance:_ conforming

_Verify:_ Read the Collection and Family types in `packages/domain-model/src/model.ts`, then author a Card that names a Collection and no appearance of its own, and a Flow that names a Family and none: each must take its association's semantic and visual identity. Give a Fabric and a Region identity directly and confirm it holds. Then activate and deactivate Architectural Scopes and confirm no element's identity moves with them — a Scope decides what is shown, never what a thing is.

_Evidence:_ `packages/domain-model/src/model.ts` and `packages/domain-core/src/model.ts`.

### APPEAR-003 — Authored appearance options are catalogued

Every authored appearance option MUST be described once at runtime: its control shape, the values it accepts where those are a closed set, the default the renderers apply where they state one, and the vocabulary term the option gives visual form to. A consumer that offers an option to a Producer or a reader MUST derive it from that catalogue rather than restate the option's members.

The catalogue MUST be keyed so that an option present in authored appearance and absent from the catalogue fails to compile. Each cited vocabulary term MUST resolve to a declared term id in [the vocabulary reference](../reference/vocabulary.md). The catalogue describes options; it MUST NOT decide what an absent option means, which remains the renderers' resolution.

_Conformance:_ conforming

_Verify:_ Read `packages/domain-model/src/option-catalogue.ts`, then walk the catalogue against the appearance fields it describes: each option states its control shape, its closed value set where it has one, the default renderers apply, and the vocabulary term it gives visual form to, resolvable in `docs/reference/vocabulary.md`. Add an appearance field without cataloguing it and confirm the gap shows in a consumer that builds its controls from the catalogue rather than from a hand-written list. Falsified by an entry that states an option's resolved appearance instead of its meaning.

_Evidence:_ `packages/domain-model/src/option-catalogue.ts` and `docs/reference/vocabulary.md`.

### APPEAR-004 — Canvas resolves authored appearance through View Model

Canvas MUST consume View Model's resolved visual treatment and region geometry rather than interpret authored appearance independently. It MUST render the selected surface and authored grid; absent, solid, dashed, and dotted Region frames; independently plain or notched Region labels at the resolved placement; Card compactness; optional Card metadata; and Domain semantic colour. A Domain-classified Card MUST use its Domain colour and fill independently of Scope visibility; an unclassified Card MAY retain the existing Scope treatment as fallback.

Absent appearance MUST render the backward-compatible defaults: neutral surface, no authored grid, non-compact Cards, hidden optional Card metadata, and unframed, unfilled Regions with plain internal labels. An absent or hidden Region label MUST suppress a requested notch without changing the authored frame style. Label placement and rounded or notched outlines MUST use the framework-neutral geometry returned by View Model.

The `cardDetails` output option MAY override authored identity, stereotype, and description visibility. It MUST NOT remove authored metadata or override Card compactness. The Design editing grid MUST derive its spacing from the authored `gridSize` declared by the Diagram, and MUST remain independent of the authored grid appearance treatment: appearance decides whether a lattice is drawn, `gridSize` decides the geometry it aligns to.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-canvas`, then render a document that authors each treatment — neutral and blueprint surface, no grid and the standard grid, absent, solid, dashed, and dotted Region frames, plain and notched labels across the compass placements, compact and non-compact Cards, shown and hidden Card metadata, Domain-classified and unclassified Cards — and compare what Canvas drew against what View Model resolved for the same document. Hide a Region's label and confirm a requested notch is suppressed with the authored frame style untouched; filter a Domain-classified Card out of Scope and confirm its Domain colour is still its fill. Falsified by any appearance Canvas decides for itself.

_Evidence:_ `packages/view-canvas/src/Canvas.tsx`, `packages/view-canvas/src/InfoschematicDiagram.tsx`, and `packages/view-model/src/appearance.ts`.

## Quality properties

### APPEAR-005 — Renderer invariants are not authored options

Shared corner geometry, notch padding, type scales, line widths, fallback colours, and similar renderer invariants MUST NOT be added to authored appearance merely to theme one output. Values whose meaning must agree across renderers belong to View Model visual tokens or renderer-neutral geometry calculations.

An output MAY override whether Card identity, stereotype, and description are visible. Such an override MUST NOT alter the authored data or become part of `InfoschematicConfig`.

_Conformance:_ conforming

_Verify:_ inspect `packages/domain-model/src/appearance.ts` for renderer invariants, and the output override in `packages/render-svg/src/index.ts` for leakage into `InfoschematicConfig`.

_Evidence:_ authored appearance in `packages/domain-model/src/appearance.ts` carries a surface, a grid treatment, Card detail defaults and Region treatment, and no corner geometry, notch padding, type scale, line width or fallback colour; those live in `packages/view-model/src/tokens.ts`. `cardDetails` is an option of `renderInfoschematicSvg` in `packages/render-svg/src/index.ts` and appears nowhere under `packages/domain-model`, and `packages/render-svg/src/index.test.ts` renders authored treatments alongside output-only Card detail overrides.

### APPEAR-006 — Shared visual semantics have one source

View Model MUST export a deeply readonly `visualTokens` manifest for visual values that must agree across renderer paths or between TypeScript geometry and rendered output. The manifest MUST group Canvas values by geometry, surfaces, text, Flows, focus, selection, and motion-independent output defaults. Token names MUST describe stable semantic roles rather than literal colours or measurements.

Authored Scope fills and Flow-family colours MUST remain `InfoschematicConfig` data. Present chrome, Studio chrome, and intentional one-off composition values MUST NOT be promoted solely because they repeat within one View.

_Conformance:_ conforming

_Verify:_ inspect the manifest in `packages/view-model/src/tokens.ts` for its grouping and its names.

_Evidence:_ `packages/view-model/src/tokens.ts` freezes a `visualTokens` manifest grouping Canvas values by geometry, surfaces, text, flows, emphasis, focus, selection and output defaults, and `packages/view-model/src/tokens.test.ts` asserts the semantic names and representative values. Authored Scope fills and Flow-family colours stay in `packages/domain-model/src/model.ts`.

### APPEAR-007 — CSS projection is deterministic

`scripts/generate-visual-tokens.ts` MUST project every manifest leaf to one CSS custom property named `--infoschematic-canvas-<group>-<token>` in `packages/view-model/src/tokens.generated.css`. Output MUST use deterministic lexical ordering, MUST reject colliding generated names, and MUST expose a check mode that fails when committed generated output differs from fresh output. Generated CSS MUST NOT become a second source of truth.

_Conformance:_ conforming

_Verify:_ run `bun run self:tokens:verify`, which is the generator's own check mode and part of the gate.

_Evidence:_ `scripts/generate-visual-tokens.ts` projects each manifest leaf to `--infoschematic-canvas-<group>-<token>` in `packages/view-model/src/tokens.generated.css`, and `scripts/generate-visual-tokens.test.ts` asserts stable sorted names, rejects distinct semantic paths that collide after CSS normalisation, and proves check mode fails when the committed output is stale.

### APPEAR-008 — Renderer values remain consistent

Interactive Canvas output MUST consume the generated CSS projection for shared values. Framework-neutral renderers MUST consume the TypeScript manifest directly without importing CSS or an interactive View. Representative tests MUST prove matching semantic names and values across TypeScript, generated CSS, interactive Canvas output, and static output.

_Conformance:_ conforming

_Verify:_ run `scripts/visual-treatment-parity.test.ts`, which renders one configuration through both paths and compares the treatment it finds.

_Evidence:_ `packages/view-canvas/src/tokens.test.tsx` asserts Canvas consumes only the generated custom properties for shared CSS decisions; `packages/render-svg/src/index.ts` imports no stylesheet and reads `visualTokens` directly; `scripts/visual-treatment-parity.test.ts` renders the same document through Canvas and the static renderer and compares the semantic values both produce.

### APPEAR-009 — Shared Canvas semantics use generated tokens

Canvas MUST consume the generated CSS projection of View Model's `visualTokens` manifest for shared geometry, surfaces, text, Flow, focus, selection, and output-default values. Generated custom properties MUST use the `--infoschematic-canvas-<group>-<token>` namespace and MUST NOT be edited as an independent styling source.

Canvas-only hit targets, drag handles, editing guides, and transient motion MAY remain local when no framework-neutral calculation or renderer must agree on their value. Authored Scope fills and Flow-family colours MUST continue to come from `InfoschematicConfig` rather than the generated token set.

_Conformance:_ conforming

_Verify:_ inspect the custom properties Canvas resolves, and confirm authored colours still arrive as data.

_Evidence:_ `packages/view-canvas/src/tokens.test.tsx` covers the three clauses in turn: shared CSS decisions come only from generated custom properties, component and editing-grid geometry come from the manifest, and authored Scope, Flow-family and Region colours stay in the rendered data rather than the generated token set.

### APPEAR-010 — Visual reduction preserves accessible meaning

The root SVG description MUST summarise visible Card identity, stereotype, and description. A Card's accessible label MUST retain those authored values even when output options hide their visual rows.

Canvas MUST provide an accessible name for the complete Infoschematic and for interactive Region, Card, and Flow elements. Hiding optional Card rows visually MUST NOT remove the Card's authored identity, stereotype, or description from its accessible SVG metadata. Domain colour, surface, and grid MUST NOT be the only source of meaning.

Representative treatment fixtures MUST prove the same resolved surface, grid, frame, label placement, Card detail, compactness, and Domain decisions as static SVG. Tests MAY compare semantic attributes and deterministic geometry rather than byte-identical React and string-rendered markup.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-canvas`, then hide the optional Card rows through output options and read the accessible tree rather than the picture: the root description must still summarise visible Card identity, stereotype, and description; each Card's accessible label must still carry its authored values; the whole Infoschematic and every interactive Region, Card, and Flow must still have a name. Read the same document with colour, surface, and grid disregarded and confirm nothing was said only by them. Then compare the resolved surface, grid, frame, label placement, Card detail, compactness, and Domain decisions against static SVG for the representative fixtures, by semantic attribute and deterministic geometry rather than by markup bytes.

_Evidence:_ `packages/view-canvas/src/InfoschematicDiagram.treatments.test.tsx` and `packages/view-model/src/region-geometry.test.ts`.

### APPEAR-011 — Card internals use the shared layout

Canvas MUST place Card label, description, stereotype, and identity text through View Model's Card layout rather than from constants of its own, so a Card of any proportion reads the same on the Canvas as in static output. It MUST draw those elements with a middle dominant baseline, and MUST NOT draw an element the layout withholds.

It MUST draw the text the layout fits, including one line per fitted label line, rather than fit or wrap text of its own.

_Conformance:_ conforming

_Verify:_ Run `bun run self:scripts:test`, then render one Card at landscape, square, tall, and minimum proportions in Canvas and in static SVG and compare both the placed positions of its label, description, stereotype, and identity text and the strings actually drawn: they must match, because both read View Model's Card layout. Confirm every element is drawn from its visual centre with a middle dominant baseline, that an element the layout withholds is absent rather than clipped, and that a fitted label is drawn one line per fitted line. Falsified by a constant in Canvas that decides where Card text goes.

_Evidence:_ `scripts/visual-treatment-parity.test.ts` compares placed Card geometry at landscape, square, tall, and minimum proportions, and the drawn Card strings at long-text proportions.

### APPEAR-012 — Visual elements expose authored identity

The outer owning SVG group for every rendered Region, Fabric, Flow, Card, Point and Overlay MUST expose its authored identifier as `data-artefact-id` and its canonical kind as `data-artefact-kind`. Kind values MUST be exactly `region`, `fabric`, `flow`, `card`, `point` or `overlay`. Canvas MUST NOT copy authored identifiers into native SVG `id` attributes, whose document-wide namespace remains renderer- and host-owned. The metadata contract identifies the authored element without promising child markup, output order or CSS structure.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/view-canvas`, then query the rendered output for every Region, Fabric, Flow, Card, Point, and Overlay and read its outer owning group: each must carry `data-artefact-id` holding the authored identifier and `data-artefact-kind` holding exactly one of `region`, `fabric`, `flow`, `card`, `point`, or `overlay`. Then search the same output for a native `id` attribute holding an authored identifier — that space is document-wide and host-owned, so a copy there is a collision waiting for the page's second Infoschematic.

_Evidence:_ `packages/view-canvas/src/InfoschematicDiagram.editing.test.tsx` covers all six kinds and collision-safe identifiers.

An inline host resolves this cross-renderer identity within its mounted SVG rather than querying document-wide native IDs. This preserves repeated authored identifiers across independent diagrams without expanding the contract to child markup.

### APPEAR-013 — Component-scale shapes share the radius token

Rectangular component-scale shapes rendered by the supplied view library MUST use the shared `cornerRadius` token rather than define unrelated local radii.

_Conformance:_ conforming

_Verify:_ Read `cornerRadius` in `packages/view-model/src/tokens.ts`, then search the component-scale view library for a radius declared locally: every rounded component-scale corner must resolve to that token, including in supplied Fabric renderers. Change the token, re-render, and confirm every such corner moved together. Falsified by a numeric radius sitting beside a component.

_Evidence:_ `cornerRadius` in `packages/view-model/src/tokens.ts`, consumed by `packages/view-canvas/src/InfoschematicDiagram.tsx` and supplied Fabric renderers.

### APPEAR-014 — Annotation labels fit their identities

A rendered Flow annotation label MUST size its bounding box to its displayed identity and MUST NOT overflow a fixed-width badge.

_Conformance:_ conforming

_Verify:_ render short and long Flow identities and assert each annotation badge width contains its label.

_Evidence:_ `packages/view-model/src/tokens.test.ts` and `packages/view-canvas/src/InfoschematicDiagram.editing.test.tsx` cover deterministic long-label sizing.

### APPEAR-015 — Region surfaces compose predictably

Each renderer MUST paint the diagram backdrop, authored grid, and Regions in that order; Regions MUST retain authored order, and each Region MUST paint its fill behind its frame and label before remaining diagram elements. The portable Region surface vocabulary MUST remain limited to serialisable colour fill, solid, dashed, or dotted frame with opacity, corner radius, and label treatment until another treatment has renderer-parity and accessibility evidence.

_Conformance:_ conforming

_Verify:_ render overlapping filled and framed Regions over neutral and blueprint surfaces in Canvas and static SVG, then compare layer order and treatment parity.

_Evidence:_ `packages/view-canvas/src/InfoschematicDiagram.treatments.test.tsx`, `packages/render-svg/src/index.test.ts`, and `scripts/visual-treatment-parity.test.ts` cover the current surface, grid, Region fill, and frame vocabulary across renderers.

### APPEAR-016 — Responsive Card detail is explicit

Canvas and static SVG hosts MAY opt into responsive Card detail, but omission MUST preserve the authored and explicitly requested Card treatment exactly; when enabled, output MUST retain every Card label and accessible identity while withholding optional description, identity, then stereotype rows as rendered scale crosses the shared deterministic thresholds defined by [ADR-INFOSCHEMATICS-011](../decisions/ADR-INFOSCHEMATICS-011-separate-authored-appearance-from-output-detail.md).

_Conformance:_ conforming

_Verify:_ exercise the framework-neutral resolver, measured Canvas output, and explicit-size static SVG above, at, and below every threshold.

_Evidence:_ `packages/view-model/src/appearance.test.ts`, `packages/view-canvas/src/InfoschematicDiagram.responsive.browser.test.tsx`, and `packages/render-svg/src/index.test.ts` cover compatibility defaults, threshold resolution, and accessible metadata retention.

### APPEAR-017 — Responsive density is renderer-neutral

Responsive Card detail MUST resolve only from the authored view-box dimensions, explicit or measured rendered dimensions, and the caller's requested detail upper bound; it MUST NOT inspect user agent, device class, ambient viewport state in View Model, or mutate authored geometry.

_Conformance:_ conforming

_Verify:_ inspect `resolveResponsiveCardTreatment` and compare Canvas and static SVG fixtures at equivalent dimensions.

_Evidence:_ `packages/view-model/src/appearance.ts` is a pure dimension-driven resolver consumed by both `packages/view-canvas/src/InfoschematicDiagram.tsx` and `packages/render-svg/src/index.ts`.

## Gaps

- `APPEAR-009`'s composition with `DESIGN-015` — a shared treatment surviving arrival at a second Diagram host — is stated and verified as `COMPOSE-001` in [Composition](composition.md) rather than here.
