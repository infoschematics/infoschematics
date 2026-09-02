# Infoschematics

Infoschematics is a visual instrument for making complex systems legible. An Infoschematic combines structural artefacts with Scenes, Themes and Stories, then supports Present, Design and Direct production modes.

This Bun monorepo owns the reusable packages, examples, guidance and public website:

- [Core](workspaces/core/) — `@infoschematics/core`, framework-neutral geometry, routing, placement and editing primitives.
- [Model](workspaces/model/) — `@infoschematics/model`, the serialisable Infoschematic configuration contract and defaults.
- [React](workspaces/app/) — `@infoschematics/react`, the React view, application and producer controls.
- [Blank](workspaces/is-blank/) — `@infoschematics/example-blank`, the minimum independently authored Infoschematic.
- [Site](workspaces/site/) — the designed homepage, guidance outlet, examples and Cloudflare deployment boundary.

## Use the React application

Each host owns one complete configuration and passes it into React:

```tsx
import { defineInfoschematic } from '@infoschematics/model'
import { App } from '@infoschematics/react'
import '@infoschematics/react/styles.css'

const config = defineInfoschematic({ title: 'My Infoschematic' })

export function InfoschematicPage() {
  return <App config={config} />
}
```

A title-only definition renders a blank canvas safely. See [the authoring guide](docs/guides/authoring.md) and [the React integration guide](docs/guides/react-integration.md) for the complete ownership boundary.

## Understand the project

- [Vocabulary](docs/specs/vocabulary.md) defines canonical product and production language.
- [Architecture](docs/design/architecture.md) defines package responsibilities and dependency direction.
- [Roadmap](ROADMAP.md) points to active and future work.
- The public website runs at [infoschematics.info](https://infoschematics.info/).

## Develop

[Bun](https://bun.sh) manages the workspace.

```bash
bun install
bun run dev
bun run check
```

`bun run check` runs tests and TypeScript across every workspace, verifies dependency boundaries and builds the production website.

The packages currently ship TypeScript source through explicit export maps. Bun resolves matching versions locally in this monorepo. External source checkouts require local overrides until package publication; hosts must not vendor library source.

## Licence

Infoschematics is available under the [MIT License](LICENSE).
