# Author an Infoschematic

Author product data with types from `@infoschematics/domain-model` and normalise complete definitions with `defineInfoschematic` from `@infoschematics/domain-core`. Keep an independently maintained definition in its own `examples/is-*` package.

## Start blank

```ts
import { defineInfoschematic } from '@infoschematics/domain-core'

export const myInfoschematic = defineInfoschematic({
  title: 'My Infoschematic'
})
```

This produces a 1200-by-800 blank canvas with empty artefact, Scene, Theme, and Story collections. Add an `id` only when the host needs a stable namespace for local editorial preferences or drafts.

## Add structure

Populate the structural `infoschematic` field:

- `lanes` and `zones` establish background geography;
- `fabrics` and `cards` establish focusable artefacts;
- `flows` connect Cards and Fabrics through named ports and points;
- `graphics` register visual material that Scenes may reveal;
- `scopes` provide applicability, `domains` provide Card classification, and `flowFamilies` provide Flow identity;
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

A Lane or Zone can select an absent, solid, dashed, or dotted frame independently of its label placement and label treatment:

```ts
appearance: {
  frame: 'dashed',
  label: 'north-east',
  labelTreatment: 'notched'
}
```

Use `frame: 'none'`, `'solid'`, `'dashed'`, or `'dotted'`. Use `labelTreatment: 'plain'` or `'notched'` independently. Place the label at `north-west`, `north`, `north-east`, `west`, `center`, `east`, `south-west`, `south`, or `south-east`; use `label: 'none'` to hide it. A hidden or empty label never leaves an unexplained notch. When appearance is omitted, Lanes retain solid frames and plain labels, Zones remain unframed with plain labels, Cards remain non-compact, and no authored grid is shown.

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

## Add presentation material

Use `standaloneScenes`, `themes`, and `stories` beside the structural `infoschematic` field. A Scene focuses artefacts and Flows, reveals Graphics, and may carry one Callout.

Copying a Standalone Scene into a Theme or Story creates independently owned material. Do not retain hidden object links or runtime references between them.

## Keep Flow signals outside authored data

Author a Flow with stable identity, endpoints, family, and route. Do not add signal state, occurrence keys, timers, callbacks, animation duration, event correlation, or Scene signal policy to the Flow or any other part of `InfoschematicConfig`.

A Scene may focus Flows because focus is durable presentation material. Present can interpret entering that Scene as one transient signal occurrence per resolved focused Flow, while a host can disable that policy or supply explicit occurrences for application events. Neither choice mutates the authored Scene or Flow. Filtering, hover, selection, and inspection do not constitute signal authoring.

Ensure the Flow's label, direction, endpoints, and surrounding explanation make sense in a still image. Interactive Canvas announces a signal and replaces travel with in-place emphasis for reduced-motion users; static SVG can show deterministic emphasis only when its caller explicitly requests Flow identifiers. Motion must never carry meaning absent from authored or persistent content.

## Author with Studio

Open Design when you want the complete authored Infoschematic rather than the Audience's current Scope and Flow-family projection. Draft creates, movement, resize, property edits, within-kind ordering and safe removals appear immediately, but remain serialisable operations until the change set is applied to authored source.

The Library provides Card, Fabric and Flow starting points. Each insertion deep-copies the template, assigns a fresh `id` and `code`, and applies current placement, Scope, Flow family and endpoints. The resulting authored value contains no template link or provenance, so later edits affect only that instance.

Removing a Card or Fabric also removes Flows that would lose an endpoint; removing a Lane removes its Zones. Resolve a Story Scene's direct Graphic reference before removing that Graphic through Studio.

## Keep configuration portable

- Export one complete value created by `defineInfoschematic`.
- Import domain types from `@infoschematics/domain-model` and domain behaviour from `@infoschematics/domain-core`; never import a view package from an authored example.
- Use stable string identifiers and renderer keys.
- Keep React components, browser APIs, fetched documents, and derived maps out of configuration.
- Let the host own contract files and other static assets addressed by configuration URLs.

The [`examples/is-blank`](../../examples/is-blank/) package is the minimum executable reference, hosted at `/examples/blank/`. The [`examples/is-infoschematics`](../../examples/is-infoschematics/) package is a substantial self-describing reference: its Lanes, Zones, Cards, Flows, Scenes, and Story explain the repository's ownership and dependency direction. The website hosts that same serialisable definition in Studio at `/examples/infoschematics/` and renders it as deterministic SVG on the homepage.
