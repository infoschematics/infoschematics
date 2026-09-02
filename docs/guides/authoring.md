# Author an Infoschematic

Author product data with types from `@infoschematics/domain-model` and normalise complete definitions with `defineInfoschematic` from `@infoschematics/domain-core`. Keep a definition in its own workspace or package when it represents an independently maintained Infoschematic.

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
- `scopes` and `flowFamilies` provide filtering and visual identity;
- `interfaces` and `specificationGroups` describe technical contracts.

Coordinates use the `Box` and `Point` shapes exposed through Domain Model configuration types. Placement and routing algorithms remain View Model behaviour; authored output remains plain data.

## Add presentation material

Use `standaloneScenes`, `themes`, and `stories` beside the structural `infoschematic` field. A Scene focuses artefacts and Flows, reveals Graphics, and may carry one Callout.

Copying a Standalone Scene into a Theme or Story creates independently owned material. Do not retain hidden object links or runtime references between them.

## Keep configuration portable

- Export one complete value created by `defineInfoschematic`.
- Import domain types from `@infoschematics/domain-model` and domain behaviour from `@infoschematics/domain-core`; never import a view package from an authored workspace.
- Use stable string identifiers and renderer keys.
- Keep React components, browser APIs, fetched documents, and derived maps out of configuration.
- Let the host own contract files and other static assets addressed by configuration URLs.

The [`workspaces/is-blank`](../../workspaces/is-blank/) package is the minimum executable reference. The public website consumes it at `/examples/blank/`.
