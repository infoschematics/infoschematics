# Integrate with React

The React package renders one complete host-owned `InfoschematicConfig`.

```tsx
import { App as InfoschematicApp } from '@infoschematics/react'
import '@infoschematics/react/styles.css'
import { myInfoschematic } from '@example/my-infoschematic'
import { useEffect } from 'react'

export function App() {
  useEffect(() => {
    document.title = myInfoschematic.title
  }, [])

  return <InfoschematicApp config={myInfoschematic} />
}
```

## Host responsibilities

The host owns:

- the React root and route where the application appears;
- `document.title` and page metadata;
- static contracts, logos and other URL-addressed assets;
- deployment and cache policy;
- selection of the authored Infoschematic definition.

The React package owns rendering, producer controls and runtime state derived from configuration. It must not import a particular example.

## Workspace development

Inside this repository, Bun resolves matching `0.1.0` package dependencies to local workspaces. Run:

```bash
bun install
bun run dev
```

The website runs from `workspaces/site`. The root verification gate runs all tests and typechecks, checks dependency boundaries and produces the site build:

```bash
bun run check
```

External source checkouts currently require local package overrides until the three public packages are published. Package publication is separate release work; do not vendor source into a host.
