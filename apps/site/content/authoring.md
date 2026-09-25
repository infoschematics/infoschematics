# Author an Infoschematic

Author product data with types from `@infoschematics/domain-model` and normalise complete definitions with `defineInfoschematic` from `@infoschematics/domain-core`. Keep an independently maintained definition in its own `examples/is-*` package.

## Start blank

```ts
import { defineInfoschematic } from '@infoschematics/domain-core'

export const myInfoschematic = defineInfoschematic({
  title: 'My Infoschematic'
})
```

This produces a 1200-by-800 blank canvas with empty artefact, [Scene](/docs/reference/vocabulary/#scene), and [Sequence](/docs/reference/vocabulary/#sequence) collections. Add an `id` only when the host needs a stable namespace for local editorial preferences or drafts.

## Add structure

Populate the structural `infoschematic` field:

- `regions` establish background geography as [Regions](/docs/reference/vocabulary/#region);
- `fabrics` and `cards` establish focusable [Fabric](/docs/reference/vocabulary/#fabric) and [Card](/docs/reference/vocabulary/#standard-card) artefacts;
- `points` establish [Points](/docs/reference/vocabulary/#point), coordinate artefacts in their own right rather than parts of the Flows that meet them: each has an `id`, a required `label`, a position, and optional ports of its own, and a Point with no Flow attached is valid. The label is drawn beside the mark, on a side no Flow leaves by, so write it for a reader of a still image rather than as a note to yourself;
- `flows` connect Cards, Fabrics, and Points through named [ports](/docs/reference/vocabulary/#port);
- `graphics` register [Graphics](/docs/reference/vocabulary/#graphic), visual material drawn as [Overlays](/docs/reference/vocabulary/#overlay) wherever the Diagram is drawn — in Present and in a still rendering as well as while editing. A Scene may name one to keep it in focus, which adds to what is drawn rather than deciding it, so write a Graphic for a reader who will always see it;
- `scopes` provide [Scope](/docs/reference/vocabulary/#scope) applicability, `domains` provide [Domain](/docs/reference/vocabulary/#domain) classification, and `flowFamilies` provide [Flow](/docs/reference/vocabulary/#flow) identity;
- `interfaces` and `specificationGroups` describe technical contracts.

Coordinates use the `Box` and `Point` shapes exposed through Domain Model configuration types. Placement and routing algorithms remain View Model behaviour; authored output remains plain data.

## Configure appearance properties

Appearance is optional serialisable presentation intent. This fragment selects the blueprint style, uses a visible grid, and asks every renderer for compact Cards with authored metadata defaults:

```ts
infoschematic: {
  appearance: {
    style: 'blueprint',
    grid: 'major-plus-minor',
    card: {
      compact: true,
      identity: true,
      stereotype: true,
      description: true
    }
  }
}
```

### A style is what the drawing is; a mode is the ground it is read on

`style` says what the drawing is — `neutral` or `blueprint` — and travels with the definition, because it is a choice the author made. `mode` says which ground the reader is on, `light` or `dark`, and its third value `system` is the author declining to pick rather than an instruction to defer: a document that says `system` leaves the answer to whoever draws it, which is the page for an interactive view and the caller for a rendered file. Set `modeLocked: true` when the drawing must be read on the ground it names whatever the reader prefers.

The two are orthogonal. A blueprint is realised on both grounds — navy paper in the dark, cyanotype on light — so choosing a style never decides a mode, and choosing a mode never changes what the drawing is.

### An authored colour is a hue, not a literal value

Every colour you author — a Card `fill`, a Region fill, a Family `color` — is read as a seed. Your hue, your saturation, and your ordering relative to the other colours you chose all survive; the lightness band those colours sit in belongs to the ground, so a set tuned against navy still reads on paper. Values the renderers cannot interpret, such as a named colour or a gradient reference, pass through untouched.

Where you meant a literal value, say so with a trailing `!` — `fill: '#6c8ebf!'` is drawn as exactly that colour on either ground, and it is then yours to check that it reads on both.

A Region authors its frame, fill, and label properties on the record itself, each independently of the others:

```ts
{
  id: 'delivery',
  label: 'Delivery',
  box: { x: 20, y: 20, width: 1680, height: 610, radius: 18 },
  frame: { style: 'dashed' },
  fill: '#0d2134aa',
  labelMount: 'boundary',
  labelPlacement: 'north-east'
}
```

Omit `frame` for no frame, or use `style: 'solid'`, `'dashed'`, or `'dotted'` with an optional `opacity`. Omit `fill` for no fill; alpha travels in the hex. Place the label at `north-west`, `north`, `north-east`, `west`, `center`, `east`, `south-west`, `south`, or `south-east`; use `labelPlacement: 'none'` to hide it, and `labelOffset` to pull it along its edge. A label mounted on the `boundary` sits on the frame line and is notched out of a visible frame; an `internal` label (the default) is set down inside the Region. A hidden or empty label never leaves an unexplained notch. When appearance is omitted, Cards remain non-compact and no authored grid is shown; a Region with nothing authored beyond its box and label is unframed and unfilled with a plain label.

Use `grid: 'none'`, `'major'`, `'major-plus-minor'`, or `'dots'`. The `dots` value marks each grid intersection instead of drawing line strokes, at the same `gridSize` spacing as the line grids.

Classify Cards with a Domain independently of their Scope:

```ts
domains: [
  {
    id: 'platform',
    label: 'Platform',
    description: 'Shared platform capability',
    color: '#5eead4',
    fill: '#123b3a'
  }
],
cards: [
  {
    // Other required Card fields omitted here.
    domain: 'platform',
    stereotype: 'service'
  }
]
```

Domain controls semantic Card colour; Scope continues to control applicability and filtering. Domain identifiers must be unique and every Card Domain reference must resolve.

Hosts can hide optional metadata for one output without changing the definition:

```tsx
<Canvas
  config={config}
  cardDetails={{ identity: false, stereotype: true, description: false }}
/>
```

```ts
renderInfoschematicSvg(config, {
  cardDetails: { identity: false, stereotype: true, description: false }
})
```

Output detail overrides affect only identity, stereotype, and description visibility. Shared corner geometry, notch padding, type scales, fallback colours, and Card compactness are not output-detail knobs. What the definition asks for is the most a reader is ever shown: a rendering too small to hold a row may leave it out, and nothing ever restores a row the definition left off.

Any element can carry its code permanently instead of waiting for a reader to ask for it. Set `identity: true` on a Card, Fabric, Adapter, Point, Region, or Flow, or `appearance: { identity: true }` on the Diagram to say it of everything that says nothing; `appearance: { card: { identity: true } }` stays the narrower statement about plain Cards. A code pinned this way is drawn in every rendering, in the same place a reader's tag control would put it, and neither `cardDetails` nor a small rendering takes it away — those describe the rendering, while `identity` describes the element.

Static SVG hosts can additionally ask for the codes a live view's tag control draws: `renderInfoschematicSvg(config, { annotations: true })` tags every visible Card, Adapter, Fabric, and Flow, and `{ annotations: { flows: true } }` or `{ annotations: { components: true } }` asks for one of those halves. A Flow may pin its chip with `label: { along: 0.5 }`. Text ink over Card and Region fills resolves automatically from each fill's luminance — author the fill and the renderers choose legible dark or light ink; there is no authored text-colour knob.

## Add presentation material

Use `sequences` beside the structural `diagram` field. Every Sequence owns its Scenes and requires explicit display, timing, and Callout presentation settings:

```yaml
sequences:
  - id: OVERVIEW
    label: Architecture overview
    description: How the parts fit together
    presentation:
      display: expanded
      timed: false
      callouts: true
    scenes:
      - id: DELIVERY
        label: Delivery path
        focus:
          elements: [CDN, PLAYER, MEDIA-01]
```

Use `display: expanded` or `collapsed`, combine either with `timed: true` or `false`, and use `callouts` to control authored Callout rendering independently. Copying a Scene between Sequences creates independently owned material; do not retain hidden object links, inheritance, or runtime references between them.

## Name the Dynamics a host can play

A Diagram may declare the named changes an audience should be able to perceive, under `diagram.dynamics`:

```yaml
diagram:
  dynamics:
    - id: segment-published
      label: A segment is published
      description: The packager produced a new segment and the manifest that names it.
      kind: signal-flow
      flows: [PUBLISHED]
    - id: manifest-rejected
      label: The edge rejected a manifest
      kind: emphasise-elements
      elements: [CDN]
    - id: playback-stalled
      label: Playback is stalled
      description: The player has run out of buffered media and is waiting.
      kind: emphasise-elements
      depicts: state
      elements: [PLAYER, VIEWED]
```

Each [Diagram Dynamic](/docs/reference/vocabulary/#diagram-dynamic) is a meaning with a stable `id` and one of two kinds. `signal-flow` signals the Flows it names; `emphasise-elements` emphasises the elements it names, which may be Regions, Fabrics, Cards, Points, Flows, or Overlays. Targets must be identities the same document declares, so validation tells you when a Dynamic still points at something you removed.

An `emphasise-elements` declaration may add `depicts`, saying whether it names an `event` — something that happened — or a `state` — something that is now the case. It is optional, and an absent one reads as `event`, so every document written before the field existed keeps the meaning it has. A `signal-flow` declaration cannot carry it, because a passage along a Flow has nothing to sustain.

What a Dynamic never carries is how to depict it. There is no duration, easing, colour, selector, callback, event source, or element geometry to author — that is what keeps the document portable and keeps every Dynamic meaningful in a still image. `depicts` is not an exception to that, and the test that separates the two is whether a Producer would say the thing out loud while presenting. “Segments were published” and “we are on this stage” are both things they would say, and both are properties of the change itself, legible in review before any wiring exists; “pulse for nine hundred milliseconds” and “run a mark round the perimeter” are things only a renderer would say. So `depicts` states what the change is while fixing no treatment, no duration, and no way of playing — a renderer that can sustain nothing at all still honours it. Write the `label` as the thing itself, what happened for an event and what is the case for a state, because it is what a screen reader announces.

Nothing plays by itself. A host supplies an occurrence naming the `id` and its own occurrence key, so the same document serves an application wired to real events, a Producer rehearsing in Studio, and a still export that stays quiet unless its caller asks. [The React integration guide](/docs/react-integration/) covers that binding.

What differs between an event and a state is who ends it. An event ends on the renderer's own duration, and the document is asking for that. A state has no duration of its own to expire, so it ends only when the host withdraws the occurrence, replays it under a new key, or stops drawing the element — retaining the key holds it for as long as the presenter needs. None of that is written back to the document: no occurrence, key, or timer ever becomes authored data.

## Keep Flow signals outside authored data

Author a Flow with stable identity, endpoints, family, and route. Do not add signal state, occurrence keys, timers, callbacks, animation duration, event correlation, or Scene signal policy to the Flow or any other part of `InfoschematicConfig`.

A Scene may focus Flows because focus is durable presentation material. Present can interpret entering that Scene as one transient signal occurrence per resolved focused Flow, while a host can disable that policy or supply explicit occurrences for application events. Neither choice mutates the authored Scene or Flow. Filtering, hover, selection, and inspection do not constitute signal authoring.

Ensure the Flow's label, direction, endpoints, and surrounding explanation make sense in a still image. Interactive Canvas announces a signal and replaces travel with in-place emphasis for reduced-motion users; static SVG can show deterministic emphasis only when its caller explicitly requests Flow identifiers. A mark a renderer may run round an emphasised element's perimeter is a different thing from that travel: it is the renderer's own reading of an `emphasise-elements` declaration, taken from the element's geometry rather than from anything the document said, and there is no way to author it. Motion must never carry meaning absent from authored or persistent content.

## Declare what the diagram must keep true

You drew this to make one reading obvious: material enters here, passes through these stages, leaves there. Six months from now somebody who was not in the room deletes a Flow, and the drawing is still immaculate — the boxes line up, nothing overlaps, every check passes, and the reading you drew it for is gone. Write the reading down, under `promises`, and a checker will notice:

```yaml
promises:
  - id: PROMISE-ORIGIN
    kind: origin
    label: A reading begins only where material enters
    description: An artefact that quietly starts a reading of its own is a second story nobody asked for.
    allowed: [INGEST, SCOPE-EDGE]
  - id: PROMISE-TERMINUS
    kind: terminus
    label: Supervision is the only place a reading stops
    allowed: [SUPERVISOR]
  - id: PROMISE-RELATIONSHIP
    kind: relationship
    label: Ingest hands to Transform directly
    from: [INGEST]
    to: [TRANSFORM]
  - id: PROMISE-PATH
    kind: path
    label: Material stays traceable from ingest to the edge
    from: [INGEST]
    to: [SCOPE-EDGE]
```

There are four kinds. An `origin` says where a reading may begin: every artefact a Flow leaves and none arrives at has to be one you allowed. A `terminus` says where one must end, the same way round. A `relationship` requires one Flow running directly between two ends. A `path` requires only that some run of Flows, of any length, still leads from one end to the other — which is the one to reach for when you care that a request reaches the database, and not which way round it goes.

Every end is a list, and each name may be an artefact's code or the id of an [Architectural Scope](/docs/reference/vocabulary/#scope). The choice matters more than it looks. A promise written over a Scope survives an edit that replaces a component inside the boundary, because the boundary is what you were talking about; a promise written over that component's own code breaks — which is exactly what you want when you meant this component and not whatever happens to sit here. Write the one you mean.

All of this is optional, and a document that declares nothing is exactly as valid as it ever was. Nothing is drawn from a promise either: no renderer reads them, so declaring one changes what a check can refuse and never what anybody sees on the page. An artefact no Flow touches — a legend, a thing you have not wired up yet — takes part in no reading, so it is neither an origin nor a terminus and no promise complains about it.

When one breaks, the finding names the promise, names what broke it, and offers the repairs. One of those repairs is always withdrawing the promise. That is deliberate: a document is allowed to change its mind about what it is for. What it is not allowed to do is change its mind quietly.

## Author with Studio

Open Design when you want the complete authored Infoschematic rather than the Audience's current Scope and Flow-family projection. Draft creates, movement, resize, property edits, within-kind ordering and safe removals appear immediately, but remain serialisable operations until the change set is applied to authored source.

The Library provides Card, Fabric, Flow and Point starting points. Each insertion deep-copies the template, assigns a fresh `id` and `code`, and applies current placement, Scope, Flow family and endpoints. The resulting authored value contains no template link or provenance, so later edits affect only that instance.

Removing a Card, Fabric, or Point also removes Flows that would lose an endpoint; removing a Region removes only itself. Resolve a Sequence Scene's direct Overlay reference before removing that Overlay through Studio.

A Point is edited on the Diagram like any other artefact: select it, drag it, nudge it with the arrow keys, or type an exact coordinate. It has no box to resize, because its geometry is a coordinate rather than a rectangle. A Producer can also make one: the Library seeds a Point beside its Card, Fabric, and Flow templates, and the Point it drops carries no Flow until one is drawn to it.

An artefact marked for removal stays visible, selectable and visibly pending so you can review or lift the mark before applying it.

## Author as a document: YAML, JSON, or TypeScript

The same definition can be a document instead of a compiled TypeScript module. `parseInfoschematic` validates the document against the domain contract and normalises it exactly as `defineInfoschematic` normalises a literal, so all three formats render identically. A `.ts` document is read in a strict TypeScript subset — comments, `import type` lines, and one exported object literal of strings, numbers, booleans, arrays, and nested objects — matched as data and never executed, so a definition module written in that subset loads without compiling. Use the hosted [Playground](/playground/) to design and edit canonical YAML with Studio. JSON and restricted TypeScript remain supported inputs for loaders and local integrations; the browser editor keeps one clear source format.

```ts
import { readFile } from 'node:fs/promises'
import { formatInfoschematicIssue, parseInfoschematic } from '@infoschematics/domain-core'

const pathname = 'infoschematic.yaml'
const parsed = parseInfoschematic(await readFile(pathname, 'utf8'), { pathname })
if (!parsed.ok) throw new Error(parsed.issues.map(formatInfoschematicIssue).join('\n'))

const config = parsed.config
```

The format is taken from the pathname's extension — `.ts`, `.json`, `.yaml`, or `.yml` — or stated outright with `{ format: 'yaml' }`. Rejection is a result rather than an exception, because at a file boundary you almost always want to print the fault rather than catch it. Every fault arrives in one shape: a dotted path such as `infoschematic.cards.2.placement`, a message, and the document pathname when you supplied one. Unparseable syntax, a wrong type, a missing field, and a Card naming a Domain that does not exist all report the same way.

Validation is strict about keys. A misspelt `subtitel` is a reported fault, not a silently dropped field, because a dropped field renders a subtly wrong Infoschematic rather than an obvious one.

Point an editor at the published schema for completion and inline errors. It is generated from the same schema the loader validates with, so the two cannot disagree, and every field carries a description saying what it is for — which turns a bare list of permitted values into an account of which one to reach for.

```yaml
# yaml-language-server: $schema=https://infoschematics.info/schema/infoschematic.schema.json
title: My Infoschematic
```

```jsonc
// infoschematic.json
{ "$schema": "https://infoschematics.info/schema/infoschematic.schema.json", "title": "My Infoschematic" }
```

This needs a YAML language server; in Visual Studio Code that is the Red Hat YAML extension, which this repository recommends. The line is a comment in YAML and the `$schema` key is editor metadata in JSON, so the loader ignores both — validation happens the same way whether or not your editor reads them.

The schema is served at the address its own `$id` declares, so a document anywhere points at it without a copy or a checkout. Inside this repository, `.vscode/settings.json` maps any `infoschematic.yaml` to the working copy's generated `packages/domain-core/schema/infoschematic.schema.json` instead, so a contributor is completed against the contract they are changing rather than the published one.

`bun run self:examples:render infoschematic.yaml` renders a document straight to SVG. TypeScript authoring keeps its compile-time guarantee and remains the right choice for a definition that lives in a package.

## Canonical YAML convention

Prefer the compact YAML form for hand-authored canonical [Infoschematics](/docs/reference/vocabulary/#infoschematic). JSON syntax remains valid input, and typed TypeScript code can construct the same structured model. Shorthand exists only at the document boundary: parsing expands it before a View, Studio, or programmatic consumer receives the model.

Order every mapping by meaning rather than alphabetically. Put identity first (`id`, `title` or `label`, `subtitle`, `description`), followed by classification, geometry, nested content, then appearance. At the document root use `id`, `title`, `subtitle`, `description`, `diagram`, `scopes`, `specifications`, `sequences`. Within `diagram`, use `bounds` and `appearance`; vocabularies (`collections`, `families`); placeables (`cards`, `fabrics`, `points`, `regions`); wiring (`flows`, `overlays`); then `calloutPositions`.

Use SVG view-box order for bounds, coordinate-pair notation for positions, CSS box shorthand clockwise from north for ports, SVG points syntax for waypoints, and an arrow for a Flow's endpoints. A Flow's `labelAt` is a share of the route's length rather than a distance in diagram units — `0` at the source, `1` at the target, `0.5` halfway along — so a value outside that range is drawn against a port and reported by `infoschematics check`:

```yaml
id: DELIVERY
title: Delivery
diagram:
  bounds: 0 0 800 500
  families:
    - id: DATA
      label: Data
      color: '#3fb950'
  cards:
    - id: SRC
      label: Source
      bounds: 100 160 200 120
      ports: 0 3 7 1
    - id: SNK
      label: Sink
      bounds: 500 160 200 120
      ports: 7 3
  flows:
    - id: LOAD
      family: DATA
      link: SRC E2 -> SNK W2
      labelAt: 0.5
      waypoints: 470,890 470,810
      line: dashed
```

Omit `direction: forward`, empty `waypoints`, and empty Card `provides`; Domain Core supplies those defaults. It also supplies the generic three-by-five callout lattice unless `calloutPositions` overrides it. A single appearance value may be unwrapped, such as `color` on a Family or `line` on a Flow. An Adapter Card declares `adapts: <card-id>`; a Wrapper Card declares `wraps: <card-id>`. Neither composition requires a diagram-level Assembly or a separately authored Assembly id.

An Adapter Card is drawn as a clasp derived from the Card it holds: the held Card sits down into the notch with all of its own detail above the rim, and the adapter's name goes in the footer band below. Its own `bounds` do not position it, so move the Card it adapts and the clasp follows — there is no second coordinate to keep in step.

`serialiseInfoschematicYaml` emits this order and notation. Parsing that output and emitting it again is stable; structured object forms remain accepted and normalize to the same internal values.

## Keep configuration portable

- Export one complete value created by `defineInfoschematic`.
- Import domain types from `@infoschematics/domain-model` and domain behaviour from `@infoschematics/domain-core`; never import a view package from an authored example.
- Use stable string identifiers and renderer keys.
- Keep React components, browser APIs, fetched documents, and derived maps out of configuration.
- Let the host own contract files and other static assets addressed by configuration URLs.

The [`examples/is-blank`](https://github.com/infoschematics/infoschematics/tree/main/examples/is-blank/) package is the minimum executable reference and appears as the [Blank Playground preset](/playground/?preset=blank). [`examples/is-infoschematics`](https://github.com/infoschematics/infoschematics/tree/main/examples/is-infoschematics/) owns the concise overview rendered on the homepage and used by the [Explained preset](/playground/?preset=explained), and [`examples/is-system`](https://github.com/infoschematics/infoschematics/tree/main/examples/is-system/) tells a four-stage story from observed signals to a shared view.

Each of those directories is meant to be copied rather than installed. The Infoschematic is authored as `infoschematic.yaml` beside the manifest, the typed export is generated from that document, and `bun run check` and `bun run render` work unchanged in a copy: take the directory, `bun install`, edit the YAML, and you have your own Infoschematic with the same validation and rendering the examples get.
