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

A Lane or Zone can select `none`, `plain`, or `notched` framing and hide its label or place it at one of nine compass positions:

```ts
appearance: {
  frame: 'notched',
  label: 'north-east'
}
```

Use `north-west`, `north`, `north-east`, `west`, `center`, `east`, `south-west`, `south`, or `south-east`. Use `label: 'none'` to hide a region label. A hidden or empty label never leaves an unexplained notch. When appearance is omitted, Lanes remain plain and labelled, Zones remain unframed and labelled, Cards remain non-compact, and no authored grid is shown.

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
