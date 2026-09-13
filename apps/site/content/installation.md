# Installation

Choose the smallest package that owns the output you need. Every interactive package builds on the same serialisable Infoschematic definition, so you can add another view later without changing the authored model.

## Choose a surface

- `@infoschematics/render-svg` renders deterministic SVG without React.
- `@infoschematics/view-canvas` mounts an interactive diagram.
- `@infoschematics/view-present` adds audience controls, filtering, Scenes and Story playback.
- `@infoschematics/view-studio` adds Producer-facing Design and Direct tools.
- `@infoschematics/domain-core` parses, validates and defines Infoschematic data. The view and renderer packages install their own internal dependencies, but authors often import this package directly.

## Install a published package

Install the surface and Domain Core with your package manager. For a Studio host using Bun:

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

The first public package release is still pending. Until those packages are available from the registry, clone the repository and use its Bun workspace:

```bash
bun install --frozen-lockfile
bun run self:check
```

## What the host owns

Your application owns the React root, route, document title, assets, renderer implementations and persistence. The Infoschematic definition stays plain serialisable data: do not put React components, browser state, callbacks or files into it.

Continue to the [visual guide](/docs/visual-guide/) to learn the visible parts, or go straight to [authoring](/docs/authoring/) to define a complete Infoschematic.
