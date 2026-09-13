# Installation

Infoschematics supports a hosted, no-install workflow as well as local package integration. Choose the smallest route that matches what you want to do; every route works from the same serialisable Infoschematic definition.

## Choose how to use Infoschematics

### Hosted editor (no install)

Open the [Playground](/playground/) to create, edit, and copy an Infoschematic in your browser. This is a first-class way to try the product and does not require a local checkout or package installation.

### Create an authored definition

Write a complete definition in TypeScript, YAML, or JSON, then give it to one or more views. Start with the [authoring guide](/docs/authoring/) when you want to keep the definition in your project.

### Render a static document

Use `@infoschematics/render-svg` to produce deterministic SVG without React. This is the smallest local route for documents, exports, and build pipelines; see [static rendering](/docs/static-rendering/) for the setup.

### Use an interactive view in a site

Mount the view that fits your audience in a host application:

- `@infoschematics/view-canvas` for an interactive diagram.
- `@infoschematics/view-present` for audience controls, filtering, focus, and Story playback.
- `@infoschematics/view-studio` for Producer-facing Design and Direct tools.

Read [React integration](/docs/react-integration/) for Canvas, Present, and Studio mounting examples.

## Install a published package

For local integration, install the package for the surface you selected. Domain Core parses and validates Infoschematic data, while each view or renderer package supplies its own runtime needs.

For example, a Studio host using Bun:

```bash
bun add @infoschematics/domain-core @infoschematics/view-studio react react-dom
```

Import the package stylesheet explicitly beside the component:

```tsx
import { defineInfoschematic } from '@infoschematics/domain-core'
import { App as Studio } from '@infoschematics/view-studio'
import '@infoschematics/view-studio/styles.css'

const config = defineInfoschematic({ title: 'My Infoschematic' })

export function InfoschematicPage() {
  return <Studio config={config} />
}
```

The first public package release is still pending. Until packages are available from the registry, clone the repository and use the Bun workspace:

```bash
bun install --frozen-lockfile
bun run self:check
```

## What the host owns

Your application owns the React root, route, document title, assets, renderer implementations, and persistence. The Infoschematic definition stays plain serialisable data: do not put React components, browser state, callbacks, or files into it.

Continue to the [visual guide](/docs/visual-guide/) to learn the visible parts, or go straight to [authoring](/docs/authoring/) to define a complete Infoschematic.
