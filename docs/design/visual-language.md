# Visual language

This brief defines the visual character shared by Infoschematic views and renderers. It is a presentation system rather than a fixed page template: implementations can adapt layout and theme while preserving hierarchy, semantic colour, routing and motion rules.

## Intent

An Infoschematic should feel like a calm, precise technical instrument. It should be cinematic enough for a large presentation screen and exact enough for an engineer to explain every visible element.

The visual language has four qualities:

- **Calm** — low-noise surfaces and motion only when something changes.
- **Legible** — consistent card dimensions, strong alignment, short labels and clear depth boundaries.
- **Semantic** — colour, line treatment and emphasis communicate stable meaning rather than decoration.
- **Observable** — focus, routes, events and health remain visible without implying certainty the product does not possess.

## Composition

Compose an interactive view from three levels:

- **Frame** — the host application surface, title and restrained controls.
- **Canvas** — the Infoschematic itself, with its fixed geography and authored artefacts.
- **Evidence** — contextual information that explains the current view, focus or Scene.

The Canvas should dominate. Present keeps supporting controls compact and at its edge; Studio can reveal more production detail without changing what the Canvas means.

## Grid and spacing

Use a fine interface rhythm around a coarser presentation grid inside the Canvas.

- Align related artefacts to shared horizontal and vertical tracks.
- Use one standard size for standard Cards within an Infoschematic. Make exceptions only when shortening the content would lose meaning.
- Leave enough space between major regions for Flows to remain independently traceable.
- Snap Cards and route points to the presentation grid.
- Keep generous insets around containers and deliberate empty space around boundaries, networks and hand-offs.
- Preserve topology, grouping and reading order when adapting to another output size.

The grid is an authoring aid and a visual character, not an excuse to fill every available cell. A blueprint treatment can make the coordinate system visible, but it should recede behind the content and may be omitted from a published output.

## Semantic colour

Colour belongs to authored or themed meaning. A Flow family can own a hue, a scope or domain can tint a Card, and health can use a separate status treatment. These meanings should not borrow one another's colours.

Use lighter variants for text and restrained emphasis, darker variants for translucent fills, and strong saturation only where it changes how the Infoschematic is read. Colour must remain configurable: a particular product palette is not part of the library's visual contract.

## Authored appearance and output policy

Authored appearance records stable presentation intent that should travel with an Infoschematic. It may select a neutral or blueprint surface, one of the standard grid treatments, compact Cards and default Card metadata visibility, and standard Lane or Zone frame style, label placement, and label treatment. These are semantic choices, not an escape hatch for arbitrary CSS or coordinates.

Output policy can reduce optional Card detail for the available space. Canvas and static SVG may override identity, stereotype, and description visibility without changing the authored definition. Compactness remains authored because it changes the Card's composition rather than merely revealing or hiding metadata.

Region geometry is shared View Model behaviour. A frame is independently absent, solid, dashed, or dotted. Its label uses one of nine compass placements and selects plain or notched treatment separately. A notched label leaves equal padding either side; when the label is empty, hidden, centred away from an edge, or cannot fit safely, the frame remains continuous. Standard corner geometry comes from invariant tokens rather than each definition choosing a radius.

Domain and Scope communicate separate facts. Domain classifies a Card and supplies semantic colour. Scope controls applicability and filtering. A Card may use both, and changing the visible Scope set must not silently reclassify its Domain treatment. Colour must still be paired with labels and other non-colour evidence.

Omitted appearance intentionally preserves the established readable treatment: neutral surface, no authored grid, non-compact Cards, hidden optional metadata, solid-framed Lanes with plain labels, and unframed Zones with plain labels. Homepage-like blueprint treatment remains explicit authored intent.

## Visual token ownership

Reusable visual values belong in the framework-neutral `visualTokens` manifest when they express the same product meaning in more than one renderer path, or when TypeScript geometry and rendered output must remain aligned. The manifest groups Canvas values by semantic role under `canvas.geometry`, `canvas.surfaces`, `canvas.text`, `canvas.flows`, `canvas.focus`, `canvas.selection`, and `canvas.output`. Names describe the role a value serves rather than its current literal colour or measurement.

The shared product-language inventory covers:

- **Canvas geometry** — component corner shape and other measurements that both calculations and output must interpret identically.
- **Canvas surfaces and text** — the base Canvas, geography, Fabric, Card, Point, and Graphic fallback treatments that identify the same artefact across interactive and static output.
- **Canvas Flows** — rail and semantic-line widths, line caps, dashes, and neutral fallback treatment. An authored Flow family's colour remains product data.
- **Canvas focus and selection** — stable dimmed, highlighted, and selected treatments owned by Canvas rather than by a host shell.
- **Canvas output defaults** — motion-independent values a deterministic renderer needs when no interactive state exists.

Interactive hit targets, drag handles, editing guides, transient motion, and other Canvas-only behaviours remain in Canvas unless a calculation also needs their value. Present owns navigation, details, controls, and Callout chrome. Studio owns application shell, panel, form, tool, resizer, and Producer-overlay chrome. Those View-local values can use local custom properties for clarity, but repetition inside one View does not make them framework-neutral product tokens. Isolated optical corrections and composition-specific offsets remain intentional one-offs.

Authored Scope fills and Flow-family colours remain serialisable `InfoschematicConfig` data. They must not be copied into the manifest, generated stylesheet, or host theme configuration. Centralising the built-in visual language does not create a general theming API.

The TypeScript manifest is the source of truth. `bun scripts/generate-visual-tokens.ts` deterministically emits `packages/view-model/src/tokens.generated.css`, with CSS custom properties named `--infoschematic-canvas-<group>-<token>` in lexical order. Generated CSS is never edited by hand; `bun scripts/generate-visual-tokens.ts --check` compares it with fresh output so stale or colliding names fail before commit. Interactive renderers consume the generated properties; framework-neutral renderers consume the same manifest directly.

Add a token only when its name states a stable semantic role and at least one of these conditions holds:

- more than one renderer must agree on the value;
- TypeScript geometry and CSS must agree on the value;
- changing the value independently would change the meaning of the same Canvas artefact or state.

Refuse a shared token when the value is authored data, belongs only to Present or Studio chrome, is a transient interaction detail with no cross-renderer contract, or is an isolated composition adjustment.

## Surfaces and depth

The default surface is dark and low contrast, with depth established by borders, restrained fills and small shadows rather than broad glow.

The artefact depths are visually distinct:

- Lanes and Zones form the background geography.
- Fabrics occupy the midground and remain visibly connectable.
- Flows, Cards and Graphics occupy the foreground.

Standard Cards use a consistent shape language: a dark or translucent fill, a meaningful border, a modest corner radius and enough separation from Flows beneath them. Fabrics, Lanes and Zones provide context without competing with Cards and Flows.

Glow is a focused state cue. It should not become a general surface treatment, and a decorative status dot should not be added where it communicates no state.

## Typography

Use a clear sans-serif face for human-readable labels and a mono face for identifiers, measurements and compact system information.

- Keep titles compact and visually decisive.
- Set geography headings with restrained contrast and deliberate tracking.
- Give Card titles more weight than descriptions.
- Keep labels and descriptions short rather than shrinking type to rescue excess content.
- Distinguish an optional stereotype or family label from the Card title and description.

Typography should explain hierarchy without requiring boxes or rules around every line of text.

## Artefacts on the Canvas

Draw software and organisational elements as consistent Cards. A standard Card can carry a title, an optional description, an optional stereotype or family label and an optional identity tag. Render options decide which of those details appear without changing the underlying model.

Adapter Cards remain visibly attached to the standard Card they wrap. Fabrics can use richer shapes or illustrations inside a stable frame, but the frame remains the geometric attachment surface used by ports and Flows.

Every independently addressable artefact has a stable identity separate from its display label. An identity tag can help authoring, discussion and review, but should be optional in Present and static output.

Lanes run across one axis and Zones subdivide them along the other. They describe geography rather than ownership of the foreground. A Card's placement, scope, domain and appearance can express different facts and are not required to agree visually.

## Flows and routes

A Flow is a semantic artefact with an identity, endpoints, family and route. Route geometry remains authored or derived data rather than an opaque SVG path.

The default treatment draws a quiet outer rail with a narrower semantic line above it. This keeps crossing and adjacent routes readable on a dark Canvas without making the diagram continuously bright.

- Prefer orthogonal routing.
- Use arrowheads to communicate direction, and bidirectional treatment only where the model says the Flow is bidirectional.
- Give each endpoint its own port and keep neighbouring arrowheads visibly separate.
- Keep the first and last route runs clear so the attachment can be read.
- Prefer the fewest bends consistent with clear terminal approaches and collision avoidance.
- Keep parallel Flows independently traceable even when they share endpoints or corridors.
- Avoid crossing Cards and avoid repeated coincident rails that darken into an apparent shared Flow.
- Preserve authored route topology when a layout is resized or regularised.

Flows have three presentation states:

1. **Hidden** — the structural Canvas is shown without that Flow.
2. **Visible** — the Flow is present as a static semantic route.
3. **Signalled** — a finite pulse or equivalent emphasis travels along the Flow because an action, event or Scene gives the movement meaning.

## Motion

Flow signalling is a finite presentation occurrence, not authored visual treatment. A host supplies a stable Flow identifier and occurrence key, or Present derives occurrences from focused Flows when a Scene is entered. Re-rendering the same occurrence does not replay it; a new key represents a new occurrence. Clearing or replacing a Scene cancels obsolete signals.

Automatic Scene signalling uses an explicit `focused-flows` policy and can be disabled with `none`. Hover, filtering, selection, and ordinary focus inspection never imply activity. Neither signal policy nor signal state belongs in `InfoschematicConfig`.

The underlying Flow route remains present and interactive throughout. A travelling pulse is decorative; a concise live announcement carries the semantic event. Under `prefers-reduced-motion`, the route receives brief in-place emphasis instead of spatial travel. Static SVG accepts only an explicit list of signalled Flow identifiers and renders deterministic still emphasis, so motion is never required to understand the Infoschematic.

Animation explains change; it is not ambient decoration.

- A signal should travel once and then leave the underlying Flow static.
- A Scene or explicit control can reveal a Flow family and emit a meaningful signal.
- State transitions should be brief unless movement itself carries information.
- Future event-driven signals should identify stable Flows and carry correlation context outside the visual treatment.
- Reduced-motion output should replace travel with a short in-place highlight.

Static renderers ignore motion safely. Where useful, they can expose the signalled state as a deterministic still treatment selected through render options.

## Controls

Controls should read as compact instrument controls rather than promotional calls to action.

- Pair every Flow-family control with a label and a non-colour cue.
- Keep filtering separate from signalling, so inspecting an Infoschematic never causes accidental animation.
- Keep independent grouping dimensions visually distinct.
- Summarise the current view in quiet, concise text.
- Keep reset actions separate from Scene and Story navigation.
- Preserve access to essential Present controls when surrounding panels are collapsed.

## Accessibility and presentation resilience

Reducing visible Card detail must preserve useful accessible metadata. Canvas and static SVG should expose the same authored identity and description through SVG labelling even when an output hides the corresponding visual rows. Surface, grid, frame, and Domain colour decisions need semantic attributes and text evidence so renderer parity can be reviewed without treating pixel equality as the contract.

Colour is never the only differentiator. Pair it with labels, line styles, direction and textual evidence.

Every interactive control needs an accessible name and state. Every Flow needs a useful description. The Infoschematic should remain understandable in a still image, with animation disabled, without hover and when projected in an imperfect room.

Critical explanation belongs in persistent content or an explicit Callout. Hover can add detail, but cannot carry information the Audience needs to understand the view.
