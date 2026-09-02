# Infoschematics

Infoschematics is a visual instrument for making complex systems legible. An Infoschematic is a structural diagram built from Lanes, Zones, Fabrics, Cards, Flows and Graphics, presented through Scenes, Themes and Stories, and worked on in Present, Design and Direct modes.

This Bun repository contains three publishable TypeScript workspaces:

- [`workspaces/core/`](workspaces/core/) — `@infoschematics/core`, framework-neutral geometry, routing, placement and editing primitives.
- [`workspaces/model/`](workspaces/model/) — `@infoschematics/model`, the serialisable Infoschematic configuration contract and defaults.
- [`workspaces/app/`](workspaces/app/) — `@infoschematics/react`, the React application shell, renderer, controls and editor.

Each host owns its Infoschematic configuration. The React package contains no built-in realisation and requires the complete configuration at its public boundary:

```tsx
import { defineInfoschematic } from '@infoschematics/model'
import { App } from '@infoschematics/react'
import '@infoschematics/react/styles.css'

const config = defineInfoschematic({ title: 'My Infoschematic' })

export function InfoschematicPage() {
  return <App config={config} />
}
```

A title-only configuration renders a blank canvas safely. Realisations add their structural model, presentation material and serialisable renderer keys through `defineInfoschematic`.

The packages ship TypeScript source behind explicit export maps for host compilation. Their manifests use matching `0.1.0` dependencies, which Bun resolves to sibling workspaces in this repository.

During local development across repositories, point all three package names at local package directories. Add root overrides for `@infoschematics/core` and `@infoschematics/model` so Bun also resolves the React and model packages' transitive dependencies locally.

## Verify

```sh
bun install
bun run check
```

## Licence

Infoschematics is available under the [MIT License](LICENSE).
