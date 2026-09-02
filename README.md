# Infoschematics

Infoschematics is a visual instrument for making complex systems legible. An Infoschematic combines structural artefacts with Scenes, Themes and Stories, then supports Present, Design and Direct production modes.

This Bun monorepo owns the reusable packages, examples, guidance and public website:

- [Domain Model](workspaces/domain-model/) — `@infoschematics/domain-model`, dependency-free serialisable product types.
- [Domain Core](workspaces/domain-core/) — `@infoschematics/domain-core`, framework-neutral domain behaviour and configuration normalisation.
- [View Model](workspaces/view-model/) — `@infoschematics/view-model`, framework-neutral geometry, routing, placement and editing primitives.
- [Studio View](workspaces/view-studio/) — `@infoschematics/view-studio`, the current combined Canvas, Present and Studio implementation.
- [Blank](workspaces/is-blank/) — `@infoschematics/is-blank`, the minimum independently authored Infoschematic.
- [Site](workspaces/site/) — the designed homepage, guidance outlet, examples and Cloudflare deployment boundary.

## Use the Studio View

Each host owns one complete configuration and passes it into React:

```tsx
import { defineInfoschematic } from '@infoschematics/domain-core'
import { App } from '@infoschematics/view-studio'
import '@infoschematics/view-studio/styles.css'

const config = defineInfoschematic({ title: 'My Infoschematic' })

export function InfoschematicPage() {
  return <App config={config} />
}
```

A title-only definition renders a blank canvas safely. See [the authoring guide](docs/guides/authoring.md) and [the React integration guide](docs/guides/react-integration.md) for the complete ownership boundary.

## Package direction

The interactive views are additive. `@infoschematics/view-canvas` will own the reusable Infoschematic component, `@infoschematics/view-present` will wrap Canvas with Audience presentation and navigation, and `@infoschematics/view-studio` will wrap Present with Producer-facing Design and Direct capabilities. The existing Studio workspace temporarily contains all three layers while that extraction proceeds.

`@infoschematics/render-svg` will sit beside the interactive views and render a deterministic `@infoschematics/view-model` snapshot without React. Authored Infoschematic packages use the `is-*` workspace prefix, such as `workspaces/is-blank` and the forthcoming `workspaces/is-infoschematics`.

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
