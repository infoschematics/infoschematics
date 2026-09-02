# Integrate a React host

The current Studio View package renders one complete host-owned `InfoschematicConfig` using React. It temporarily contains Canvas and Present while the additive view packages are extracted.

```tsx
import { App as InfoschematicApp } from '@infoschematics/view-studio'
import '@infoschematics/view-studio/styles.css'
import { myInfoschematic } from '@example/my-infoschematic'
import { useEffect } from 'react'

export function App() {
  useEffect(() => {
    document.title = myInfoschematic.title
  }, [])

  return <InfoschematicApp config={myInfoschematic} renderers={renderers} />
}
```

## Host renderers

Authored Fabrics and Graphics carry stable renderer keys and serialisable properties. React implementations stay in the host and are supplied separately:

```tsx
import type { InfoschematicRenderers } from '@infoschematics/view-studio'
import { Network } from 'lucide-react'
import { FabricArtwork, GraphicArtwork, SharedDefinitions } from './renderers.tsx'

export const renderers = {
  definitions: SharedDefinitions,
  fabrics: { 'example-fabric': FabricArtwork },
  graphics: { 'example-graphic': GraphicArtwork },
  scopeIcons: { network: Network },
} satisfies InfoschematicRenderers
```

A Fabric renderer receives the authored Fabric and its effective `bounds`, including an in-progress Studio move. A Graphic renderer receives the resolved authored Graphic and the Infoschematic `viewBox`. Studio owns selection, pointer behaviour, editing frames, and a generic Fabric fallback. An unresolved Story Graphic reference produces no invented visual content.

The renderer object is host runtime configuration, not part of `InfoschematicConfig`: do not place React components, callbacks, or shared SVG definitions in authored data.

## Host responsibilities

The host owns:

- the React root and route where the application appears;
- `document.title` and other page metadata;
- static contracts, logos, and other URL-addressed assets;
- deployment and cache policy;
- selection of the authored Infoschematic definition.
- React implementations for any renderer or Scope icon keys used by that definition.

Studio View owns generic rendering, Producer controls, and runtime state derived from configuration. It must not import a particular authored Infoschematic or its visual implementations.

## Monorepo development

Inside this repository, Bun resolves matching `0.1.0` package dependencies to local workspaces:

```bash
bun install
bun run dev
```

The website runs from `apps/site`. The root verification gate runs all tests and type checks, checks dependency boundaries, and produces the site build:

```bash
bun run check
```

External source checkouts currently require local package overrides until the packages are published. Package publication is separate release work; do not vendor source into a host.
