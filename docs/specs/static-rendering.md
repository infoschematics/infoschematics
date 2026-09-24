# Static rendering — STATIC

Deterministic, accessible, framework-neutral SVG output from the canonical model and View Model. Part of the [Specifications corpus](index.md).

## User-observable behaviours

### STATIC-001 — Scene visibility is explicit

The caller MAY select a Standalone Scene or a Sequence Scene. The renderer MUST apply the selected Scene's focus deterministically and MUST make the treatment of unfocused content explicit through options rather than interactive state.

_Conformance:_ conforming

_Verify:_ render one document with and without a Scene selection and compare; an unknown Scene must fail rather than render everything.

_Evidence:_ `packages/render-svg/src/index.ts` takes a discriminated `scene` selection and an explicit `unfocused` option of `dim`, `hide` or `show`, defaulting to `dim`. `packages/render-svg/src/index.test.ts` applies explicit Scope visibility and Scene focus without motion or browser state, and fails explicitly when a selected Scene does not exist.

### STATIC-002 — Scope visibility is explicit

The caller MAY select visible Scopes. When omitted, all configured Scopes MUST be visible. Flow visibility MUST continue to respect both its family and endpoint visibility.

_Conformance:_ conforming

_Verify:_ render with `scopes` omitted and with a subset, and check Flow visibility against both endpoints.

_Evidence:_ `packages/render-svg/src/index.ts` resolves visible Scopes as `options.visibility?.scopes ?? config.scopes.map(...)`, so an omitted field shows every declared Scope, and filters Flows on family and on both endpoints. `packages/render-svg/src/index.test.ts` applies explicit Scope visibility and Scene focus without motion or browser state.

### STATIC-003 — Overlays remain serialisable

Placed Overlays MUST resolve from authored configuration. The framework-neutral renderer MUST provide labelled fallback output without importing host React renderers or executing authored callbacks, and MUST expose the requested renderer key and schema version as deterministic data attributes.

_Conformance:_ conforming

_Verify:_ `packages/render-svg/src/index.test.ts` covers the labelled fallback and requested renderer metadata.

_Evidence:_ `renderInfoschematicSvg` emits `data-renderer` and `data-renderer-version` on a placed Overlay fallback.

### STATIC-004 — Static output honours resolved visual treatments

Static SVG MUST use View Model's visual-treatment and region-geometry resolvers for authored surface and grid; absent, solid, dashed, and dotted Region frames; independently plain or notched Region labels and their placement; Card compactness; optional Card metadata; and Domain semantic colour. It MUST NOT implement a second set of appearance defaults or notch calculations. Omitted appearance MUST retain neutral surface, no authored grid, non-compact Cards, hidden optional Card metadata, and unframed, unfilled Regions with plain labels.

The `cardDetails` option MAY override identity, stereotype, and description visibility without mutating authored data. It MUST NOT override Card compactness. Domain colour MUST remain independent of Scope visibility, with existing Scope treatment available as the fallback for an unclassified Card.

The standalone SVG root MUST retain its accessible role, title, and whole-diagram label. Its description MUST summarise visible Card identity, stereotype, and description so visually hidden detail remains available at the image boundary. Each Card's accessible label and `<title>` MUST retain the same useful authored detail. Output MUST expose stable semantic treatment attributes sufficient to compare representative Canvas and SVG fixtures without relying on browser CSS.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/render-svg` and `bun run self:scripts:test`, then render a document across the treatment matrix — neutral and blueprint surface, authored grid and none, absent, solid, dashed, and dotted frames, plain and notched Region labels at their placements, compact and non-compact Cards, optional Card metadata shown and hidden, Domain-classified and unclassified Cards — and compare the emitted values against what View Model resolved for the same document rather than against what looks right. Strip the appearance and confirm the fallback is neutral surface, no grid, non-compact Cards, hidden optional metadata, and unframed, unfilled Regions with plain labels. Read the root `<title>` and `<desc>` and each Card's accessible name and `<title>` and confirm the authored detail the picture hides is still there. Falsified by a notch calculation or an appearance default in the renderer, by `cardDetails` changing Card compactness, or by Domain colour that follows Scope visibility.

_Evidence:_ `packages/render-svg/src/index.test.ts`, `packages/view-model/src/appearance.test.ts`, and `packages/view-model/src/region-geometry.test.ts`.

### STATIC-005 — Explicit signals have deterministic still treatment

The `signals` render option MAY identify configured Flows that should receive signalled emphasis. Static SVG MUST emit a deterministic, non-animated still treatment for each known identifier. Unknown identifiers MUST be ignored, and duplicate identifiers MUST NOT change output.

Omitting `signals`, or supplying an empty list, MUST preserve the ordinary motion-free output. Static SVG MUST NOT derive signals from Scene focus, filtering, or authored Flow data. It MUST NOT serialise occurrence keys, animation elements, timers, callbacks, browser preferences, or runtime completion state.

Signalled emphasis MUST leave the normal Flow route, direction, accessible label, authored geometry, and output ordering intact. It MUST use the shared signal still-treatment token so Canvas reduced-motion and static output interpret the emphasis consistently without requiring byte-identical markup.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/render-svg`, then render with `signals` naming one known Flow twice and one Flow the document does not declare: the output must equal naming it once, and the unknown identifier must leave no trace. Render again with `signals` omitted and with an empty list and diff both against the ordinary output — byte-identical. Then search the signalled output for an occurrence key, an animation element, a timer, a callback, a browser preference, or runtime completion state, none of which may be serialised, and diff the signalled Flow's route, direction, accessible label, authored geometry, and place in the output order against the quiet render. Confirm the still treatment takes its measurements from the shared signal token rather than a constant here, and that nothing derives a signal from Scene focus, filtering, or authored Flow data.

_Evidence:_ `packages/render-svg/src/index.test.ts` covers deterministic signalled output, unknown identifiers, duplicate identifiers, and unchanged default output.

### STATIC-006 — Code annotations are opt-in, selective, and deterministic

The `annotations` render option MAY request the code chips a live view's tag control draws. It MUST accept both a single answer for every kind and a per-kind selection of components and Flows, so a still placed beside a live view can say exactly what that view is saying rather than more. `true` MUST mean every kind the tag control covers — Cards, Adapters, Fabrics, and Flows — and omitting the option MUST leave output free of annotation markup.

When enabled, each chip MUST render the authored code verbatim at the shared placement from View Model, so static output and Canvas agree on position without a second placement algorithm. An authored `label.along` fraction MUST be honoured. Chips MUST use the shared annotation output tokens, MUST dim with Scene focus alongside the element they name, and MUST NOT change output for hidden Flows. A code the document pinned to an element under `APPEAR-018` in [Appearance](appearance.md) MUST be drawn whether or not this option was given, and MUST NOT be drawn twice when it was.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/render-svg`, then render with `annotations` omitted and confirm the output carries no annotation markup at all. Enable it and confirm each visible Flow's chip holds the authored code verbatim at the placement View Model resolved — compare the position against Canvas for the same document rather than against a second calculation here. Ask for `{ flows: true }` and confirm no component was tagged; ask for `{ components: true }` and confirm every visible Card, Adapter, and Fabric was and no Flow was; ask for `true` and confirm both. Author a `label.along` fraction and confirm the chip moved to it. Focus a Scene and confirm a chip dims with its Flow; hide a Flow and confirm its absence changes nothing. Then pin a code to one element, render with the option omitted and with it given, and confirm the code is drawn exactly once either way.

_Evidence:_ `packages/render-svg/src/index.test.ts` covers default-off output, the per-kind selection, opt-in chips, deterministic repetition, authored `label.along`, focus dimming, and the pinned codes drawn with no option given.

### STATIC-007 — Ink resolves from the fill it sits on

Card and Region-label text colour MUST resolve through View Model's readable-ink resolution against the fill the text is drawn over, not against the surface treatment. Output MUST expose the resolved ink as a `data-ink` attribute on Card groups and on plain Region labels drawn over an authored fill so Canvas and static SVG can be compared without browser CSS, and Canvas MUST resolve the same ink from the same fills. Labels on unfilled Regions and the Flow pipe underlay MAY remain surface-conditional because they sit on the surface itself.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/render-svg` and `bun run self:scripts:test`, then render a Card over a dark authored fill on a light surface and the reverse, and read `data-ink` on the Card group and on a plain Region label drawn over an authored fill: the resolved ink must follow the fill the text sits on, not the surface treatment. Compare the same documents' resolved ink against Canvas. Falsified by ink that changes when only the surface changes, or by a surface-conditional CSS rule deciding text colour after the fact.

_Evidence:_ `packages/render-svg/src/index.test.ts` covers ink resolution and `data-ink` emission; `scripts/visual-treatment-parity.test.ts` compares resolved ink across renderers.

### STATIC-008 — A dots grid treatment renders intersection marks

Authored `grid: 'dots'` MUST render a mark at each grid intersection, sized from the same `gridSize` token as the line grids, as a deterministic alternative to `major` and `major-plus-minor`. It MUST use the shared `data-grid-treatment` attribute and MUST NOT change output for any other authored grid value.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/render-svg` and `bun run self:scripts:test`, then author `grid: 'dots'` and read the output: one mark at each grid intersection, spaced by the same `gridSize` token the line grids use, under the shared `data-grid-treatment` attribute. Render twice and diff for determinism, compare against Canvas for the same document, and confirm `major` and `major-plus-minor` output is unchanged from before `dots` existed.

_Evidence:_ `packages/render-svg/src/index.test.ts`, `InfoschematicDiagram.treatments.test.tsx`, and `scripts/visual-treatment-parity.test.ts` cover the `dots` treatment across both renderers.

### STATIC-009 — Card internals use the shared layout

Static output MUST place Card label, description, stereotype, and identity text through View Model's Card layout rather than from constants of its own, and MUST draw those elements with a middle dominant baseline. An element the layout withholds — metadata a small Card has no room for — MUST NOT be emitted.

It MUST draw the text the layout fits, including one line per fitted label line, rather than fit or wrap text of its own.

_Conformance:_ conforming

_Verify:_ Run `bun run self:scripts:test`, then render one Card at landscape, square, tall, and minimum proportions and compare the placed positions of its label, description, stereotype, and identity text, and the strings drawn, against Canvas for the same Card: they must match, because both read View Model's Card layout. Confirm each element is drawn with a middle dominant baseline, that metadata the layout withholds on a small Card is absent from the markup rather than drawn past the border, and that a fitted label is emitted one line per fitted line. Falsified by a constant here that decides where Card text goes, or by wrapping performed in the renderer.

_Evidence:_ `scripts/visual-treatment-parity.test.ts` compares placed Card geometry at landscape, square, tall, and minimum proportions, and the drawn Card strings at long-text proportions.

### STATIC-010 — Visual elements expose authored identity

The outer owning SVG group for every rendered Region, Fabric, Flow, Card, Point and Overlay MUST expose its authored identifier as `data-artefact-id` and its canonical kind as `data-artefact-kind`. Kind values MUST be exactly `region`, `fabric`, `flow`, `card`, `point` or `overlay`. The renderer MUST NOT copy authored identifiers into native SVG `id` attributes, whose document-wide namespace remains renderer- and host-owned. Static SVG MAY retain `data-id` as a compatibility duplicate.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/render-svg`, then render a document containing all six kinds and read each outer owning group: `data-artefact-id` holds the authored identifier and `data-artefact-kind` holds exactly one of `region`, `fabric`, `flow`, `card`, `point`, or `overlay`. Then search the output for a native `id` attribute carrying an authored identifier — that namespace is document-wide and host-owned, so a copy there collides with the page's second Infoschematic. Where `data-id` is retained for compatibility, confirm it agrees with `data-artefact-id`.

_Evidence:_ `packages/render-svg/src/index.test.ts` covers all six kinds, compatibility attributes and collision-safe identifiers.

### STATIC-018 — An Adapter Card is drawn as the clasp it is

Static output MUST draw an [Adapter Card](../reference/vocabulary.md#adapter-card) as the notched clasp the interactive Diagram draws, traced from View Model's one outline rather than assembled here, so nothing the adapter paints passes under the Card it holds. It MUST place the adapter's own label in the footer band below the notch rather than centred in the clasp box, and MUST NOT draw an adapter whose held Card this rendering did not draw.

The clasp box MUST be derived from the held Card in both renderers, and an Adapter Card's authored `bounds` MUST NOT position it, as [`ADR-INFOSCHEMATICS-032`](../decisions/ADR-INFOSCHEMATICS-032-an-adapter-card-is-positioned-by-what-it-holds.md) records. An element emphasis over an Adapter Card MUST take the same derived box.

_Conformance:_ conforming

_Verify:_ Run `bun run self:scripts:test`, then render a document composing an Adapter Card over a Card whose own label is not compact, and read that label: it MUST be legible, which it is not when a rectangle is painted over the lower half of the Card. Author the adapter's `bounds` somewhere else entirely and confirm both renderings are unchanged. Then draw the adapter as a `<rect>` again and the parity case MUST fail — the treatment flags both renderers already agreed on could not see this, so a suite comparing those alone is not evidence.

_Evidence:_ `adapterClaspOutline` and `adapterLabelBaseline` in `packages/view-model/src/assembly.ts` state the shape and the label band once; `scripts/visual-treatment-parity.test.ts` asserts the same outline string and the same label position in both renderings from an adapter authored at the origin, so a renderer reading the authored box fails. `examples/is-showcase/infoschematic.yaml` composes one with non-compact Cards.

### STATIC-019 — An authored Overlay is drawn by default

Static output MUST draw every authored [Overlay](../reference/vocabulary.md#overlay) when the caller passes no visibility options, so a document rendered through `infoschematics render` shows the Overlays it declares. `visibility.graphics` MUST keep `scene`, which narrows the drawn set to the Graphics the selected Scene names, and `none`, which draws no Overlay at all; neither MUST be the default. A Scene's focus MUST continue to dim or hide an unfocused Overlay through `unfocused` rather than remove it from the default set.

[`ADR-INFOSCHEMATICS-033`](../decisions/ADR-INFOSCHEMATICS-033-an-authored-overlay-is-drawn-wherever-the-diagram-is.md) records why the default reversed: an authored Scene has no field that can name a Graphic, so the scene-scoped default was unreachable from every authored document and no document depended on it.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/render-svg` and `bun run self:scripts:test`, then render `examples/is-showcase/infoschematic.yaml` through `infoschematics render` and find `OVL-01` in the output — the command passes no options, so a scene-scoped default emits nothing here. Ask for `graphics: 'scene'` without selecting a Scene and confirm no Overlay is drawn, which is what the old default did to every authored document. Restore the `'scene'` default and the parity case MUST fail.

_Evidence:_ `packages/render-svg/src/index.ts` defaults `graphicVisibility` to `'all'`; `packages/render-svg/src/index.test.ts` draws every authored Overlay by default and narrows to a Scene only when asked; `scripts/visual-treatment-parity.test.ts` draws each standard Overlay treatment from a document alone, with no Scene and no options.

## Quality properties

### STATIC-011 — Output is deterministic

The same configuration and options MUST produce byte-for-byte identical SVG. Output ordering MUST follow authored order and MUST NOT depend on object enumeration outside declared authored collections.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/render-svg`, then render the same configuration and options twice in one process and twice in separate ones and diff all four: identical bytes, or the output depends on something it must not. Reorder the keys of an authored object without touching the authored collections and confirm the output is unchanged; reorder an authored collection and confirm the output order followed it. Falsified by output that depends on enumeration of anything but a declared authored collection.

_Evidence:_ `packages/render-svg/src/index.test.ts` snapshots title-only and representative configured output.

### STATIC-012 — Text and attributes are safe

All authored text and attribute values MUST be XML escaped, generated output MUST NOT contain script elements or inline event attributes, and numeric geometry MUST be finite before serialisation.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/render-svg`, then author text and attribute values carrying XML-significant characters, a value shaped like an event handler, and a coordinate that is `NaN` or infinite. Parse the output with an XML parser and confirm the escaped text round-trips; search it for a script element and for an inline event attribute and find neither; and confirm the non-finite geometry was refused before serialisation rather than written as an attribute a parser accepts and no renderer can draw.

_Evidence:_ `packages/render-svg/src/index.test.ts` covers XML-significant text, handler-shaped authored values, absent executable markup, and invalid coordinates.

### STATIC-013 — Static output uses shared visual semantics

Static SVG MUST consume shared Canvas geometry, typography, Flow, focus, metrics, and paint-role values directly from View Model's readonly `visualTokens` manifest. It MUST NOT duplicate those literals or import generated CSS. Equivalent built-in Canvas artefacts MUST retain the same semantic treatment across interactive and static output, while authored Scope fills and Flow-family colours MUST continue to come from `InfoschematicConfig`.

Where an interactive renderer states a treatment through an SVG 2 feature a browser resolves — `orient="auto-start-reverse"` on a marker, `fill: context-stroke` on the head inside it — static output MUST NOT depend on that feature. The geometry MUST stay one View Model token both renderers draw from, and static output MUST emit whichever literal definition reproduces the same picture: a mirrored head for one that faces back out of its source, and a separately painted head for one an emphasis recolours. The rasteriser behind the command line ignores both features without complaint, so depending on them yields a plausible SVG and a wrong PNG. Each renderer's divergent choice MUST be recorded where it is made, so neither reads as an oversight in the other.

_Conformance:_ conforming

_Verify:_ run `scripts/visual-treatment-parity.test.ts`, confirm the static renderer imports no stylesheet, and rasterise a document whose Flows include a reversed and an emphasised head — a browser and the command line must show the same picture.

_Evidence:_ `packages/render-svg/src/index.ts` reads geometry, typography, Flow, focus, metrics and paint-role values from `visualTokens` and imports no CSS at all. `packages/render-svg/src/index.test.ts` uses the shared static tokens while preserving authored colours, and `scripts/visual-treatment-parity.test.ts` holds the interactive and static paths to the same semantic treatment.

### STATIC-014 — Static rendering stays framework-neutral

The static SVG renderer MUST NOT depend on React, browser state, or an interactive View package.

_Conformance:_ conforming

_Verify:_ inspect the render-svg dependency graph and run repository dependency-boundary checks.

_Evidence:_ `packages/render-svg/package.json` declares only Domain Model and View Model workspace dependencies; `bun run lint:deps` enforces package boundaries.

### STATIC-015 — Inline resources can be host-namespaced

When static SVG is inserted into a host document, the renderer MUST accept a deterministic host-owned resource prefix and apply it consistently to every native SVG marker and pattern identifier and reference without copying authored artefact identifiers into that namespace.

_Conformance:_ conforming

_Verify:_ `packages/render-svg/src/index.test.ts` renders the same definition with two prefixes and checks isolated marker identifiers and references; `apps/site/src/InlineSvgReference.test.tsx` scopes repeated authored identifiers to separate host SVGs; `apps/site/src/StaticInfoschematic.test.tsx` places two drawings in one document and checks every definition is unique and every reference resolves within the drawing that made it.

_Evidence:_ `packages/render-svg/src/index.test.ts`, `apps/site/src/InlineSvgReference.test.tsx` and `apps/site/src/StaticInfoschematic.test.tsx` cover distinct renderer-resource namespaces and host-scoped authored identity resolution.

### STATIC-016 — Responsive output uses an explicit target size

The static renderer MAY accept an explicit responsive Card-detail target size and MUST use it for both deterministic output dimensions and the shared View Model density decision; omission MUST preserve authored output dimensions and Card-detail treatment.

_Conformance:_ conforming

_Verify:_ render the representative treatment fixture repeatedly with full, reduced, and label-only target sizes and inspect its root dimensions, optional rows, label, and accessible summary.

_Evidence:_ `packages/render-svg/src/index.test.ts` covers explicit target dimensions, deterministic optional-row reduction, and retained accessible authored metadata.

### STATIC-017 — Standard catalogue artwork is drawn from the shared description

Static output MUST draw every standard Fabric and Overlay treatment the product offers from View Model's stated artwork description rather than a realisation of its own, and MUST mark each drawn piece with the standard key it drew as `data-artwork`. Artwork paint roles MUST resolve through `visualTokens` for whichever scheme the rendering is painted in, per `STATIC-020`, exactly as `STATIC-013` requires of every other treatment: one catalogue, drawn correctly in each scheme rather than in one outlet's colours. Each piece's declared `defs` MUST be emitted under this rendering's resource prefix and the piece's own ordinal, so two Fabrics of one kind at different sizes do not share the first one's resources. A renderer key the catalogue does not offer, or a standard key requested at a schema version it does not state, MUST leave the generic Fabric or Overlay treatment drawn rather than draw nothing; the accessible name stays the document's whichever treatment draws.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/render-svg` and `bun run self:scripts:test`, then render one document naming every standard key and read each `data-artwork` group against the Canvas drawing of the same document: shape counts, geometry and drawn strings must agree, because a piece that draws in one renderer only is the defect the catalogue risks. Resolve every `url(#…)` a piece references within its own rendering — a resource named but never defined survives a green run here. Author two Fabrics of one kind at different sizes and confirm each references resources of its own. Render the same document on the default and blueprint surfaces and confirm the paint changes with the outlet. Ask for a standard key at a schema version the catalogue does not state and confirm the generic plane is drawn with the authored accessible name intact.

_Evidence:_ `artworkPrimitives` and `artworkResources` in `packages/render-svg/src/index.ts` walk the shared description into SVG strings under per-piece resource ids; `packages/render-svg/src/index.test.ts` covers per-piece resources, both palettes, and the unstated-version fallback; `scripts/visual-treatment-parity.test.ts` compares each `data-artwork` piece across both renderers and closes the `url(#…)` loop in each.

### STATIC-020 — A rendering states the colour scheme it is painted in

A static rendering MUST be painted in one named colour scheme, resolved once from View Model's paint roles and written as colours, because nothing downstream of a file reports a reader's preference. The scheme MUST default to `light`. An authored blueprint surface MUST override it in either scheme, per [ADR-INFOSCHEMATICS-037](../decisions/ADR-INFOSCHEMATICS-037-a-palette-belongs-to-a-colour-scheme-not-an-outlet.md): a scheme is a reader's context and a surface treatment is authored data.

A caller MAY instead ask the rendering to defer the choice. An `adaptive` SVG MUST carry every palette it might need in its own `<style>` element behind `prefers-color-scheme`, MUST scope those declarations to the drawing's own element rather than `:root` so inlining it into a host page does not repaint that page, and MUST reference each role through an inline `style` declaration rather than a presentation attribute, which is a CSS value only where SVG 2 parsing is implemented. An adaptive rendering MUST NOT write a palette colour on any drawn element, and MUST NOT be offered for raster output, where the choice is made before the pixels exist. An `adaptive` SVG MUST also carry a `print` rule restoring the default scheme, declared after the preference rule for the same reason the generated projection does. An adaptive rendering depends on a consumer that resolves custom properties; a consumer that does not paints those roles black rather than reading a fallback, so the guidance for a caller MUST say that anything other than a browser asks for a named scheme.

_Conformance:_ conforming

_Verify:_ Run `bun run test --filter=@infoschematics/render-svg`, render one document in each scheme and compare the colours written; confirm a document authoring a blueprint surface renders identically under both. Render it `adaptive` and confirm the media rule and both palettes are present, that no palette colour appears outside the embedded stylesheet, and that no drawn element carries `fill="var(…)"`. Then open the adaptive file in a browser under each preference and look at it — the declarations resolve in the engine displaying the file, so reading them out of the markup asserts the rule you hoped applied. Falsified by a rendering whose colours change with a preference the caller pinned, by a blueprint document that follows a scheme, or by an adaptive drawing that paints a literal. Print-preview the adaptive file to confirm the default palette comes back on paper. Rasterise the adaptive file through the command's own encoder to see why that output is refused: without CSS the referenced roles paint black, so the file that follows its reader is not the file a raster pipeline can read.

_Evidence:_ `packages/render-svg/src/index.ts` resolves one palette at the top of the rendering and `adaptivePalettes` emits the deferred pair; `packages/render-svg/src/index.test.ts` covers the locked and adaptive shapes and the blueprint override; `packages/cli/src/options.ts` refuses `--scheme adaptive --format png`; `packages/view-canvas/src/Canvas.schemes.browser.test.tsx` proves the resolved scheme in a browser for the interactive path.

### STATIC-021 — A still may be drawn in a supplied detail band

A static rendering MAY be given the detail band an interactive view resolved, and MUST then draw the Card rows that band names, so a still of a magnified part matches what a Canvas shows at that scale. Omitting the band MUST draw the `full` band, leaving output that never asks for one unchanged. A supplied band MUST take precedence over the explicit target size `STATIC-016` admits, because a caller naming a band has already answered the question that size was asked to answer.

A supplied band remains a reduction and nothing more: it MUST NOT restore a Card row the `cardDetails` override withheld, and MUST NOT remove a pinned element code. The command line MUST expose the band as a render option and MUST reject a value that is not one of the four bands rather than falling back to a default.

_Conformance:_ conforming

_Verify:_ render one document with no options, once per band, and once with a band alongside an explicit target size, and compare the Card rows each still draws.

_Evidence:_ `detail` on `RenderInfoschematicSvgOptions` in `packages/render-svg/src/index.ts`, the `detail` render option in `packages/cli/src/options.ts`, and the band cases in `packages/render-svg/src/index.test.ts`.

## Gaps

- `STATIC-015`'s composition with `DESIGN-017` — document-global `defs` identifiers across two Diagram hosts on one page — is enumerated in [ADR-INFOSCHEMATICS-030](../decisions/ADR-INFOSCHEMATICS-030-a-composition-is-its-own-requirement.md) and left with the divergence `INFOSCHEMATICS-TOOL-058` tracks, so it has no requirement in [Composition](composition.md) yet.
