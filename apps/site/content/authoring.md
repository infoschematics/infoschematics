# Author an Infoschematic

Author product data with types from `@infoschematics/domain-model` and normalise complete definitions with `defineInfoschematic` from `@infoschematics/domain-core`. Keep an independently maintained definition in its own `examples/is-*` package.

## Start blank

```ts
import { defineInfoschematic } from '@infoschematics/domain-core'

export const myInfoschematic = defineInfoschematic({
  title: 'My Infoschematic'
})
```

This produces a 1200-by-800 blank canvas with empty artefact, [Scene](/docs/reference/vocabulary/#scene), [Theme](/docs/reference/vocabulary/#theme), and [Story](/docs/reference/vocabulary/#story) collections. Add an `id` only when the host needs a stable namespace for local editorial preferences or drafts.

## Add structure

Populate the structural `infoschematic` field:

- `regions` establish background geography as [Regions](/docs/reference/vocabulary/#region);
- `fabrics` and `cards` establish focusable [Fabric](/docs/reference/vocabulary/#fabric) and [Card](/docs/reference/vocabulary/#standard-card) artefacts;
- `flows` connect Cards and Fabrics through named [ports](/docs/reference/vocabulary/#port) and [points](/docs/reference/vocabulary/#point);
- `graphics` register [Graphics](/docs/reference/vocabulary/#graphic), visual material that Scenes may reveal;
- `scopes` provide [Scope](/docs/reference/vocabulary/#scope) applicability, `domains` provide [Domain](/docs/reference/vocabulary/#domain) classification, and `flowFamilies` provide [Flow](/docs/reference/vocabulary/#flow) identity;
- `interfaces` and `specificationGroups` describe technical contracts.

Coordinates use the `Box` and `Point` shapes exposed through Domain Model configuration types. Placement and routing algorithms remain View Model behaviour; authored output remains plain data.

## Configure visual treatments

Appearance is optional serialisable presentation intent. This fragment opts into the blueprint treatment, uses a visible grid, and asks every renderer for compact Cards with authored metadata defaults:

```ts
infoschematic: {
  appearance: {
    surface: 'blueprint',
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

A Region authors its frame, fill and label treatment on the record itself, each independently of the others:

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

Use `grid: 'none'`, `'major'`, `'major-plus-minor'`, or `'dots'`. The `dots` treatment marks each grid intersection instead of drawing line strokes, at the same `gridSize` spacing as the line grids.

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

Output detail overrides affect only identity, stereotype, and description visibility. Shared corner geometry, notch padding, type scales, fallback colours, and Card compactness are not output-detail knobs.

Static SVG hosts can additionally pass `renderInfoschematicSvg(config, { annotations: true })` to draw each visible Flow's code chip at the shared annotation placement; a Flow may pin its chip with `label: { along: 0.5 }`. Text ink over Card and Region fills resolves automatically from each fill's luminance — author the fill and the renderers choose legible dark or light ink; there is no authored text-colour knob.

## Add presentation material

Use `standaloneScenes`, `themes`, and `stories` beside the structural `infoschematic` field. A Scene focuses artefacts and Flows, reveals Graphics, and may carry one [Callout](/docs/reference/vocabulary/#callout).

Copying a Standalone Scene into a Theme or Story creates independently owned material. Do not retain hidden object links or runtime references between them.

## Keep Flow signals outside authored data

Author a Flow with stable identity, endpoints, family, and route. Do not add signal state, occurrence keys, timers, callbacks, animation duration, event correlation, or Scene signal policy to the Flow or any other part of `InfoschematicConfig`.

A Scene may focus Flows because focus is durable presentation material. Present can interpret entering that Scene as one transient signal occurrence per resolved focused Flow, while a host can disable that policy or supply explicit occurrences for application events. Neither choice mutates the authored Scene or Flow. Filtering, hover, selection, and inspection do not constitute signal authoring.

Ensure the Flow's label, direction, endpoints, and surrounding explanation make sense in a still image. Interactive Canvas announces a signal and replaces travel with in-place emphasis for reduced-motion users; static SVG can show deterministic emphasis only when its caller explicitly requests Flow identifiers. Motion must never carry meaning absent from authored or persistent content.

## Author with Studio

Open Design when you want the complete authored Infoschematic rather than the Audience's current Scope and Flow-family projection. Draft creates, movement, resize, property edits, within-kind ordering and safe removals appear immediately, but remain serialisable operations until the change set is applied to authored source.

The Library provides Card, Fabric and Flow starting points. Each insertion deep-copies the template, assigns a fresh `id` and `code`, and applies current placement, Scope, Flow family and endpoints. The resulting authored value contains no template link or provenance, so later edits affect only that instance.

Removing a Card or Fabric also removes Flows that would lose an endpoint; removing a Region removes only itself. Resolve a Story Scene's direct Graphic reference before removing that Graphic through Studio.

## Author as a document: YAML, JSON, or TypeScript

The same definition can be a document instead of a compiled TypeScript module. `parseInfoschematic` validates the document against the domain contract and normalises it exactly as `defineInfoschematic` normalises a literal, so all three formats render identically. A `.ts` document is read in a strict TypeScript subset — comments, `import type` lines, and one exported object literal of strings, numbers, booleans, arrays, and nested objects — matched as data and never executed, so a definition module written in that subset loads without compiling. Try all three forms live in the [playground](/playground/) on the website.

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

Point an editor at the committed schema, `packages/domain-core/schema/infoschematic.schema.json`, for completion and inline errors. It is generated from the same schema the loader validates with, so the two cannot disagree.

```jsonc
// infoschematic.json
{ "$schema": "../packages/domain-core/schema/infoschematic.schema.json", "title": "My Infoschematic" }
```

```yaml
# yaml-language-server: $schema=../packages/domain-core/schema/infoschematic.schema.json
title: My Infoschematic
```

The `$schema` key is editor metadata; the loader removes it before validating. The schema is a repository file rather than a published package export, so a document outside this repository points at a copy or a checkout. `bun run self:examples:render infoschematic.yaml` renders a document straight to SVG. TypeScript authoring keeps its compile-time guarantee and remains the right choice for a definition that lives in a package.

## Keep configuration portable

- Export one complete value created by `defineInfoschematic`.
- Import domain types from `@infoschematics/domain-model` and domain behaviour from `@infoschematics/domain-core`; never import a view package from an authored example.
- Use stable string identifiers and renderer keys.
- Keep React components, browser APIs, fetched documents, and derived maps out of configuration.
- Let the host own contract files and other static assets addressed by configuration URLs.

The [`examples/is-blank`](https://github.com/infoschematics/infoschematics/tree/main/examples/is-blank/) package is the minimum executable reference, hosted at `/examples/blank/`. The [`examples/is-infoschematics`](https://github.com/infoschematics/infoschematics/tree/main/examples/is-infoschematics/) package is a substantial self-describing reference: its Regions, Cards, Flows, Scenes, and Story explain the repository's ownership and dependency direction. The website hosts that same serialisable definition in Studio at `/examples/infoschematics/` and renders it as deterministic SVG on the homepage.
